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
import { BookOpen, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = { financial: 'Financial', staffing: 'Staffing', ministry: 'Ministry', strategy: 'Strategy', operations: 'Operations', communications: 'Communications', other: 'Other' };
const IMPACT_COLORS = { low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive' };
const STATUS_COLORS = { active: 'default', reversed: 'destructive', superseded: 'secondary' };
const BLANK = { decision: '', context: '', made_by: '', date: new Date().toISOString().split('T')[0], category: 'ministry', impact: 'medium', affected_teams: '', review_date: '', notes: '', status: 'active' };

export default function DecisionLogPanel({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ ...BLANK });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisionLog', orgId],
    queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DecisionLog.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisionLog', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
    },
  });

  const sorted = [...decisions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-base font-semibold">Decision Log</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Log Decision</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="col-span-2">
              <Label className="text-xs">Decision</Label>
              <Textarea placeholder="Describe the decision made..." value={form.decision} onChange={e => setForm({ ...form, decision: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Made By</Label>
                <Input placeholder="Name or group" value={form.made_by} onChange={e => setForm({ ...form, made_by: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORIES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Impact Level</Label>
                <Select value={form.impact} onValueChange={v => setForm({ ...form, impact: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Context / Rationale</Label>
                <Textarea placeholder="Why was this decision made?" value={form.context} onChange={e => setForm({ ...form, context: e.target.value })} rows={2} />
              </div>
              <div>
                <Label className="text-xs">Teams Affected</Label>
                <Input value={form.affected_teams} onChange={e => setForm({ ...form, affected_teams: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Review Date</Label>
                <Input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.decision || !form.made_by}>Save</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map(d => (
            <div key={d.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-start justify-between p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{d.decision}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(d.date), 'MMM d, yyyy')} · {d.made_by} · {CATEGORIES[d.category]}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  <Badge variant={IMPACT_COLORS[d.impact]} className="text-xs capitalize">{d.impact}</Badge>
                  {expanded === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expanded === d.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-1.5 text-sm">
                  {d.context && <p><span className="font-medium">Rationale:</span> {d.context}</p>}
                  {d.affected_teams && <p><span className="font-medium">Affects:</span> {d.affected_teams}</p>}
                  {d.review_date && <p><span className="font-medium">Review by:</span> {format(new Date(d.review_date), 'MMM d, yyyy')}</p>}
                  {d.notes && <p className="text-muted-foreground">{d.notes}</p>}
                  <Badge variant={STATUS_COLORS[d.status]} className="capitalize text-xs">{d.status}</Badge>
                </div>
              )}
            </div>
          ))}
          {decisions.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No decisions logged yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}