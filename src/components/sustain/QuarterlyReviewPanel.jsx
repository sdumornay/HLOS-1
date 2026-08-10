import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Plus, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

const currentQuarter = () => {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
};

const TREND_COLORS = {
  improving: 'bg-emerald-100 text-emerald-700',
  stable: 'bg-amber-100 text-amber-700',
  declining: 'bg-red-100 text-red-700',
};

const QUESTIONS = [
  { key: 'what_improved', label: 'What improved?', placeholder: 'What areas saw positive movement this quarter?' },
  { key: 'what_declined', label: 'What declined?', placeholder: 'What areas regressed or got worse?' },
  { key: 'what_accomplished', label: 'What did we accomplish?', placeholder: 'Key wins and completed priorities...' },
  { key: 'what_failed', label: 'What did we fail to complete?', placeholder: 'What fell short and why?' },
  { key: 'recurring_issues', label: 'What recurring issues are appearing?', placeholder: 'Patterns that keep surfacing...' },
  { key: 'stop_doing', label: 'What should we stop doing?', placeholder: 'Activities or habits that are no longer serving the team...' },
  { key: 'continue_doing', label: 'What should we continue?', placeholder: 'Practices that are working well and should be maintained...' },
  { key: 'next_quarter_attention', label: 'What needs attention in the next quarter?', placeholder: 'Where should the team focus?' },
  { key: 'next_priorities', label: 'What are our next 3–5 priorities?', placeholder: 'List the top priorities for next quarter...' },
];

const EMPTY_FORM = {
  quarter: currentQuarter(), facilitator: '',
  what_improved: '', what_declined: '', what_accomplished: '', what_failed: '',
  recurring_issues: '', stop_doing: '', continue_doing: '',
  next_quarter_attention: '', next_priorities: '',
  health_trend: 'stable', momentum_trend: 'stable',
  renewal_action: '', status: 'draft',
};

export default function QuarterlyReviewPanel({ orgId }) {
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
  const answeredCount = QUESTIONS.filter(q => form[q.key]?.trim()).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Quarterly Reset</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-3 w-3 mr-1" /> New Review
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="space-y-4 border border-border/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="space-y-1">
                  <Label>Quarter</Label>
                  <Input value={form.quarter} onChange={e => set('quarter', e.target.value)} placeholder="2026-Q3" />
                </div>
                <div className="space-y-1">
                  <Label>Facilitator</Label>
                  <Input value={form.facilitator} onChange={e => set('facilitator', e.target.value)} placeholder="Name" />
                </div>
              </div>
              <Badge variant="outline" className="ml-3 text-xs">{answeredCount}/{QUESTIONS.length} answered</Badge>
            </div>

            <div className="space-y-3">
              {QUESTIONS.map(({ key, label, placeholder }, idx) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                    {label}
                  </Label>
                  <Textarea
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    className="h-16"
                    placeholder={placeholder}
                  />
                </div>
              ))}
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
              <Label>Renewal / Reset Commitment</Label>
              <Textarea value={form.renewal_action} onChange={e => set('renewal_action', e.target.value)} className="h-16" placeholder="What will the team do to renew or reset?" />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate({ ...form, organization_id: orgId })}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Saving…' : 'Save Quarterly Review'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {reviews.length === 0 && !open && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No quarterly reviews yet. Start a guided review to reflect on the past quarter and plan the next.
          </p>
        )}

        {reviews.map(r => (
          <div key={r.id} className="border border-border/50 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">{r.quarter}</span>
                <Badge className={`text-xs ${TREND_COLORS[r.health_trend] || ''}`}>Health: {r.health_trend}</Badge>
                <Badge className={`text-xs ${TREND_COLORS[r.momentum_trend] || ''}`}>Momentum: {r.momentum_trend}</Badge>
                {r.status === 'complete' && <Badge variant="outline" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>}
              </div>
              {expanded === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                {QUESTIONS.map(({ key, label }, idx) => r[key] && (
                  <div key={key}>
                    <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-accent/10 text-accent text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                      {label.toUpperCase()}
                    </p>
                    <p className="text-sm">{r[key]}</p>
                  </div>
                ))}
                {r.renewal_action && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">RENEWAL COMMITMENT</p>
                    <p className="text-sm text-accent font-medium">{r.renewal_action}</p>
                  </div>
                )}
                {r.status !== 'complete' && (
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: r.id, data: { status: 'complete' } })}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Mark Complete
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