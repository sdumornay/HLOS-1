import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { STAGE_META } from '@/lib/stageMeta';
import { cn } from '@/lib/utils';
import AdvanceStageButton from '@/components/dashboard/AdvanceStageButton';

export default function CurrentStagePanel({ currentStage, stageSteps = [], completedCount = 0, nextStep, orgId }) {
  const meta = STAGE_META[currentStage] || STAGE_META.stabilize;
  const totalSteps = stageSteps.length;
  const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const allStarted = !nextStep;

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Current Stage: {meta.name}</CardTitle>
        <Link to={`/${currentStage}`} className="text-xs text-primary hover:underline flex items-center gap-1">
          Open stage <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Objective */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Objective</p>
          <p className="text-sm text-foreground">{meta.what}</p>
        </div>

        {/* Activities (disciplines) */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Activities</p>
          <div className="space-y-1">
            {meta.disciplines.map(d => (
              <div key={d.number} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] flex items-center justify-center font-bold mt-0.5">
                  {d.number}
                </span>
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</p>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completedCount} of {totalSteps} activities started</p>
        </div>

        {/* Next recommended step */}
        {nextStep ? (
          <Link
            to={nextStep.link}
            className="block rounded-lg bg-accent/10 border border-accent/20 p-3 hover:bg-accent/15 transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">Next Recommended Step</p>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{nextStep.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{nextStep.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-accent flex-shrink-0 ml-2" />
            </div>
          </Link>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-sm font-semibold text-emerald-700">All stage activities started!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ready to advance to the next stage.</p>
            </div>
            {orgId && currentStage !== 'sustain' && (
              <AdvanceStageButton orgId={orgId} currentStage={currentStage} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}