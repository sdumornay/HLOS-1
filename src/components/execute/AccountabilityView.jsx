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
import { ClipboardCheck, AlertCircle, Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { format, isPast, isToday, isThisWeek, isThisYear, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = { low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive' };

export default function AccountabilityView({ orgId }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Action.update(id, {
      status,
      ...(status === 'completed' ? { completed_date: new Date().toISOString().split('T')[0] } : {}),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions', orgId] }),
  });

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekAgo = subDays(now, 7);

  const withOverdue = actions.map(a => ({
    ...a,
    effectiveStatus: a.status !== 'completed' && a.status !== 'cancelled' && a.due_date &&
      isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) ? 'overdue' : a.status,
  }));

  const dueThisWeek = withOverdue.filter(a =>
    a.due_date &&
    !['completed', 'cancelled'].includes(a.effectiveStatus) &&
    isThisWeek(new Date(a.due_date), { weekStartsOn: 1 })
  );

  const overdue = withOverdue.filter(a => a.effectiveStatus === 'overdue');

  const recentlyCompleted = withOverdue.filter(a =>
    a.status === 'completed' &&
    a.completed_date &&
    new Date(a.completed_date) >= weekAgo
  );

  // Group by owner
  const groupByOwner = (items) => {
    const groups = {};
    items.forEach(a => {
      const owner = a.owner || 'Unassigned';
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push(a);
    });
    return groups;
  };

  const dueGroups = groupByOwner(dueThisWeek);
  const overdueGroups = groupByOwner(overdue);
  const completedGroups = groupByOwner(recentlyCompleted);

  const renderGroup = (owner, items, colorClass) => (
    <div key={owner} className="border border-border/50 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/20"
        onClick={() => setExpanded(expanded === owner + colorClass ? null : owner + colorClass)}
      >
        <div className="flex items-center gap-2">
          <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold', colorClass)}>
            {owner.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium">{owner}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{items.length}</Badge>
          {expanded === owner + colorClass ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      {expanded === owner + colorClass && (
        <div className="border-t border-border/50 p-2 space-y-1.5 bg-muted/20">
          {items.map(a => (
            <div key={a.id} className="flex items-start gap-2 p-2 rounded bg-white border border-border/40">
              <button className="mt-0.5 flex-shrink-0"
                onClick={() => updateMutation.mutate({ id: a.id, status: a.status === 'completed' ? 'pending' : 'completed' })}>
                {a.status === 'completed'
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <Circle className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', a.status === 'completed' && 'line-through text-muted-foreground')}>{a.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {a.due_date && (
                    <span className={cn('text-xs', a.effectiveStatus === 'overdue' ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                      Due {format(new Date(a.due_date), 'MMM d')}
                    </span>
                  )}
                  <Badge variant={PRIORITY_COLORS[a.priority]} className="text-xs capitalize">{a.priority}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-base font-semibold">Accountability</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold leading-none">{overdue.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Overdue</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50">
            <Calendar className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold leading-none">{dueThisWeek.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Due This Week</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold leading-none">{recentlyCompleted.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Done (7 days)</p>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Overdue
          </p>
          {overdue.length === 0
            ? <p className="text-sm text-emerald-600 font-medium">✓ Nothing overdue</p>
            : <div className="space-y-1.5">{Object.entries(overdueGroups).map(([owner, items]) => renderGroup(owner, items, 'bg-red-100 text-red-700'))}</div>
          }
        </div>

        {/* Due this week */}
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Due This Week ({format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')})
          </p>
          {dueThisWeek.length === 0
            ? <p className="text-sm text-muted-foreground">Nothing due this week.</p>
            : <div className="space-y-1.5">{Object.entries(dueGroups).map(([owner, items]) => renderGroup(owner, items, 'bg-amber-100 text-amber-700'))}</div>
          }
        </div>

        {/* Recently completed */}
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Recently Completed
          </p>
          {recentlyCompleted.length === 0
            ? <p className="text-sm text-muted-foreground">Nothing completed in the last 7 days.</p>
            : <div className="space-y-1.5">{Object.entries(completedGroups).map(([owner, items]) => renderGroup(owner, items, 'bg-emerald-100 text-emerald-700'))}</div>
          }
        </div>
      </CardContent>
    </Card>
  );
}