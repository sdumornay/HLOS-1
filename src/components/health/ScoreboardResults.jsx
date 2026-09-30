import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Compass, Rocket, Leaf, Target, Radar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STAGE_META } from '@/lib/stageMeta';
import { buildScoreboardRecommendations, SEVERITY_STYLES } from '@/lib/scoreboardRecommendations';
import { useScoreboardConfig } from '@/lib/useScoreboardConfig';
import { useStageAccess } from '@/lib/useStageAccess';
import { cn } from '@/lib/utils';

const STAGE_ICONS = { stabilize: Shield, align: Compass, execute: Rocket, sustain: Leaf };

export default function ScoreboardResults({ scores, orgId }) {
  const { config } = useScoreboardConfig();
  const { getStageStatus } = useStageAccess(orgId);

  // Build stage status map; fall back to 'available' for the first stage and
  // 'locked' for the rest when stage access hasn't loaded yet (e.g. right after
  // baseline submission). This keeps the current action stage correct.
  const stageStatuses = {};
  ['stabilize', 'align', 'execute', 'sustain'].forEach((s) => {
    const status = getStageStatus(s);
    stageStatuses[s] = status && status !== 'locked' ? status : (s === 'stabilize' ? 'available' : 'locked');
  });

  const result = buildScoreboardRecommendations(scores, stageStatuses, config);

  return (
    <div className="space-y-5">
      {/* Your Starting Point */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Your Starting Point</p>
          </div>
          <p className="text-sm leading-relaxed">{result.startingPoint}</p>
        </CardContent>
      </Card>

      {/* Phase cards in HLOS sequence */}
      <div className="space-y-3">
        {result.phases.map((phase) => {
          const Icon = STAGE_ICONS[phase.stage];
          const style = SEVERITY_STYLES[phase.severity];
          return (
            <Card key={phase.stage} className={cn('border-border/50', style.bg)}>
              <CardContent className="p-5 space-y-3">
                {/* Header: name + score + severity */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', style.badge)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        Stage {phase.number}: {phase.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{STAGE_META[phase.stage].what}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-lg font-bold', style.text)}>{phase.score}</span>
                    <Badge className={cn('border', style.badge)}>{phase.severityLabel}</Badge>
                  </div>
                </div>

                {/* Diagnosis */}
                <p className="text-sm text-foreground/90 leading-relaxed">{phase.diagnosis}</p>

                {/* Recommendation: current action vs future priority vs maintain */}
                {phase.recommendationType === 'current_action' && (
                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-accent" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent">What to Focus on Now</p>
                    </div>
                    <p className="text-sm leading-relaxed">{phase.recommendationText}</p>
                    {phase.tools?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {phase.tools.map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground/80 border border-accent/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link to={`/${phase.stage}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline pt-1">
                      Go to {phase.name} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {phase.recommendationType === 'future_priority' && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Radar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keep on the Radar</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{phase.recommendationText}</p>
                  </div>
                )}

                {phase.recommendationType === 'maintain' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Maintain</p>
                    </div>
                    <p className="text-sm text-emerald-800/80 leading-relaxed">{phase.recommendationText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}