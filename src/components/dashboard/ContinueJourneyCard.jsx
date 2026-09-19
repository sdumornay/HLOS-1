import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Compass } from 'lucide-react';
import { useStageAccess } from '@/lib/useStageAccess';
import { STAGE_LABELS, STAGE_DESCRIPTIONS, STATUS_LABELS } from '@/lib/stageDeliverables';

/**
 * Replaces the AssessmentStatusPanel on the dashboard.
 * Directs users to their next required activity in their current stage.
 */
export default function ContinueJourneyCard() {
  const { stages, currentStage, baselineCompleted, isLoading } = useStageAccess();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="h-20 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find the active stage (in_progress, available, or awaiting_approval)
  const activeStage = stages.find((s) =>
    s.status === 'in_progress' || s.status === 'available' || s.status === 'awaiting_approval'
  );

  // If no baseline, direct to scoreboard
  if (!baselineCompleted) {
    return (
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Compass className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Continue Your HLOS Journey</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start with the Leadership Health Scoreboard — your 16-question baseline assessment.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/scoreboard')}>
              Take Scoreboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If awaiting approval
  if (activeStage?.status === 'awaiting_approval') {
    return (
      <Card className="border-purple-200 bg-purple-50/30 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Compass className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Continue Your HLOS Journey</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {STAGE_LABELS[activeStage.stage]} is complete and awaiting administrator approval.
                The next stage will unlock once approved.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate(`/${activeStage.stage}`)}>
              Review <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active stage in progress — find next deliverable
  const nextDeliverable = activeStage?.deliverables?.find((d) => !d.met);
  const completedCount = activeStage?.deliverables?.filter((d) => d.met).length || 0;
  const totalCount = activeStage?.deliverables?.length || 0;

  return (
    <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Compass className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Continue Your HLOS Journey</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nextDeliverable ? (
                <>Next: <strong>{nextDeliverable.label}</strong> in Stage {activeStage.stage_number}: {STAGE_LABELS[activeStage.stage]}</>
              ) : (
                <>Stage {activeStage.stage_number}: {STAGE_LABELS[activeStage.stage]} — {completedCount} of {totalCount} deliverables complete</>
              )}
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2 max-w-xs">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${activeStage?.completion_percentage || 0}%` }} />
            </div>
          </div>
          <Button size="sm" onClick={() => navigate(`/${activeStage.stage}`)}>
            Open {STAGE_LABELS[activeStage.stage]} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}