import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus } from 'lucide-react';

const CATEGORIES = {
  change_announcement: 'Change Announcement', meeting_behavior: 'Meeting Behavior',
  resource_allocation: 'Resource Allocation', role_overlap: 'Role Overlap',
  communication_gap: 'Communication Gap', leadership_decision: 'Leadership Decision',
  workload_imbalance: 'Workload Imbalance', other: 'Other',
};

const IMPACT_COLORS = { low: 'secondary', moderate: 'outline', high: 'default', critical: 'destructive' };
const FREQ_COLORS = { rare: 'text-green-600', occasional: 'text-amber-600', frequent: 'text-orange-600', constant: 'text-red-600' };

export default function ConflictTriggerTracker({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    trigger_description: '', trigger_category: 'other', frequency: 'occasional',
    impact_level: 'moderate', pattern_notes: '', mitigation_strategy: '',
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ['conflictTriggers', orgId],
    queryFn: () => base44.entities.ConflictTrigger.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConflictTrigger.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflictTriggers', orgId] });
      setOpen(false);
      setForm({ trigger_description: '', trigger_category: 'other', frequency: 'occasional', impact_level: 'moderate', pattern_notes: '', mitigation_strategy: '' });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ConflictTrigger.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conflictTriggers', orgId] }),
  });

  const active = triggers.filter(t => t.status !== 'resolved');

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" />
          <CardTitle className="text-base font-semibold">Conflict Trigger Tracker</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Trigger
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div>
              <Label className="text-xs">Trigger Description</Label>
              <Textarea placeholder="What situation or behavior triggers conflict?" value={form.trigger_description}
                onChange={e => setForm({ ...form, trigger_description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.trigger_category} onValueChange={v => setForm({ ...form, trigger_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="frequent">Frequent</SelectItem>
                    <SelectItem value="constant">Constant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Impact</Label>
                <Select value={form.impact_level} onValueChange={v => setForm({ ...form, impact_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Pattern Notes</Label>
              <Input placeholder="Any recurring patterns you've noticed..." value={form.pattern_notes}
                onChange={e => setForm({ ...form, pattern_notes: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Mitigation Strategy</Label>
              <Textarea placeholder="What might help prevent or reduce this trigger?" value={form.mitigation_strategy}
                onChange={e => setForm({ ...form, mitigation_strategy: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.trigger_description}>Save</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {active.map(t => (
            <div key={t.id} className="p-3 rounded-lg border border-border/50 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium flex-1">{t.trigger_description}</p>
                <Badge variant={IMPACT_COLORS[t.impact_level]} className="text-xs capitalize flex-shrink-0">{t.impact_level}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{CATEGORIES[t.trigger_category]}</span>
                <span className={`font-medium capitalize ${FREQ_COLORS[t.frequency]}`}>{t.frequency}</span>
              </div>
              {t.mitigation_strategy && <p className="text-xs text-muted-foreground">💡 {t.mitigation_strategy}</p>}
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-muted-foreground"
                onClick={() => updateStatus.mutate({ id: t.id, status: 'resolved' })}>
                Mark Resolved
              </Button>
            </div>
          ))}
          {triggers.filter(t => t.status === 'resolved').length > 0 && (
            <p className="text-xs text-muted-foreground">{triggers.filter(t => t.status === 'resolved').length} resolved trigger(s)</p>
          )}
          {active.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No triggers tracked yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}