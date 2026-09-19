import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle2, Clock, Shield, Compass, Rocket, Leaf, ArrowRight, AlertCircle } from 'lucide-react';
import { useStageAccess } from '@/lib/useStageAccess';
import { STAGE_LABELS, STATUS_LABELS, STATUS_COLORS, STATUS_BACKGROUNDS, STAGE_DESCRIPTIONS } from '@/lib/stageDeliverables';
import { cn } from '@/lib/utils';

const STAGE_ICONS = {
  stabilize: Shield,
  align: Compass,
  execute: Rocket,
  sustain: Leaf,
};

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'locked') return <Lock className="h-4 w-4 text-muted-foreground" />;
  if (status === 'awaiting_approval') return <AlertCircle className="h-4 w-4 text-purple-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

export default function StageJourneyDashboard() {
  const { stages, isLoading } = useStageAccess();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Your HLOS Journey</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Progress through the four stages</p>
          </div>
        </div>

        <div className="space-y-2">
          {stages.map((s, i) => {
            const Icon = STAGE_ICONS[s.stage];
            const isLocked = s.status === 'locked';
            const isCompleted = s.status === 'completed';
            const isAwaiting = s.status === 'awaiting_approval';

            return (
              <div
                key={s.stage}
                className={cn(
                  "rounded-lg border p-3 transition-all",
                  isLocked ? "border-border/30 bg-muted/30 opacity-60" : "border-border/50",
                  isAwaiting && "border-purple-200 bg-purple-50/50",
                  isCompleted && "border-emerald-200 bg-emerald-50/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    isLocked ? "bg-muted" : isCompleted ? "bg-emerald-100" : "bg-accent/10"
                  )}>
                    <Icon className={cn("h-4 w-4", isLocked ? "text-muted-foreground" : "text-accent")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Stage {s.stage_number}</span>
                      <p className="text-sm font-semibold">{s.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{STAGE_DESCRIPTIONS[s.stage]}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusIcon status={s.status} />
                    <span className={cn("text-xs font-medium", STATUS_COLORS[s.status])}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>
                </div>

                {/* Progress bar for non-locked stages */}
                {!isLocked && (
                  <div className="mt-2.5 ml-12">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden mr-2">
                        <div
                          className={cn("h-full rounded-full transition-all", isCompleted ? "bg-emerald-500" : "bg-accent")}
                          style={{ width: `${s.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{s.completion_percentage}%</span>
                    </div>
                    {s.completion_date && (
                      <p className="text-[10px] text-muted-foreground">Completed {new Date(s.completion_date).toLocaleDateString()}</p>
                    )}
                    {isAwaiting && (
                      <p className="text-[10px] text-purple-600 font-medium">Stage complete. Awaiting approval.</p>
                    )}
                  </div>
                )}

                {/* Action button */}
                <div className="mt-2 ml-12">
                  {isLocked ? (
                    <p className="text-[10px] text-muted-foreground">
                      {i === 0
                        ? 'Complete the Leadership Health Scoreboard to unlock'
                        : `Complete ${STAGE_LABELS[stages[i - 1].stage]} before accessing ${s.label}`}
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant={isCompleted ? "ghost" : "outline"}
                      onClick={() => navigate(`/${s.stage}`)}
                      className="text-xs h-7"
                    >
                      {isCompleted ? 'Review' : 'Open Stage'} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}