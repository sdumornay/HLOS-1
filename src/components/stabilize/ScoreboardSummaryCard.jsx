import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useBaselineStatus } from '@/lib/useBaselineStatus';
import { cn } from '@/lib/utils';

const STAGE_LABELS = {
  stabilize_score: 'Stabilize',
  align_score: 'Align',
  execute_score: 'Execute',
  sustain_score: 'Sustain',
};

/**
 * Shows a summary of the latest Leadership Health Scoreboard results
 * within the Stabilize stage page. The Scoreboard is the second assessment
 * in the diagnostic journey and the baseline for Stage 1.
 */
export default function ScoreboardSummaryCard({ orgId }) {
  const navigate = useNavigate();
  const { latestScoreboard, baselineCompleted: scoreboardBaseline } = useBaselineStatus(orgId);

  // Fallback: use the org's baseline_completed flag since the scoreboards query
  // is RLS-filtered and can return empty if the user's session role is stale.
  const { data: org } = useQuery({
    queryKey: ['org-for-scoreboard-card', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });
  const orgBaselineCompleted = org?.baseline_completed === true;
  const baselineCompleted = scoreboardBaseline || orgBaselineCompleted;

  if (!baselineCompleted) {
    return (
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete the 16-question baseline assessment for your leadership team.
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

  // Baseline completed but RLS hides the detailed records — show completed state
  if (!latestScoreboard) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your leadership team baseline is complete.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/scoreboard')}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retake
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overall = latestScoreboard.overall_score || 0;
  const stageScores = ['stabilize_score', 'align_score', 'execute_score', 'sustain_score']
    .map(k => ({ key: k, label: STAGE_LABELS[k], score: latestScoreboard[k] || 0 }));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              <p className="text-xs text-muted-foreground">Your leadership team baseline</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{overall.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
        </div>

        {/* Stage scores */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {stageScores.map(s => (
            <div key={s.key} className="text-center rounded-lg bg-muted/40 py-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold">{s.score.toFixed(1)}</p>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/scoreboard')}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retake Scoreboard
        </Button>
      </CardContent>
    </Card>
  );
}