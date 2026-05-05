import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, Target, Calendar, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ScoreCard from '@/components/dashboard/ScoreCard';
import StageProgressBar from '@/components/dashboard/StageProgressBar';
import HealthRadar from '@/components/dashboard/HealthRadar';
import MomentumChart from '@/components/dashboard/MomentumChart';

export default function Dashboard() {
  const { user, canManageAll, loading: userLoading } = useCurrentUser();

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 50),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 50),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-date', 10),
  });

  // Filter data by user's organization if not admin/coach
  const orgId = user?.organization_id;
  const filteredAssessments = canManageAll ? assessments : assessments.filter(a => a.organization_id === orgId);
  const filteredActions = canManageAll ? actions : actions.filter(a => a.organization_id === orgId);
  const filteredSessions = canManageAll ? sessions : sessions.filter(s => s.organization_id === orgId);

  const currentOrg = organizations.find(o => o.id === orgId) || organizations[0];

  // Compute average health
  const recentAssessments = filteredAssessments.slice(0, 20);
  const avgHealth = recentAssessments.length > 0
    ? recentAssessments.reduce((s, a) => s + (a.overall_health || 0), 0) / recentAssessments.length
    : 0;

  const completedActions = filteredActions.filter(a => a.status === 'completed').length;
  const totalActions = filteredActions.length;
  const completionRate = totalActions > 0 ? (completedActions / totalActions) * 10 : 0;

  const overdueActions = filteredActions.filter(a => a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Leadership Health Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Health First. Momentum Next.
          </p>
        </div>
        {currentOrg && (
          <Badge variant="outline" className="text-sm px-3 py-1 w-fit">
            {currentOrg.name} — <span className="capitalize font-medium">{currentOrg.current_stage || 'stabilize'}</span>
          </Badge>
        )}
      </div>

      {/* Stage Progress */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-6 px-4 lg:px-8">
          <StageProgressBar
            currentStage={currentOrg?.current_stage || 'stabilize'}
            completedStages={[]}
          />
        </CardContent>
      </Card>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Overall Health" score={avgHealth} icon={Heart} variant="health" subtitle={`${recentAssessments.length} assessments`} />
        <ScoreCard title="Momentum" score={completionRate} icon={TrendingUp} variant="momentum" subtitle={`${completedActions}/${totalActions} actions done`} />
        <ScoreCard title="Overdue Items" score={overdueActions} maxScore={totalActions || 1} icon={Target} variant="health" subtitle="Needs attention" />
        <ScoreCard title="Sessions" score={filteredSessions.length} maxScore={20} icon={Calendar} variant="momentum" subtitle="Total meetings logged" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthRadar assessments={recentAssessments} />
        <MomentumChart assessments={recentAssessments} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Actions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Actions</CardTitle>
            <Link to="/actions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredActions.slice(0, 5).map(action => (
              <div key={action.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.owner_email}</p>
                </div>
                <Badge variant={action.status === 'completed' ? 'default' : action.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs ml-2">
                  {action.status?.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {filteredActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No actions yet. Start by creating your first action item.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
            <Link to="/sessions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{session.date ? format(new Date(session.date), 'MMM d, yyyy') : 'No date'}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize ml-2">{session.stage}</Badge>
              </div>
            ))}
            {filteredSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No sessions logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}