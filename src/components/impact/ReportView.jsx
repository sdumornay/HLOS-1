import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ShieldCheck } from 'lucide-react';
import ExportPDFButton from '@/components/shared/ExportPDFButton';
import {
  AI_NOTICE,
  NARRATIVE_SECTIONS,
  REPORT_STATUS,
  REPORT_TYPES,
  buildReportPdfSections,
} from '@/lib/impactReports';
import { INDICATOR_STATUS, formatValue, indicatorStatus } from '@/lib/impactDimensions';
import { BEHAVIOR_STATUS } from '@/lib/impactDimensions';

export default function ReportView({ report, org, agreement, indicators, behaviors, canEdit, onUpdate, updating }) {
  const [narrative, setNarrative] = useState(report.narrative || {});

  useEffect(() => {
    setNarrative(report.narrative || {});
  }, [report.id, report.updated_date]);

  const pdfSections = buildReportPdfSections({
    report: { ...report, narrative },
    org,
    agreement,
    indicators,
    behaviors,
  });

  const behaviorCounts = Object.keys(BEHAVIOR_STATUS).map((key) => ({
    key,
    label: BEHAVIOR_STATUS[key].label,
    count: behaviors.filter((b) => b.status === key).length,
  }));

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {REPORT_TYPES[report.type]?.stage}
                </Badge>
                <Badge variant={REPORT_STATUS[report.status]?.tone} className="text-[10px]">
                  {REPORT_STATUS[report.status]?.label}
                </Badge>
                {report.ai_generated && (
                  <Badge variant="secondary" className="text-[10px]">AI-assisted draft</Badge>
                )}
              </div>
              <CardTitle className="text-lg font-semibold">
                {report.title || REPORT_TYPES[report.type]?.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {org?.name} · {report.period_start || '—'} to {report.period_end || '—'}
                {report.generated_date ? ` · generated ${report.generated_date}` : ''}
              </p>
            </div>
            <ExportPDFButton
              title={report.title || REPORT_TYPES[report.type]?.label}
              subtitle={`${org?.name || ''} · Dumornay Coaching`}
              sections={pdfSections}
              filename={`impact-${report.type}.pdf`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.ai_generated && (
            <Alert className="border-accent/40 bg-accent/5">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs text-foreground">{AI_NOTICE}</AlertDescription>
            </Alert>
          )}

          {agreement?.priority_results?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Agreed success outcomes</p>
              <div className="space-y-2">
                {agreement.priority_results.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-2.5">
                    <p className="text-sm text-foreground">{r.result || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Baseline: {r.baseline || 'Not yet measured'} · Target: {r.target || '—'}
                      {r.target_date ? ` by ${r.target_date}` : ''}
                      {r.owner ? ` · Owner: ${r.owner}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Indicator measurements</p>
            {indicators.length === 0 ? (
              <p className="text-xs text-muted-foreground">No indicators selected for this engagement.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-1.5 pr-2 font-medium">Indicator</th>
                      <th className="py-1.5 pr-2 font-medium">Baseline</th>
                      <th className="py-1.5 pr-2 font-medium">Current</th>
                      <th className="py-1.5 pr-2 font-medium">Target</th>
                      <th className="py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators.map((i) => (
                      <tr key={i.id} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 text-foreground">{i.name}</td>
                        <td className="py-1.5 pr-2">{formatValue(i.baseline_value, i.unit)}</td>
                        <td className="py-1.5 pr-2 font-medium text-foreground">
                          {formatValue(i.actual_value, i.unit)}
                        </td>
                        <td className="py-1.5 pr-2">{formatValue(i.target_value, i.unit)}</td>
                        <td className="py-1.5">{INDICATOR_STATUS[indicatorStatus(i)]?.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Behavioral adoption</p>
            <div className="flex flex-wrap gap-2">
              {behaviorCounts.map((b) => (
                <span
                  key={b.key}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {b.label}: <strong className="text-foreground">{b.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Narrative</CardTitle>
          <p className="text-xs text-muted-foreground">
            {canEdit
              ? 'Edit any section. Changes are saved to the report only, never to the assessment records.'
              : 'Read-only. A coach can revise these conclusions.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {NARRATIVE_SECTIONS.map((section) => (
            <div key={section.key}>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {section.heading}
              </Label>
              {canEdit ? (
                <Textarea
                  rows={3}
                  className="mt-1"
                  value={narrative[section.key] || ''}
                  placeholder="Not Yet Measured — no evidence recorded for this section."
                  onChange={(e) => setNarrative({ ...narrative, [section.key]: e.target.value })}
                />
              ) : (
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {narrative[section.key] || 'Not Yet Measured'}
                </p>
              )}
            </div>
          ))}

          {canEdit && (
            <div className="space-y-3 border-t border-border pt-3">
              <div>
                <Label className="text-xs">Reviewer notes</Label>
                <Textarea
                  rows={2}
                  defaultValue={report.reviewer_notes || ''}
                  onBlur={(e) => onUpdate({ reviewer_notes: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onUpdate({ narrative })} disabled={updating}>
                  {updating ? 'Saving…' : 'Save narrative'}
                </Button>
                {report.status !== 'in_review' && report.status !== 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => onUpdate({ status: 'in_review', narrative })}>
                    Send to review
                  </Button>
                )}
                {report.status !== 'approved' && (
                  <Button size="sm" variant="secondary" onClick={() => onUpdate({ status: 'approved', narrative })}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Approve as coach
                  </Button>
                )}
              </div>
            </div>
          )}

          {report.reviewed_by && (
            <p className="text-xs text-muted-foreground">
              Reviewed by {report.reviewed_by}
              {report.reviewed_date ? ` on ${report.reviewed_date}` : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}