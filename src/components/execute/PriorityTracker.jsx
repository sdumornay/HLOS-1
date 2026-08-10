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
import { Target, Plus, Trash2, ChevronDown, ChevronUp, Flag, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = { proposed: 'secondary', active: 'default', on_hold: 'outline', completed: 'secondary' };
const STATUS_LABEL = { proposed: 'Proposed', active: 'Active', on_hold: 'On Hold', completed: 'Completed' };

const BLANK = {
  title: '', description: '', desired_outcome: '', owner: '', timeframe: '90_day',
  start_date: '', target_date: '', progress_percentage: 0, milestones: [], status: 'active', rank: 1,
};

export default function PriorityTracker({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ ...BLANK });
  const [newMilestone, setNewMilestone] = useState('');

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions-for-priorities', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PriorityAlignment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['priorities', orgId] }),
  });

  const active = priorities.filter(p => p.status === 'active' || p.status === 'proposed');
  const sorted = [...active].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const atLimit = active.length >= 5;

  const addMilestone = () => {
    if (!newMilestone) return;
    setForm({ ...form, milestones: [...(form.milestones || []), { title: newMilestone, completed: false }] });
    setNewMilestone('');
  };
  const removeMilestone = (i) => setForm({ ...form, milestones: form.milestones.filter((_, idx) => idx !== i) });

  const getActionsForPriority = (pid) => actions.filter(a => a.priority_id === pid);
  const getMilestoneProgress = (milestones = []) => {
    if (!milestones.length) return 0;
    return Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100);
  };

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-base font-semibold">Active Priorities</CardTitle>
          <Badge variant="outline" className="text-xs">{active.length}/5</Badge>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)} disabled={atLimit && !open}>
          <Plus className="h-4 w-4 mr-1" /> Add Priority
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {atLimit && !open && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            You have 5 active priorities — the recommended maximum. Complete or pause one before adding more.
          </div>
        )}

        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Priority Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Desired Outcome</Label>
                <Textarea placeholder="What does success look like?" value={form.desired_outcome}
                  onChange={e => setForm({ ...form, desired_outcome: e.target.value })} rows={2} />
              </div>
              <div>
                <Label className="text-xs">Owner</Label>
                <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Operating Period</Label>
                <Select value={form.timeframe} onValueChange={v => setForm({ ...form, timeframe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30_day">30 Day</SelectItem>
                    <SelectItem value="60_day">60 Day</SelectItem>
                    <SelectItem value="90_day">90 Day</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Target Date</Label>
                <Input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
              </div>
            </div>

            {/* Milestones builder */}
            <div>
              <Label className="text-xs font-semibold">Milestones</Label>
              <div className="space-y-1.5 mt-1.5">
                {(form.milestones || []).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 bg-white border border-border/50 rounded text-sm">
                    <Flag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">{m.title}</span>
                    <button onClick={() => removeMilestone(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Milestone..." value={newMilestone}
                    onChange={e => setNewMilestone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                    className="text-sm" />
                  <Button size="sm" variant="outline" onClick={addMilestone}>Add</Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.title}>Save Priority</Button>
            </div>
          </div>
        )}

        {/* Priority cards */}
        <div className="space-y-2.5">
          {sorted.map(p => {
            const pActions = getActionsForPriority(p.id);
            const pDone = pActions.filter(a => a.status === 'completed').length;
            const pOverdue = pActions.filter(a =>
              a.status !== 'completed' && a.status !== 'cancelled' &&
              a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date))
            ).length;
            const msProgress = getMilestoneProgress(p.milestones);
            const isExpanded = expanded === p.id;
            const isOverdue = p.target_date && isPast(new Date(p.target_date)) && !isToday(new Date(p.target_date)) && p.status !== 'completed';

            return (
              <div key={p.id} className={cn(
                'border rounded-lg overflow-hidden transition-colors',
                isOverdue ? 'border-red-200 bg-red-50/30' : 'border-border/50'
              )}>
                <div className="p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpanded(isExpanded ? null : p.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{p.rank || '—'}</span>
                        <p className="text-sm font-semibold">{p.title}</p>
                      </div>
                      {p.desired_outcome && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.desired_outcome}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant={STATUS_VARIANT[p.status]} className="text-xs">{STATUS_LABEL[p.status]}</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {p.owner && `Owner: ${p.owner}`}
                        {p.target_date && ` · Target: ${format(new Date(p.target_date), 'MMM d')}`}
                      </span>
                      <span className="font-medium">{p.progress_percentage || 0}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${p.progress_percentage || 0}%` }} />
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {(p.milestones?.length > 0) && (
                      <span>{p.milestones.filter(m => m.completed).length}/{p.milestones.length} milestones</span>
                    )}
                    {pActions.length > 0 && (
                      <span>{pDone}/{pActions.length} actions done</span>
                    )}
                    {pOverdue > 0 && (
                      <span className="text-red-600 font-medium">{pOverdue} overdue</span>
                    )}
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-3 bg-muted/20 space-y-3">
                    {p.description && <p className="text-sm">{p.description}</p>}

                    {/* Milestones */}
                    {p.milestones?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Milestones</p>
                        <div className="space-y-1">
                          {p.milestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <button onClick={() => {
                                const newMs = [...p.milestones];
                                newMs[i] = { ...m, completed: !m.completed, completed_date: !m.completed ? new Date().toISOString().split('T')[0] : null };
                                updateMutation.mutate({ id: p.id, data: { milestones: newMs } });
                              }}>
                                {m.completed
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  : <Circle className="h-4 w-4 text-muted-foreground" />}
                              </button>
                              <span className={m.completed ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related actions */}
                    {pActions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Related Actions</p>
                        <div className="space-y-1">
                          {pActions.map(a => (
                            <div key={a.id} className="flex items-center gap-2 text-sm">
                              {a.status === 'completed'
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                : <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                              <span className={a.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{a.title}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{a.owner}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress slider */}
                    <div>
                      <Label className="text-xs">Progress: {p.progress_percentage || 0}%</Label>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={p.progress_percentage || 0}
                        onChange={e => updateMutation.mutate({ id: p.id, data: { progress_percentage: parseInt(e.target.value) } })}
                        className="w-full mt-1 accent-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {sorted.length === 0 && !open && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active priorities. Add 3-5 priorities for this operating period.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}