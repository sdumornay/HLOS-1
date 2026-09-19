import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { STAGE_ORDER, STAGE_LABELS } from '../../shared/stageDeliverables.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user?.data?.role || user?.role;
    if (!['super_admin', 'coach'].includes(role)) {
      return Response.json({ error: 'Only administrators can override stage progress' }, { status: 403 });
    }

    const { organizationId, stage, action, reason, notes } = await req.json();
    if (!organizationId || !stage || !action || !reason) {
      return Response.json({ error: 'Missing required fields: organizationId, stage, action, reason' }, { status: 400 });
    }

    if (!reason.trim() || reason.trim().length < 5) {
      return Response.json({ error: 'A meaningful reason is required (at least 5 characters)' }, { status: 400 });
    }

    const stageIndex = STAGE_ORDER.indexOf(stage);
    if (stageIndex === -1) return Response.json({ error: 'Invalid stage' }, { status: 400 });

    // Get the progress record
    const progressRecords = await base44.asServiceRole.entities.OrganizationStageProgress
      .filter({ organization_id: organizationId, stage });
    let progress = progressRecords[0];

    const previousStatus = progress?.status || 'locked';
    let newStatus = previousStatus;
    const today = new Date().toISOString().split('T')[0];

    switch (action) {
      case 'unlock':
        newStatus = 'available';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
      case 'relock':
        newStatus = 'locked';
        break;
      case 'reset':
        newStatus = 'in_progress';
        break;
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (progress) {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completion_date = today;
        updates.approved_by = user.email;
        updates.approval_date = today;
      }
      if ((newStatus === 'available' || newStatus === 'in_progress') && !progress.start_date) {
        updates.start_date = today;
      }
      await base44.asServiceRole.entities.OrganizationStageProgress.update(progress.id, updates);
    } else {
      progress = await base44.asServiceRole.entities.OrganizationStageProgress.create({
        organization_id: organizationId,
        stage,
        stage_number: stageIndex + 1,
        status: newStatus,
        start_date: newStatus !== 'locked' ? today : undefined,
        completion_date: newStatus === 'completed' ? today : undefined,
        approved_by: newStatus === 'completed' ? user.email : undefined,
        approval_date: newStatus === 'completed' ? today : undefined,
        required_deliverables: [],
        completed_deliverables: [],
        notes,
      });
    }

    // If completing a stage, unlock the next one
    if (action === 'complete') {
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
        await base44.asServiceRole.entities.Organization.update(organizationId, {
          current_stage: nextStage,
        });
      }
    }

    // Log the override
    await base44.asServiceRole.entities.StageOverrideLog.create({
      organization_id: organizationId,
      admin_email: user.email,
      action,
      stage,
      reason,
      previous_status: previousStatus,
      new_status: newStatus,
      notes,
    });

    return Response.json({
      success: true,
      stage,
      action,
      previousStatus,
      newStatus,
      message: `${STAGE_LABELS[stage]} ${action} successful. ${reason}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}