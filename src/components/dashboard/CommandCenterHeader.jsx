import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { STAGE_META, STAGE_ORDER, computeStageProgress } from '@/lib/stageMeta';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const STAGE_COLORS = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
};

export default function CommandCenterHeader({ org, currentStage, stageProgress = [] }) {
  const meta = STAGE_META[currentStage] || STAGE_META.stabilize;
  const stageIdx = STAGE_ORDER.indexOf(currentStage);
  const overallProgress = Math.round(((stageIdx + 1) / STAGE_ORDER.length) * 100);

  const counts = {};
  if (stageProgress.length > 0) {
    const sp = stageProgress.find(s => s.stage === currentStage);
    if (sp?.milestones) {
      counts.milestones = sp.milestones.filter(m => m.completed).length;
    }
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-primary to-[hsl(220,65%,13%)] p-px shadow-lg">
      <div className="rounded-xl bg-gradient-to-r from-primary to-[hsl(220,65%,11%)] px-5 py-4">
        {/* Top row: org name + stage badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-0.5">Healthy Leadership OS</p>
            <h1 className="text-xl lg:text-2xl font-barlow font-bold text-white tracking-tight">
              {org?.name || 'Your Organization'}
            </h1>
          </div>
          <Link
            to={`/${currentStage}`}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg px-3 py-2 transition-colors w-fit"
          >
            <span className={cn('h-2 w-2 rounded-full', STAGE_COLORS[meta.color])} />
            <span className="text-sm font-semibold text-white capitalize">
              Stage {meta.number}: {meta.name}
            </span>
            <ChevronRight className="h-4 w-4 text-white/60" />
          </Link>
        </div>

        {/* Stage progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Stage Progress</span>
            <span className="text-white/90 font-semibold">{overallProgress}% through the journey</span>
          </div>
          <div className="flex items-center gap-2">
            {STAGE_ORDER.map((stage, i) => {
              const stageMeta = STAGE_META[stage];
              const status = i < stageIdx ? 'completed' : i === stageIdx ? 'current' : 'upcoming';
              return (
                <div key={stage} className="flex items-center gap-2">
                  <Link to={`/${stage}`} className="flex items-center gap-1.5 group">
                    <div className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                      status === 'completed' ? 'bg-emerald-500 text-white'
                        : status === 'current' ? cn(STAGE_COLORS[stageMeta.color], 'text-white ring-2 ring-white/30')
                        : 'bg-white/10 text-white/40'
                    )}>
                      {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : stageMeta.number}
                    </div>
                    <span className={cn(
                      'text-xs font-medium hidden sm:inline',
                      status === 'current' ? 'text-white' : status === 'completed' ? 'text-white/80' : 'text-white/40'
                    )}>
                      {stageMeta.name}
                    </span>
                  </Link>
                  {i < STAGE_ORDER.length - 1 && (
                    <div className={cn(
                      'h-0.5 flex-1 rounded-full',
                      i < stageIdx ? 'bg-emerald-500/60' : 'bg-white/10'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}