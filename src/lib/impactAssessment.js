import { DIMENSIONS } from '@/lib/impactDimensions';

/** The 15 baseline questions, three per impact dimension (1-5 scale). */
export const IMPACT_QUESTIONS = [
  { key: 'q1', dim: 'organizational_health', text: 'People in our organization can raise problems without fear of fallout.' },
  { key: 'q2', dim: 'organizational_health', text: 'Difficult issues are handled directly rather than avoided.' },
  { key: 'q3', dim: 'organizational_health', text: 'Staff and volunteers remain steady under pressure.' },

  { key: 'q4', dim: 'strategic_alignment', text: 'Everyone can state why our organization exists and what matters most this season.' },
  { key: 'q5', dim: 'strategic_alignment', text: 'Our team agrees on the few priorities that matter most right now.' },
  { key: 'q6', dim: 'strategic_alignment', text: 'People know what they own and what success looks like in their role.' },

  { key: 'q7', dim: 'leadership_effectiveness', text: 'Responsibility is distributed beyond one or two key leaders.' },
  { key: 'q8', dim: 'leadership_effectiveness', text: 'Commitments are reviewed and followed up on consistently.' },
  { key: 'q9', dim: 'leadership_effectiveness', text: 'Leaders are being developed intentionally, not just managed.' },

  { key: 'q10', dim: 'operational_execution', text: 'Committed actions are usually completed by the agreed date.' },
  { key: 'q11', dim: 'operational_execution', text: 'Decisions are made in a timely way rather than deferred.' },
  { key: 'q12', dim: 'operational_execution', text: 'Meetings end with clear decisions, owners, and dates.' },

  { key: 'q13', dim: 'mission_impact', text: 'Our programs produce the outcomes they exist to produce.' },
  { key: 'q14', dim: 'mission_impact', text: 'The people we serve experience real change.' },
  { key: 'q15', dim: 'mission_impact', text: 'Our staffing, systems, and funding can carry the current load.' },
];

/** Dimension key → score field on the ImpactAssessment record. */
export const DIMENSION_SCORE_FIELD = DIMENSIONS.reduce((acc, d) => {
  acc[d.key] = `${d.key}_score`;
  return acc;
}, {});

export const IMPACT_DIMENSIONS = DIMENSIONS;

export { DIMENSIONS };

export function questionsForDimension(dimensionKey) {
  return IMPACT_QUESTIONS.filter((q) => q.dim === dimensionKey);
}

/** Build a scores object from a stored assessment record (for "view answers"). */
export function impactScoresFromRecord(record) {
  if (!record) return null;
  const scores = { overall_score: record.overall_score };
  DIMENSIONS.forEach((d) => {
    scores[DIMENSION_SCORE_FIELD[d.key]] = record[DIMENSION_SCORE_FIELD[d.key]];
  });
  return scores;
}

/** Severity band for a 1-5 score. */
export function scoreBand(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return { label: 'Not measured', tone: 'secondary' };
  }
  const n = Number(score);
  if (n >= 4.5) return { label: 'Strong', tone: 'default' };
  if (n >= 3.5) return { label: 'Stable', tone: 'default' };
  if (n >= 2.5) return { label: 'Needs attention', tone: 'outline' };
  return { label: 'Critical', tone: 'destructive' };
}