import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle2, Calendar, Target } from 'lucide-react';
import { format, subDays } from 'date-fns';
import ScoreCard from '@/components/dashboard/ScoreCard';

export default function Reviews() {
  const { user, canManageAll } = useCurrentUser();
  const orgId = user?.organization_id;

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 100),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 200),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-date', 50),
  });

  const myAssessments = canManageAll ? assessments : assessments.filter(a => a.organization_id === orgId);
  const myActions = canManageAll ? actions : actions.filter(a => a.organization_id === orgId);
  const mySessions = canManageAll ? sessions : sessions.filter(s => s.organization_id === orgId);

  // 30/60/90 day stats
  const now = new Date();
  const periods = [
    { label: '30 Day', key: '30_day', since: subDays(now, 30) },
    { label: '60 Day', key: '60_day', since: subDays(now, 60) },
    { label: '90 Day', key: '90_day', since: subDays(now, 90) },
  ];

  const periodStats = periods.map(p => {
    const periodActions = myActions.filter(a => a.plan_period === p.key);
    const completed = periodActions.filter(a => a.status === 'completed').length;
    const total = periodActions.length;
    return { ...p, completed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  // Monthly health trend
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = format(d, 'MMM yyyy');
    const monthAssessments = myAssessments.filter(a => {
      const aDate = new Date(a.created_date);
      return aDate.getMonth() === d.getMonth() && aDate.getFullYear() === d.getFullYear();
    });
    const avg = monthAssessments.length > 0
      ? monthAssessments.reduce((s, a) => s + (a.overall_health || 0), 0) / monthAssessments.length
      : 0;
    monthlyData.push({ month: format(d, 'MMM'), health: parseFloat(avg.toFixed(1)) });
  }

  const totalCompleted = myActions.filter(a => a.status === 'completed').length;
  const totalDecisions = mySessions.reduce((s, ses) => s + (ses.decisions?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Reviews & Reports</h1>
        <p className="text-muted-foreground mt-1">Monthly pulse review and quarterly dashboard</p>
      </div>

      {/* Momentum Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Decisions Made" score={totalDecisions} maxScore={Math.max(totalDecisions, 10)} icon={Target} variant="momentum" subtitle="From all sessions" />
        <ScoreCard title="Actions Completed" score={totalCompleted} maxScore={myActions.length || 1} icon={CheckCircle2} variant="momentum" subtitle={`of ${myActions.length} total`} />
        <ScoreCard title="Sessions Held" score={mySessions.length} maxScore={20} icon={Calendar} variant="momentum" subtitle="Total logged" />
        <ScoreCard title="Avg Health" score={myAssessments.length > 0 ? myAssessments.reduce((s, a) => s + (a.overall_health || 0), 0) / myAssessments.length : 0} icon={TrendingUp} variant="health" subtitle={`${myAssessments.length} assessments`} />
      </div>

      {/* 30/60/90 Plan Progress */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">30 / 60 / 90 Day Plan Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {periodStats.map(p => (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{p.label}</Badge>
                  <span className="text-sm text-muted-foreground">{p.completed}/{p.total} actions</span>
                </div>
                <span className="text-sm font-semibold">{p.rate}%</span>
              </div>
              <Progress value={p.rate} className="h-2" />
            </div>
          ))}
          {periodStats.every(p => p.total === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No plan actions tagged yet. Tag actions with a plan period to see progress here.</p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Health Trend */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Health Pulse</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="health" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}