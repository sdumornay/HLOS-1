import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrgId } from '../../shared/resolveOrg.ts';
import { validateStageAccess } from '../../shared/validateStageAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organization_id, ...data } = body;

    const orgId = await resolveOrgId(base44, organization_id, user);
    if (!orgId) {
      return Response.json({ error: 'Could not determine your organization. Please contact your coach.' }, { status: 400 });
    }

    // Enforce stage gating: Workstyle Assessment is a Stage 2 (Align) assessment
    const access = await validateStageAccess(base44, orgId, 'workstyle');
    if (!access.allowed) {
      return Response.json({ error: access.reason }, { status: 403 });
    }

    const record = await base44.asServiceRole.entities.WorkstyleAssessment.create({
      ...data,
      organization_id: orgId,
    });

    return Response.json({ success: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}