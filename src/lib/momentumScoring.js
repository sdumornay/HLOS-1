// Momentum Scoreboard scoring + interpretation logic.
// Calculates execution momentum from REAL data: priorities, actions, decisions, milestones.
// Returns 0-10 scores per indicator and an overall momentum score.
// Does NOT fabricate data — all metrics derive from stored entities.

export const MOMENTUM_INDICATORS = [
  { key: 'priority_progress', label: 'Priority Progress', description: 'Active or completed priorities', invert: false },
  { key: 'on_time_completion', label: 'On-Time Completion', description: 'Actions completed by their due date', invert: false },
  { key: 'decisions_resolved', label: 'Decisions Resolved', description: 'Decisions made and still standing', invert: false },
  { key: 'milestones_achieved', label: 'Milestones Achieved', description: 'Completed stage milestones', invert: false },
  { key: 'commitments_completed', label: 'Commitments Completed', description: 'All action items completed', invert: false },
  { key: 'overdue_commitments', label: 'Overdue Commitments', description: 'Actions past due and not completed', invert: true },
];

function rate(numerator, denominator) {
  if (denominator === 0) return null;
  return parseFloat(((numerator / denominator) * 10).toFixed(1));
}

// Compute all momentum indicators from real data
export function computeMomentumIndicators(priorities = [], actions = [], decisions = [], stageProgress = []) {
  const now = new Date();

  // 1. Priority progress: active or completed / total
  const activePriorities = priorities.filter(p => p.status === 'active' || p.status === 'completed').length;
  const priorityScore = priorities.length > 0 ? rate(activePriorities, priorities.length) : null;

  // 2. On-time completion: completed actions done by due date / total completed
  const completedActions = actions.filter(a => a.status === 'completed');
  const onTimeCompleted = completedActions.filter(a => {
    if (!a.due_date) return true;
    if (!a.completed_date) return true;
    return new Date(a.completed_date) <= new Date(a.due_date);
  }).length;
  const onTimeScore = completedActions.length > 0 ? rate(onTimeCompleted, completedActions.length) : null;

  // 3. Decisions resolved: active (standing) decisions / total
  const activeDecisions = decisions.filter(d => d.status === 'active').length;
  const decisionScore = decisions.length > 0 ? rate(activeDecisions, decisions.length) : null;

  // 4. Milestones achieved: completed milestones / total milestones
  const allMilestones = stageProgress.flatMap(sp => sp.milestones || []);
  const completedMilestones = allMilestones.filter(m => m.completed).length;
  const milestoneScore = allMilestones.length > 0 ? rate(completedMilestones, allMilestones.length) : null;

  // 5. Commitments completed: completed actions / total actions
  const commitmentScore = actions.length > 0 ? rate(completedActions.length, actions.length) : null;

  // 6. Overdue commitments (inverse): 0 overdue = 10, scales down with overdue ratio
  const overdueCount = actions.filter(a =>
    a.status !== 'completed' && a.due_date && new Date(a.due_date) < now
  ).length;
  const overdueScore = actions.length > 0
    ? parseFloat(Math.max(0, 10 - (overdueCount / actions.length) * 20).toFixed(1))
    : null;

  const indicators = {
    priority_progress: priorityScore,
    on_time_completion: onTimeScore,
    decisions_resolved: decisionScore,
    milestones_achieved: milestoneScore,
    commitments_completed: commitmentScore,
    overdue_commitments: overdueScore,
  };

  const counts = {
    priority_progress: { value: activePriorities, total: priorities.length },
    on_time_completion: { value: onTimeCompleted, total: completedActions.length },
    decisions_resolved: { value: activeDecisions, total: decisions.length },
    milestones_achieved: { value: completedMilestones, total: allMilestones.length },
    commitments_completed: { value: completedActions.length, total: actions.length },
    overdue_commitments: { value: overdueCount, total: actions.length },
  };

  const availableScores = Object.values(indicators).filter(v => v != null);
  const overall = availableScores.length > 0
    ? parseFloat((availableScores.reduce((s, v) => s + v, 0) / availableScores.length).toFixed(1))
    : 0;

  return { indicators, counts, overall, hasData: availableScores.length > 0 };
}

// Compute trend by comparing execution activity in last 30 days vs previous 30 days
export function computeMomentumTrend(actions = [], decisions = []) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentCompleted = actions.filter(a =>
    a.status === 'completed' && a.completed_date && new Date(a.completed_date) >= thirtyDaysAgo
  ).length;
  const prevCompleted = actions.filter(a =>
    a.status === 'completed' && a.completed_date &&
    new Date(a.completed_date) >= sixtyDaysAgo && new Date(a.completed_date) < thirtyDaysAgo
  ).length;

  const recentDecisions = decisions.filter(d => d.date && new Date(d.date) >= thirtyDaysAgo).length;
  const prevDecisions = decisions.filter(d =>
    d.date && new Date(d.date) >= sixtyDaysAgo && new Date(d.date) < thirtyDaysAgo
  ).length;

  const recentActivity = recentCompleted + recentDecisions;
  const prevActivity = prevCompleted + prevDecisions;

  const direction = recentActivity > prevActivity + 1 ? 'improving' :
    recentActivity < prevActivity - 1 ? 'declining' : 'stable';

  return {
    recentCompleted, prevCompleted, recentDecisions, prevDecisions,
    recentActivity, prevActivity, direction,
    hasData: recentActivity > 0 || prevActivity > 0,
  };
}

export function getMomentumColor(score) {
  if (score >= 8) return { text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Strong' };
  if (score >= 6) return { text: 'text-blue-600', bg: 'bg-blue-50', label: 'Active' };
  if (score >= 4) return { text: 'text-amber-600', bg: 'bg-amber-50', label: 'Building' };
  return { text: 'text-red-600', bg: 'bg-red-50', label: 'Stalled' };
}

export function interpretMomentum(indicators, counts, overall) {
  const patterns = [];

  if (indicators.overdue_commitments != null && indicators.overdue_commitments < 5 && counts.overdue_commitments?.value > 0) {
    patterns.push(`${counts.overdue_commitments.value} overdue commitment${counts.overdue_commitments.value !== 1 ? 's' : ''} — the team may be taking on more than it can deliver right now.`);
  }
  if (indicators.on_time_completion != null && indicators.on_time_completion < 5) {
    patterns.push('Actions are being completed but frequently late, indicating timeline discipline needs attention.');
  }
  if (indicators.priority_progress != null && indicators.priority_progress < 5) {
    patterns.push('Priorities are stuck in proposed status — alignment hasn\'t translated into committed action yet.');
  }
  if (indicators.decisions_resolved != null && indicators.decisions_resolved < 5) {
    patterns.push('Few decisions are being made and standing, which may be blocking execution.');
  }
  if (indicators.milestones_achieved != null && indicators.milestones_achieved < 5) {
    patterns.push('Milestones aren\'t being completed — consider breaking work into smaller, trackable chunks.');
  }
  if (patterns.length === 0 && overall >= 6) {
    patterns.push('No critical execution gaps. The team is consistently moving priorities forward.');
  }

  let focusStage = 'sustain';
  let focusDiscipline = 'Measurement';
  if (indicators.priority_progress != null && indicators.priority_progress < 5) {
    focusStage = 'align';
    focusDiscipline = 'Organizational Clarity';
  } else if ((indicators.on_time_completion != null && indicators.on_time_completion < 5) ||
             (indicators.commitments_completed != null && indicators.commitments_completed < 5)) {
    focusStage = 'execute';
    focusDiscipline = 'Accountability';
  } else if (indicators.decisions_resolved != null && indicators.decisions_resolved < 5) {
    focusStage = 'execute';
    focusDiscipline = 'Execution Rhythm';
  }

  return { patterns, focusStage, focusDiscipline, overall };
}

export function getMomentumNextSteps(indicators) {
  const steps = [];

  if (indicators.priority_progress != null && indicators.priority_progress < 5) {
    steps.push({ stage: 'align', discipline: 'Organizational Clarity', action: 'Run a Priority Alignment exercise to move priorities from proposed to active', link: '/align' });
  }
  if (indicators.on_time_completion != null && indicators.on_time_completion < 5) {
    steps.push({ stage: 'execute', discipline: 'Accountability', action: 'Review action due dates and break large tasks into smaller, time-bound pieces', link: '/execute' });
  }
  if (indicators.commitments_completed != null && indicators.commitments_completed < 5) {
    steps.push({ stage: 'execute', discipline: 'Accountability', action: 'Use the Action Tracker to assign clear owners and deadlines to every commitment', link: '/execute' });
  }
  if (indicators.decisions_resolved != null && indicators.decisions_resolved < 5) {
    steps.push({ stage: 'execute', discipline: 'Execution Rhythm', action: 'Start a Decision Log to record what was decided and who owns the follow-through', link: '/execute' });
  }
  if (indicators.overdue_commitments != null && indicators.overdue_commitments < 5) {
    steps.push({ stage: 'execute', discipline: 'Accountability', action: 'Review overdue items and either reschedule, reassign, or cancel them', link: '/execute' });
  }
  if (indicators.milestones_achieved != null && indicators.milestones_achieved < 5) {
    steps.push({ stage: 'sustain', discipline: 'Measurement', action: 'Break stage milestones into smaller, weekly check-ins to maintain visible progress', link: '/sustain' });
  }

  if (steps.length === 0) {
    steps.push({ stage: 'sustain', discipline: 'Measurement', action: 'Continue tracking momentum monthly to catch execution drift early', link: '/sustain' });
    steps.push({ stage: 'sustain', discipline: 'Renewal', action: 'Schedule a Quarterly Review to celebrate wins and adjust course', link: '/sustain' });
  }

  return steps;
}