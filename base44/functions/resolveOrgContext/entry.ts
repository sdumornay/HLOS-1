import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { resolveOrgId } from '../../shared/resolveOrg.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const providedOrgId = body?.organization_id;

    const orgId = await resolveOrgId(base44, providedOrgId, user);

    if (!orgId) {
      return Response.json({ error: 'No organization found for this user' }, { status: 404 });
    }

    return Response.json({ organization_id: orgId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}