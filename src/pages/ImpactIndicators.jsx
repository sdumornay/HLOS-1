import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus } from 'lucide-react';
import ImpactNav from '@/components/impact/ImpactNav';
import IndicatorCard from '@/components/impact/IndicatorCard';
import IndicatorLibraryDialog from '@/components/impact/IndicatorLibraryDialog';
import { DIMENSIONS } from '@/lib/impactDimensions';
import { items } from '@/lib/impactQuery';

export default function ImpactIndicators() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: indicators = [], isLoading } = useQuery({
    queryKey: ['impactIndicators', orgId],
    queryFn: () => base44.entities.ImpactIndicator.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['impactAgreements', orgId],
    queryFn: () => base44.entities.ImpactAgreement.filter({ organization_id: orgId }, { sort: '-created_date', limit: 1 }).then(items),
    enabled: !!orgId,
  });
  const agreement = agreements[0];

  const { data: snapshots = [] } = useQuery({
    queryKey: ['orgSnapshots-impact', orgId],
    queryFn: () => base44.entities.OrgHealthSnapshot.filter({ organization_id: orgId }, { sort: '-created_date', limit: 1 }).then(items),
    enabled: !!orgId,
  });
  const snapshot = snapshots[0];

  const addMutation = useMutation({
    mutationFn: (records) =>
      base44.entities.ImpactIndicator.bulkCreate(
        records.map((r) => ({ ...r, organization_id: orgId, agreement_id: agreement?.id }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impactIndicators', orgId] });
      setPickerOpen(false);
    },
  });

  const existingNames = useMemo(() => indicators.map((i) => i.name), [indicators]);
  const grouped = DIMENSIONS.map((d) => ({
    ...d,
    items: indicators.filter((i) => i.dimension === d.key),
  })).filter((d) => d.items.length > 0);

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to select its indicators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ImpactNav
        title="Impact Indicators"
        description="Choose the measures that fit this engagement, then record a baseline, a target and follow-up measurements. Nothing is scored together unless a transparent calculation has been agreed."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add indicators
        </Button>
        <Badge variant="outline" className="text-[10px]">{indicators.length} tracked</Badge>
        {snapshot && (
          <span className="text-xs text-muted-foreground">
            Baseline values are reused from the Organizational Health Snapshot where a matching score exists.
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading indicators…</p>}

      {!isLoading && indicators.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">No indicators yet</p>
            <p className="text-xs text-muted-foreground">
              Start with two or three measures tied to your agreed results. You do not need to measure everything.
            </p>
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              Choose from the indicator library
            </Button>
          </CardContent>
        </Card>
      )}

      {grouped.map((dimension) => (
        <div key={dimension.key} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{dimension.letter}</Badge>
            <p className="text-sm font-semibold text-foreground">{dimension.label}</p>
            <span className="text-xs text-muted-foreground hidden sm:inline">{dimension.blurb}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {dimension.items.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} orgId={orgId} />
            ))}
          </div>
        </div>
      ))}

      <IndicatorLibraryDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        snapshot={snapshot}
        existingKeys={existingNames}
        saving={addMutation.isPending}
        onAdd={(records, reset) =>
          addMutation.mutate(records, {
            onSuccess: () => reset?.(),
          })
        }
      />
    </div>
  );
}