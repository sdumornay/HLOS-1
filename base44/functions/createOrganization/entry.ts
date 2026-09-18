import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, city, state, role, leaderName, leaderEmail, orgType, teamMembers } = await req.json();

    if (!name?.trim()) {
      return Response.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Create the organization
    const org = await base44.asServiceRole.entities.Organization.create({
      name: name.trim(),
      type: orgType || 'church',
      city: (city || '').trim(),
      state: (state || '').trim(),
      lead_pastor_name: (leaderName || '').trim(),
      lead_pastor_email: (leaderEmail || '').trim() || user.email,
      current_stage: 'stabilize',
      health_score: 0,
      momentum_score: 0,
      baseline_completed: false,
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

    // Invite team members if provided
    if (teamMembers && Array.isArray(teamMembers)) {
      const validInvites = teamMembers.filter(m => m.email?.trim());
      await Promise.allSettled(
        validInvites.map(m => base44.users.inviteUser(m.email.trim(), 'team_member'))
      );
    }

    return Response.json({ success: true, org });
  } catch (error) {
    console.error('createOrganization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}