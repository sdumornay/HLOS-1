import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BEHAVIOR_STATUS } from '@/lib/impactDimensions';

const BLANK = {
  description: '',
  owner_name: '',
  owner_email: '',
  expected_frequency: '',
  evidence: '',
  date_reviewed: new Date().toISOString().slice(0, 10),
  status: 'not_started',
  barriers: '',
  corrective_actions: '',
  next_review_date: '',
  notes: '',
};

export default function BehaviorForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({ ...BLANK, ...(initial || {}) });
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
      <div>
        <Label className="text-xs">Behavior commitment</Label>
        <Textarea
          rows={2}
          placeholder="e.g. Weekly accountability meeting with a written action list"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Owner</Label>
          <Input value={form.owner_name} onChange={(e) => set({ owner_name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Expected frequency</Label>
          <Input
            placeholder="Weekly, monthly, per decision"
            value={form.expected_frequency}
            onChange={(e) => set({ expected_frequency: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => set({ status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BEHAVIOR_STATUS).map(([value, meta]) => (
                <SelectItem key={value} value={value}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Date reviewed</Label>
          <Input
            type="date"
            value={form.date_reviewed || ''}
            onChange={(e) => set({ date_reviewed: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Evidence of implementation</Label>
        <Textarea
          rows={2}
          placeholder="Meetings held, decisions logged, actions closed"
          value={form.evidence}
          onChange={(e) => set({ evidence: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Barriers</Label>
          <Textarea rows={2} value={form.barriers} onChange={(e) => set({ barriers: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Corrective actions</Label>
          <Textarea
            rows={2}
            value={form.corrective_actions}
            onChange={(e) => set({ corrective_actions: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Next review date</Label>
          <Input
            type="date"
            value={form.next_review_date || ''}
            onChange={(e) => set({ next_review_date: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Notes</Label>
          <Input value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={!form.description || saving} onClick={() => onSubmit(form)}>
          {saving ? 'Saving…' : 'Save commitment'}
        </Button>
      </div>
    </div>
  );
}