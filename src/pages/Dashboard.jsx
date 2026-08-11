import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useOrgId } from '@/lib/useOrgId';
import { computeUnifiedHealthScore } from '@/lib/healthMetrics';
import { computeMomentumIndicators, computeMomentumTrend } from '@/lib/momentumScoring';
import { getRoundComparison } from '@/lib/scoreboardScoring';
import { STAGE_STEPS } from '@/components/dashboard/NextStepsPanel';

import CommandCenterHeader from '@/components/dashboard/CommandCenterHeader';
import PrimaryScoreCards from '@/components/dashboard/PrimaryScoreCards';
import TopPriorities from '@/components/dashboard/TopPriorities';
import NeedsAttention from '@/components/dashboard/NeedsAttention';
import CurrentStagePanel from '@/components/dashboard/CurrentStagePanel';
import UpcomingItems from '@/components/dashboard/UpcomingItems';
import RecentProgress from '@/components/dashboard/RecentProgress';

import SecurityAuditPanel from '@/components/dashboard/SecurityAuditPanel';
import AdminOrgWidget from '@/components/dashboard/AdminOrgWidget';
import StageCompletionMatrix from '@/components/dashboard/StageCompletionMatrix';
import TeamMemberWelcome from '@/components/dashboard/TeamMemberWelcome';

import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Dashboard({ orgId: overrideOrgId }) {
  const { user, isAdmin, isCoach, isTeamMember } = useCurrentUser();
  const orgIdFromUrl = useOrgId();
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');
  const isConsultantView = !!overrideOrgId || !!orgParam;
  const rawOrgId = overrideOrgId || orgIdFromUrl;

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', overrideOrgId || 'me'],
    queryFn: () => isConsultantView
      ? base44.entities.Organization.filter({ id: rawOrgId })
      : isAdmin
        ? base44.entities.Organization.list()
        : isCoach
          ? base44.entities.Organization.filter({ coach_email: user?.email })
          : base44.entities.Organization.filter({ id: rawOrgId }),
    enabled: !!user || isConsultantView,
  });

  const currentOrg = organizations.find(o => o.id === rawOrgId) || organizations[0];
  // If the user's own org_id doesn't match a real org (e.g. super_admin with a stale org_id),
  // fall back to the org we're actually displaying so data queries match the header.
  const orgId = organizations.length > 0 && !organizations.find(o => o.id === rawOrgId)
    ? currentOrg?.id || rawOrgId
    : rawOrgId;

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', orgId],
    queryFn: () => base44.entities.Assessment.filter({ organization_id: orgId }),
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
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', orgId],
    queryFn: () => base44.entities.Session.filter({ organization_id: orgId }),
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

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues-summary', orgId],
    queryFn: () => base44.entities.Issue.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: quarterlyReviews = [] } = useQuery({
    queryKey: ['quarterlyReviews-dash', orgId],
    queryFn: () => base44.entities.QuarterlyReview.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  // Stabilize-stage data for next-steps logic
  const { data: tensionPulsesNS = [] } = useQuery({
    queryKey: ['tensionPulses-ns', orgId], queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: conflictIntakes = [] } = useQuery({
    queryKey: ['conflictIntakes-ns', orgId], queryFn: () => base44.entities.ConflictIntake.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: commAgreements = [] } = useQuery({
    queryKey: ['commAgreements-ns', orgId], queryFn: () => base44.entities.CommAgreement.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: dysfunctions = [] } = useQuery({
    queryKey: ['fiveDysfunctions-ns', orgId], queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: workstyles = [] } = useQuery({
    queryKey: ['workstyleAssessments-ns', orgId], queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: roleClarity = [] } = useQuery({
    queryKey: ['roleClarity-ns', orgId], queryFn: () => base44.entities.RoleClarity.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: decisionRights = [] } = useQuery({
    queryKey: ['decisionRights-ns', orgId], queryFn: () => base44.entities.DecisionRight.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: covenants = [] } = useQuery({
    queryKey: ['covenants-ns', orgId], queryFn: () => base44.entities.LeadershipCovenant.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: meetingAgendas = [] } = useQuery({
    queryKey: ['meetingAgendas-ns', orgId], queryFn: () => base44.entities.MeetingAgenda.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: riskFlags = [] } = useQuery({
    queryKey: ['riskFlags-ns', orgId], queryFn: () => base44.entities.RiskFlag.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const currentStage = currentOrg?.current_stage || 'stabilize';

  // Unified scores
  const unifiedHealth = computeUnifiedHealthScore(assessments, healthPulses, tensionPulses);
  const momentumResult = computeMomentumIndicators(priorities, actions, decisions, stageProgress);
  const unifiedMomentum = momentumResult.overall;

  // Health trend
  const { current: healthCurrent, previous: healthPrevious } = getRoundComparison(assessments);
  const healthTrend = !healthCurrent || !healthPrevious ? 'stable' :
    healthCurrent.overall > healthPrevious.overall + 0.5 ? 'improving' :
    healthCurrent.overall < healthPrevious.overall - 0.5 ? 'declining' : 'stable';

  // Momentum trend
  const momentumTrend = computeMomentumTrend(actions, decisions).direction;

  // Last assessment date
  const lastAssessmentDate = assessments.length > 0
    ? assessments[0]?.created_date
    : null;

  // Current operating period
  const activePlan = planPeriods.find(p => p.status === 'active');
  const operatingPeriod = activePlan
    ? `${activePlan.type?.replace('_', ' ') || 'Active'} plan`
    : priorities.length > 0
      ? `${priorities.filter(p => p.status === 'active').length} active priorities`
      : null;

  // Stage steps logic (from NextStepsPanel)
  const stageSteps = STAGE_STEPS[currentStage] || [];
  const stageCounts = {
    tension_pulse: tensionPulsesNS.length,
    conflict_intake: conflictIntakes.length,
    leader_interviews: 0,
    comm_agreements: commAgreements.length,
    conflict_triggers: 0,
    nvc_conversations: 0,
    five_dysfunctions: dysfunctions.length,
    workstyle: workstyles.length,
    role_clarity: roleClarity.length,
    priorities: priorities.length,
    decision_rights: decisionRights.length,
    covenant: covenants.length,
    planning: planPeriods.length,
    meetings: meetingAgendas.length,
    decisions: decisions.length,
    actions: actions.filter(a => a.status === 'completed').length,
    health_pulse: healthPulses.length,
    risk_flags: riskFlags.length,
    quarterly_review: quarterlyReviews.length,
    renewal: quarterlyReviews.filter(r => r.renewal_action).length,
  };
  const completedCount = stageSteps.filter(s => (stageCounts[s.key] || 0) > 0).length;
  const nextStep = stageSteps.find(s => (stageCounts[s.key] || 0) === 0);

  // Generate notifications on load
  useEffect(() => {
    if (orgId) base44.functions.invoke('generateNotifications', { organizationId: orgId });
  }, [orgId]);

  return (
    <div className="space-y-5">
      {/* Back link for consultant view */}
      {isConsultantView && (
        <Link to="/coach" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>
      )}

      {/* 1. Header: Org name, stage, progress */}
      <CommandCenterHeader
        org={currentOrg}
        currentStage={currentStage}
        stageProgress={stageProgress}
      />

      {/* Team member welcome for first-time users */}
      {isTeamMember && !isConsultantView && (
        <TeamMemberWelcome userName={user?.full_name} hasAssessments={assessments.length > 0} />
      )}

      {/* 2. Two primary cards: Leadership Health + Momentum */}
      <PrimaryScoreCards
        healthScore={unifiedHealth}
        healthTrend={healthTrend}
        lastAssessmentDate={lastAssessmentDate}
        momentumScore={unifiedMomentum}
        momentumTrend={momentumTrend}
        operatingPeriod={operatingPeriod}
      />

      {/* 3. Top Priorities + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopPriorities orgId={orgId} />
        <NeedsAttention issues={issues} actions={actions} healthTrend={healthTrend} />
      </div>

      {/* 4. Current Stage + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CurrentStagePanel
          currentStage={currentStage}
          stageSteps={stageSteps}
          completedCount={completedCount}
          nextStep={nextStep}
          orgId={orgId}
        />
        <UpcomingItems sessions={sessions} actions={actions} quarterlyReviews={quarterlyReviews} />
      </div>

      {/* 5. Recent Progress */}
      <RecentProgress
        priorities={priorities}
        issues={issues}
        actions={actions}
        healthTrend={healthTrend}
      />

      {/* Admin panels — only on the consultant's own dashboard, not when viewing a specific org */}
      {!isConsultantView && (isAdmin || isCoach) && <AdminOrgWidget />}
      {!isConsultantView && isAdmin && <StageCompletionMatrix />}
      {!isConsultantView && isAdmin && <SecurityAuditPanel />}
    </div>
  );
}