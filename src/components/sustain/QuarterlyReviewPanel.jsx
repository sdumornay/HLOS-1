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
import { ClipboardList, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const currentQuarter = () => {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
};

const TREND_COLORS = { improving: 'bg-emerald-100 text-emerald-700', stable: 'bg-amber-100 text-amber-700', declining: 'bg-red-100 text-red-700' };

const EMPTY_FORM = {
  quarter: currentQuarter(), facilitator: '', wins: '', misses: '',
  health_trend: 'stable', momentum_trend: 'stable',
  key_learnings: '', next_quarter_focus: '', renewal_action: '', status: 'draft',
};

export default function QuarterlyReviewPanel({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: reviews = [] } = useQuery({
    queryKey: ['quarterlyReviews', orgId],
    queryFn: () => base44.entities.QuarterlyReview.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.QuarterlyReview.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['quarterlyReviews', orgId]); setOpen(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QuarterlyReview.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['quarterlyReviews', orgId]),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Quarterly Review</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-3 w-3 mr-1" /> New Review
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="space-y-3 border border-border/60 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quarter</Label>
                <Input value={form.quarter} onChange={e => set('quarter', e.target.value)} placeholder="2025-Q2" />
              </div>
              <div className="space-y-1">
                <Label>Facilitator</Label>
                <Input value={form.facilitator} onChange={e => set('facilitator', e.target.value)} placeholder="Name" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Key Wins</Label>
              <Textarea value={form.wins} onChange={e => set('wins', e.target.value)} className="h-20" placeholder="What went well?" />
            </div>
            <div className="space-y-1">
              <Label>Misses / What Didn't Get Done</Label>
              <Textarea value={form.misses} onChange={e => set('misses', e.target.value)} className="h-20" placeholder="What fell short and why?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Health Trend</Label>
                <Select value={form.health_trend} onValueChange={v => set('health_trend', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Momentum Trend</Label>
                <Select value={form.momentum_trend} onValueChange={v => set('momentum_trend', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Key Learnings</Label>
              <Textarea value={form.key_learnings} onChange={e => set('key_learnings', e.target.value)} className="h-20" placeholder="What did the team learn?" />
            </div>
            <div className="space-y-1">
              <Label>Next Quarter Focus</Label>
              <Textarea value={form.next_quarter_focus} onChange={e => set('next_quarter_focus', e.target.value)} className="h-20" placeholder="What's the primary focus next quarter?" />
            </div>
            <div className="space-y-1">
              <Label>Renewal / Reset Commitment</Label>
              <Textarea value={form.renewal_action} onChange={e => set('renewal_action', e.target.value)} className="h-16" placeholder="What will the team do to renew or reset?" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate({ ...form, organization_id: orgId })} disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? 'Saving…' : 'Save Review'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {reviews.length === 0 && !open && (
          <p className="text-sm text-muted-foreground text-center py-6">No quarterly reviews yet.</p>
        )}

        {reviews.map(r => (
          <div key={r.id} className="border border-border/50 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">{r.quarter}</span>
                <Badge className={`text-xs ${TREND_COLORS[r.health_trend]}`}>{r.health_trend}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{r.status}</Badge>
              </div>
              {expanded === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                {r.wins && <div><p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">WINS</p><p className="text-sm">{r.wins}</p></div>}
                {r.misses && <div><p className="text-xs font-semibold text-muted-foreground mb-1">MISSES</p><p className="text-sm">{r.misses}</p></div>}
                {r.key_learnings && <div><p className="text-xs font-semibold text-muted-foreground mb-1">LEARNINGS</p><p className="text-sm">{r.key_learnings}</p></div>}
                {r.next_quarter_focus && <div><p className="text-xs font-semibold text-muted-foreground mb-1">NEXT FOCUS</p><p className="text-sm">{r.next_quarter_focus}</p></div>}
                {r.renewal_action && <div><p className="text-xs font-semibold text-muted-foreground mb-1">RENEWAL COMMITMENT</p><p className="text-sm text-accent font-medium">{r.renewal_action}</p></div>}
                {r.status !== 'complete' && (
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: r.id, data: { status: 'complete' } })}>
                    Mark Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}