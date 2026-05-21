import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, role } = await req.json();

    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.User.update(userId, { role });
    return Response.json({ success: true, user: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});