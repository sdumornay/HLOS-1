import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, city, role, leaderName } = await req.json();

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

    // Link the user to the new organization and set role via service role
    const updateData = {
      organization_id: org.id,
      role: role || 'lead_pastor',
      onboarded: true,
    };

    // Save leader name if provided and user doesn't already have one
    if (leaderName?.trim()) {
      updateData.full_name = leaderName.trim();
    }

    await base44.asServiceRole.entities.User.update(user.id, updateData);

    return Response.json({ success: true, org });
  } catch (error) {
    console.error('createOrganization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}