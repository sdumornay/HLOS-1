import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Compass, Rocket, Leaf, Heart, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STAGE_META, STAGE_ORDER, computeStageProgress } from '@/lib/stageMeta';
import { cn } from '@/lib/utils';

const ICONS = { stabilize: Shield, align: Compass, execute: Rocket, sustain: Leaf };

const COLOR_MAP = {
  blue: { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-200', text: 'text-blue-600', icon: 'bg-blue-100', ring: 'ring-blue-300' },
  amber: { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-200', text: 'text-amber-600', icon: 'bg-amber-100', ring: 'ring-amber-300' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'bg-emerald-100', ring: 'ring-emerald-300' },
  purple: { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-200', text: 'text-purple-600', icon: 'bg-purple-100', ring: 'ring-purple-300' },
};

export default function StageHero({ stage, orgId, counts = {} }) {
  const meta = STAGE_META[stage];
  const Icon = ICONS[stage];
  const colors = COLOR_MAP[meta.color];
  const progress = computeStageProgress(stage, counts);

  const { data: org } = useQuery({
    queryKey: ['org-for-hero', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const healthScore = org?.health_score || 0;
  const momentumScore = org?.momentum_score || 0;
  const isCurrentStage = org?.current_stage === stage;
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const nextStage = STAGE_ORDER[stageIndex + 1];

  return (
    <div className={cn('rounded-xl bg-gradient-to-r border p-5 lg:p-6', colors.bg, colors.border)}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Icon + stage number */}
        <div className="flex items-center gap-3">
          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon, colors.text)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold uppercase tracking-widest', colors.text)}>Stage {meta.number}</span>
              {isCurrentStage && (
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', colors.icon, colors.text)}>
                  Current
                </span>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-barlow font-bold tracking-tight">{meta.name}</h1>
          </div>
        </div>

        {/* What & Why */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{meta.what}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.why}</p>
        </div>

        {/* Status scores */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Heart className={cn('h-3.5 w-3.5', colors.text)} />
              <span className="text-lg font-bold">{healthScore.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <TrendingUp className={cn('h-3.5 w-3.5', colors.text)} />
              <span className="text-lg font-bold">{momentumScore.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Momentum</p>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold">{progress}%</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-white/40 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', colors.text.replace('text-', 'bg-'))} style={{ width: `${progress}%` }} />
      </div>

      {/* Disciplines preview + next stage */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {meta.disciplines.map(d => (
            <span key={d.number} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/60 border border-border/40">
              {d.number}. {d.name}
            </span>
          ))}
        </div>
        {nextStage && (
          <Link to={`/${nextStage}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0">
            Next: <span className="font-semibold capitalize">{nextStage}</span> <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}