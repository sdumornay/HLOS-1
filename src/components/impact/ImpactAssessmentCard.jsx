import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useOrgId } from '@/lib/useOrgId';
import { useImpactAssessmentStatus } from '@/lib/useImpactAssessmentStatus';
import { scoreBand } from '@/lib/impactAssessment';

export default function ImpactAssessmentCard() {
  const orgId = useOrgId();
  const { impactCompleted, latestAssessment } = useImpactAssessmentStatus(orgId);
  const band = scoreBand(latestAssessment?.overall_score);

  return (
    <Card className={impactCompleted ? 'border-emerald-200 bg-emerald-50/40' : 'border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5'}>
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
          {impactCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Target className="h-5 w-5 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">Organizational Impact Baseline</p>
            {impactCompleted ? (
              <Badge variant="outline" className="text-[10px]">
                {band.label} · {Number(latestAssessment?.overall_score).toFixed(1)} / 5
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Not yet taken</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {impactCompleted && latestAssessment?.created_date
              ? `Completed ${format(new Date(latestAssessment.created_date), 'MMM d, yyyy')}. This is the baseline your indicators are measured against.`
              : 'A 15-question baseline across the five impact dimensions. Take it once your Leadership Health Scoreboard is complete.'}
          </p>
        </div>
        <Button asChild size="sm" variant={impactCompleted ? 'outline' : 'default'} className="flex-shrink-0">
          <Link to="/impact/assessment">
            {impactCompleted ? 'Review baseline' : 'Take assessment'} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}