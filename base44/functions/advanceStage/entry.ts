import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user?.data?.role || user?.role;
    if (!['super_admin', 'coach', 'lead_pastor'].includes(role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organizationId } = await req.json();
    if (!organizationId) return Response.json({ error: 'Missing organizationId' }, { status: 400 });

    const org = await base44.asServiceRole.entities.Organization.get(organizationId);
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 });

    const stage = org.current_stage || 'stabilize';
    if (stage === 'sustain') return Response.json({ stage, complete: false, reason: 'Sustain is the final stage' });

    const [tensionPulses, commAgreements, conflictIntakes, dysfunctions, workstyles, roleClarity, priorities, decisionRights, covenants, planPeriods, meetingAgendas, actions, stageProgress] = await Promise.all([
      base44.asServiceRole.entities.TensionPulse.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.CommAgreement.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.ConflictIntake.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.FiveDysfunctions.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.WorkstyleAssessment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.RoleClarity.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.PriorityAlignment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.DecisionRight.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.LeadershipCovenant.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.PlanningPeriod.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.MeetingAgenda.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.Action.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.StageProgress.filter({ organization_id: organizationId }),
    ]);

    let results = [];
    let nextStage = null;

    if (stage === 'stabilize') {
      const avgTension = tensionPulses.length > 0
        ? tensionPulses.reduce((s, p) => s + (p.team_tension || 0), 0) / tensionPulses.length
        : 10;
      results = [
        { label: 'At least 1 Tension Pulse submitted', met: tensionPulses.length > 0 },
        { label: 'At least 1 active Communication Agreement', met: commAgreements.some(a => a.status === 'active') },
        { label: 'No open (unresolved) conflicts', met: !conflictIntakes.some(c => c.status === 'open') },
        { label: 'Average team tension below 4', met: avgTension < 4 },
      ];
      nextStage = 'align';
    } else if (stage === 'align') {
      results = [
        { label: 'Team Health Diagnostic completed', met: dysfunctions.length > 0 },
        { label: 'Workstyle Assessment completed', met: workstyles.length > 0 },
        { label: 'At least 1 Role Clarity agreed', met: roleClarity.some(r => r.status === 'agreed') },
        { label: 'At least 1 Priority active', met: priorities.some(p => p.status === 'active') },
        { label: 'At least 1 Decision Right clear', met: decisionRights.some(d => d.clarity_status === 'clear') },
        { label: 'Leadership Covenant active', met: covenants.some(c => c.status === 'active') },
      ];
      nextStage = 'execute';
    } else if (stage === 'execute') {
      const completedActions = actions.filter(a => a.status === 'completed');
      results = [
        { label: 'At least 1 Planning Period created', met: planPeriods.length > 0 },
        { label: 'At least 1 Meeting Agenda created', met: meetingAgendas.length > 0 },
        { label: 'At least 5 actions completed', met: completedActions.length >= 5 },
        { label: 'Action completion rate above 60%', met: actions.length > 0 && (completedActions.length / actions.length) >= 0.6 },
      ];
      nextStage = 'sustain';
    }

    const complete = results.every(r => r.met);

    if (complete && nextStage) {
      await base44.asServiceRole.entities.Organization.update(organizationId, { current_stage: nextStage });

      const existingProgress = stageProgress.find(sp => sp.stage === stage);
      if (existingProgress) {
        await base44.asServiceRole.entities.StageProgress.update(existingProgress.id, {
          status: 'completed',
          completed_date: new Date().toISOString().split('T')[0],
        });
      } else {
        await base44.asServiceRole.entities.StageProgress.create({
          organization_id: organizationId,
          stage,
          status: 'completed',
          completed_date: new Date().toISOString().split('T')[0],
        });
      }

      const nextProgress = stageProgress.find(sp => sp.stage === nextStage);
      if (!nextProgress) {
        await base44.asServiceRole.entities.StageProgress.create({
          organization_id: organizationId,
          stage: nextStage,
          status: 'in_progress',
          started_date: new Date().toISOString().split('T')[0],
        });
      }
    }

    return Response.json({ stage, complete, results, nextStage, advanced: complete });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}