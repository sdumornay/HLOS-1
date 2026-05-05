import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, CheckCircle, Eye } from 'lucide-react';

const TYPE_LABELS = {
  slipping_priority: 'Slipping Priority',
  recurring_conflict: 'Recurring Conflict',
  incomplete_followthrough: 'Incomplete Follow-through',
  health_decline: 'Health Decline',
  momentum_drop: 'Momentum Drop',
  other: 'Other',
};

const SEVERITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_ICONS = {
  open: <AlertTriangle className="h-4 w-4 text-red-500" />,
  acknowledged: <Eye className="h-4 w-4 text-amber-500" />,
  resolved: <CheckCircle className="h-4 w-4 text-emerald-500" />,
};

const EMPTY_FORM = { title: '', type: 'slipping_priority', severity: 'medium', description: '' };

export default function RiskFlagPanel({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('open');
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: flags = [] } = useQuery({
    queryKey: ['riskFlags', orgId],
    queryFn: () => base44.entities.RiskFlag.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RiskFlag.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['riskFlags', orgId]); setOpen(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RiskFlag.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['riskFlags', orgId]),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = filter === 'all' ? flags : flags.filter(f => f.status === filter);
  const openCount = flags.filter(f => f.status === 'open').length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-base">Risk Flags</CardTitle>
          {openCount > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs border-0">{openCount} open</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-3 w-3 mr-1" /> Flag Risk
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="space-y-3 border border-border/60 rounded-lg p-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Briefly describe the risk…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => set('severity', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} className="h-20" placeholder="What's happening? What's at risk?" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate({ ...form, organization_id: orgId, raised_by: user?.email, status: 'open' })}
                disabled={!form.title || createMutation.isPending} className="flex-1">
                {createMutation.isPending ? 'Saving…' : 'Raise Flag'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['open', 'acknowledged', 'resolved', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {filter === 'open' ? 'No open risk flags. Great work!' : 'No items in this category.'}
          </p>
        )}

        <div className="space-y-2">
          {filtered.map(flag => (
            <div key={flag.id} className="border border-border/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {STATUS_ICONS[flag.status]}
                  <p className="text-sm font-medium truncate">{flag.title}</p>
                </div>
                <Badge className={`text-xs border-0 flex-shrink-0 ${SEVERITY_COLORS[flag.severity]}`}>{flag.severity}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{TYPE_LABELS[flag.type]}</Badge>
                {flag.description && <p className="text-xs text-muted-foreground flex-1">{flag.description}</p>}
              </div>
              {flag.status !== 'resolved' && (
                <div className="flex gap-2 pt-1">
                  {flag.status === 'open' && (
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => updateMutation.mutate({ id: flag.id, data: { status: 'acknowledged' } })}>
                      Acknowledge
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    onClick={() => updateMutation.mutate({ id: flag.id, data: { status: 'resolved' } })}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}