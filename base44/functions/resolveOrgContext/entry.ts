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

    // Look up the authoritative role from the User entity (service role bypasses
    // any stale session-token role) so the frontend always sees the current role.
    let role = user?.role;
    try {
      const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
      if (users && users.length > 0) role = users[0].role;
    } catch {
      // keep me() role as fallback
    }

    if (!orgId) {
      return Response.json({ error: 'No organization found for this user' }, { status: 404 });
    }

    // If the user's organization_id is stale or missing, correct it now so that
    // all client-side RLS-filtered queries (LeadershipHealthScoreboard, Assessment,
    // etc.) match the right org. RLS checks data.organization_id against
    // user.organization_id — a stale value silently returns empty results.
    if (user.organization_id !== orgId) {
      try {
        await base44.asServiceRole.entities.User.update(user.id, { organization_id: orgId });
      } catch {
        // best-effort — don't fail the request if the update can't go through
      }
    }

    return Response.json({ organization_id: orgId, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}