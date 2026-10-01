// Organizational Health Snapshot — 20 questions across 6 dimensions, 1-5 scale.
// Higher = healthier. Used for the first assessment in the HLOS diagnostic journey.

export const DIMENSIONS = [
  { key: 'mission_direction',         label: 'Mission & Direction',         shortLabel: 'Mission',    questions: ['q1','q2','q3','q4'] },
  { key: 'culture_trust',             label: 'Culture & Trust',              shortLabel: 'Culture',    questions: ['q5','q6','q7','q8'] },
  { key: 'role_decision_clarity',     label: 'Role & Decision Clarity',     shortLabel: 'Role Clarity', questions: ['q9','q10','q11'] },
  { key: 'execution_accountability',  label: 'Execution & Accountability',  shortLabel: 'Execution',  questions: ['q12','q13','q14'] },
  { key: 'momentum_adaptability',      label: 'Momentum & Adaptability',     shortLabel: 'Momentum',   questions: ['q15','q16','q17'] },
  { key: 'sustainability_capacity',    label: 'Sustainability & Capacity',    shortLabel: 'Sustainability', questions: ['q18','q19','q20'] },
];

export const QUESTIONS = [
  // Mission & Direction
  { key: 'q1',  dimension: 'mission_direction', text: 'Our organization has a clear understanding of its mission and why it exists.' },
  { key: 'q2',  dimension: 'mission_direction', text: 'Our current priorities are clear to the people responsible for carrying them out.' },
  { key: 'q3',  dimension: 'mission_direction', text: 'We are able to distinguish what is most important from what is merely urgent.' },
  { key: 'q4',  dimension: 'mission_direction', text: 'Our activities and programs generally support our stated mission and priorities.' },
  // Culture & Trust
  { key: 'q5',  dimension: 'culture_trust', text: 'People in our organization generally feel safe raising concerns or offering a different perspective.' },
  { key: 'q6',  dimension: 'culture_trust', text: 'Difficult issues are more likely to be addressed directly than discussed through side conversations.' },
  { key: 'q7',  dimension: 'culture_trust', text: 'People generally assume positive intent when disagreements occur.' },
  { key: 'q8',  dimension: 'culture_trust', text: 'The culture encourages honesty, respect, and responsibility.' },
  // Role & Decision Clarity
  { key: 'q9',  dimension: 'role_decision_clarity', text: 'People generally understand their responsibilities and what is expected of them.' },
  { key: 'q10', dimension: 'role_decision_clarity', text: 'It is clear who has authority to make important decisions.' },
  { key: 'q11', dimension: 'role_decision_clarity', text: 'Leaders know when they can make a decision independently and when others need to be involved.' },
  // Execution & Accountability
  { key: 'q12', dimension: 'execution_accountability', text: 'Meetings generally result in clear decisions and next steps.' },
  { key: 'q13', dimension: 'execution_accountability', text: 'Important commitments have a clear owner and deadline.' },
  { key: 'q14', dimension: 'execution_accountability', text: 'People are appropriately held accountable for following through on their commitments.' },
  // Momentum & Adaptability
  { key: 'q15', dimension: 'momentum_adaptability', text: 'Our most important priorities are making measurable progress.' },
  { key: 'q16', dimension: 'momentum_adaptability', text: 'We address recurring problems rather than repeatedly working around them.' },
  { key: 'q17', dimension: 'momentum_adaptability', text: 'Our organization is able to adjust when circumstances change without losing sight of our mission.' },
  // Sustainability & Capacity
  { key: 'q18', dimension: 'sustainability_capacity', text: 'Responsibilities are distributed in a way that does not depend excessively on one or two people.' },
  { key: 'q19', dimension: 'sustainability_capacity', text: 'Our leaders and key team members have sufficient capacity to fulfill their responsibilities effectively.' },
  { key: 'q20', dimension: 'sustainability_capacity', text: 'Our current pace and way of operating feel sustainable over time.' },
];

export const RESPONSE_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Mixed / Unsure' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

// ── Scoring ──────────────────────────────────────────────────────────────

export function computeDimensionScores(answers) {
  const scores = {};
  for (const dim of DIMENSIONS) {
    const vals = dim.questions.map(q => answers[q]).filter(v => v != null);
    scores[dim.key] = vals.length > 0
      ? vals.reduce((s, v) => s + v, 0) / vals.length
      : 0;
  }
  return scores;
}

export function computeOverallScore(answers) {
  const vals = Object.values(answers).filter(v => v != null);
  return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}

export function computeSnapshotScores(answers) {
  const dimensionScores = computeDimensionScores(answers);
  const overall = computeOverallScore(answers);
  return { dimensionScores, overall };
}

// ── Interpretation ───────────────────────────────────────────────────────

export function getInterpretation(score) {
  if (score >= 4.2) return { label: 'Strong Foundation',                         tone: 'emerald', badge: 'bg-emerald-100 text-emerald-700' };
  if (score >= 3.4) return { label: 'Generally Healthy, with Areas to Strengthen', tone: 'blue',    badge: 'bg-blue-100 text-blue-700' };
  if (score >= 2.6) return { label: 'Needs Attention',                           tone: 'amber',  badge: 'bg-amber-100 text-amber-700' };
  if (score >= 1.8) return { label: 'Significant Strain',                        tone: 'orange', badge: 'bg-orange-100 text-orange-700' };
  return { label: 'Requires Focused Attention',                                   tone: 'red',     badge: 'bg-red-100 text-red-700' };
}

// ── Results sections ──────────────────────────────────────────────────────

export function getStrongAreas(dimensionScores) {
  const sorted = DIMENSIONS
    .map(d => ({ ...d, score: dimensionScores[d.key] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  // Return top 1-2 (only if score >= 3.4)
  const strong = sorted.filter(d => d.score >= 3.4).slice(0, 2);
  return strong.length > 0 ? strong : sorted.slice(0, 1);
}

export function getAttentionAreas(dimensionScores) {
  const sorted = DIMENSIONS
    .map(d => ({ ...d, score: dimensionScores[d.key] ?? 0 }))
    .sort((a, b) => a.score - b.score);
  // Return bottom 1-2 (only if score < 3.4)
  const attention = sorted.filter(d => d.score < 3.4).slice(0, 2);
  return attention.length > 0 ? attention : sorted.slice(0, 1);
}

export const WHAT_THIS_MEANS_MESSAGE =
  'This snapshot reflects your current perspective on the organization. It is a starting point, not a final diagnosis. Other leaders may see the organization differently. As additional members of your leadership team participate in HLOS, those perspectives will help create a fuller picture of organizational health.';