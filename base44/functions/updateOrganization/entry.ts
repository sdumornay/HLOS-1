import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user?.data?.role || user?.role;
    const allowed = ['super_admin', 'admin', 'coach', 'lead_pastor'];
    if (!allowed.includes(role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, data } = await req.json();
    if (!id) {
      return Response.json({ error: 'Missing organization id' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Organization.update(id, data);
    return Response.json({ organization: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});