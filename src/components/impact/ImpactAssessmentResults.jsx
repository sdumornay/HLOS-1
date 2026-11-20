import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { DIMENSIONS, DIMENSION_SCORE_FIELD, scoreBand } from '@/lib/impactAssessment';
import { cn } from '@/lib/utils';

function ScoreBar({ score }) {
  const pct = score == null ? 0 : Math.max(0, Math.min(100, (Number(score) / 5) * 100));
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ImpactAssessmentResults({ scores, record }) {
  const overall = scores?.overall_score;
  const overallBand = scoreBand(overall);

  const dimensionScores = DIMENSIONS.map((d) => ({
    ...d,
    score: scores?.[DIMENSION_SCORE_FIELD[d.key]],
  }));

  const measured = dimensionScores.filter((d) => d.score != null);
  const strength = measured.length
    ? measured.reduce((best, d) => (d.score > best.score ? d : best), measured[0])
    : null;
  const priority = measured.length
    ? measured.reduce((low, d) => (d.score < low.score ? d : low), measured[0])
    : null;

  return (
    <div className="space-y-5">
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-6 text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Organizational Impact Baseline
          </p>
          <p className="text-4xl font-display font-bold">{overall != null ? Number(overall).toFixed(1) : '—'}</p>
          <p className="text-xs text-muted-foreground">out of 5.0 across the five impact dimensions</p>
          <Badge variant={overallBand.tone}>{overallBand.label}</Badge>
          <p className="text-xs text-muted-foreground pt-1">
            {record?.respondent_name || record?.respondent_email || 'You'}
            {record?.created_date ? ` · ${format(new Date(record.created_date), 'MMM d, yyyy')}` : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold">Dimension scores</p>
          {dimensionScores.map((d) => {
            const band = scoreBand(d.score);
            return (
              <div key={d.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground mr-1.5">{d.letter}.</span>
                    {d.label}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold">{d.score != null ? Number(d.score).toFixed(1) : '—'}</span>
                    <Badge variant={band.tone} className="text-[10px]">{band.label}</Badge>
                  </div>
                </div>
                <ScoreBar score={d.score} />
                <p className="text-xs text-muted-foreground">{d.blurb}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {measured.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strongest</p>
              </div>
              <p className="text-sm font-medium mt-1">{strength?.label}</p>
              <p className="text-xs text-muted-foreground">{Number(strength?.score).toFixed(1)} / 5</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority focus</p>
              </div>
              <p className="text-sm font-medium mt-1">{priority?.label}</p>
              <p className="text-xs text-muted-foreground">{Number(priority?.score).toFixed(1)} / 5</p>
            </CardContent>
          </Card>
        </div>
      )}

      <p className={cn('text-xs text-muted-foreground leading-relaxed px-1')}>
        These scores are your impact baseline. Use them as the starting value for the indicators you choose to
        track, so later measurements can be compared against a recorded point in time.
      </p>
    </div>
  );
}