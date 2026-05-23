import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const DYSFUNCTIONS = [
  { key: 'trust', label: 'Trust', description: 'Team members are vulnerable and open with each other', notesKey: 'trust_notes' },
  { key: 'conflict', label: 'Healthy Conflict', description: 'Team engages in passionate debate around ideas', notesKey: 'conflict_notes' },
  { key: 'commitment', label: 'Commitment', description: 'Team commits to decisions and plans of action', notesKey: 'commitment_notes' },
  { key: 'accountability', label: 'Accountability', description: 'Team calls out peers on behaviors that hurt the team', notesKey: 'accountability_notes' },
  { key: 'results', label: 'Results', description: 'Team focuses on collective outcomes, not individual status', notesKey: 'results_notes' },
];

const BLANK = { trust: 3, conflict: 3, commitment: 3, accountability: 3, results: 3, trust_notes: '', conflict_notes: '', commitment_notes: '', accountability_notes: '', results_notes: '' };

export default function FiveDysfunctionsModal({ open, onClose, orgId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...BLANK });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitFiveDysfunctions', { ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiveDysfunctions', orgId] });
      toast.success('Assessment submitted!');
      setForm({ ...BLANK });
      onClose();
    },
    onError: (err) => toast.error('Failed to submit: ' + (err?.message || 'Unknown error')),
  });

  const handleClose = () => {
    setForm({ ...BLANK });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Health &amp; Culture Assessment</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Rate each dimension 1 (very low) to 5 (very high) as it currently exists on your team.</p>
        <div className="space-y-5 mt-2">
          {DYSFUNCTIONS.map((d) => (
            <div key={d.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{d.label}: {form[d.key]}/5</Label>
              </div>
              <p className="text-xs text-muted-foreground italic">{d.description}</p>
              <Slider
                min={1} max={5} step={1}
                value={[form[d.key]]}
                onValueChange={([v]) => setForm(f => ({ ...f, [d.key]: v }))}
              />
              <Textarea
                placeholder="Optional notes..."
                value={form[d.notesKey]}
                onChange={e => setForm(f => ({ ...f, [d.notesKey]: e.target.value }))}
                rows={1}
                className="text-xs"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={() => submitMutation.mutate(form)}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}