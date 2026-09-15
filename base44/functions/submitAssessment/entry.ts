import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { resolveOrgId } from '../../shared/resolveOrg.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organization_id, ...scores } = body;

    const orgId = await resolveOrgId(base44, organization_id, user);
    if (!orgId) {
      return Response.json({ error: 'Could not determine your organization. Please contact your coach.' }, { status: 400 });
    }

    // Create the Assessment record
    const record = await base44.asServiceRole.entities.Assessment.create({
      ...scores,
      organization_id: orgId,
      respondent_email: user.email,
    });

    // Also create a TensionPulse record (mapped fields) so existing
    // scoring, interpretation, and stage-progress flows continue to work
    // from the consolidated Quick Health Check.
    const trust = scores.trust ?? 5;
    const safety = scores.safety ?? 5;
    const conflict = scores.conflict_intensity ?? 5;
    const accountability = scores.accountability ?? 5;
    const overall = scores.overall_health ?? 5;

    try {
      await base44.asServiceRole.entities.TensionPulse.create({
        organization_id: orgId,
        respondent_email: user.email,
        trust_level: trust,
        communication_safety: safety,
        unresolved_conflicts: conflict,
        team_tension: conflict,
        leadership_confidence: Math.round((trust + accountability) / 2),
        team_morale: Math.round(overall),
        biggest_tension: scores.biggest_tension || '',
        one_change: scores.one_change || '',
      });
    } catch (e) {
      // TensionPulse creation is best-effort — don't fail the whole submission
      console.error('TensionPulse mirror failed:', e?.message || e);
    }

    return Response.json({ success: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}