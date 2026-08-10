// Unified Health Score — aggregates Assessment, HealthPulse, and TensionPulse
// Returns a 0-10 score with weighted contributions from each available source.
export function computeUnifiedHealthScore(assessments = [], healthPulses = [], tensionPulses = []) {
  const sources = [];

  // Assessment: overall_health is already 0-10
  if (assessments.length > 0) {
    const recent = assessments.slice(0, 10);
    const avg = recent.reduce((s, a) => s + (a.overall_health || 0), 0) / recent.length;
    sources.push({ value: avg, weight: 40 });
  }

  // HealthPulse: overall_health is 0-10
  if (healthPulses.length > 0) {
    const recent = healthPulses.slice(0, 6);
    const avg = recent.reduce((s, p) => s + (p.overall_health || 0), 0) / recent.length;
    sources.push({ value: avg, weight: 30 });
  }

  // TensionPulse: 6 dimensions on 1-10, some inverted (lower = healthier)
  if (tensionPulses.length > 0) {
    const recent = tensionPulses.slice(0, 6);
    const normalized = recent.map(p => {
      const dims = [
        p.team_tension ? 11 - p.team_tension : 0,        // invert: lower tension = healthier
        p.trust_level || 0,
        p.communication_safety || 0,
        p.unresolved_conflicts ? 11 - p.unresolved_conflicts : 0, // invert
        p.leadership_confidence || 0,
        p.team_morale || 0,
      ];
      return dims.reduce((s, v) => s + v, 0) / dims.length;
    });
    const avg = normalized.reduce((s, v) => s + v, 0) / normalized.length;
    sources.push({ value: avg, weight: 30 });
  }

  if (sources.length === 0) return 0;
  const totalWeight = sources.reduce((s, w) => s + w.weight, 0);
  const weightedSum = sources.reduce((s, w) => s + w.value * w.weight, 0);
  return parseFloat((weightedSum / totalWeight).toFixed(1));
}

// Unified Momentum Score — aggregates action completion, decision velocity,
// milestone completion, and plan period progress. Returns 0-10.
export function computeMomentumScore(actions = [], decisions = [], stageProgress = [], planPeriods = []) {
  const components = [];

  // Action completion rate (0-10)
  if (actions.length > 0) {
    const completed = actions.filter(a => a.status === 'completed').length;
    components.push((completed / actions.length) * 10);
  }

  // Decision velocity: decisions in last 30 days, 5+ = max score
  if (decisions.length > 0) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent = decisions.filter(d => d.date && new Date(d.date) >= thirtyDaysAgo);
    components.push(Math.min(10, recent.length * 2));
  }

  // Milestone completion (0-10)
  if (stageProgress.length > 0) {
    const allMilestones = stageProgress.flatMap(sp => sp.milestones || []);
    if (allMilestones.length > 0) {
      const completed = allMilestones.filter(m => m.completed).length;
      components.push((completed / allMilestones.length) * 10);
    }
  }

  // Plan period progress (0-10)
  if (planPeriods.length > 0) {
    const activePlans = planPeriods.filter(p => p.status === 'active' || p.status === 'completed');
    if (activePlans.length > 0) {
      const completedPlans = activePlans.filter(p => p.status === 'completed').length;
      components.push((completedPlans / activePlans.length) * 10);
    }
  }

  if (components.length === 0) return 0;
  return parseFloat((components.reduce((s, v) => s + v, 0) / components.length).toFixed(1));
}