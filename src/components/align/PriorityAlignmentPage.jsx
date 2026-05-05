import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, GripVertical } from 'lucide-react';

const ALIGNMENT_COLORS = {
  fully_aligned: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  mostly_aligned: 'bg-blue-100 text-blue-800 border-blue-200',
  partially_aligned: 'bg-amber-100 text-amber-800 border-amber-200',
  not_aligned: 'bg-red-100 text-red-800 border-red-200',
};
const ALIGNMENT_LABELS = {
  fully_aligned: 'Fully Aligned', mostly_aligned: 'Mostly Aligned',
  partially_aligned: 'Partially Aligned', not_aligned: 'Not Aligned',
};
const STATUS_VARIANT = { proposed: 'secondary', active: 'default', on_hold: 'outline', completed: 'secondary' };

const BLANK = { title: '', description: '', timeframe: '90_day', alignment_level: 'mostly_aligned', owner: '', team_input: '', obstacles: '', rank: 1, status: 'proposed' };

export default function PriorityAlignmentPage({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...BLANK });

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PriorityAlignment.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priorities', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PriorityAlignment.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['priorities', orgId] }),
  });

  const sorted = [...priorities].sort((a, b) => (a.rank || 99) - (b.rank || 99));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Priority Alignment</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Priority
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Priority / Initiative Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div>
                <Label className="text-xs">Timeframe</Label>
                <Select value={form.timeframe} onValueChange={v => setForm({ ...form, timeframe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30_day">30 Day</SelectItem>
                    <SelectItem value="60_day">60 Day</SelectItem>
                    <SelectItem value="90_day">90 Day</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="multi_year">Multi-Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Alignment Level</Label>
                <Select value={form.alignment_level} onValueChange={v => setForm({ ...form, alignment_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALIGNMENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Owner</Label>
                <Input placeholder="Name or role" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Rank (1 = highest)</Label>
                <Input type="number" min={1} value={form.rank} onChange={e => setForm({ ...form, rank: parseInt(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Team Input / Discussion Notes</Label>
                <Textarea value={form.team_input} onChange={e => setForm({ ...form, team_input: e.target.value })} rows={2} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Obstacles</Label>
                <Textarea placeholder="What might prevent this from happening?" value={form.obstacles} onChange={e => setForm({ ...form, obstacles: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.title}>Save</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20">
              <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                <GripVertical className="h-4 w-4" />
                <span className="text-xs font-bold w-4">{p.rank || i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{p.title}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ALIGNMENT_COLORS[p.alignment_level]}`}>
                      {ALIGNMENT_LABELS[p.alignment_level]}
                    </span>
                    <Badge variant={STATUS_VARIANT[p.status]} className="text-xs capitalize">{p.status?.replace('_', ' ')}</Badge>
                  </div>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {p.owner && <span>Owner: {p.owner}</span>}
                  <span>{p.timeframe?.replace('_', ' ')}</span>
                  {p.status === 'proposed' && (
                    <Button size="sm" variant="ghost" className="h-5 text-xs px-2 ml-auto"
                      onClick={() => updateStatus.mutate({ id: p.id, status: 'active' })}>Activate</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {priorities.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No priorities aligned yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}