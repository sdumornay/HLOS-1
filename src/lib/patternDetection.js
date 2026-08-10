// Pattern detection for the Sustain stage.
// Analyzes health, momentum, issues, actions, and priorities to surface
// patterns using non-alarming language: "Needs Attention", "Consider Reviewing",
// "Emerging Pattern".

const SEVERITY = {
  NEEDS_ATTENTION: 'needs_attention',
  CONSIDER_REVIEWING: 'consider_reviewing',
  EMERGING_PATTERN: 'emerging_pattern',
};

export const SEVERITY_LABELS = {
  needs_attention: 'Needs Attention',
  consider_reviewing: 'Consider Reviewing',
  emerging_pattern: 'Emerging Pattern',
};

export const SEVERITY_STYLES = {
  needs_attention: 'bg-amber-50 border-amber-200 text-amber-800',
  consider_reviewing: 'bg-blue-50 border-blue-200 text-blue-800',
  emerging_pattern: 'bg-purple-50 border-purple-200 text-purple-800',
};

export const SEVERITY_ICONS = {
  needs_attention: 'AlertCircle',
  consider_reviewing: 'Eye',
  emerging_pattern: 'TrendingDown',
};

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function detectPatterns({
  pulses = [],
  issues = [],
  actions = [],
  priorities = [],
}) {
  const patterns = [];

  // Sort pulses by month ascending
  const sortedPulses = [...pulses].sort((a, b) =>
    (a.month || '').localeCompare(b.month || '')
  );

  // Group by month and average
  const monthMap = {};
  sortedPulses.forEach(p => {
    if (!p.month) return;
    if (!monthMap[p.month]) monthMap[p.month] = { health: [], momentum: [], conflict: [] };
    monthMap[p.month].health.push(p.overall_health || 0);
    monthMap[p.month].momentum.push(p.momentum || 0);
    monthMap[p.month].conflict.push(p.conflict_level || 0);
  });
  const months = Object.keys(monthMap).sort();
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const monthlyData = months.map(m => ({
    month: m,
    health: avg(monthMap[m].health),
    momentum: avg(monthMap[m].momentum),
    conflict: avg(monthMap[m].conflict),
  }));

  // 1. Declining health — 2+ consecutive months of health decline
  if (monthlyData.length >= 3) {
    const last3 = monthlyData.slice(-3);
    let declineStreak = 0;
    for (let i = 1; i < last3.length; i++) {
      if (last3[i].health < last3[i - 1].health) declineStreak++;
    }
    if (declineStreak >= 2) {
      patterns.push({
        severity: SEVERITY.NEEDS_ATTENTION,
        title: 'Health declining',
        detail: 'Leadership health has declined over the past 2+ months. Consider reviewing what is driving the trend.',
      });
    } else if (declineStreak === 1) {
      patterns.push({
        severity: SEVERITY.CONSIDER_REVIEWING,
        title: 'Health dip detected',
        detail: 'Health dipped in the most recent month. Worth monitoring to see if it becomes a pattern.',
      });
    }
  }

  // 2. Declining momentum — 2+ consecutive months of momentum decline
  if (monthlyData.length >= 3) {
    const last3 = monthlyData.slice(-3);
    let declineStreak = 0;
    for (let i = 1; i < last3.length; i++) {
      if (last3[i].momentum < last3[i - 1].momentum) declineStreak++;
    }
    if (declineStreak >= 2) {
      patterns.push({
        severity: SEVERITY.NEEDS_ATTENTION,
        title: 'Momentum declining',
        detail: 'Momentum has declined over the past 2+ months. Consider reviewing priorities and execution rhythm.',
      });
    } else if (declineStreak === 1) {
      patterns.push({
        severity: SEVERITY.CONSIDER_REVIEWING,
        title: 'Momentum dip detected',
        detail: 'Momentum dipped in the most recent month. Worth monitoring.',
      });
    }
  }

  // 3. Repeated unresolved issues — open/in_progress for 30+ days
  const staleIssues = issues.filter(
    i => (i.status === 'open' || i.status === 'in_progress') && daysSince(i.date_identified) >= 30
  );
  if (staleIssues.length >= 2) {
    patterns.push({
      severity: SEVERITY.EMERGING_PATTERN,
      title: 'Repeated unresolved issues',
      detail: `${staleIssues.length} issues have been open for 30+ days. Consider reviewing whether these need a different approach.`,
    });
  } else if (staleIssues.length === 1) {
    patterns.push({
      severity: SEVERITY.CONSIDER_REVIEWING,
      title: 'Issue unresolved for 30+ days',
      detail: 'One issue has been open for over 30 days. Consider whether it needs renewed attention.',
    });
  }

  // 4. Repeated missed commitments — overdue actions
  const overdueActions = actions.filter(a => a.status === 'overdue' || a.status === 'pending');
  const trulyOverdue = actions.filter(
    a => a.status === 'overdue' || (a.status === 'pending' && a.due_date && new Date(a.due_date) < new Date())
  );
  if (trulyOverdue.length >= 3) {
    patterns.push({
      severity: SEVERITY.NEEDS_ATTENTION,
      title: 'Repeated missed commitments',
      detail: `${trulyOverdue.length} actions are overdue. Consider reviewing workload and due-date realism.`,
    });
  } else if (trulyOverdue.length >= 1) {
    patterns.push({
      severity: SEVERITY.CONSIDER_REVIEWING,
      title: 'Commitment carrying over',
      detail: `${trulyOverdue.length} action${trulyOverdue.length > 1 ? 's' : ''} overdue. Consider reviewing owners and timelines.`,
    });
  }

  // 5. Recurring conflict — conflict_level trending up
  if (monthlyData.length >= 3) {
    const last3 = monthlyData.slice(-3);
    let conflictRising = true;
    for (let i = 1; i < last3.length; i++) {
      if (last3[i].conflict <= last3[i - 1].conflict) conflictRising = false;
    }
    if (conflictRising && last3.length >= 2) {
      patterns.push({
        severity: SEVERITY.EMERGING_PATTERN,
        title: 'Recurring conflict pattern',
        detail: 'Conflict levels have been rising over recent months. Consider reviewing underlying tensions.',
      });
    }
  }

  // 6. Priorities consistently carrying over — past target date, not completed
  const carryingOver = priorities.filter(
    p => p.target_date && new Date(p.target_date) < new Date() && p.status !== 'completed'
  );
  if (carryingOver.length >= 2) {
    patterns.push({
      severity: SEVERITY.NEEDS_ATTENTION,
      title: 'Priorities consistently carrying over',
      detail: `${carryingOver.length} priorities have passed their target date without completion. Consider reviewing scope and capacity.`,
    });
  } else if (carryingOver.length === 1) {
    patterns.push({
      severity: SEVERITY.CONSIDER_REVIEWING,
      title: 'Priority past target date',
      detail: 'One priority has passed its target date. Consider whether it needs re-scoping or re-dating.',
    });
  }

  return patterns;
}