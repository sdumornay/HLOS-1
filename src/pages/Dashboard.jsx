import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { computeUnifiedHealthScore, computeMomentumScore } from '@/lib/healthMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, Target, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ScoreCard from '@/components/dashboard/ScoreCard';
import StageProgressBar from '@/components/dashboard/StageProgressBar';
import HealthRadar from '@/components/dashboard/HealthRadar';
import MomentumChart from '@/components/dashboard/MomentumChart';
import SecurityAuditPanel from '@/components/dashboard/SecurityAuditPanel';
import BenchmarkPanel from '@/components/dashboard/BenchmarkPanel';
import AdminOrgWidget from '@/components/dashboard/AdminOrgWidget';
import WorkstyleCard from '@/components/dashboard/WorkstyleCard';
import NextStepsPanel from '@/components/dashboard/NextStepsPanel';
import RiskFlagSummary from '@/components/dashboard/RiskFlagSummary';

export default function Dashboard() {
  const { user, isAdmin, isCoach } = useCurrentUser();
  const orgId = user?.organization_id;

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => isAdmin
      ? base44.entities.Organization.list()
      : isCoach
        ? base44.entities.Organization.filter({ coach_email: user?.email })
        : base44.entities.Organization.filter({ id: orgId }),
    enabled: !!user,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', orgId],
    queryFn: () => isAdmin
      ? base44.entities.Assessment.list('-created_date', 50)
      : base44.entities.Assessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: healthPulses = [] } = useQuery({
    queryKey: ['healthPulses', orgId],
    queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: tensionPulses = [] } = useQuery({
    queryKey: ['tensionPulses', orgId],
    queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', orgId],
    queryFn: () => isAdmin
      ? base44.entities.Action.list('-created_date', 50)
      : base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', orgId],
    queryFn: () => isAdmin
      ? base44.entities.Session.list('-date', 10)
      : base44.entities.Session.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisionLog', orgId],
    queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: stageProgress = [] } = useQuery({
    queryKey: ['stageProgress', orgId],
    queryFn: () => base44.entities.StageProgress.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: planPeriods = [] } = useQuery({
    queryKey: ['planningPeriods', orgId],
    queryFn: () => base44.entities.PlanningPeriod.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const currentOrg = organizations.find(o => o.id === orgId) || organizations[0];
  const currentStage = currentOrg?.current_stage || 'stabilize';

  const unifiedHealth = computeUnifiedHealthScore(assessments, healthPulses, tensionPulses);
  const unifiedMomentum = computeMomentumScore(actions, decisions, stageProgress, planPeriods);

  const recentAssessments = assessments.slice(0, 20);
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const totalActions = actions.length;
  const overdueActions = actions.filter(a => a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Healthy Leadership OS</p>
          <h1 className="text-2xl lg:text-3xl font-barlow font-bold text-foreground tracking-tight">
            Leadership Health Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Health First. Momentum Next.</p>
        </div>
        {currentOrg && (
          <Badge className="text-sm px-3 py-1.5 w-fit bg-primary text-primary-foreground border-0 font-semibold">
            {currentOrg.name} — <span className="capitalize ml-1">{currentStage}</span>
          </Badge>
        )}
      </div>

      {/* Brand banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary via-primary to-secondary/80 p-px shadow-lg">
        <div className="rounded-xl bg-gradient-to-r from-primary to-[hsl(220,65%,14%)] px-6 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-white font-barlow font-bold text-lg tracking-wide">STABILIZE → ALIGN → EXECUTE → SUSTAIN</p>
            <p className="text-white/60 text-xs mt-0.5">Moving teams from friction to momentum through a reproducible system for team health</p>
          </div>
          {currentOrg && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-accent text-xs font-semibold uppercase tracking-wider capitalize">{currentStage} Stage</span>
            </div>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-6 px-4 lg:px-8">
          <StageProgressBar currentStage={currentStage} completedStages={[]} />
        </CardContent>
      </Card>

      {/* Next Steps — contextual guidance */}
      {orgId && <NextStepsPanel stage={currentStage} orgId={orgId} />}

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/assessments"><ScoreCard title="Overall Health" score={unifiedHealth} icon={Heart} variant="health" subtitle={`${recentAssessments.length} assessments`} /></Link>
        <Link to="/actions"><ScoreCard title="Momentum Score" score={unifiedMomentum} icon={TrendingUp} variant="momentum" subtitle={`${completedActions}/${totalActions} actions done`} /></Link>
        <Link to="/actions"><ScoreCard title="Overdue Items" score={overdueActions} maxScore={totalActions || 1} icon={Target} variant="health" subtitle="Needs attention" /></Link>
        <Link to="/sessions"><ScoreCard title="Sessions" score={sessions.length} maxScore={20} icon={Calendar} variant="momentum" subtitle="Total meetings logged" /></Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthRadar assessments={recentAssessments} />
        <MomentumChart assessments={recentAssessments} />
      </div>

      {/* Risk Flags */}
      {orgId && <RiskFlagSummary />}

      {/* Benchmarking */}
      {orgId && <BenchmarkPanel orgId={orgId} />}

      {/* Admin Org Overview — super_admin and coach only */}
      {(isAdmin || isCoach) && <AdminOrgWidget />}

      {/* Security Audit — super_admin only */}
      {isAdmin && <SecurityAuditPanel />}

      {/* Workstyle + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WorkstyleCard userEmail={user?.email} />
        {/* Recent Actions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Actions</CardTitle>
            <Link to="/actions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.slice(0, 5).map(action => (
              <div key={action.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.owner_email || action.owner}</p>
                </div>
                <Badge variant={action.status === 'completed' ? 'default' : action.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs ml-2">
                  {action.status?.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {actions.length === 0 && (
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
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{session.date ? format(new Date(session.date), 'MMM d, yyyy') : 'No date'}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize ml-2">{session.stage}</Badge>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No sessions logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}