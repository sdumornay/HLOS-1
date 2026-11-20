import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Sparkles, FileText } from 'lucide-react';
import ImpactNav from '@/components/impact/ImpactNav';
import ReportView from '@/components/impact/ReportView';
import { REPORT_STATUS, REPORT_TYPES } from '@/lib/impactReports';
import { items } from '@/lib/impactQuery';
import { cn } from '@/lib/utils';

export default function ImpactReports() {
  const orgId = useOrgId();
  const { user, isAdmin, isCoach, isLeadPastor } = useCurrentUser();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const canEdit = isAdmin || isCoach;

  const { data: org } = useQuery({
    queryKey: ['impactOrg', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['impactReports', orgId],
    queryFn: () => base44.entities.ImpactReport.filter({ organization_id: orgId }, { sort: '-created_date', limit: 50 }).then(items),
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

  const generateMutation = useMutation({
    mutationFn: async (type) => {
      const res = await base44.functions.invoke('generateImpactReport', { organizationId: orgId, type });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['impactReports', orgId] });
      if (data?.report?.id) setSelectedId(data.report.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (patch) =>
      base44.entities.ImpactReport.update(selectedReport.id, {
        ...patch,
        reviewed_by: user?.email || '',
        reviewed_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impactReports', orgId] }),
  });

  const selectedReport = reports.find((r) => r.id === selectedId) || reports[0];

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to view its impact reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ImpactNav
        title="Impact Reports"
        description="Generate a report from the evidence on record, review the narrative as a coach, then export it. AI sections are drafts until a coach approves them."
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">Generate a report</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(REPORT_TYPES).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate(key)}
                className={cn(
                  'rounded-lg border border-border p-3 text-left transition-colors',
                  'hover:bg-muted/40 disabled:opacity-60'
                )}
              >
                <p className="text-sm font-medium text-foreground">{meta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.blurb}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">{meta.stage} stage</Badge>
              </button>
            ))}
          </div>
          {generateMutation.isPending && (
            <p className="text-xs text-muted-foreground">
              Reading the records and drafting the narrative. This takes a few seconds.
            </p>
          )}
          {generateMutation.isError && (
            <p className="text-xs text-destructive">
              The report could not be generated. {generateMutation.error?.message}
            </p>
          )}
          {!isCoach && !isAdmin && isLeadPastor && (
            <p className="text-xs text-muted-foreground">
              You can generate and read reports for your organization. Your coach approves the final narrative.
            </p>
          )}
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex gap-2 px-1 min-w-max">
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedId(report.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors min-w-[190px]',
                  selectedReport?.id === report.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/40'
                )}
              >
                <p className="text-xs font-medium text-foreground truncate">
                  {REPORT_TYPES[report.type]?.label || report.type}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {report.generated_date || report.created_date?.slice(0, 10)} · {REPORT_STATUS[report.status]?.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedReport ? (
        <ReportView
          report={selectedReport}
          org={org}
          agreement={agreement}
          indicators={indicators}
          behaviors={behaviors}
          canEdit={canEdit}
          onUpdate={(patch) => updateMutation.mutate(patch)}
          updating={updateMutation.isPending}
        />
      ) : (
        <Card className="border-dashed border-border">
          <CardContent className="p-6 text-center space-y-2">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">No reports yet</p>
            <p className="text-xs text-muted-foreground">
              Generate a baseline report first, then a midpoint or final report as evidence accumulates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}