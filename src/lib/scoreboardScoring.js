// Leadership Health Scoreboard scoring + interpretation logic.
// Uses the existing Assessment entity (trust, safety, clarity, accountability,
// meeting_effectiveness, conflict_intensity) as the primary health measurement.

export const SCOREBOARD_DIMENSIONS = [
  { key: 'trust', label: 'Trust', invert: false, description: 'How much do team members trust each other?' },
  { key: 'safety', label: 'Psychological Safety', invert: false, description: 'Do people feel safe to speak honestly?' },
  { key: 'clarity', label: 'Clarity', invert: false, description: 'Is the vision and direction clear?' },
  { key: 'accountability', label: 'Accountability', invert: false, description: 'Are people following through on commitments?' },
  { key: 'meeting_effectiveness', label: 'Meeting Effectiveness', invert: false, description: 'Are meetings productive and well-run?' },
  { key: 'conflict_intensity', label: 'Low Conflict', invert: true, description: 'How well is conflict managed? (higher = healthier)' },
];

// Normalize a raw dimension value to 0-10 (higher = always healthier)
export function normalizeScore(key, value) {
  const dim = SCOREBOARD_DIMENSIONS.find(d => d.key === key);
  if (!dim || value == null) return null;
  return dim.invert ? 10 - value : value;
}

// Compute the overall health score for a single assessment (properly inverting conflict)
export function computeAssessmentScore(assessment) {
  const scores = SCOREBOARD_DIMENSIONS.map(d => {
    const v = assessment[d.key];
    return v == null ? null : normalizeScore(d.key, v);
  }).filter(v => v != null);
  if (scores.length === 0) return 0;
  return parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1));
}

// Group assessments into monthly rounds
export function groupByRound(assessments) {
  const byMonth = {};
  assessments.forEach(a => {
    if (!a.created_date) return;
    const monthKey = a.created_date.substring(0, 7);
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(a);
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, items]) => ({ month, items }));
}

// Compute average dimension scores + overall for a set of assessments
export function computeRoundScores(assessments) {
  const sums = {};
  const counts = {};
  SCOREBOARD_DIMENSIONS.forEach(d => { sums[d.key] = 0; counts[d.key] = 0; });

  assessments.forEach(a => {
    SCOREBOARD_DIMENSIONS.forEach(d => {
      const v = a[d.key];
      if (v != null) {
        sums[d.key] += normalizeScore(d.key, v);
        counts[d.key]++;
      }
    });
  });

  const dimensions = {};
  SCOREBOARD_DIMENSIONS.forEach(d => {
    dimensions[d.key] = counts[d.key] > 0 ? parseFloat((sums[d.key] / counts[d.key]).toFixed(1)) : 0;
  });

  const overall = parseFloat((Object.values(dimensions).reduce((s, v) => s + v, 0) / SCOREBOARD_DIMENSIONS.length).toFixed(1));
  const respondents = new Set(assessments.map(a => a.respondent_email).filter(Boolean)).size;

  return { dimensions, overall, respondents, count: assessments.length };
}

// Get current + previous round scores, plus all rounds for trend
export function getRoundComparison(assessments) {
  const rounds = groupByRound(assessments);
  if (rounds.length === 0) return { current: null, previous: null, rounds: [] };

  const roundScores = rounds.map(r => ({
    month: r.month,
    ...computeRoundScores(r.items),
  }));

  const current = roundScores[roundScores.length - 1];
  const previous = roundScores.length > 1 ? roundScores[roundScores.length - 2] : null;

  return { current, previous, rounds: roundScores };
}

// Identify strongest and weakest areas
export function getStrongestAndWeakest(dimensions) {
  const entries = Object.entries(dimensions)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const strongest = entries.slice(0, 2).map(([key, value]) => ({
    key, value,
    label: SCOREBOARD_DIMENSIONS.find(d => d.key === key)?.label || key,
  }));

  const weakest = entries.slice(-2).reverse().map(([key, value]) => ({
    key, value,
    label: SCOREBOARD_DIMENSIONS.find(d => d.key === key)?.label || key,
  }));

  return { strongest, weakest };
}

// Generate interpretation for "What This Means"
export function interpretHealth(current, previous) {
  if (!current) return null;

  const { dimensions, overall, respondents } = current;
  const { strongest, weakest } = getStrongestAndWeakest(dimensions);

  const risks = Object.entries(dimensions)
    .filter(([, v]) => v < 5)
    .map(([key, value]) => ({
      key, value,
      label: SCOREBOARD_DIMENSIONS.find(d => d.key === key)?.label || key,
    }));

  const patterns = [];
  if (dimensions.trust < 5 && dimensions.safety < 5) {
    patterns.push('Trust and psychological safety are both low, suggesting a foundational trust deficit that may require dedicated stabilization work.');
  }
  if (dimensions.conflict_intensity > 6) {
    patterns.push('Conflict intensity is elevated, indicating unresolved tensions that may be undermining team cohesion.');
  }
  if (dimensions.clarity < 5 && dimensions.accountability < 5) {
    patterns.push('Low clarity combined with low accountability suggests the team may not have shared priorities or clear roles.');
  }
  if (dimensions.meeting_effectiveness < 5) {
    patterns.push('Meeting effectiveness is low, which may indicate a need for better meeting discipline and decision-making processes.');
  }
  if (patterns.length === 0 && overall >= 6) {
    patterns.push('No critical patterns detected. The team is generally healthy — focus on sustaining momentum and preventing drift.');
  }

  // Determine recommended LHOS focus area
  let focusStage = 'sustain';
  let focusDiscipline = 'Measurement';
  if (dimensions.trust < 5 || dimensions.safety < 5 || dimensions.conflict_intensity > 6) {
    focusStage = 'stabilize';
    focusDiscipline = dimensions.conflict_intensity > 6 ? 'Healthy Conflict' : 'Leadership Health';
  } else if (dimensions.clarity < 5) {
    focusStage = 'align';
    focusDiscipline = 'Organizational Clarity';
  } else if (dimensions.accountability < 5 || dimensions.meeting_effectiveness < 5) {
    focusStage = 'execute';
    focusDiscipline = dimensions.accountability < 5 ? 'Accountability' : 'Execution Rhythm';
  }

  const change = previous ? parseFloat((overall - previous.overall).toFixed(1)) : null;

  return {
    strongest,
    weakest,
    risks,
    patterns,
    focusStage,
    focusDiscipline,
    overall,
    respondents,
    change,
  };
}

// Generate recommended next steps linked to LHOS stages
export function getRecommendedSteps(dimensions) {
  const steps = [];

  if (dimensions.trust < 5 || dimensions.safety < 5) {
    steps.push({
      stage: 'stabilize',
      discipline: 'Leadership Health',
      action: 'Complete a Tension Pulse Survey to baseline team trust and tension levels',
      link: '/stabilize',
    });
  }
  if (dimensions.conflict_intensity > 6) {
    steps.push({
      stage: 'stabilize',
      discipline: 'Healthy Conflict',
      action: 'Use the Conflict Intake form to document and address active conflicts',
      link: '/stabilize',
    });
    steps.push({
      stage: 'stabilize',
      discipline: 'Healthy Conflict',
      action: 'Establish Communication Agreements to reduce recurring conflict triggers',
      link: '/stabilize',
    });
  }
  if (dimensions.clarity < 5) {
    steps.push({
      stage: 'align',
      discipline: 'Organizational Clarity',
      action: 'Complete Role Clarity Worksheets to define responsibilities and decision authority',
      link: '/align',
    });
    steps.push({
      stage: 'align',
      discipline: 'Organizational Clarity',
      action: 'Run a Priority Alignment exercise to agree on what matters most right now',
      link: '/align',
    });
  }
  if (dimensions.accountability < 5) {
    steps.push({
      stage: 'execute',
      discipline: 'Accountability',
      action: 'Set up the Action Tracker to break goals into concrete, owned tasks',
      link: '/execute',
    });
    steps.push({
      stage: 'execute',
      discipline: 'Accountability',
      action: 'Start a Decision Log to record what was decided, why, and who was involved',
      link: '/execute',
    });
  }
  if (dimensions.meeting_effectiveness < 5) {
    steps.push({
      stage: 'execute',
      discipline: 'Execution Rhythm',
      action: 'Use the Meeting Agenda Builder to structure meetings for decisions, not just updates',
      link: '/execute',
    });
  }

  if (steps.length === 0) {
    steps.push({
      stage: 'sustain',
      discipline: 'Measurement',
      action: 'Continue monthly Health Pulses to track trends and catch issues early',
      link: '/sustain',
    });
    steps.push({
      stage: 'sustain',
      discipline: 'Renewal',
      action: 'Schedule a Quarterly Review to reflect on wins, misses, and key learnings',
      link: '/sustain',
    });
  }

  return steps;
}

export function getScoreColor(score) {
  if (score >= 8) return { text: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Strong' };
  if (score >= 6) return { text: 'text-blue-600', bg: 'bg-blue-100', label: 'Healthy' };
  if (score >= 4) return { text: 'text-amber-600', bg: 'bg-amber-100', label: 'At Risk' };
  return { text: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
}