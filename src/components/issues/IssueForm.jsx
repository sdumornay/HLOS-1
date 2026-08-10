import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Cog, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { value: 'stabilize', label: 'Stabilize' },
  { value: 'align', label: 'Align' },
  { value: 'execute', label: 'Execute' },
  { value: 'sustain', label: 'Sustain' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function IssueForm({ open, onClose, onSubmit, editing, currentUser, canOverride }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    title: '',
    description: '',
    date_identified: today,
    identified_by: currentUser?.full_name || '',
    owner: '',
    status: 'open',
    priority: 'medium',
    stage: 'stabilize',
    classification: '',
    notes: '',
    resolution: '',
    date_resolved: '',
  });
  const [overridden, setOverridden] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || '',
        description: editing.description || '',
        date_identified: editing.date_identified || today,
        identified_by: editing.identified_by || '',
        owner: editing.owner || '',
        status: editing.status || 'open',
        priority: editing.priority || 'medium',
        stage: editing.stage || 'stabilize',
        classification: editing.classification || '',
        notes: editing.notes || '',
        resolution: editing.resolution || '',
        date_resolved: editing.date_resolved || '',
      });
      setOverridden(editing.classification_overridden || false);
    } else {
      setForm({
        title: '',
        description: '',
        date_identified: today,
        identified_by: currentUser?.full_name || '',
        owner: '',
        status: 'open',
        priority: 'medium',
        stage: 'stabilize',
        classification: '',
        notes: '',
        resolution: '',
        date_resolved: '',
      });
      setOverridden(false);
    }
  }, [editing, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.classification) return;

    const payload = { ...form };
    if (canOverride && overridden) {
      payload.classification_overridden = true;
      payload.classification_overridden_by = currentUser?.full_name || 'Admin';
    } else {
      payload.classification_overridden = false;
      payload.classification_overridden_by = '';
    }

    // Auto-set date_resolved when status changes to resolved
    if (payload.status === 'resolved' && !payload.date_resolved) {
      payload.date_resolved = today;
    }
    if (payload.status !== 'resolved' && payload.status !== 'closed') {
      payload.date_resolved = '';
      if (payload.status !== 'resolved') payload.resolution = payload.resolution;
    }

    onSubmit(payload);
  };

  const showResolutionFields = form.status === 'resolved' || form.status === 'closed' || !!form.resolution;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Issue' : 'Capture a New Issue'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the problem, tension, or barrier in more detail"
              rows={3}
            />
          </div>

          {/* Classification — the key field */}
          <div className="space-y-2">
            <Label>Classification *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Relational */}
              <button
                type="button"
                onClick={() => setForm({ ...form, classification: 'relational' })}
                className={cn(
                  "text-left p-3 rounded-lg border-2 transition-all",
                  form.classification === 'relational'
                    ? "border-rose-500 bg-rose-50"
                    : "border-border bg-card hover:border-rose-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="font-semibold text-sm">Relational Issue</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trust, communication, interpersonal tension, misunderstanding, unresolved conflict, or damaged relationships.
                </p>
              </button>

              {/* Operational */}
              <button
                type="button"
                onClick={() => setForm({ ...form, classification: 'operational' })}
                className={cn(
                  "text-left p-3 rounded-lg border-2 transition-all",
                  form.classification === 'operational'
                    ? "border-blue-500 bg-blue-50"
                    : "border-border bg-card hover:border-blue-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Cog className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">Operational Issue</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Priorities, processes, resources, decisions, responsibilities, deadlines, or execution.
                </p>
              </button>
            </div>

            {/* Admin override notice */}
            {canOverride && form.classification && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs text-amber-900 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overridden}
                      onChange={(e) => setOverridden(e.target.checked)}
                      className="rounded"
                    />
                    Mark as admin-overridden classification
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Grid: identified_by, owner, date_identified */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="identified_by">Identified By</Label>
              <Input
                id="identified_by"
                value={form.identified_by}
                onChange={(e) => setForm({ ...form, identified_by: e.target.value })}
                placeholder="Who raised it"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="Who will resolve it"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_identified">Date Identified</Label>
              <Input
                id="date_identified"
                type="date"
                value={form.date_identified}
                onChange={(e) => setForm({ ...form, date_identified: e.target.value })}
              />
            </div>
          </div>

          {/* Grid: priority, stage, status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Related Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional context, discussion points, or background"
              rows={2}
            />
          </div>

          {/* Resolution fields — show when resolving */}
          {showResolutionFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <div className="space-y-1.5">
                <Label htmlFor="date_resolved">Date Resolved</Label>
                <Input
                  id="date_resolved"
                  type="date"
                  value={form.date_resolved}
                  onChange={(e) => setForm({ ...form, date_resolved: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  value={form.resolution}
                  onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                  placeholder="How was this issue resolved?"
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!form.title.trim() || !form.classification}>
              {editing ? 'Save Changes' : 'Add Issue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}