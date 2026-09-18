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
    const { organization_id, biggest_challenge, timeline, ...answers } = body;

    const orgId = await resolveOrgId(base44, organization_id, user);
    if (!orgId) {
      return Response.json({ error: 'Could not determine your organization. Please contact your coach.' }, { status: 400 });
    }

    // Validate all 16 answers are present and in range 1-5
    const answerKeys = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15','q16'];
    for (const key of answerKeys) {
      const val = answers[key];
      if (val == null || val < 1 || val > 5) {
        return Response.json({ error: `Missing or invalid answer for ${key}` }, { status: 400 });
      }
    }

    // Compute stage scores: average of 4 questions × 2 → 2.0-10.0 scale
    const avg = (keys) => {
      const sum = keys.reduce((s, k) => s + (answers[k] || 0), 0);
      return parseFloat((sum / keys.length * 2).toFixed(1));
    };

    const stabilize_score = avg(['q1','q2','q3','q4']);
    const align_score = avg(['q5','q6','q7','q8']);
    const execute_score = avg(['q9','q10','q11','q12']);
    const sustain_score = avg(['q13','q14','q15','q16']);
    const overall_score = parseFloat((answerKeys.reduce((s, k) => s + (answers[k] || 0), 0) / 16 * 2).toFixed(1));

    // Create the scoreboard record
    const record = await base44.asServiceRole.entities.LeadershipHealthScoreboard.create({
      organization_id: orgId,
      respondent_email: user.email,
      respondent_name: user.full_name || user.data?.full_name || '',
      q1: answers.q1, q2: answers.q2, q3: answers.q3, q4: answers.q4,
      q5: answers.q5, q6: answers.q6, q7: answers.q7, q8: answers.q8,
      q9: answers.q9, q10: answers.q10, q11: answers.q11, q12: answers.q12,
      q13: answers.q13, q14: answers.q14, q15: answers.q15, q16: answers.q16,
      stabilize_score, align_score, execute_score, sustain_score, overall_score,
      biggest_challenge: biggest_challenge || '',
      timeline: timeline || '',
      is_baseline: true,
    });

    // Mark the org's baseline as completed
    await base44.asServiceRole.entities.Organization.update(orgId, {
      baseline_completed: true,
      health_score: overall_score,
    });

    return Response.json({
      success: true,
      record,
      scores: { stabilize_score, align_score, execute_score, sustain_score, overall_score },
    });
  } catch (error) {
    console.error('submitScoreboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}