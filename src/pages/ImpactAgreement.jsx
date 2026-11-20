import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
import ImpactNav from '@/components/impact/ImpactNav';
import { items } from '@/lib/impactQuery';

const EMPTY_RESULT = { result: '', baseline: '', target: '', target_date: '', owner: '' };
const EMPTY_BEHAVIOR = { behavior: '', owner: '' };
const EMPTY_INDICATOR = { indicator: '', frequency: '', evidence_source: '' };

export default function ImpactAgreement() {
  const orgId = useOrgId();
  const { user, isCoach, isAdmin, isLeadPastor } = useCurrentUser();
  const queryClient = useQueryClient();
  const canConfirm = isCoach || isAdmin;

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['impactAgreements', orgId],
    queryFn: () => base44.entities.ImpactAgreement.filter({ organization_id: orgId }, { sort: '-created_date', limit: 1 }).then(items),
    enabled: !!orgId,
  });
  const agreement = agreements[0];

  const [form, setForm] = useState({
    title: 'Organizational Impact Agreement',
    engagement_start: '',
    engagement_end: '',
    sponsor_name: '',
    sponsor_email: '',
    coach_email: '',
    priority_results: [{ ...EMPTY_RESULT }],
    critical_behaviors: [{ ...EMPTY_BEHAVIOR }],
    leading_indicators: [{ ...EMPTY_INDICATOR }],
    barriers: '',
    review_notes: '',
  });

  useEffect(() => {
    if (agreement) {
      setForm({
        title: agreement.title || 'Organizational Impact Agreement',
        engagement_start: agreement.engagement_start || '',
        engagement_end: agreement.engagement_end || '',
        sponsor_name: agreement.sponsor_name || '',
        sponsor_email: agreement.sponsor_email || '',
        coach_email: agreement.coach_email || '',
        priority_results: agreement.priority_results?.length ? agreement.priority_results : [{ ...EMPTY_RESULT }],
        critical_behaviors: agreement.critical_behaviors?.length ? agreement.critical_behaviors : [{ ...EMPTY_BEHAVIOR }],
        leading_indicators: agreement.leading_indicators?.length ? agreement.leading_indicators : [{ ...EMPTY_INDICATOR }],
        barriers: agreement.barriers || '',
        review_notes: agreement.review_notes || '',
      });
    }
  }, [agreement?.id, agreement?.updated_date]);

  const saveMutation = useMutation({
    mutationFn: async (status) => {
      const payload = {
        ...form,
        organization_id: orgId,
        status,
        priority_results: form.priority_results.filter((r) => r.result),
        critical_behaviors: form.critical_behaviors.filter((b) => b.behavior),
        leading_indicators: form.leading_indicators.filter((i) => i.indicator),
      };
      if (agreement) return base44.entities.ImpactAgreement.update(agreement.id, payload);
      return base44.entities.ImpactAgreement.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impactAgreements', orgId] }),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      base44.entities.ImpactAgreement.update(agreement.id, {
        status: 'confirmed',
        confirmed_by: user?.email || '',
        confirmed_date: new Date().toISOString().slice(0, 10),
        review_notes: form.review_notes,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impactAgreements', orgId] }),
  });

  const setRow = (field, index, patch) => {
    const next = [...form[field]];
    next[index] = { ...next[index], ...patch };
    setForm({ ...form, [field]: next });
  };
  const addRow = (field, template) => setForm({ ...form, [field]: [...form[field], { ...template }] });
  const removeRow = (field, index) =>
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to build its impact agreement.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading agreement…</div>;
  }

  return (
    <div className="space-y-5">
      <ImpactNav
        title="Organizational Impact Agreement"
        description="Define success before you measure it. Agree two or three organizational results, the leadership behaviors that produce them, and how progress will be evidenced."
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Engagement</CardTitle>
            <Badge variant={agreement?.status === 'confirmed' ? 'default' : agreement?.status === 'under_review' ? 'outline' : 'secondary'} className="text-[10px] capitalize">
              {(agreement?.status || 'draft').replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Agreement title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Engagement start</Label>
            <Input type="date" value={form.engagement_start} onChange={(e) => setForm({ ...form, engagement_start: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Engagement end</Label>
            <Input type="date" value={form.engagement_end} onChange={(e) => setForm({ ...form, engagement_end: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Executive sponsor</Label>
            <Input value={form.sponsor_name} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Sponsor email</Label>
            <Input type="email" value={form.sponsor_email} onChange={(e) => setForm({ ...form, sponsor_email: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Coach email</Label>
            <Input type="email" value={form.coach_email} onChange={(e) => setForm({ ...form, coach_email: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Priority organizational results</CardTitle>
          <p className="text-xs text-muted-foreground">Two or three results. Each needs a measurable baseline, a target and a date.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.priority_results.map((row, index) => (
            <div key={index} className="rounded-lg border border-border/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Result {index + 1}</p>
                {form.priority_results.length > 1 && (
                  <button type="button" onClick={() => removeRow('priority_results', index)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Textarea
                rows={2}
                placeholder="What organizational result are we trying to produce?"
                value={row.result}
                onChange={(e) => setRow('priority_results', index, { result: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Baseline (as measured today)</Label>
                  <Input value={row.baseline} onChange={(e) => setRow('priority_results', index, { baseline: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Target</Label>
                  <Input value={row.target} onChange={(e) => setRow('priority_results', index, { target: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Target date</Label>
                  <Input type="date" value={row.target_date || ''} onChange={(e) => setRow('priority_results', index, { target_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Owner</Label>
                  <Input value={row.owner} onChange={(e) => setRow('priority_results', index, { owner: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addRow('priority_results', EMPTY_RESULT)}>
            <Plus className="h-4 w-4 mr-1" /> Add result
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Critical leadership behaviors</CardTitle>
            <p className="text-xs text-muted-foreground">What leaders must do differently for those results to happen.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {form.critical_behaviors.map((row, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Behavior"
                  value={row.behavior}
                  onChange={(e) => setRow('critical_behaviors', index, { behavior: e.target.value })}
                />
                <Input
                  placeholder="Owner"
                  className="w-32 flex-shrink-0"
                  value={row.owner}
                  onChange={(e) => setRow('critical_behaviors', index, { owner: e.target.value })}
                />
                <button type="button" onClick={() => removeRow('critical_behaviors', index)} className="mt-2.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addRow('critical_behaviors', EMPTY_BEHAVIOR)}>
              <Plus className="h-4 w-4 mr-1" /> Add behavior
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Leading indicators</CardTitle>
            <p className="text-xs text-muted-foreground">Early signals, how often they are checked, and where the evidence lives.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {form.leading_indicators.map((row, index) => (
              <div key={index} className="rounded-lg border border-border/60 p-2 space-y-2">
                <Input
                  placeholder="Indicator"
                  value={row.indicator}
                  onChange={(e) => setRow('leading_indicators', index, { indicator: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Frequency"
                    value={row.frequency}
                    onChange={(e) => setRow('leading_indicators', index, { frequency: e.target.value })}
                  />
                  <Input
                    placeholder="Evidence source"
                    value={row.evidence_source}
                    onChange={(e) => setRow('leading_indicators', index, { evidence_source: e.target.value })}
                  />
                  <button type="button" onClick={() => removeRow('leading_indicators', index)} className="mt-2.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addRow('leading_indicators', EMPTY_INDICATOR)}>
              <Plus className="h-4 w-4 mr-1" /> Add leading indicator
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Barriers, review and confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Known organizational barriers or risks</Label>
            <Textarea rows={2} value={form.barriers} onChange={(e) => setForm({ ...form, barriers: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Review notes (coach and sponsor)</Label>
            <Textarea rows={2} value={form.review_notes} onChange={(e) => setForm({ ...form, review_notes: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate('draft')} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-1" /> {saveMutation.isPending ? 'Saving…' : 'Save draft'}
            </Button>
            <Button variant="outline" onClick={() => saveMutation.mutate('under_review')} disabled={saveMutation.isPending}>
              Submit for review
            </Button>
            {canConfirm && agreement && (
              <Button variant="secondary" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {confirmMutation.isPending ? 'Confirming…' : 'Confirm agreement'}
              </Button>
            )}
            {!canConfirm && isLeadPastor && (
              <p className="text-xs text-muted-foreground self-center">Your coach confirms the agreement after review.</p>
            )}
          </div>
          {agreement?.confirmed_by && (
            <p className="text-xs text-muted-foreground">
              Confirmed by {agreement.confirmed_by} on {agreement.confirmed_date}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}