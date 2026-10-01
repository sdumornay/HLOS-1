/**
 * Scoring and interpretation logic for the Organizational Health Snapshot.
 * Scores are on a 1-5 scale (not converted to 1-10).
 */

export const DIMENSIONS = [
  {
    key: 'mission_direction_score',
    label: 'Mission & Direction',
    shortLabel: 'Mission',
    questions: ['q1', 'q2', 'q3', 'q4'],
    description: 'Clarity of mission, priorities, and alignment between activities and purpose.',
  },
  {
    key: 'culture_trust_score',
    label: 'Culture & Trust',
    shortLabel: 'Culture',
    questions: ['q5', 'q6', 'q7', 'q8'],
    description: 'Psychological safety, directness, positive intent, and shared values.',
  },
  {
    key: 'role_clarity_score',
    label: 'Role & Decision Clarity',
    shortLabel: 'Roles',
    questions: ['q9', 'q10', 'q11'],
    description: 'Understanding of responsibilities, authority, and decision-making boundaries.',
  },
  {
    key: 'execution_accountability_score',
    label: 'Execution & Accountability',
    shortLabel: 'Execution',
    questions: ['q12', 'q13', 'q14'],
    description: 'Meeting effectiveness, ownership of commitments, and follow-through.',
  },
  {
    key: 'momentum_adaptability_score',
    label: 'Momentum & Adaptability',
    shortLabel: 'Momentum',
    questions: ['q15', 'q16', 'q17'],
    description: 'Progress on priorities, problem-solving patterns, and ability to adapt.',
  },
  {
    key: 'sustainability_capacity_score',
    label: 'Sustainability & Capacity',
    shortLabel: 'Sustainability',
    questions: ['q18', 'q19', 'q20'],
    description: 'Distribution of responsibility, leader capacity, and long-term sustainability.',
  },
];

export const INTERPRETATION_RANGES = [
  { min: 4.20, max: 5.00, label: 'Strong Foundation', tone: 'emerald' },
  { min: 3.40, max: 4.19, label: 'Generally Healthy, with Areas to Strengthen', tone: 'blue' },
  { min: 2.60, max: 3.39, label: 'Needs Attention', tone: 'amber' },
  { min: 1.80, max: 2.59, label: 'Significant Strain', tone: 'orange' },
  { min: 1.00, max: 1.79, label: 'Requires Focused Attention', tone: 'red' },
];

/**
 * Returns the interpretation label for a given 1-5 score.
 */
export function getInterpretation(score) {
  return INTERPRETATION_RANGES.find(r => score >= r.min && score <= r.max) || INTERPRETATION_RANGES[2];
}

/**
 * Returns the tone color class for a given score.
 */
export function getToneClass(tone) {
  const map = {
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: '#10b981' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bar: '#3b82f6' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: '#f59e0b' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: '#f97316' },
    red: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: '#ef4444' },
  };
  return map[tone] || map.amber;
}

/**
 * Returns the bar color for a dimension score on a 1-5 scale.
 */
export function getBarColor(score) {
  if (score >= 4.2) return '#10b981'; // emerald
  if (score >= 3.4) return '#3b82f6';  // blue
  if (score >= 2.6) return '#f59e0b';  // amber
  if (score >= 1.8) return '#f97316';  // orange
  return '#ef4444';                     // red
}

/**
 * Generates the "What Appears Strong" and "What Needs Attention" sections
 * based on the highest and lowest scoring dimensions.
 */
export function getStrengthsAndConcerns(scores) {
  const dims = DIMENSIONS.map(d => ({
    key: d.key,
    label: d.label,
    score: scores[d.key] ?? 0,
  })).sort((a, b) => b.score - a.score);

  const strongest = dims.slice(0, 2).filter(d => d.score >= 3.4);
  const weakest = [...dims].reverse().slice(0, 2).filter(d => d.score <= 3.39);

  return { strongest, weakest, allDims: dims };
}