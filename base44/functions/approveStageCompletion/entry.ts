import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { STAGE_ORDER, STAGE_LABELS } from '../../shared/stageDeliverables.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user?.data?.role || user?.role;
    if (!['super_admin', 'coach'].includes(role)) {
      return Response.json({ error: 'Only administrators can approve stage completion' }, { status: 403 });
    }

    const { organizationId, stage } = await req.json();
    if (!organizationId || !stage) {
      return Response.json({ error: 'Missing organizationId or stage' }, { status: 400 });
    }

    const stageIndex = STAGE_ORDER.indexOf(stage);
    if (stageIndex === -1) return Response.json({ error: 'Invalid stage' }, { status: 400 });

    // Get the progress record for this stage
    const progressRecords = await base44.asServiceRole.entities.OrganizationStageProgress
      .filter({ organization_id: organizationId, stage });

    const progress = progressRecords[0];
    if (!progress) {
      return Response.json({ error: 'No stage progress record found' }, { status: 404 });
    }

    if (progress.status !== 'awaiting_approval') {
      return Response.json({
        error: `Stage is not awaiting approval (current status: ${progress.status}). All deliverables must be complete before approval.`
      }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Mark current stage as completed
    await base44.asServiceRole.entities.OrganizationStageProgress.update(progress.id, {
      status: 'completed',
      completion_date: today,
      approved_by: user.email,
      approval_date: today,
    });

    // Unlock the next stage
    const nextStage = STAGE_ORDER[stageIndex + 1];
    if (nextStage) {
      const nextRecords = await base44.asServiceRole.entities.OrganizationStageProgress
        .filter({ organization_id: organizationId, stage: nextStage });
      const nextProgress = nextRecords[0];
      if (nextProgress) {
        await base44.asServiceRole.entities.OrganizationStageProgress.update(nextProgress.id, {
          status: 'available',
          start_date: today,
        });
      } else {
        await base44.asServiceRole.entities.OrganizationStageProgress.create({
          organization_id: organizationId,
          stage: nextStage,
          stage_number: stageIndex + 2,
          status: 'available',
          start_date: today,
          required_deliverables: [],
          completed_deliverables: [],
        });
      }

      // Update the org's current_stage
      await base44.asServiceRole.entities.Organization.update(organizationId, {
        current_stage: nextStage,
      });
    }

    // Log the approval
    await base44.asServiceRole.entities.StageOverrideLog.create({
      organization_id: organizationId,
      admin_email: user.email,
      action: 'approve',
      stage,
      reason: 'Stage deliverables complete and approved',
      previous_status: 'awaiting_approval',
      new_status: 'completed',
    });

    return Response.json({
      success: true,
      stage,
      nextStage,
      message: nextStage
        ? `${STAGE_LABELS[stage]} approved. ${STAGE_LABELS[nextStage]} is now unlocked.`
        : `${STAGE_LABELS[stage]} approved. All stages complete!`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}