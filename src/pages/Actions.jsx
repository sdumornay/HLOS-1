import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Actions() {
  const { user, canManageAll } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    title: '', description: '', owner_email: '', priority: 'medium',
    status: 'pending', stage: 'stabilize', plan_period: '30_day', due_date: '',
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 100),
  });

  const orgId = user?.organization_id;
  const myActions = canManageAll ? actions : actions.filter(a => a.organization_id === orgId);
  const filtered = filter === 'all' ? myActions : myActions.filter(a => a.status === filter);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Action.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      setOpen(false);
      setForm({ title: '', description: '', owner_email: '', priority: 'medium', status: 'pending', stage: 'stabilize', plan_period: '30_day', due_date: '' });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Action.update(id, {
      status: status === 'completed' ? 'pending' : 'completed',
      completed_date: status === 'completed' ? null : new Date().toISOString().split('T')[0],
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
  });

  const statusCounts = {
    all: myActions.length,
    pending: myActions.filter(a => a.status === 'pending').length,
    in_progress: myActions.filter(a => a.status === 'in_progress').length,
    completed: myActions.filter(a => a.status === 'completed').length,
    overdue: myActions.filter(a => a.status === 'overdue').length,
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    critical: 'bg-red-500 text-white',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Action Tracker</h1>
          <p className="text-muted-foreground mt-1">Track commitments and follow-through</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Action</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Action Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to happen?" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Owner Email</Label>
                  <Input value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} placeholder="owner@church.org" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
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
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stabilize">Stabilize</SelectItem>
                      <SelectItem value="align">Align</SelectItem>
                      <SelectItem value="execute">Execute</SelectItem>
                      <SelectItem value="sustain">Sustain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan Period</Label>
                  <Select value={form.plan_period} onValueChange={v => setForm(f => ({ ...f, plan_period: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30_day">30 Day</SelectItem>
                      <SelectItem value="60_day">60 Day</SelectItem>
                      <SelectItem value="90_day">90 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => createMutation.mutate({ ...form, organization_id: orgId })} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Action'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({statusCounts.overdue})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3">
        {filtered.map(action => (
          <Card key={action.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <button
                onClick={() => toggleComplete.mutate({ id: action.id, status: action.status })}
                className="flex-shrink-0"
              >
                {action.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : action.status === 'overdue' ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.owner_email || 'Unassigned'}
                  {action.due_date && ` • Due ${format(new Date(action.due_date), 'MMM d')}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${priorityColors[action.priority]}`}>{action.priority}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{action.stage}</Badge>
                {action.plan_period && <Badge variant="secondary" className="text-xs">{action.plan_period?.replace('_', ' ')}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No actions found. Create your first action item.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}