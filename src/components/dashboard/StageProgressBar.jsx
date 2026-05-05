import React from 'react';
import { Shield, Compass, Rocket, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_ICONS = { stabilize: Shield, align: Compass, execute: Rocket, sustain: RefreshCw };
const STAGE_COLORS = {
  stabilize: { active: 'bg-secondary text-secondary-foreground', completed: 'bg-secondary text-secondary-foreground', line: 'bg-secondary' },
  align: { active: 'bg-accent text-accent-foreground', completed: 'bg-accent text-accent-foreground', line: 'bg-accent' },
  execute: { active: 'bg-primary text-primary-foreground', completed: 'bg-primary text-primary-foreground', line: 'bg-primary' },
  sustain: { active: 'bg-accent text-accent-foreground', completed: 'bg-accent text-accent-foreground', line: 'bg-accent' },
};

const STAGES_ORDER = ['stabilize', 'align', 'execute', 'sustain'];

export default function StageProgressBar({ currentStage, completedStages = [] }) {
  const currentIdx = STAGES_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center w-full">
      {STAGES_ORDER.map((stage, i) => {
        const Icon = STAGE_ICONS[stage];
        const isCompleted = completedStages.includes(stage);
        const isCurrent = stage === currentStage;
        const isPast = i < currentIdx;
        const colors = STAGE_COLORS[stage];

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                isCompleted || isPast
                  ? cn(colors.completed, 'border-transparent')
                  : isCurrent
                    ? cn(colors.active, 'border-transparent ring-4 ring-offset-2 ring-accent/30')
                    : 'bg-muted text-muted-foreground border-border'
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-xs font-medium capitalize",
                isCurrent ? 'text-foreground' : 'text-muted-foreground'
              )}>{stage}</span>
            </div>
            {i < STAGES_ORDER.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 rounded-full transition-all duration-500",
                isPast || isCompleted ? colors.line : 'bg-border'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}