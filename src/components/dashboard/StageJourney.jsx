import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { STAGE_META, STAGE_ORDER, computeStageProgress } from '@/lib/stageMeta';
import { cn } from '@/lib/utils';

const ICONS = { stabilize: 'Shield', align: 'Compass', execute: 'Rocket', sustain: 'Leaf' };

const COLOR_MAP = {
  blue: { active: 'bg-blue-500 text-white', completed: 'bg-blue-100 text-blue-700', muted: 'text-blue-400', ring: 'ring-blue-400' },
  amber: { active: 'bg-amber-500 text-white', completed: 'bg-amber-100 text-amber-700', muted: 'text-amber-400', ring: 'ring-amber-400' },
  emerald: { active: 'bg-emerald-500 text-white', completed: 'bg-emerald-100 text-emerald-700', muted: 'text-emerald-400', ring: 'ring-emerald-400' },
  purple: { active: 'bg-purple-500 text-white', completed: 'bg-purple-100 text-purple-700', muted: 'text-purple-400', ring: 'ring-purple-400' },
};

export default function StageJourney({ currentStage, orgId }) {
  const { data: org } = useQuery({
    queryKey: ['org-journey', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const { data: stageProgress = [] } = useQuery({
    queryKey: ['stageProgress-journey', orgId],
    queryFn: () => base44.entities.StageProgress.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const healthScore = org?.health_score || 0;
  const momentumScore = org?.momentum_score || 0;

  const getStageStatus = (stage) => {
    if (stage === currentStage) return 'current';
    const sp = stageProgress.find(s => s.stage === stage);
    if (sp?.status === 'completed') return 'completed';
    const stageIdx = STAGE_ORDER.indexOf(stage);
    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    return stageIdx < currentIdx ? 'completed' : 'upcoming';
  };

  return (
    <div className="rounded-xl bg-gradient-to-r from-primary to-[hsl(220,65%,14%)] p-px shadow-lg">
      <div className="rounded-xl bg-gradient-to-r from-primary to-[hsl(220,65%,12%)] px-5 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-accent text-xs font-bold uppercase tracking-widest">Your Journey</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-white/80 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Health {healthScore.toFixed(1)}
            </span>
            <span className="text-white/80 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Momentum {momentumScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Stage cards */}
        <div className="grid grid-cols-4 gap-2">
          {STAGE_ORDER.map((stage, i) => {
            const meta = STAGE_META[stage];
            const status = getStageStatus(stage);
            const colors = COLOR_MAP[meta.color];

            return (
              <Link key={stage} to={`/${stage}`} className="block">
                <div className={cn(
                  'rounded-lg p-3 border transition-all hover:scale-[1.02]',
                  status === 'current'
                    ? cn('bg-white/95 border-transparent ring-2', colors.ring)
                    : status === 'completed'
                      ? 'bg-white/15 border-white/20'
                      : 'bg-white/5 border-white/10'
                )}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      status === 'current' ? colors.active
                        : status === 'completed' ? cn(colors.completed, 'flex items-center justify-center')
                        : 'bg-white/10 text-white/40'
                    )}>
                      {status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : meta.number}
                    </div>
                    <span className={cn(
                      'text-sm font-bold capitalize',
                      status === 'current' ? 'text-primary'
                        : status === 'completed' ? 'text-white/90'
                        : 'text-white/40'
                    )}>
                      {meta.name}
                    </span>
                  </div>
                  {/* Discipline names */}
                  <div className="space-y-0.5">
                    {meta.disciplines.map(d => (
                      <p key={d.number} className={cn(
                        'text-[10px] leading-tight',
                        status === 'current' ? 'text-muted-foreground'
                          : status === 'completed' ? 'text-white/60'
                          : 'text-white/30'
                      )}>
                        {d.number}. {d.name}
                      </p>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Arrow flow indicator */}
        <div className="flex items-center justify-center gap-1 mt-2 text-white/30 text-xs">
          <span>diagnose</span>
          <ArrowRight className="h-3 w-3" />
          <span>understand</span>
          <ArrowRight className="h-3 w-3" />
          <span>act</span>
          <ArrowRight className="h-3 w-3" />
          <span>measure</span>
          <ArrowRight className="h-3 w-3" />
          <span>improve</span>
        </div>
      </div>
    </div>
  );
}