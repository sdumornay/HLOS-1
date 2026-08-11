/**
 * Resolves the correct organization ID for a user, bypassing RLS via the service role.
 * Used by backend functions to ensure submissions are always saved with the correct org.
 *
 * Priority:
 * 1. Provided org_id (e.g. from URL param) — validated against the DB
 * 2. user.organization_id — validated against the DB
 * 3. First org where coach_email matches the user's email
 */
export async function resolveOrgId(base44, providedOrgId, user) {
  // 1. Validate provided org_id
  if (providedOrgId) {
    try {
      await base44.asServiceRole.entities.Organization.get(providedOrgId);
      return providedOrgId;
    } catch {
      // not found — continue
    }
  }

  // 2. Try user's own organization_id
  if (user.organization_id) {
    try {
      await base44.asServiceRole.entities.Organization.get(user.organization_id);
      return user.organization_id;
    } catch {
      // stale — continue
    }
  }

  // 3. Fall back to org where this user is the coach
  if (user.email) {
    const orgs = await base44.asServiceRole.entities.Organization.filter({ coach_email: user.email });
    if (orgs.length > 0) return orgs[0].id;
  }

  // 4. Super admins / admins with no direct org link fall back to the first org
  if (user.role === 'super_admin' || user.role === 'admin') {
    const allOrgs = await base44.asServiceRole.entities.Organization.list();
    if (allOrgs.length > 0) return allOrgs[0].id;
  }

  return null;
}