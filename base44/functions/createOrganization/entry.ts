import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, city } = await req.json();

    if (!name?.trim()) {
      return Response.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Create the organization
    const org = await base44.asServiceRole.entities.Organization.create({
      name: name.trim(),
      city: (city || '').trim(),
      current_stage: 'stabilize',
      health_score: 0,
      momentum_score: 0,
    });

    // Link the user to the new organization
    await base44.auth.updateMe({
      organization_id: org.id,
      role: 'lead_pastor',
      onboarded: true,
    });

    return Response.json({ success: true, org });
  } catch (error) {
    console.error('createOrganization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});