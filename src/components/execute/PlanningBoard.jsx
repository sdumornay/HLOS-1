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
import { LayoutGrid, Plus, CheckCircle2, Circle } from 'lucide-react';

const PERIODS = [
  { key: '30_day', label: '30-Day', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { key: '60_day', label: '60-Day', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { key: '90_day', label: '90-Day', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
];

const BLANK = { period: '30_day', theme: '', goals: '', key_risks: '', resources_needed: '', review_notes: '', start_date: '', end_date: '', status: 'planning' };

export default function PlanningBoard({ orgId }) {
  const queryClient = useQueryClient();
  const [openPeriod, setOpenPeriod] = useState(null);
  const [form, setForm] = useState({ ...BLANK });

  const { data: planPeriods = [] } = useQuery({
    queryKey: ['planningPeriods', orgId],
    queryFn: () => base44.entities.PlanningPeriod.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['executeActions', orgId],
    queryFn: () => base44.entities.ExecuteAction.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlanningPeriod.create({ ...data, organization_id: orgId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['planningPeriods', orgId] }); setOpenPeriod(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlanningPeriod.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planningPeriods', orgId] }),
  });

  const getPlanForPeriod = (periodKey) => planPeriods.find(p => p.period === periodKey);
  const getActionsForPeriod = (periodKey) => actions.filter(a => a.plan_period === periodKey);

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-violet-500" />
          <CardTitle className="text-base font-semibold">30 / 60 / 90-Day Planning</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PERIODS.map(period => {
            const plan = getPlanForPeriod(period.key);
            const periodActions = getActionsForPeriod(period.key);
            const completed = periodActions.filter(a => a.status === 'completed').length;
            const isEditingThis = openPeriod === period.key;

            return (
              <div key={period.key} className={`rounded-xl border p-4 space-y-3 ${period.bg}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-sm ${period.color}`}>{period.label} Plan</h3>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setOpenPeriod(isEditingThis ? null : period.key); setForm(plan ? { ...plan } : { ...BLANK, period: period.key }); }}>
                    {plan ? 'Edit' : <><Plus className="h-3 w-3 mr-1" />Create</>}
                  </Button>
                </div>

                {isEditingThis && (
                  <div className="space-y-2 bg-white rounded-lg p-3 border border-white/80">
                    <div>
                      <Label className="text-xs">Theme / Focus</Label>
                      <Input value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} placeholder="What is this period focused on?" className="h-7 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="h-7 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Goals</Label>
                      <Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={2} className="text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Key Risks</Label>
                      <Textarea value={form.key_risks} onChange={e => setForm({ ...form, key_risks: e.target.value })} rows={2} className="text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Resources Needed</Label>
                      <Input value={form.resources_needed} onChange={e => setForm({ ...form, resources_needed: e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpenPeriod(null)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs"
                        onClick={() => plan ? updateMutation.mutate({ id: plan.id, data: form }) : createMutation.mutate(form)}>
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                {plan && !isEditingThis && (
                  <div className="space-y-2">
                    {plan.theme && <p className={`text-xs font-semibold ${period.color}`}>"{plan.theme}"</p>}
                    <Badge variant="outline" className="text-xs capitalize">{plan.status}</Badge>
                    {plan.goals && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Goals</p>
                        <p className="text-xs">{plan.goals}</p>
                      </div>
                    )}
                    {plan.key_risks && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Risks</p>
                        <p className="text-xs">{plan.key_risks}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions summary */}
                <div className="border-t border-current/10 pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Actions</p>
                    <p className="text-xs font-semibold">{completed}/{periodActions.length}</p>
                  </div>
                  {periodActions.length > 0 && (
                    <>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full ${period.color.replace('text-', 'bg-')} transition-all`}
                          style={{ width: `${periodActions.length ? (completed / periodActions.length) * 100 : 0}%` }} />
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {periodActions.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center gap-1.5 text-xs">
                            {a.status === 'completed'
                              ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                              : <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                            <span className={`truncate ${a.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{a.title}</span>
                          </div>
                        ))}
                        {periodActions.length > 5 && <p className="text-xs text-muted-foreground">+{periodActions.length - 5} more</p>}
                      </div>
                    </>
                  )}
                  {periodActions.length === 0 && <p className="text-xs text-muted-foreground">No actions yet</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}