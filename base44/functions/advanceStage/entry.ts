import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_DELIVERABLES,
  evaluateDeliverables,
} from '../../shared/stageDeliverables.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user?.data?.role || user?.role;
    if (!['super_admin', 'coach', 'lead_pastor', 'admin'].includes(role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organizationId } = await req.json();
    if (!organizationId) return Response.json({ error: 'Missing organizationId' }, { status: 400 });

    const org = await base44.asServiceRole.entities.Organization.get(organizationId);
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 });

    const stage = org.current_stage || 'stabilize';
    if (stage === 'sustain') return Response.json({ stage, complete: false, reason: 'Sustain is the final stage' });

    // Fetch all data needed for deliverable checks
    const [
      tensionPulses, fiveDysfunctions, commAgreements, conflictIntakes,
      workstyles, roleClarity, priorities, decisionRights, covenants,
      planPeriods, meetingAgendas, actions, healthPulses,
      quarterlyReviews, renewalReflections, scoreboards, existingProgress,
    ] = await Promise.all([
      base44.asServiceRole.entities.TensionPulse.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.FiveDysfunctions.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.CommAgreement.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.ConflictIntake.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.WorkstyleAssessment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.RoleClarity.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.PriorityAlignment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.DecisionRight.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.LeadershipCovenant.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.PlanningPeriod.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.MeetingAgenda.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.Action.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.HealthPulse.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.QuarterlyReview.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.RenewalReflection.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.LeadershipHealthScoreboard.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.OrganizationStageProgress.filter({ organization_id: organizationId }),
    ]);

    const data = {
      tensionPulses, fiveDysfunctions, commAgreements, conflictIntakes,
      workstyles, roleClarity, priorities, decisionRights, covenants,
      planPeriods, meetingAgendas, actions, healthPulses,
      quarterlyReviews, renewalReflections,
    };

    const baselineCompleted = scoreboards.length > 0 || org.baseline_completed === true;
    if (stage === 'stabilize' && !baselineCompleted) {
      return Response.json({
        stage, complete: false,
        reason: 'Complete the Leadership Health Scoreboard baseline first.',
        results: [],
      });
    }

    const evalResult = evaluateDeliverables(stage, data);
    const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1] || null;

    if (evalResult.allMet) {
      // All deliverables met — mark as awaiting approval (do NOT auto-advance)
      const progress = existingProgress.find((p) => p.stage === stage);
      if (progress && progress.status !== 'completed' && progress.status !== 'awaiting_approval') {
        await base44.asServiceRole.entities.OrganizationStageProgress.update(progress.id, {
          status: 'awaiting_approval',
          completion_percentage: 100,
          completed_deliverables: evalResult.completed,
        });
      }

      return Response.json({
        stage,
        complete: true,
        results: evalResult.results,
        nextStage,
        advanced: false,
        awaitingApproval: true,
        message: `All ${STAGE_LABELS[stage]} deliverables complete. Stage is awaiting administrator approval.`,
      });
    }

    return Response.json({
      stage,
      complete: false,
      results: evalResult.results,
      nextStage,
      advanced: false,
      awaitingApproval: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}