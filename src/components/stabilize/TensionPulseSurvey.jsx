import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Activity, Plus, Download, CheckCircle2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import TensionPulseInterpretation, { interpretTensionPulse, PRESSURE_POINTS } from '@/components/stabilize/TensionPulseInterpretation';
import TensionPulseReport from '@/components/stabilize/TensionPulseReport';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportToPDF } from '@/lib/exportPDF';

const QUESTION_TEXT = {
  side_conversations: 'Concerns get discussed in side conversations rather than directly with the person involved.',
  decision_aftermath: 'After decisions are made, people continue to second-guess or push back privately.',
  ownership_confusion: "It's unclear who is responsible for what, causing overlap or things falling through the cracks.",
  meeting_atmosphere: 'Team meetings feel tense, guarded, or like walking on eggshells.',
  disengagement: 'Key people are going quiet, pulling back, or disengaging from the team.',
  faction_pressure: 'People are grouping into subgroups or factions rather than operating as one team.',
};

export default function TensionPulseSurvey({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submittedPulse, setSubmittedPulse] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [form, setForm] = useState({
    side_conversations: 5, decision_aftermath: 5, ownership_confusion: 5,
    meeting_atmosphere: 5, disengagement: 5, faction_pressure: 5,
    biggest_tension: '', one_change: '',
  });

  const { data: pulses = [] } = useQuery({
    queryKey: ['tensionPulses', orgId],
    queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitTensionPulse', { ...data, organization_id: orgId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tensionPulses', orgId] });
      const record = data?.data?.record || data?.record || data?.data || data;
      setSubmittedPulse(record);
      setShowResults(false);
      setShowReport(true);
    },
  });

  // Aggregate average for radar — show raw pressure (higher = more pressure)
  const avgData = PRESSURE_POINTS.map(p => {
    const vals = pulses.map(rec => rec[p.key] || 5);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { subject: p.shortLabel, value: avg };
  });

  const myLatest = user?.email
    ? pulses.find(p => p.respondent_email === user.email)
    : null;

  const handleExport = (targetPulse) => {
    const target = targetPulse || myLatest || pulses[0];
    if (!target) return;
    const interp = interpretTensionPulse(target);
    exportToPDF({
      title: 'Relational Pressure Pulse Report',
      subtitle: `Submitted ${format(new Date(target.created_date), 'MMM d, yyyy')} by ${target.respondent_email}`,
      filename: 'tension-pulse-report.pdf',
      sections: [
        {
          heading: 'Pressure Points',
          table: {
            headers: ['Pressure Point', 'Score (1-10, higher = more pressure)'],
            rows: PRESSURE_POINTS.map(p => [p.label, String(target[p.key] ?? '—')]),
          },
        },
        { heading: 'Open Responses', items: [
          { label: 'Where pressure is showing up most', value: target.biggest_tension || '—' },
          { label: 'One change that would relieve pressure', value: target.one_change || '—' },
        ]},
        { heading: 'Interpretation', items: [
          { label: 'Overall pressure level', value: interp ? `${interp.overallPressure.toFixed(1)}/10` : '—' },
          { label: 'Hottest pressure points', value: interp && interp.hotSpots.length ? interp.hotSpots.map(s => s.label).join(', ') : 'None elevated' },
          { label: 'Cooler areas', value: interp && interp.coolSpots.length ? interp.coolSpots.map(s => s.label).join(', ') : 'None' },
          { label: 'Recommended focus', value: interp ? interp.focusArea : '—' },
        ]},
      ],
    });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <div>
            <CardTitle className="text-base font-semibold">Tension Pulse</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Where is the pressure showing up between people?</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pulses.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
          <Button size="sm" onClick={() => { setSubmittedPulse(null); setShowResults(false); setOpen(!open); }}>
            <Plus className="h-4 w-4 mr-1" /> Take Pulse
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && !submittedPulse && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Rate each pressure point from 1 (rarely) to 10 (almost always). Higher scores mean more pressure — this helps pinpoint exactly where tension is showing up between people.
            </p>
            {PRESSURE_POINTS.map(p => (
              <div key={p.key} className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <Label className="text-xs font-medium">{p.label}</Label>
                  <span className="text-sm font-bold text-primary">{form[p.key]}/10</span>
                </div>
                <p className="text-xs text-muted-foreground">{QUESTION_TEXT[p.key]}</p>
                <Slider min={1} max={10} step={1} value={[form[p.key]]}
                  onValueChange={([v]) => setForm({ ...form, [p.key]: v })} />
                <div className="flex justify-between text-xs text-muted-foreground/60">
                  <span>1 — Rarely</span>
                  <span>10 — Almost always</span>
                </div>
              </div>
            ))}
            <div>
              <Label className="text-xs font-medium">Where is the pressure showing up most right now?</Label>
              <p className="text-xs text-muted-foreground mb-1.5">Name the relationship or interaction (e.g., "between staff and board," "between two key leaders").</p>
              <Textarea placeholder="Describe where the pressure is concentrated..." value={form.biggest_tension}
                onChange={e => setForm({ ...form, biggest_tension: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs font-medium">What one conversation or change would most relieve the pressure?</Label>
              <Textarea placeholder="What would make the biggest difference?" value={form.one_change}
                onChange={e => setForm({ ...form, one_change: e.target.value })} rows={2} />
            </div>
            {createMutation.isError && (
              <p className="text-xs text-destructive">
                {createMutation.error?.message || 'Failed to submit. Please try again.'}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Pulse'}
              </Button>
            </div>
          </div>
        )}

        {submittedPulse && open && (
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">Your Tension Pulse has been recorded.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => handleExport(submittedPulse)}>
                <Download className="h-4 w-4 mr-1" /> Export Report
              </Button>
              <Button size="sm" onClick={() => setShowReport(true)}>
                <Eye className="h-4 w-4 mr-1" /> View Full Report
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setSubmittedPulse(null); setShowResults(false); setOpen(false); }}>
                Done
              </Button>
            </div>
          </div>
        )}

        {submittedPulse && (
          <Dialog open={showReport} onOpenChange={setShowReport}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Relational Pressure Pulse Report</DialogTitle>
              </DialogHeader>
              <TensionPulseReport pulse={submittedPulse} onClose={() => setShowReport(false)} />
            </DialogContent>
          </Dialog>
        )}

        {pulses.length > 0 && !open && (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={avgData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              <Tooltip formatter={(v) => `${v.toFixed(1)} pressure`} />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {myLatest && !open && <TensionPulseInterpretation pulse={myLatest} />}

        <div className="space-y-1.5">
          {pulses.slice(0, 5).map(p => {
            const isMine = user?.email && p.respondent_email === user.email;
            const avgPressure = PRESSURE_POINTS.reduce((s, pt) => s + (p[pt.key] || 0), 0) / PRESSURE_POINTS.length;
            return (
              <div key={p.id} className={`flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0 rounded px-1.5 ${isMine ? 'bg-accent/10 border-accent/30' : ''}`}>
                <span className={isMine ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                  {p.respondent_email}{isMine && ' (You)'}
                </span>
                <span className="text-muted-foreground">{format(new Date(p.created_date), 'MMM d')}</span>
                <span className="font-medium">Pressure: {avgPressure.toFixed(1)}/10</span>
              </div>
            );
          })}
          {pulses.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No pulse surveys yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}