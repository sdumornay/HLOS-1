import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, Shield, Swords, Handshake, Eye, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIMENSIONS = [
  {
    key: 'trust',
    label: 'Trust',
    icon: Shield,
    question: 'Do team members feel safe being vulnerable with each other?',
    gapLabel: 'Trust Gap',
    lowDesc: 'Team members hold back, avoid admitting mistakes, and protect themselves rather than building genuine trust.',
  },
  {
    key: 'conflict',
    label: 'Healthy Conflict',
    icon: Swords,
    question: 'Does the team engage in passionate, honest debate around ideas?',
    gapLabel: 'Unhealthy Conflict',
    lowDesc: 'The team avoids disagreement or descends into personal attacks instead of productive debate.',
  },
  {
    key: 'commitment',
    label: 'Commitment',
    icon: Handshake,
    question: 'Does the team genuinely commit to decisions and plans of action?',
    gapLabel: 'Lack of Commitment',
    lowDesc: 'Decisions are ambiguous, people nod but don\'t follow through, and there is false consensus.',
  },
  {
    key: 'accountability',
    label: 'Accountability',
    icon: Eye,
    question: 'Do team members call out peers on behaviors that hurt the team?',
    gapLabel: 'Accountability Problem',
    lowDesc: 'No one holds anyone accountable. Standards slip and resentment builds toward those who underperform.',
  },
  {
    key: 'results',
    label: 'Shared Results',
    icon: Trophy,
    question: 'Does the team focus on collective outcomes, not individual status?',
    gapLabel: 'Inattention to Results',
    lowDesc: 'Team members prioritize their own status, ego, or department over the team\'s shared goals.',
  },
];

export default function TeamHealthPanel({ orgId }) {
  const { data: responses = [] } = useQuery({
    queryKey: ['fiveDysfunctions', orgId],
    queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const avg = (key) => {
    const vals = responses.map(r => r[key]).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const getLevel = (val) => {
    if (val == null) return 'none';
    if (val >= 4) return 'healthy';
    if (val >= 3) return 'watch';
    return 'gap';
  };

  const levelConfig = {
    healthy: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Healthy', badge: 'default' },
    watch: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Watch', badge: 'secondary' },
    gap: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Gap', badge: 'destructive' },
    none: { color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border/40', label: 'No Data', badge: 'outline' },
  };

  const gaps = DIMENSIONS.filter(d => getLevel(avg(d.key)) === 'gap');
  const watches = DIMENSIONS.filter(d => getLevel(avg(d.key)) === 'watch');

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-base font-semibold">Team Health</CardTitle>
          {responses.length > 0 && (
            <Badge variant="outline" className="text-xs ml-1">{responses.length} response{responses.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {responses.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-muted-foreground">No team health data yet.</p>
            <p className="text-xs text-muted-foreground">
              Complete the Five Dysfunctions assessment on the Assessments page to identify trust gaps and dysfunction patterns.
            </p>
          </div>
        ) : (
          <>
            {/* Guiding question */}
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
              <p className="text-sm font-medium text-indigo-800">
                Are we honest, healthy, and committed — or are we avoiding the real issues?
              </p>
            </div>

            {/* Dimension cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DIMENSIONS.map(d => {
                const val = avg(d.key);
                const level = getLevel(val);
                const cfg = levelConfig[level];
                const Icon = d.icon;
                return (
                  <div key={d.key} className={cn('p-3 rounded-lg border', cfg.bg, cfg.border)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-4 w-4', cfg.color)} />
                        <span className="text-sm font-semibold">{d.label}</span>
                      </div>
                      {val != null && (
                        <span className={cn('text-sm font-bold', cfg.color)}>{val.toFixed(1)}/5</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-1.5">{d.question}</p>
                    {level === 'gap' && (
                      <p className="text-xs text-red-600/90">{d.lowDesc}</p>
                    )}
                    {level === 'watch' && (
                      <p className="text-xs text-amber-600/90">Worth watching — not yet a serious gap.</p>
                    )}
                    {level === 'healthy' && (
                      <p className="text-xs text-emerald-600/90">This is a strength of the team.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary of gaps */}
            {(gaps.length > 0 || watches.length > 0) && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
                {gaps.length > 0 && (
                  <p className="text-sm text-red-600 mb-1">
                    <span className="font-medium">Gaps:</span> {gaps.map(g => g.label).join(', ')}
                  </p>
                )}
                {watches.length > 0 && (
                  <p className="text-sm text-amber-600">
                    <span className="font-medium">Watch:</span> {watches.map(w => w.label).join(', ')}
                  </p>
                )}
                {gaps.length === 0 && watches.length === 0 && (
                  <p className="text-sm text-emerald-600">All dimensions are healthy. Keep reinforcing what's working.</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}