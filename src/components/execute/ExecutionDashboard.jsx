import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { isPast, isToday, format } from 'date-fns';

export default function ExecutionDashboard({ orgId }) {
  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const withOverdue = actions.map(a => ({
    ...a,
    effectiveStatus: a.status !== 'completed' && a.status !== 'cancelled' && a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) ? 'overdue' : a.status,
  }));

  const overdue = withOverdue.filter(a => a.effectiveStatus === 'overdue');
  const inProgress = withOverdue.filter(a => a.effectiveStatus === 'in_progress');
  const completed = withOverdue.filter(a => a.effectiveStatus === 'completed');
  const pending = withOverdue.filter(a => a.effectiveStatus === 'pending');

  // Progress by priority
  const priorityData = ['critical', 'high', 'medium', 'low'].map(p => {
    const total = withOverdue.filter(a => a.priority === p && a.status !== 'cancelled').length;
    const done = withOverdue.filter(a => a.priority === p && a.status === 'completed').length;
    return { priority: p.charAt(0).toUpperCase() + p.slice(1), total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }).filter(d => d.total > 0);

  const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#3b82f6', Low: '#6b7280' };

  const stats = [
    { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <CardTitle className="text-base font-semibold">Execution Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 flex-shrink-0 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue list */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overdue Actions</p>
            {overdue.length === 0
              ? <p className="text-sm text-emerald-600 font-medium">✓ No overdue actions</p>
              : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {overdue.map(a => (
                    <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">Owner: {a.owner} · Due {format(new Date(a.due_date), 'MMM d')}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs capitalize flex-shrink-0">{a.priority}</Badge>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Progress by priority chart */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progress by Priority</p>
            {priorityData.length === 0
              ? <p className="text-sm text-muted-foreground">No actions to display.</p>
              : (
                <div className="space-y-2">
                  {priorityData.map(d => (
                    <div key={d.priority}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium">{d.priority}</span>
                        <span className="text-muted-foreground">{d.done}/{d.total} ({d.pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${d.pct}%`, backgroundColor: PRIORITY_COLORS[d.priority] }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>

        {/* Plan period breakdown */}
        {actions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Plan Period</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={['30_day', '60_day', '90_day'].map(p => {
                const period_actions = withOverdue.filter(a => a.plan_period === p);
                return {
                  name: p.replace('_day', '-Day'),
                  Total: period_actions.length,
                  Done: period_actions.filter(a => a.status === 'completed').length,
                  Overdue: period_actions.filter(a => a.effectiveStatus === 'overdue').length,
                };
              })} barGap={2}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Done" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Overdue" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Total" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} fillOpacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}