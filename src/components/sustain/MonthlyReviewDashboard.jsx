import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Rocket, Target, AlertCircle, CalendarClock, Eye } from 'lucide-react';
import { format } from 'date-fns';

const currentMonth = format(new Date(), 'yyyy-MM');

function MetricRow({ icon, label, value, sub, accent }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

export default function MonthlyReviewDashboard({ orgId }) {
  const { data: pulses = [] } = useQuery({
    queryKey: ['healthPulses', orgId],
    queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', orgId],
    queryFn: () => base44.entities.Assessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues', orgId],
    queryFn: () => base44.entities.Issue.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  // Current month health
  const thisMonthPulses = pulses.filter(p => p.month === currentMonth);
  const avgHealth = thisMonthPulses.length > 0
    ? (thisMonthPulses.reduce((s, p) => s + (p.overall_health || 0), 0) / thisMonthPulses.length).toFixed(1)
    : '—';
  const avgMomentum = thisMonthPulses.length > 0
    ? (thisMonthPulses.reduce((s, p) => s + (p.momentum || 0), 0) / thisMonthPulses.length).toFixed(1)
    : '—';

  // Priority progress
  const activePriorities = priorities.filter(p => p.status === 'active' || p.status === 'proposed');
  const avgProgress = activePriorities.length > 0
    ? Math.round(activePriorities.reduce((s, p) => s + (p.progress_percentage || 0), 0) / activePriorities.length)
    : 0;

  // Unresolved issues
  const unresolvedIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress');

  // Overdue commitments
  const now = new Date();
  const overdueActions = actions.filter(a =>
    a.status === 'overdue' ||
    (a.status === 'pending' && a.due_date && new Date(a.due_date) < now)
  );

  // Emerging concerns (from pulse concerns + risk flags)
  const recentConcerns = thisMonthPulses
    .filter(p => p.concern)
    .map(p => ({ text: p.concern, source: p.respondent_email }));
  const renewalFlagged = thisMonthPulses.some(p => p.renewal_needed);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Monthly Health + Momentum Review</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs">{format(new Date(), 'MMMM yyyy')}</Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        <MetricRow
          icon={<Heart className="h-4 w-4 text-rose-500" />}
          label="Leadership Health"
          value={avgHealth}
          sub={thisMonthPulses.length > 0 ? `${thisMonthPulses.length} response${thisMonthPulses.length !== 1 ? 's' : ''} this month` : 'No pulses yet this month'}
          accent="bg-rose-50"
        />
        <MetricRow
          icon={<Rocket className="h-4 w-4 text-emerald-500" />}
          label="Momentum Score"
          value={avgMomentum}
          sub={thisMonthPulses.length > 0 ? 'Team average' : 'No data yet'}
          accent="bg-emerald-50"
        />
        <MetricRow
          icon={<Target className="h-4 w-4 text-blue-500" />}
          label="Priority Progress"
          value={activePriorities.length > 0 ? `${avgProgress}%` : '—'}
          sub={activePriorities.length > 0 ? `${activePriorities.length} active priorit${activePriorities.length !== 1 ? 'ies' : 'y'}` : 'No active priorities'}
          accent="bg-blue-50"
        />
        <MetricRow
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          label="Unresolved Issues"
          value={unresolvedIssues.length}
          sub={unresolvedIssues.length > 0 ? `${unresolvedIssues.filter(i => i.classification === 'relational').length} relational · ${unresolvedIssues.filter(i => i.classification === 'operational').length} operational` : 'No open issues'}
          accent="bg-amber-50"
        />
        <MetricRow
          icon={<CalendarClock className="h-4 w-4 text-red-500" />}
          label="Overdue Commitments"
          value={overdueActions.length}
          sub={overdueActions.length > 0 ? 'Actions past due date' : 'All commitments on track'}
          accent="bg-red-50"
        />
        <MetricRow
          icon={<Eye className="h-4 w-4 text-purple-500" />}
          label="Emerging Concerns"
          value={recentConcerns.length + (renewalFlagged ? 1 : 0)}
          sub={renewalFlagged ? 'Renewal flagged this month' : recentConcerns.length > 0 ? 'From monthly pulse concerns' : 'No concerns surfaced'}
          accent="bg-purple-50"
        />

        {/* Concern details */}
        {recentConcerns.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">CONCERNS SURFACED THIS MONTH</p>
            {recentConcerns.slice(0, 3).map((c, i) => (
              <div key={i} className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                <p className="text-sm text-foreground">{c.text}</p>
                <p className="text-xs text-muted-foreground mt-1">— {c.source}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}