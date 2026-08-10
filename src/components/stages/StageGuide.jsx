import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Lightbulb } from 'lucide-react';
import { STAGE_STEPS } from '@/components/dashboard/NextStepsPanel';
import { cn } from '@/lib/utils';

/**
 * Shows a guided sequence of steps for the current stage.
 * Highlights the next recommended step so users know exactly what to do.
 */
export default function StageGuide({ stage, counts = {} }) {
  const steps = STAGE_STEPS[stage] || [];
  if (steps.length === 0) return null;

  const completedCount = steps.filter(s => (counts[s.key] || 0) > 0).length;
  const nextStep = steps.find(s => (counts[s.key] || 0) === 0);
  const pct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  if (!nextStep) {
  return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">All activities started!</p>
          </div>
          <p className="text-xs text-muted-foreground">You're ready to advance to the next stage from your Dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold">Start Here</p>
          <span className="text-xs text-muted-foreground ml-auto">{completedCount} of {steps.length} done</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-1.5">
          {steps.map((step) => {
            const done = (counts[step.key] || 0) > 0;
            const isNext = step.key === nextStep.key;
            return (
              <div key={step.key} className={cn('flex items-start gap-2 text-sm', isNext && 'font-semibold')}>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : isNext ? (
                  <Circle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5 fill-accent/20" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className={cn(done ? 'text-muted-foreground' : isNext ? 'text-foreground' : 'text-muted-foreground/70')}>
                    {step.label}
                  </p>
                  {isNext && <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}