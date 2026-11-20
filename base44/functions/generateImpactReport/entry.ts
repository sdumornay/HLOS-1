import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ALLOWED_ROLES = ['super_admin', 'admin', 'coach', 'lead_pastor'];
const REPORT_TYPES = ['baseline', 'midpoint', 'final', 'sustainability_90day'];
const TITLES = {
  baseline: 'Organizational Impact Baseline Report',
  midpoint: 'Midpoint Organizational Progress Report',
  final: 'Final Organizational Impact Report',
  sustainability_90day: '90-Day Sustainability Report',
};

const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    executive_summary: { type: 'string' },
    health_changes: { type: 'string' },
    learning_alignment: { type: 'string' },
    behavior_evidence: { type: 'string' },
    results_progress: { type: 'string' },
    capacity_gaps: { type: 'string' },
    recommendations: { type: 'string' },
    follow_up_90_day: { type: 'string' },
    evidence_gaps: { type: 'string' },
  },
  required: [
    'executive_summary',
    'health_changes',
    'learning_alignment',
    'behavior_evidence',
    'results_progress',
    'capacity_gaps',
    'recommendations',
    'follow_up_90_day',
    'evidence_gaps',
  ],
};

function averageByKey(responses) {
  const buckets = {};
  responses.forEach((r) => {
    Object.entries(r.responses || {}).forEach(([key, raw]) => {
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= 0) return;
      if (!buckets[key]) buckets[key] = { sum: 0, count: 0 };
      buckets[key].sum += value;
      buckets[key].count += 1;
    });
  });
  return Object.entries(buckets).map(([key, b]) => ({
    question: key,
    average: Number((b.sum / b.count).toFixed(2)),
    responses: b.count,
  }));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId;
    if (!organizationId) return Response.json({ error: 'organizationId is required' }, { status: 400 });
    const type = REPORT_TYPES.includes(body.type) ? body.type : 'midpoint';

    const role = user.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await base44.asServiceRole.entities.Organization.get(organizationId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 });

    const userOrg = user.organization_id || user.data?.organization_id;
    const entitled =
      role === 'super_admin' ||
      role === 'admin' ||
      (role === 'coach' && (org.coach_email === user.email || userOrg === organizationId || !org.coach_email)) ||
      (role === 'lead_pastor' && userOrg === organizationId);
    if (!entitled) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [agRes, indicatorsRes, measRes, behaviorsRes, respRes, snapRes, boardRes] = await Promise.all([
      base44.asServiceRole.entities.ImpactAgreement.filter({ organization_id: organizationId }, { sort: '-created_date', limit: 1 }),
      base44.asServiceRole.entities.ImpactIndicator.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.ImpactMeasurement.filter({ organization_id: organizationId }, { sort: '-measured_date', limit: 200 }),
      base44.asServiceRole.entities.BehaviorCommitment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.EvaluationResponse.filter({ organization_id: organizationId }, { limit: 200 }),
      base44.asServiceRole.entities.OrgHealthSnapshot.filter({ organization_id: organizationId }, { sort: '-created_date', limit: 2 }),
      base44.asServiceRole.entities.LeadershipHealthScoreboard.filter({ organization_id: organizationId }, { sort: '-created_date', limit: 2 }),
    ]);

    const pageItems = (res) => (Array.isArray(res) ? res : res?.items || []);
    const agreements = pageItems(agRes);
    const indicators = pageItems(indicatorsRes);
    const measurements = pageItems(measRes);
    const behaviors = pageItems(behaviorsRes);
    const responses = pageItems(respRes);
    const snapshots = pageItems(snapRes);
    const scoreboards = pageItems(boardRes);
    const agreement = agreements[0] || null;

    const indicatorEvidence = indicators.map((i) => ({
      name: i.name,
      dimension: i.dimension,
      unit: i.unit,
      improvement_direction: i.improvement_direction,
      baseline: i.baseline_value ?? null,
      baseline_date: i.baseline_date || null,
      baseline_source: i.baseline_source || null,
      current: i.actual_value ?? null,
      current_date: i.actual_date || null,
      current_source: i.actual_source || null,
      target: i.target_value ?? null,
      target_date: i.target_date || null,
    }));

    const measurementHistory = measurements.map((m) => ({
      indicator_id: m.indicator_id,
      phase: m.phase,
      value: m.value,
      date: m.measured_date || null,
      source: m.source || null,
    }));

    const behaviorEvidence = behaviors.map((b) => ({
      commitment: b.description,
      owner: b.owner_name || null,
      expected_frequency: b.expected_frequency || null,
      status: b.status,
      evidence: b.evidence || null,
      reviewed: b.date_reviewed || null,
      barriers: b.barriers || null,
      corrective_actions: b.corrective_actions || null,
    }));

    const levelAggregates = [1, 2, 3, 4].map((level) => {
      const forLevel = responses.filter((r) => Number(r.level) === level);
      return {
        level,
        response_count: forLevel.length,
        averages: averageByKey(forLevel),
        latest_date: forLevel
          .map((r) => r.submitted_date)
          .filter(Boolean)
          .sort()
          .slice(-1)[0] || null,
      };
    });

    const missing = [];
    indicators.forEach((i) => {
      if (i.baseline_value === null || i.baseline_value === undefined) {
        missing.push(`${i.name}: no baseline measurement recorded`);
      }
      if (i.actual_value === null || i.actual_value === undefined) {
        missing.push(`${i.name}: no follow-up measurement recorded`);
      }
    });
    levelAggregates.forEach((l) => {
      if (l.response_count === 0) missing.push(`Level ${l.level} evaluation: no responses recorded`);
    });
    if (behaviors.length === 0) missing.push('No leadership behavior commitments recorded');
    if (!agreement) missing.push('No Organizational Impact Agreement on record');

    const evidence = {
      organization: { name: org.name, stage: org.current_stage || null },
      report_type: type,
      agreement: agreement
        ? {
            status: agreement.status,
            engagement_start: agreement.engagement_start || null,
            engagement_end: agreement.engagement_end || null,
            priority_results: agreement.priority_results || [],
            critical_behaviors: agreement.critical_behaviors || [],
            leading_indicators: agreement.leading_indicators || [],
            barriers: agreement.barriers || null,
          }
        : null,
      indicators: indicatorEvidence,
      measurement_history: measurementHistory,
      behaviors: behaviorEvidence,
      evaluation_aggregates: levelAggregates,
      organizational_health_snapshots: snapshots.map((s) => ({
        date: (s.created_date || '').slice(0, 10),
        overall_score: s.overall_score ?? null,
        mission_direction: s.mission_direction_score ?? null,
        culture_trust: s.culture_trust_score ?? null,
        role_clarity: s.role_clarity_score ?? null,
        execution_accountability: s.execution_accountability_score ?? null,
        momentum_adaptability: s.momentum_adaptability_score ?? null,
        sustainability_capacity: s.sustainability_capacity_score ?? null,
      })),
      leadership_scoreboards: scoreboards.map((s) => ({
        date: (s.created_date || '').slice(0, 10),
        overall_score: s.overall_score ?? s.average_score ?? null,
      })),
      missing_evidence: missing,
    };

    const prompt = `You are writing the narrative sections of an organizational impact report for a church or nonprofit, for Dumornay Coaching. The evaluation framework follows Kirkpatrick's four levels: reaction, learning, behavior, results.

Write ONLY from the evidence provided in the JSON below. Rules you must follow exactly:
1. Never invent numbers, interviews, observations, survey responses or outcomes. If a value is null or an evidence list is empty, write "Not Yet Measured" or "Insufficient Evidence" for that point.
2. Separate what was observed (records, measurements) from what participants perceived (survey averages). Say which is which.
3. Do not claim that coaching caused an improvement. Describe change between baseline and latest measurement and name other plausible influences as possibilities, not conclusions.
4. Cite the specific record you rely on by name (for example an indicator name, a behavior commitment, or an evaluation level and response count).
5. Be concise and concrete. No filler, no praise, no motivational language. Plain professional prose a senior leader would respect.
6. For the executive_summary, at most 150 words and lead with what the evidence shows.
7. For follow_up_90_day, give a practical 90-day plan naming who checks what and how often, based on the gaps in the evidence.
8. For evidence_gaps, list exactly what is missing or too thin to judge, using the missing_evidence array.

Report type: ${TITLES[type]}.

EVIDENCE JSON:
${JSON.stringify(evidence, null, 2)}`;

    const narrative = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: NARRATIVE_SCHEMA,
    });

    const today = new Date().toISOString().slice(0, 10);
    const earliest = [
      agreement?.engagement_start,
      ...indicators.map((i) => i.baseline_date),
      ...measurements.map((m) => m.measured_date),
    ]
      .filter(Boolean)
      .sort()[0];

    const report = await base44.asServiceRole.entities.ImpactReport.create({
      organization_id: organizationId,
      type,
      title: TITLES[type],
      status: 'draft',
      period_start: earliest || today,
      period_end: today,
      generated_date: today,
      ai_generated: true,
      narrative: typeof narrative === 'string' ? { executive_summary: narrative } : narrative,
      data_snapshot: {
        indicator_count: indicators.length,
        measured_indicator_count: indicators.filter(
          (i) => i.actual_value !== null && i.actual_value !== undefined
        ).length,
        behavior_count: behaviors.length,
        behavior_status: behaviors.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {}),
        evaluation_responses: levelAggregates.reduce((acc, l) => acc + l.response_count, 0),
        missing_evidence: missing,
      },
    });

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}