import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, CalendarClock, ClipboardList, Target } from 'lucide-react';
import ImpactNav from '@/components/impact/ImpactNav';
import ImpactStatCards from '@/components/impact/ImpactStatCards';
import ImpactAssessmentCard from '@/components/impact/ImpactAssessmentCard';
import IndicatorComparisonChart from '@/components/impact/IndicatorComparisonChart';
import {
  DIMENSION_MAP,
  INDICATOR_STATUS,
  UNITS,
  computeProgress,
  deltaFromBaseline,
  formatValue,
  indicatorStatus,
} from '@/lib/impactDimensions';
import { INSTRUMENTS } from '@/lib/impactInstruments';
import { REPORT_TYPES } from '@/lib/impactReports';
import { items } from '@/lib/impactQuery';

export default function Impact() {
  const orgId = useOrgId();

  const { data: org } = useQuery({
    queryKey: ['impactOrg', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['impactAgreements', orgId],
    queryFn: () => base44.entities.ImpactAgreement.filter({ organization_id: orgId }, { sort: '-created_date', limit: 1 }).then(items),
    enabled: !!orgId,
  });
  const agreement = agreements[0];

  const { data: indicators = [] } = useQuery({
    queryKey: ['impactIndicators', orgId],
    queryFn: () => base44.entities.ImpactIndicator.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: behaviors = [] } = useQuery({
    queryKey: ['impactBehaviors', orgId],
    queryFn: () => base44.entities.BehaviorCommitment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['impactResponses', orgId],
    queryFn: () => base44.entities.EvaluationResponse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['impactReports', orgId],
    queryFn: () => base44.entities.ImpactReport.filter({ organization_id: orgId }, { sort: '-created_date', limit: 1 }).then(items),
    enabled: !!orgId,
  });
  const latestReport = reports[0];

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to view its impact evaluation.</p>
        </div>
      </div>
    );
  }

  const cards = indicators.slice(0, 3).map((indicator) => {
    const { pct } = computeProgress(indicator);
    const delta = deltaFromBaseline(indicator);
    const status = indicatorStatus(indicator);
    return {
      id: indicator.id,
      label: indicator.name,
      value: indicator.actual_value == null ? '—' : formatValue(indicator.actual_value, indicator.unit),
      unit: UNITS[indicator.unit],
      pct,
      goalText:
        indicator.target_value == null
          ? 'no target set yet'
          : `of ${formatValue(indicator.target_value, indicator.unit)} target`,
      trend:
        delta === null
          ? { dir: 'flat', text: 'No baseline yet' }
          : {
              dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
              text: `${delta > 0 ? '+' : ''}${Number(delta.toFixed(2))}`,
              period: 'vs baseline',
            },
      note: `${DIMENSION_MAP[indicator.dimension]?.label} · ${INDICATOR_STATUS[status]?.label}`,
    };
  });

  const evaluationStatus = INSTRUMENTS.map((instrument) => {
    const levelResponses = responses.filter((r) => r.level === instrument.level);
    return { ...instrument, count: levelResponses.length };
  });

  const reviewDates = behaviors.map((b) => b.next_review_date).filter(Boolean).sort();
  const nextEvaluation = reviewDates[0] || agreement?.engagement_end || null;

  const attention = [];
  indicators.forEach((i) => {
    const status = indicatorStatus(i);
    if (status === 'off_track') attention.push({ title: i.name, detail: 'Behind the agreed pace toward target.' });
    if (i.target_value != null && i.baseline_value == null) {
      attention.push({ title: i.name, detail: 'Target set but no baseline recorded — comparison not possible.' });
    }
    if (i.baseline_value != null && i.actual_value == null) {
      attention.push({ title: i.name, detail: 'Baseline recorded, no follow-up measurement yet.' });
    }
  });
  behaviors
    .filter((b) => b.status === 'not_started')
    .forEach((b) => attention.push({ title: b.description, detail: 'Commitment has not started.' }));
  evaluationStatus
    .filter((e) => e.count === 0)
    .forEach((e) => attention.push({ title: `Level ${e.level}: ${e.title}`, detail: 'No evaluation recorded for this level.' }));
  if (!agreement) attention.push({ title: 'Impact Agreement', detail: 'Success outcomes and measures have not been agreed yet.' });
  if (agreement && agreement.status !== 'confirmed') {
    attention.push({ title: 'Impact Agreement', detail: 'Agreement is not yet confirmed by the sponsor and coach.' });
  }

  const timeline = [
    agreement?.engagement_start && { date: agreement.engagement_start, label: 'Engagement began' },
    agreement?.confirmed_date && { date: agreement.confirmed_date, label: 'Impact Agreement confirmed' },
    ...indicators.filter((i) => i.baseline_date).map((i) => ({ date: i.baseline_date, label: `Baseline recorded — ${i.name}` })),
    ...indicators.filter((i) => i.actual_date).map((i) => ({ date: i.actual_date, label: `Measured — ${i.name}` })),
    ...behaviors.filter((b) => b.date_reviewed).map((b) => ({ date: b.date_reviewed, label: `Behavior reviewed — ${b.description.slice(0, 40)}` })),
    latestReport?.generated_date && { date: latestReport.generated_date, label: 'Latest impact report generated' },
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  return (
    <div className="space-y-5">
      <ImpactNav />

      <ImpactAssessmentCard />

      {cards.length > 0 ? (
        <ImpactStatCards cards={cards} />
      ) : (
        <Card className="border-dashed border-border">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <Target className="h-5 w-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">No indicators selected yet</p>
              <p className="text-xs text-muted-foreground">
                Pick the measures that matter for this engagement. Nothing is invented for you.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/impact/indicators">Choose indicators</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Priority outcomes</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/impact/agreement">
                Agreement <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(agreement?.priority_results || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No priority results agreed yet.</p>
            )}
            {(agreement?.priority_results || []).map((r, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3">
                <p className="text-sm font-medium text-foreground">{r.result || 'Untitled result'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseline: {r.baseline || 'Not yet measured'} · Target: {r.target || '—'}
                  {r.target_date ? ` by ${r.target_date}` : ''}
                  {r.owner ? ` · ${r.owner}` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evaluation status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {evaluationStatus.map((e) => (
              <div key={e.level} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">
                  <span className="text-muted-foreground mr-1">{e.level}.</span>
                  {e.title}
                </span>
                <Badge variant={e.count > 0 ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                  {e.count > 0 ? `${e.count} recorded` : 'Not Yet Measured'}
                </Badge>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Next evaluation: {nextEvaluation || 'not scheduled'}
            </div>
          </CardContent>
        </Card>
      </div>

      {indicators.length > 0 && <IndicatorComparisonChart indicators={indicators} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Behavioral adoption</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/impact/behaviors">
                Tracker <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {behaviors.length === 0 && (
              <p className="text-sm text-muted-foreground">No behavior commitments recorded yet.</p>
            )}
            {behaviors.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{b.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.owner_name || 'No owner'} · {b.expected_frequency || 'frequency not set'}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                  {b.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Areas needing attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attention.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing flagged from the evidence on record.</p>
            )}
            {attention.slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Engagement timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dated evidence yet.</p>
          ) : (
            <ol className="relative border-l border-border pl-4 space-y-3">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-secondary" />
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                  <p className="text-sm text-foreground">{t.label}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Reports</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link to="/impact/reports">
              Open reports <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {latestReport ? (
            <div className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground">{latestReport.title || REPORT_TYPES[latestReport.type]?.label}</span>
              <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                {latestReport.status.replace('_', ' ')}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No report generated yet. Baseline, midpoint, final and 90-day reports can be generated from the Reports tab.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}