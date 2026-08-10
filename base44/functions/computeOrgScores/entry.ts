import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId } = await req.json();
    if (!organizationId) return Response.json({ error: 'Missing organizationId' }, { status: 400 });

    const [assessments, healthPulses, tensionPulses, actions, decisions, stageProgress, planPeriods] = await Promise.all([
      base44.asServiceRole.entities.Assessment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.HealthPulse.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.TensionPulse.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.Action.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.DecisionLog.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.StageProgress.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.PlanningPeriod.filter({ organization_id: organizationId }),
    ]);

    // Compute unified health score
    const healthSources = [];
    if (assessments.length > 0) {
      const recent = assessments.slice(0, 10);
      const avg = recent.reduce((s, a) => s + (a.overall_health || 0), 0) / recent.length;
      healthSources.push({ value: avg, weight: 40 });
    }
    if (healthPulses.length > 0) {
      const recent = healthPulses.slice(0, 6);
      const avg = recent.reduce((s, p) => s + (p.overall_health || 0), 0) / recent.length;
      healthSources.push({ value: avg, weight: 30 });
    }
    if (tensionPulses.length > 0) {
      const recent = tensionPulses.slice(0, 6);
      const normalized = recent.map(p => {
        const dims = [
          p.team_tension ? 11 - p.team_tension : 0,
          p.trust_level || 0,
          p.communication_safety || 0,
          p.unresolved_conflicts ? 11 - p.unresolved_conflicts : 0,
          p.leadership_confidence || 0,
          p.team_morale || 0,
        ];
        return dims.reduce((s, v) => s + v, 0) / dims.length;
      });
      const avg = normalized.reduce((s, v) => s + v, 0) / normalized.length;
      healthSources.push({ value: avg, weight: 30 });
    }
    const healthScore = healthSources.length > 0
      ? parseFloat((healthSources.reduce((s, w) => s + w.value * w.weight, 0) / healthSources.reduce((s, w) => s + w.weight, 0)).toFixed(1))
      : 0;

    // Compute unified momentum score
    const momentumComponents = [];
    if (actions.length > 0) {
      const completed = actions.filter(a => a.status === 'completed').length;
      momentumComponents.push((completed / actions.length) * 10);
    }
    if (decisions.length > 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recent = decisions.filter(d => d.date && new Date(d.date) >= thirtyDaysAgo);
      momentumComponents.push(Math.min(10, recent.length * 2));
    }
    if (stageProgress.length > 0) {
      const allMilestones = stageProgress.flatMap(sp => sp.milestones || []);
      if (allMilestones.length > 0) {
        const completed = allMilestones.filter(m => m.completed).length;
        momentumComponents.push((completed / allMilestones.length) * 10);
      }
    }
    if (planPeriods.length > 0) {
      const activePlans = planPeriods.filter(p => p.status === 'active' || p.status === 'completed');
      if (activePlans.length > 0) {
        const completedPlans = activePlans.filter(p => p.status === 'completed').length;
        momentumComponents.push((completedPlans / activePlans.length) * 10);
      }
    }
    const momentumScore = momentumComponents.length > 0
      ? parseFloat((momentumComponents.reduce((s, v) => s + v, 0) / momentumComponents.length).toFixed(1))
      : 0;

    await base44.asServiceRole.entities.Organization.update(organizationId, {
      health_score: healthScore,
      momentum_score: momentumScore,
    });

    return Response.json({ healthScore, momentumScore });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}