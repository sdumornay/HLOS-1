import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Download } from 'lucide-react';
import { format } from 'date-fns';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import TensionPulseInterpretation, { interpretTensionPulse } from '@/components/stabilize/TensionPulseInterpretation';
import GuidedAssessment from '@/components/assessments/GuidedAssessment';
import { exportToPDF } from '@/lib/exportPDF';

const METRICS = [
  { key: 'trust_level', label: 'Trust', invert: false },
  { key: 'communication_safety', label: 'Comm Safety', invert: false },
  { key: 'team_morale', label: 'Morale', invert: false },
  { key: 'leadership_confidence', label: 'Leadership', invert: false },
  { key: 'unresolved_conflicts', label: 'Unresolved Conflicts', invert: true },
  { key: 'team_tension', label: 'Team Tension', invert: true },
];

export default function HealthCheckCard({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [guidedOpen, setGuidedOpen] = useState(false);

  const { data: pulses = [] } = useQuery({
    queryKey: ['tensionPulses', orgId],
    queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  // Aggregate average for radar
  const avgData = METRICS.map(m => {
    const vals = pulses.map(p => p[m.key] || 5);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { subject: m.label, value: m.invert ? 10 - avg : avg };
  });

  // Find the current user's most recent submission
  const myLatest = user?.email
    ? pulses.find(p => p.respondent_email === user.email)
    : null;

  const handleExport = () => {
    const target = myLatest || pulses[0];
    if (!target) return;
    const interp = interpretTensionPulse(target);
    exportToPDF({
      title: 'Team Health Check Report',
      subtitle: `Submitted ${format(new Date(target.created_date), 'MMM d, yyyy')} by ${target.respondent_email}`,
      filename: 'health-check-report.pdf',
      sections: [
        {
          heading: 'Scores',
          table: {
            headers: ['Dimension', 'Score (1-10)'],
            rows: METRICS.map(m => [m.label, String(target[m.key] ?? '—')]),
          },
        },
        { heading: 'Open Responses', items: [
          { label: 'Biggest source of tension', value: target.biggest_tension || '—' },
          { label: 'One change that would help', value: target.one_change || '—' },
        ]},
        { heading: 'Interpretation', items: [
          { label: 'Overall health', value: interp ? `${interp.overall.toFixed(1)}/10` : '—' },
          { label: 'Strengths', value: interp ? interp.strongest.map(s => s.label).join(', ') : '—' },
          { label: 'Needs attention', value: interp && interp.risks.length ? interp.risks.map(r => r.label).join(', ') : 'None flagged' },
          { label: 'Recommended focus', value: interp ? `${interp.focusDiscipline} (${interp.focusStage})` : '—' },
        ]},
      ],
    });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">Quick Health Check</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {pulses.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
          <Button size="sm" onClick={() => setGuidedOpen(true)}>
            <Heart className="h-4 w-4 mr-1" /> Take Health Check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A guided 8-question pulse survey covering trust, safety, clarity, accountability, meetings, and conflict — plus two open-ended reflection questions. Takes less than 3 minutes.
        </p>

        {pulses.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={avgData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              <Tooltip formatter={(v) => v.toFixed(1)} />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {myLatest && <TensionPulseInterpretation pulse={myLatest} />}

        <div className="space-y-1.5">
          {pulses.slice(0, 5).map(p => {
            const isMine = user?.email && p.respondent_email === user.email;
            return (
              <div key={p.id} className={`flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0 rounded px-1.5 ${isMine ? 'bg-accent/10 border-accent/30' : ''}`}>
                <span className={isMine ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                  {p.respondent_email}{isMine && ' (You)'}
                </span>
                <span className="text-muted-foreground">{format(new Date(p.created_date), 'MMM d')}</span>
                <span className="font-medium">Tension: {p.team_tension}/10 • Trust: {p.trust_level}/10</span>
              </div>
            );
          })}
          {pulses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No health checks yet.</p>}
        </div>

        <GuidedAssessment
          open={guidedOpen}
          onClose={() => {
            setGuidedOpen(false);
            queryClient.invalidateQueries({ queryKey: ['tensionPulses', orgId] });
          }}
          orgId={orgId}
          user={user}
        />
      </CardContent>
    </Card>
  );
}