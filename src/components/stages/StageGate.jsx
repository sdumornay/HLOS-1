import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import { useStageAccess } from '@/lib/useStageAccess';
import { STAGE_LABELS, STAGE_DESCRIPTIONS } from '@/lib/stageDeliverables';

/**
 * Wraps a stage page. If the stage is locked, shows a locked message
 * instead of the page content. Completed stages remain accessible.
 */
export default function StageGate({ stage, children }) {
  const { stages, isLoading, error, canAccessStage, getStageStatus } = useStageAccess();
  const navigate = useNavigate();

  if (isLoading || (error && stages.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading stage access...</p>
      </div>
    );
  }

  const status = getStageStatus(stage);
  const canAccess = canAccessStage(stage);

  if (!canAccess) {
    const stageIndex = ['stabilize', 'align', 'execute', 'sustain'].indexOf(stage);
    const prevStage = stageIndex > 0 ? STAGE_LABELS[['stabilize', 'align', 'execute', 'sustain'][stageIndex - 1]] : null;
    const isBaseline = stage === 'stabilize';

    return (
      <div className="max-w-lg mx-auto py-12">
        <Card className="border-border/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold">{STAGE_LABELS[stage]} is Locked</h2>
              <p className="text-sm text-muted-foreground">
                {STAGE_DESCRIPTIONS[stage]}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              {isBaseline ? (
                <p>
                  Complete the <strong>Leadership Health Scoreboard</strong> to unlock Stage 1: Stabilize.
                </p>
              ) : (
                <p>
                  Complete <strong>{prevStage}</strong> and get administrator approval before accessing {STAGE_LABELS[stage]}.
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Back to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}