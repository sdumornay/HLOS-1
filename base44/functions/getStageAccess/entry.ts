import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
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

    // Read organizationId from query params (GET) or body (POST via SDK)
    const url = new URL(req.url);
    let organizationId = url.searchParams.get('organizationId');
    if (!organizationId) {
      try {
        const body = await req.json();
        organizationId = body?.organizationId;
      } catch { /* no body */ }
    }
    if (!organizationId) {
      organizationId = user?.data?.organization_id;
    }
    if (!organizationId) {
      return Response.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const org = await base44.asServiceRole.entities.Organization.get(organizationId);
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 });

    // Fetch all data needed for deliverable checks across all stages
    const [
      tensionPulses,
      fiveDysfunctions,
      commAgreements,
      conflictIntakes,
      workstyles,
      roleClarity,
      priorities,
      decisionRights,
      covenants,
      planPeriods,
      meetingAgendas,
      actions,
      healthPulses,
      quarterlyReviews,
      renewalReflections,
      scoreboards,
      existingProgress,
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
    const currentStage = org.current_stage || 'stabilize';

    // Build or migrate OrganizationStageProgress records
    const progressMap = new Map(existingProgress.map((p) => [p.stage, p]));

    // If no progress records exist, migrate from current_stage (legacy)
    const isLegacy = existingProgress.length === 0;
    if (isLegacy) {
      const currentStageIndex = STAGE_ORDER.indexOf(currentStage);
      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const stage = STAGE_ORDER[i];
        const stageNum = i + 1;
        let status = 'locked';
        if (i < currentStageIndex) {
          status = 'completed';
        } else if (i === currentStageIndex) {
          // If baseline not done and this is stage 1, keep locked
          if (stage === 'stabilize' && !baselineCompleted) {
            status = 'locked';
          } else {
            status = 'in_progress';
          }
        }
        const record = await base44.asServiceRole.entities.OrganizationStageProgress.create({
          organization_id: organizationId,
          stage,
          stage_number: stageNum,
          status,
          migrated_from_legacy: true,
          start_date: status !== 'locked' ? new Date().toISOString().split('T')[0] : undefined,
          completion_date: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
          required_deliverables: (STAGE_DELIVERABLES[stage] || []).map((d) => d.key),
          completed_deliverables: [],
          notes: status === 'completed' ? 'Auto-migrated from existing stage progress' : undefined,
        });
        progressMap.set(stage, record);
      }
    }

    // Evaluate deliverables and compute status for each stage
    const stages = STAGE_ORDER.map((stage, i) => {
      const stageNum = i + 1;
      const progress = progressMap.get(stage);
      const evalResult = evaluateDeliverables(stage, data);

      // Determine effective status
      let status = progress?.status || 'locked';

      // If already completed or awaiting_approval, keep it (admin-gated)
      if (status !== 'completed' && status !== 'awaiting_approval') {
        // Check if previous stage is completed (or this is stage 1 with baseline)
        const prevStage = i > 0 ? STAGE_ORDER[i - 1] : null;
        const prevProgress = prevStage ? progressMap.get(prevStage) : null;
        const prevCompleted = !prevStage || prevProgress?.status === 'completed';

        if (stage === 'stabilize') {
          if (!baselineCompleted) {
            status = 'locked';
          } else if (evalResult.allMet) {
            status = 'awaiting_approval';
          } else if (evalResult.percentage > 0 || status === 'in_progress') {
            status = 'in_progress';
          } else {
            status = 'available';
          }
        } else {
          if (!prevCompleted) {
            status = 'locked';
          } else if (evalResult.allMet) {
            status = 'awaiting_approval';
          } else if (evalResult.percentage > 0 || status === 'in_progress') {
            status = 'in_progress';
          } else {
            status = 'available';
          }
        }
      }

      // Update progress record if status changed and not legacy-completed
      if (progress && progress.status !== status && progress.status !== 'completed' && progress.status !== 'awaiting_approval') {
        const updates: any = {
          status,
          completion_percentage: evalResult.percentage,
          completed_deliverables: evalResult.completed,
        };
        if (status === 'in_progress' && !progress.start_date) {
          updates.start_date = new Date().toISOString().split('T')[0];
        }
        base44.asServiceRole.entities.OrganizationStageProgress.update(progress.id, updates).catch(() => {});
      }

      return {
        stage,
        stage_number: stageNum,
        label: STAGE_LABELS[stage],
        status,
        completion_percentage: evalResult.percentage,
        start_date: progress?.start_date,
        completion_date: progress?.completion_date,
        approved_by: progress?.approved_by,
        approval_date: progress?.approval_date,
        deliverables: evalResult.results,
        migrated_from_legacy: progress?.migrated_from_legacy || false,
      };
    });

    // Determine the user's next required activity
    const accessibleStages = stages.filter((s) => s.status !== 'locked');
    const activeStage = stages.find((s) => s.status === 'in_progress' || s.status === 'available' || s.status === 'awaiting_approval');
    const nextStage = activeStage?.stage || currentStage;

    // Check if user can access a specific stage
    const canAccess = (stage) => {
      const s = stages.find((s) => s.stage === stage);
      if (!s) return false;
      return s.status !== 'locked';
    };

    return Response.json({
      organization_id: organizationId,
      baseline_completed: baselineCompleted,
      current_stage: currentStage,
      next_stage: nextStage,
      stages,
      canAccess,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}