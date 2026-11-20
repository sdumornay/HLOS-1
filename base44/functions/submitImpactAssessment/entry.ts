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
    const { organization_id, ...answers } = body;

    const orgId = await resolveOrgId(base44, organization_id, user);
    if (!orgId) {
      return Response.json({ error: 'Could not determine your organization. Please contact your coach.' }, { status: 400 });
    }

    // Validate all 15 answers are present and in range 1-5
    const answerKeys = Array.from({ length: 15 }, (_, i) => `q${i + 1}`);
    for (const key of answerKeys) {
      const val = answers[key];
      if (val == null || val < 1 || val > 5) {
        return Response.json({ error: `Missing or invalid answer for ${key}` }, { status: 400 });
      }
    }

    // Compute dimension scores: average of questions in each dimension (1-5 scale)
    const avg = (keys) => {
      const sum = keys.reduce((s, k) => s + (answers[k] || 0), 0);
      return parseFloat((sum / keys.length).toFixed(2));
    };

    const organizational_health_score = avg(['q1', 'q2', 'q3']);
    const strategic_alignment_score = avg(['q4', 'q5', 'q6']);
    const leadership_effectiveness_score = avg(['q7', 'q8', 'q9']);
    const operational_execution_score = avg(['q10', 'q11', 'q12']);
    const mission_impact_score = avg(['q13', 'q14', 'q15']);
    const overall_score = parseFloat((answerKeys.reduce((s, k) => s + (answers[k] || 0), 0) / 15).toFixed(2));

    const record = await base44.asServiceRole.entities.ImpactAssessment.create({
      organization_id: orgId,
      respondent_email: user.email,
      respondent_name: user.full_name || user.data?.full_name || '',
      q1: answers.q1, q2: answers.q2, q3: answers.q3,
      q4: answers.q4, q5: answers.q5, q6: answers.q6,
      q7: answers.q7, q8: answers.q8, q9: answers.q9,
      q10: answers.q10, q11: answers.q11, q12: answers.q12,
      q13: answers.q13, q14: answers.q14, q15: answers.q15,
      organizational_health_score,
      strategic_alignment_score,
      leadership_effectiveness_score,
      operational_execution_score,
      mission_impact_score,
      overall_score,
    });

    return Response.json({
      success: true,
      record,
      scores: {
        organizational_health_score,
        strategic_alignment_score,
        leadership_effectiveness_score,
        operational_execution_score,
        mission_impact_score,
        overall_score,
      },
    });
  } catch (error) {
    console.error('submitImpactAssessment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}