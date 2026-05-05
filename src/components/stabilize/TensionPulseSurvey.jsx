import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Activity, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const METRICS = [
  { key: 'trust_level', label: 'Trust', invert: false },
  { key: 'communication_safety', label: 'Comm Safety', invert: false },
  { key: 'team_morale', label: 'Morale', invert: false },
  { key: 'leadership_confidence', label: 'Leadership', invert: false },
  { key: 'unresolved_conflicts', label: 'Unresolved Conflicts', invert: true },
  { key: 'team_tension', label: 'Team Tension', invert: true },
];

export default function TensionPulseSurvey({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    team_tension: 5, trust_level: 5, communication_safety: 5,
    unresolved_conflicts: 5, leadership_confidence: 5, team_morale: 5,
    biggest_tension: '', one_change: '',
  });

  const { data: pulses = [] } = useQuery({
    queryKey: ['tensionPulses', orgId],
    queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TensionPulse.create({ ...data, organization_id: orgId, respondent_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tensionPulses', orgId] });
      setOpen(false);
    },
  });

  // Aggregate average for radar
  const avgData = METRICS.map(m => {
    const vals = pulses.map(p => p[m.key] || 5);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { subject: m.label, value: m.invert ? 10 - avg : avg };
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base font-semibold">Team Tension Pulse</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Take Survey
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            {METRICS.map(m => (
              <div key={m.key}>
                <Label className="text-xs">{m.label}: {form[m.key]}/10</Label>
                <Slider min={1} max={10} step={1} value={[form[m.key]]}
                  onValueChange={([v]) => setForm({ ...form, [m.key]: v })} className="mt-1" />
              </div>
            ))}
            <div>
              <Label className="text-xs">Biggest source of tension right now</Label>
              <Textarea placeholder="Describe in your own words..." value={form.biggest_tension}
                onChange={e => setForm({ ...form, biggest_tension: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs">One change that would most improve team health</Label>
              <Textarea placeholder="What would make the biggest difference?" value={form.one_change}
                onChange={e => setForm({ ...form, one_change: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)}>Submit Survey</Button>
            </div>
          </div>
        )}

        {pulses.length > 0 && !open && (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={avgData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              <Tooltip formatter={(v) => v.toFixed(1)} />
            </RadarChart>
          </ResponsiveContainer>
        )}

        <div className="space-y-1.5">
          {pulses.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{p.respondent_email}</span>
              <span className="text-muted-foreground">{format(new Date(p.created_date), 'MMM d')}</span>
              <span className="font-medium">Tension: {p.team_tension}/10 • Trust: {p.trust_level}/10</span>
            </div>
          ))}
          {pulses.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No pulse surveys yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}