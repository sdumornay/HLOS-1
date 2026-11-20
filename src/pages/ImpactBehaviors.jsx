import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Pencil, Trash2, CalendarClock } from 'lucide-react';
import ImpactNav from '@/components/impact/ImpactNav';
import BehaviorForm from '@/components/impact/BehaviorForm';
import { BEHAVIOR_STATUS } from '@/lib/impactDimensions';
import { items } from '@/lib/impactQuery';

export default function ImpactBehaviors() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: behaviors = [], isLoading } = useQuery({
    queryKey: ['impactBehaviors', orgId],
    queryFn: () => base44.entities.BehaviorCommitment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['impactAgreements', orgId],
    queryFn: () => base44.entities.ImpactAgreement.filter({ organization_id: orgId }, { sort: '-created_date', limit: 1 }).then(items),
    enabled: !!orgId,
  });
  const agreement = agreements[0];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['impactBehaviors', orgId] });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.BehaviorCommitment.create({ ...data, organization_id: orgId, agreement_id: agreement?.id }),
    onSuccess: () => {
      invalidate();
      setAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BehaviorCommitment.update(id, data),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BehaviorCommitment.delete(id),
    onSuccess: invalidate,
  });

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to track its behaviors.</p>
        </div>
      </div>
    );
  }

  const counts = Object.keys(BEHAVIOR_STATUS).map((key) => ({
    key,
    label: BEHAVIOR_STATUS[key].label,
    count: behaviors.filter((b) => b.status === key).length,
  }));

  const nextReview = behaviors.map((b) => b.next_review_date).filter(Boolean).sort()[0];

  return (
    <div className="space-y-5">
      <ImpactNav
        title="Behavioral Change Tracker"
        description="Level 3 of the evaluation: are leaders actually doing what they agreed to do? Review each commitment monthly and record the evidence behind the status."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add commitment
        </Button>
        {counts.map((c) => (
          <span key={c.key} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
            {c.label}: <strong className="text-foreground">{c.count}</strong>
          </span>
        ))}
        {nextReview && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> Next review {nextReview}
          </span>
        )}
      </div>

      {adding && (
        <BehaviorForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setAdding(false)}
          saving={createMutation.isPending}
        />
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading commitments…</p>}

      {!isLoading && behaviors.length === 0 && !adding && (
        <Card className="border-dashed border-border">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">No behavior commitments yet</p>
            <p className="text-xs text-muted-foreground">
              Add the behaviors you agreed in the Impact Agreement — weekly accountability, clear delegation, timely decisions,
              direct conflict, consistent follow-through.
            </p>
            <Button size="sm" onClick={() => setAdding(true)}>
              Add the first commitment
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {behaviors.map((behavior) => (
          <Card key={behavior.id} className="border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{behavior.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {behavior.owner_name || 'No owner'} · {behavior.expected_frequency || 'frequency not set'}
                    {behavior.next_review_date ? ` · next review ${behavior.next_review_date}` : ''}
                  </p>
                </div>
                <Badge
                  variant={behavior.status === 'sustained' || behavior.status === 'consistent' ? 'default' : behavior.status === 'emerging' ? 'outline' : 'secondary'}
                  className="text-[10px] flex-shrink-0"
                >
                  {BEHAVIOR_STATUS[behavior.status]?.label || behavior.status}
                </Badge>
              </div>

              {behavior.evidence && (
                <p className="text-xs text-foreground"><span className="font-medium">Evidence:</span> {behavior.evidence}</p>
              )}
              {behavior.barriers && (
                <p className="text-xs text-muted-foreground"><span className="font-medium">Barriers:</span> {behavior.barriers}</p>
              )}
              {behavior.corrective_actions && (
                <p className="text-xs text-muted-foreground"><span className="font-medium">Corrective action:</span> {behavior.corrective_actions}</p>
              )}

              {editingId === behavior.id ? (
                <BehaviorForm
                  initial={behavior}
                  onSubmit={(data) => updateMutation.mutate({ id: behavior.id, data })}
                  onCancel={() => setEditingId(null)}
                  saving={updateMutation.isPending}
                />
              ) : (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(behavior.id)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Monthly check-in
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(behavior.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}