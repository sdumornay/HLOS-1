// Validates that an organization has access to the stage required for a
// given assessment type. Used by submission backend functions to enforce
// stage gating at the backend level — not just the frontend.

import { ASSESSMENT_STAGE_MAP } from './stageDeliverables.ts';

export async function validateStageAccess(base44: any, organizationId: string, assessmentType: string) {
  const requiredStage = ASSESSMENT_STAGE_MAP[assessmentType];
  if (!requiredStage) {
    // Assessment types not in the map are not stage-gated
    return { allowed: true, requiredStage: null };
  }

  const stageIndex = ['stabilize', 'align', 'execute', 'sustain'].indexOf(requiredStage);

  // Check baseline for stage 1
  if (requiredStage === 'stabilize') {
    const scoreboards = await base44.asServiceRole.entities.LeadershipHealthScoreboard
      .filter({ organization_id: organizationId });
    if (scoreboards.length === 0) {
      return {
        allowed: false,
        requiredStage,
        reason: 'Complete the Leadership Health Scoreboard before accessing Stage 1 assessments.',
      };
    }
    return { allowed: true, requiredStage };
  }

  // For stages 2+, check that the previous stage is completed
  const prevStage = ['stabilize', 'align', 'execute', 'sustain'][stageIndex - 1];
  const progressRecords = await base44.asServiceRole.entities.OrganizationStageProgress
    .filter({ organization_id: organizationId, stage: prevStage });
  const prevProgress = progressRecords[0];

  if (!prevProgress || prevProgress.status !== 'completed') {
    return {
      allowed: false,
      requiredStage,
      reason: `Complete and get approval for the ${prevStage.charAt(0).toUpperCase() + prevStage.slice(1)} stage before accessing ${requiredStage.charAt(0).toUpperCase() + requiredStage.slice(1)} assessments.`,
    };
  }

  return { allowed: true, requiredStage };
}