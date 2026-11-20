import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DIMENSIONS, INDICATOR_LIBRARY, UNITS } from '@/lib/impactDimensions';

// Reuse the Organizational Health Snapshot dimension scores as a valid 1-5
// baseline where one exists, instead of inventing a number.
const SNAPSHOT_FIELD = {
  organizational_health: { field: 'culture_trust_score', label: 'Culture and trust score' },
  strategic_alignment: { field: 'mission_direction_score', label: 'Mission and direction score' },
  leadership_effectiveness: { field: 'role_clarity_score', label: 'Role clarity score' },
  operational_execution: { field: 'execution_accountability_score', label: 'Execution and accountability score' },
  mission_impact: { field: 'sustainability_capacity_score', label: 'Sustainability and capacity score' },
};

export default function IndicatorLibraryDialog({ open, onOpenChange, snapshot, existingKeys = [], onAdd, saving }) {
  const [selected, setSelected] = useState([]);

  const grouped = useMemo(
    () =>
      DIMENSIONS.map((d) => ({
        ...d,
        items: INDICATOR_LIBRARY.filter((i) => i.dimension === d.key),
      })),
    []
  );

  const toggle = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleAdd = () => {
    const chosen = INDICATOR_LIBRARY.filter((i) => selected.includes(i.key));
    const records = chosen.map((item) => {
      const snap = SNAPSHOT_FIELD[item.dimension];
      const snapshotValue = snap && snapshot ? Number(snapshot[snap.field]) : NaN;
      const usable = item.unit === 'scale_1_5' && Number.isFinite(snapshotValue) && snapshotValue > 0;
      return {
        dimension: item.dimension,
        name: item.name,
        definition: item.definition,
        unit: item.unit,
        improvement_direction: item.improvement_direction,
        baseline_value: usable ? Number(snapshotValue.toFixed(2)) : undefined,
        baseline_date: usable ? (snapshot.created_date || '').slice(0, 10) : undefined,
        baseline_source: usable ? `Organizational Health Snapshot — ${snap.label}` : undefined,
        status: 'not_measured',
      };
    });
    onAdd(records, () => setSelected([]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose indicators to track</DialogTitle>
          <DialogDescription>
            Select only what matters for this engagement. Where the Organizational Health Snapshot already
            measured a matching 1–5 dimension, its score is used as the baseline and labeled with its source.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {grouped.map((dimension) => (
            <div key={dimension.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {dimension.letter}
                </Badge>
                <p className="text-sm font-semibold text-foreground">{dimension.label}</p>
              </div>
              <div className="space-y-1.5">
                {dimension.items.map((item) => {
                  const already = existingKeys.includes(item.name);
                  return (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 rounded-lg border border-border/60 p-2.5 cursor-pointer hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selected.includes(item.key)}
                        disabled={already || saving}
                        onCheckedChange={() => toggle(item.key)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-foreground">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {item.definition} · {UNITS[item.unit]}
                        </span>
                      </span>
                      {already && (
                        <Badge variant="secondary" className="ml-auto text-[10px] flex-shrink-0">
                          Tracking
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected.length || saving}>
            {saving ? 'Adding…' : `Add ${selected.length || ''} indicator${selected.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}