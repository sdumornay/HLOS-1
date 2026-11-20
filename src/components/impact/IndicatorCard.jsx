import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Save, PlusCircle } from 'lucide-react';
import {
  DIMENSION_MAP,
  INDICATOR_STATUS,
  UNITS,
  computeProgress,
  formatValue,
  indicatorStatus,
} from '@/lib/impactDimensions';
import { cn } from '@/lib/utils';

const PHASES = [
  { value: 'baseline', label: 'Baseline' },
  { value: 'midpoint', label: 'Midpoint' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'sustainability_90day', label: '90-day check' },
];

export default function IndicatorCard({ indicator, orgId, canEdit = true }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);
  const [form, setForm] = useState({
    baseline_value: indicator.baseline_value ?? '',
    baseline_date: indicator.baseline_date || '',
    baseline_source: indicator.baseline_source || '',
    target_value: indicator.target_value ?? '',
    target_date: indicator.target_date || '',
    owner: indicator.owner || '',
  });
  const [measure, setMeasure] = useState({
    value: '',
    measured_date: new Date().toISOString().slice(0, 10),
    source: '',
    evidence: '',
    phase: 'follow_up',
  });

  const status = indicatorStatus(indicator);
  const { pct } = computeProgress(indicator);
  const meta = INDICATOR_STATUS[status];
  const dimension = DIMENSION_MAP[indicator.dimension];

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ImpactIndicator.update(indicator.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impactIndicators', orgId] });
      setOpen(false);
    },
  });

  const measureMutation = useMutation({
    mutationFn: async (payload) => {
      await base44.entities.ImpactMeasurement.create({
        organization_id: orgId,
        indicator_id: indicator.id,
        phase: payload.phase,
        value: Number(payload.value),
        measured_date: payload.measured_date,
        source: payload.source,
        evidence: payload.evidence,
      });
      const next = {
        ...indicator,
        actual_value: Number(payload.value),
        actual_date: payload.measured_date,
        actual_source: payload.source,
      };
      const nextStatus = indicatorStatus({ ...next, status: undefined });
      return base44.entities.ImpactIndicator.update(indicator.id, {
        actual_value: Number(payload.value),
        actual_date: payload.measured_date,
        actual_source: payload.source,
        status: nextStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impactIndicators', orgId] });
      queryClient.invalidateQueries({ queryKey: ['impactMeasurements', orgId] });
      setShowMeasure(false);
      setMeasure({ value: '', measured_date: new Date().toISOString().slice(0, 10), source: '', evidence: '', phase: 'follow_up' });
    },
  });

  const numeric = (v) => (v === '' ? undefined : Number(v));

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {dimension?.letter} · {dimension?.label}
              </Badge>
              <Badge variant={meta.tone} className="text-[10px]">
                {meta.label}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">{indicator.name}</p>
            {indicator.definition && (
              <p className="text-xs text-muted-foreground mt-0.5">{indicator.definition}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label="Edit indicator"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Baseline</p>
            <p className="text-sm font-medium text-foreground">
              {formatValue(indicator.baseline_value, indicator.unit)}
            </p>
          </div>
          <div className="rounded-lg bg-primary/5 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current</p>
            <p className="text-sm font-semibold text-primary">
              {formatValue(indicator.actual_value, indicator.unit)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Target</p>
            <p className="text-sm font-medium text-foreground">
              {formatValue(indicator.target_value, indicator.unit)}
            </p>
          </div>
        </div>

        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700',
                status === 'off_track' ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-secondary'
              )}
              style={{ width: `${pct ?? 0}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{pct == null ? 'Not yet measured against a target' : `${pct}% of the way to target`}</span>
            <span>{UNITS[indicator.unit]}</span>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowMeasure(!showMeasure)}>
              <PlusCircle className="h-4 w-4 mr-1" /> Record measurement
            </Button>
          </div>
        )}

        {showMeasure && (
          <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={measure.value}
                  onChange={(e) => setMeasure({ ...measure, value: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Date measured</Label>
                <Input
                  type="date"
                  value={measure.measured_date}
                  onChange={(e) => setMeasure({ ...measure, measured_date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Phase</Label>
                <Select value={measure.phase} onValueChange={(v) => setMeasure({ ...measure, phase: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Input
                  placeholder="Survey, records, observation"
                  value={measure.source}
                  onChange={(e) => setMeasure({ ...measure, source: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Evidence</Label>
              <Textarea
                rows={2}
                placeholder="What supports this number?"
                value={measure.evidence}
                onChange={(e) => setMeasure({ ...measure, evidence: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowMeasure(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={measure.value === '' || measureMutation.isPending}
                onClick={() => measureMutation.mutate(measure)}
              >
                {measureMutation.isPending ? 'Saving…' : 'Save measurement'}
              </Button>
            </div>
          </div>
        )}

        {open && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Baseline value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.baseline_value}
                  onChange={(e) => setForm({ ...form, baseline_value: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Baseline date</Label>
                <Input
                  type="date"
                  value={form.baseline_date}
                  onChange={(e) => setForm({ ...form, baseline_date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Target value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Target date</Label>
                <Input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Baseline source</Label>
              <Input
                placeholder="Where this baseline came from"
                value={form.baseline_source}
                onChange={(e) => setForm({ ...form, baseline_source: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Owner</Label>
              <Input
                placeholder="Who is accountable for this indicator"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() =>
                  saveMutation.mutate({
                    baseline_value: numeric(form.baseline_value),
                    baseline_date: form.baseline_date || undefined,
                    baseline_source: form.baseline_source,
                    target_value: numeric(form.target_value),
                    target_date: form.target_date || undefined,
                    owner: form.owner,
                  })
                }
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}