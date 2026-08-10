// Portfolio-level scoring for the Consultant Admin dashboard.
// Computes per-org summary metrics from raw entity arrays so the consultant
// can see every organization in a single cross-org view.
// All computation is client-side from data the consultant is already allowed
// to read (RLS enforces org-scoped access server-side).

import { computeUnifiedHealthScore } from './healthMetrics';
import { computeMomentumIndicators, computeMomentumTrend } from './momentumScoring';
import { getRoundComparison } from './scoreboardScoring';

const STAGE_ORDER = ['stabilize', 'align', 'execute', 'sustain'];

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

// Compute the trend direction from current vs previous round overall health
function healthTrendFromAssessments(assessments) {
  const { current, previous } = getRoundComparison(assessments);
  if (!current || !previous) return 'stable';
  const diff = current.overall - previous.overall;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

// Find the most recent activity date across multiple entity types
function lastActivityDate(actions, sessions, decisions, assessments) {
  const candidates = [];
  actions.forEach(a => candidates.push(parseDate(a.updated_date || a.completed_date || a.due_date)));
  sessions.forEach(s => candidates.push(parseDate(s.date || s.updated_date)));
  decisions.forEach(d => candidates.push(parseDate(d.date || d.updated_date)));
  assessments.forEach(a => candidates.push(parseDate(a.created_date || a.updated_date)));
  return candidates.filter(Boolean).sort((a, b) => b - a)[0] || null;
}

// Find the next upcoming scheduled session or action due date
function nextScheduledDate(sessions, actions) {
  const now = new Date();
  const candidates = [];
  sessions.forEach(s => {
    const d = parseDate(s.date);
    if (d && d >= now) candidates.push({ date: d, label: s.title || 'Session' });
  });
  actions.forEach(a => {
    if (a.status === 'completed' || a.status === 'cancelled') return;
    const d = parseDate(a.due_date);
    if (d && d >= now) candidates.push({ date: d, label: a.title || 'Action due' });
  });
  candidates.sort((a, b) => a.date - b.date);
  return candidates[0] || null;
}

// Count overdue actions (past due, not completed/cancelled)
function countOverdueActions(actions) {
  const now = new Date();
  return actions.filter(a =>
    a.status !== 'completed' && a.status !== 'cancelled' &&
    a.due_date && new Date(a.due_date) < now
  ).length;
}

// Count high-priority unresolved issues
function countHighPriorityIssues(issues) {
  return issues.filter(i =>
    i.status !== 'resolved' && i.status !== 'closed' &&
    (i.priority === 'high' || i.priority === 'critical')
  ).length;
}

// Count unresolved relational issues
function countRelationalIssues(issues) {
  return issues.filter(i =>
    i.status !== 'resolved' && i.status !== 'closed' &&
    i.classification === 'relational'
  ).length;
}

// Count stalled priorities (proposed or on_hold for too long, or no progress)
function countStalledPriorities(priorities) {
  return priorities.filter(p =>
    p.status === 'proposed' || p.status === 'on_hold'
  ).length;
}

// Count repeated overdue commitments (actions that have been overdue for 14+ days)
function countRepeatedOverdue(actions) {
  const cutoff = daysAgo(14);
  return actions.filter(a =>
    a.status !== 'completed' && a.status !== 'cancelled' &&
    a.due_date && new Date(a.due_date) < cutoff
  ).length;
}

// Check if org has had any activity in the last 14 days
function hasRecentActivity(actions, sessions, decisions, assessments) {
  const last = lastActivityDate(actions, sessions, decisions, assessments);
  if (!last) return false;
  return last >= daysAgo(14);
}

// Determine consultant attention reasons for an org
function getAttentionReasons(metrics) {
  const reasons = [];
  if (metrics.healthTrend === 'declining') reasons.push('declining_health');
  if (metrics.unresolvedRelational > 0) reasons.push('relational_issues');
  if (metrics.stalledPriorities > 0) reasons.push('stalled_priorities');
  if (metrics.repeatedOverdue > 0) reasons.push('repeated_overdue');
  if (!metrics.hasRecentActivity) reasons.push('no_recent_activity');
  return reasons;
}

// Build a complete portfolio summary for one org from raw data arrays
export function buildOrgPortfolio(org, {
  users = [],
  assessments = [],
  healthPulses = [],
  tensionPulses = [],
  actions = [],
  priorities = [],
  issues = [],
  sessions = [],
  decisions = [],
  stageProgress = [],
}) {
  const orgAssessments = assessments.filter(a => a.organization_id === org.id);
  const orgHealthPulses = healthPulses.filter(p => p.organization_id === org.id);
  const orgTensionPulses = tensionPulses.filter(p => p.organization_id === org.id);
  const orgActions = actions.filter(a => a.organization_id === org.id);
  const orgPriorities = priorities.filter(p => p.organization_id === org.id);
  const orgIssues = issues.filter(i => i.organization_id === org.id);
  const orgSessions = sessions.filter(s => s.organization_id === org.id);
  const orgDecisions = decisions.filter(d => d.organization_id === org.id);
  const orgStageProgress = stageProgress.filter(sp => sp.organization_id === org.id);

  // Leader name from users
  const orgUsers = users.filter(u => u.organization_id === org.id);
  const leader = orgUsers.find(u => u.role === 'lead_pastor') ||
    orgUsers.find(u => u.role === 'admin') ||
    orgUsers[0];
  const leaderName = leader?.full_name || '—';

  // Health
  const healthScore = computeUnifiedHealthScore(orgAssessments, orgHealthPulses, orgTensionPulses);
  const healthTrend = healthTrendFromAssessments(orgAssessments);

  // Momentum
  const momentumResult = computeMomentumIndicators(orgPriorities, orgActions, orgDecisions, orgStageProgress);
  const momentumScore = momentumResult.overall;
  const momentumTrend = computeMomentumTrend(orgActions, orgDecisions).direction;

  // Activity
  const lastActivity = lastActivityDate(orgActions, orgSessions, orgDecisions, orgAssessments);
  const nextScheduled = nextScheduledDate(orgSessions, orgActions);

  // Issues & overdue
  const overdueActions = countOverdueActions(orgActions);
  const highPriorityIssues = countHighPriorityIssues(orgIssues);
  const unresolvedRelational = countRelationalIssues(orgIssues);
  const stalledPriorities = countStalledPriorities(orgPriorities);
  const repeatedOverdue = countRepeatedOverdue(orgActions);
  const recentActivity = hasRecentActivity(orgActions, orgSessions, orgDecisions, orgAssessments);

  const metrics = {
    healthScore,
    healthTrend,
    momentumScore,
    momentumTrend,
    overdueActions,
    highPriorityIssues,
    unresolvedRelational,
    stalledPriorities,
    repeatedOverdue,
    hasRecentActivity: recentActivity,
  };

  const attentionReasons = getAttentionReasons(metrics);

  return {
    id: org.id,
    name: org.name,
    city: org.city,
    state: org.state,
    type: org.type,
    coach_email: org.coach_email,
    current_stage: org.current_stage || 'stabilize',
    leaderName,
    healthScore,
    healthTrend,
    momentumScore,
    momentumTrend,
    lastActivity,
    nextScheduled,
    overdueActions,
    highPriorityIssues,
    unresolvedRelational,
    stalledPriorities,
    repeatedOverdue,
    hasRecentActivity: recentActivity,
    attentionReasons,
    needsAttention: attentionReasons.length > 0,
    // Keep counts for detail views
    actionCount: orgActions.length,
    priorityCount: orgPriorities.length,
    issueCount: orgIssues.length,
    sessionCount: orgSessions.length,
  };
}

export const ATTENTION_REASON_LABELS = {
  declining_health: { label: 'Declining Health', description: 'Health score trending down' },
  relational_issues: { label: 'Unresolved Relational Issues', description: 'Open relational conflicts' },
  stalled_priorities: { label: 'Stalled Priorities', description: 'Priorities stuck in proposed/on-hold' },
  repeated_overdue: { label: 'Repeated Overdue Commitments', description: 'Actions overdue 14+ days' },
  no_recent_activity: { label: 'Lack of Recent Activity', description: 'No activity in 14 days' },
};

export { STAGE_ORDER };