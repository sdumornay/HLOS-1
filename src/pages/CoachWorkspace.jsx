import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Building2 } from 'lucide-react';

import PortfolioSummary from '@/components/coach/PortfolioSummary';
import PortfolioFilters from '@/components/coach/PortfolioFilters';
import PortfolioTable from '@/components/coach/PortfolioTable';
import ConsultantAttention from '@/components/coach/ConsultantAttention';
import { buildOrgPortfolio } from '@/lib/portfolioScoring';

export default function CoachWorkspace() {
  const { user, isCoach, isAdmin } = useCurrentUser();
  const [activeFilters, setActiveFilters] = useState([]);

  // Fetch all organizations the consultant can see
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['coach-portfolio-orgs', user?.email],
    queryFn: () =>
      isAdmin
        ? base44.entities.Organization.list('-created_date', 200)
        : base44.entities.Organization.filter({ coach_email: user?.email }),
    enabled: !!user && (isCoach || isAdmin),
  });

  const orgIds = organizations.map(o => o.id);

  // Fetch all users (for leader names) — admin only
  const { data: users = [] } = useQuery({
    queryKey: ['portfolio-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: orgIds.length > 0 && isAdmin,
  });

  // Fetch all cross-org data in bulk, filter client-side
  const { data: assessments = [] } = useQuery({
    queryKey: ['portfolio-assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: healthPulses = [] } = useQuery({
    queryKey: ['portfolio-health-pulses'],
    queryFn: () => base44.entities.HealthPulse.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: tensionPulses = [] } = useQuery({
    queryKey: ['portfolio-tension-pulses'],
    queryFn: () => base44.entities.TensionPulse.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['portfolio-actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['portfolio-priorities'],
    queryFn: () => base44.entities.PriorityAlignment.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['portfolio-issues'],
    queryFn: () => base44.entities.Issue.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['portfolio-sessions'],
    queryFn: () => base44.entities.Session.list('-date', 100),
    enabled: orgIds.length > 0,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['portfolio-decisions'],
    queryFn: () => base44.entities.DecisionLog.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: stageProgress = [] } = useQuery({
    queryKey: ['portfolio-stage-progress'],
    queryFn: () => base44.entities.StageProgress.list(),
    enabled: orgIds.length > 0,
  });

  // Build per-org portfolio summaries
  const portfolioOrgs = useMemo(() => {
    if (organizations.length === 0) return [];
    return organizations.map(org =>
      buildOrgPortfolio(org, {
        users,
        assessments,
        healthPulses,
        tensionPulses,
        actions,
        priorities,
        issues,
        sessions,
        decisions,
        stageProgress,
      })
    );
  }, [organizations, users, assessments, healthPulses, tensionPulses, actions, priorities, issues, sessions, decisions, stageProgress]);

  // Apply filters
  const filteredOrgs = useMemo(() => {
    if (activeFilters.length === 0) return portfolioOrgs;
    return portfolioOrgs.filter(org => {
      return activeFilters.every(filter => {
        switch (filter) {
          case 'stabilize':
          case 'align':
          case 'execute':
          case 'sustain':
            return org.current_stage === filter;
          case 'declining_health':
            return org.healthTrend === 'declining';
          case 'declining_momentum':
            return org.momentumTrend === 'declining';
          case 'overdue':
            return org.overdueActions > 0 || org.stalledPriorities > 0;
          case 'high_priority_issues':
            return org.highPriorityIssues > 0;
          default:
            return true;
        }
      });
    });
  }, [portfolioOrgs, activeFilters]);

  const toggleFilter = (key) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  // Summary stats
  const totalOrgs = portfolioOrgs.length;
  const orgsWithHealth = portfolioOrgs.filter(o => o.healthScore > 0);
  const avgHealth = orgsWithHealth.length > 0
    ? orgsWithHealth.reduce((s, o) => s + o.healthScore, 0) / orgsWithHealth.length
    : 0;
  const orgsWithMomentum = portfolioOrgs.filter(o => o.momentumScore > 0);
  const avgMomentum = orgsWithMomentum.length > 0
    ? orgsWithMomentum.reduce((s, o) => s + o.momentumScore, 0) / orgsWithMomentum.length
    : 0;
  const needsAttentionCount = portfolioOrgs.filter(o => o.needsAttention).length;

  if (!isCoach && !isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Coach Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Cross-organization view of every team you're guiding through LHOS
        </p>
      </div>

      {totalOrgs === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No organizations assigned to you yet.</p>
        </div>
      ) : (
        <>
          <PortfolioSummary
            totalOrgs={totalOrgs}
            avgHealth={avgHealth}
            avgMomentum={avgMomentum}
            needsAttentionCount={needsAttentionCount}
          />

          <ConsultantAttention orgs={portfolioOrgs} />

          <PortfolioFilters
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters([])}
            resultCount={filteredOrgs.length}
          />

          <PortfolioTable orgs={filteredOrgs} />
        </>
      )}
    </div>
  );
}