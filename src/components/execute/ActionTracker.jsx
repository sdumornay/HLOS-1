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
import { CheckSquare, Plus, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const PRIORITY_COLORS = { low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive' };
const STATUS_ICONS = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  overdue: <AlertCircle className="h-4 w-4 text-red-500" />,
  cancelled: <Circle className="h-4 w-4 text-muted-foreground/40" />,
};
const BLANK = { title: '', description: '', owner: '', due_date: '', priority: 'medium', plan_period: '30_day', status: 'pending', notes: '' };

export default function ActionTracker({ orgId, compact = false }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState({ ...BLANK });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Action.create({ ...data, organization_id: orgId, stage: 'execute' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actions'] }); setOpen(false); setForm({ ...BLANK }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Action.update(id, { status, ...(status === 'completed' ? { completed_date: new Date().toISOString().split('T')[0] } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
  });

  const withOverdue = actions.map(a => ({
    ...a,
    effectiveStatus: a.status !== 'completed' && a.status !== 'cancelled' && a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) ? 'overdue' : a.status,
  }));

  const filtered = filter === 'all' ? withOverdue
    : filter === 'active' ? withOverdue.filter(a => ['pending', 'in_progress', 'overdue'].includes(a.effectiveStatus))
    : withOverdue.filter(a => a.effectiveStatus === filter);

  const sorted = [...filtered].sort((a, b) => {
    const order = { overdue: 0, in_progress: 1, pending: 2, completed: 3, cancelled: 4 };
    return (order[a.effectiveStatus] ?? 5) - (order[b.effectiveStatus] ?? 5);
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-base font-semibold">Action Tracker</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Add Action</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Action Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Owner</Label>
                <Input placeholder="Name or role" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Plan Period</Label>
                <Select value={form.plan_period} onValueChange={v => setForm({ ...form, plan_period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30_day">30-Day</SelectItem>
                    <SelectItem value="60_day">60-Day</SelectItem>
                    <SelectItem value="90_day">90-Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description / Notes</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.owner}>Save</Button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {[['active', 'Active'], ['pending', 'Pending'], ['in_progress', 'In Progress'], ['overdue', 'Overdue'], ['completed', 'Done'], ['all', 'All']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filter === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              {l} {v !== 'all' && v !== 'active' && <span className="ml-0.5 opacity-60">({withOverdue.filter(a => a.effectiveStatus === v).length})</span>}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {sorted.map(a => (
            <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${a.effectiveStatus === 'overdue' ? 'border-red-200 bg-red-50/50' : 'border-border/50 hover:bg-muted/20'}`}>
              <button className="mt-0.5 flex-shrink-0"
                onClick={() => updateMutation.mutate({ id: a.id, status: a.status === 'completed' ? 'pending' : a.status === 'pending' ? 'in_progress' : 'completed' })}>
                {STATUS_ICONS[a.effectiveStatus]}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${a.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{a.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">Owner: {a.owner}</span>
                  {a.due_date && (
                    <span className={`text-xs ${a.effectiveStatus === 'overdue' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      Due {format(new Date(a.due_date), 'MMM d')}
                    </span>
                  )}
                  <Badge variant={PRIORITY_COLORS[a.priority]} className="text-xs capitalize">{a.priority}</Badge>
                  <span className="text-xs text-muted-foreground">{a.plan_period?.replace('_', '-')}</span>
                </div>
                {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
              </div>
            </div>
          ))}
          {sorted.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No actions found.</p>}
        </div>
      </CardContent>
    </Card>
  );
}