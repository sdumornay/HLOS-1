export const DIMENSIONS = [
  {
    key: 'organizational_health',
    letter: 'A',
    label: 'Organizational Health',
    blurb: 'Trust, communication, staff morale, conflict management, resilience.',
  },
  {
    key: 'strategic_alignment',
    letter: 'B',
    label: 'Strategic Alignment',
    blurb: 'Mission clarity, priorities, role clarity, shared expectations, decision rights.',
  },
  {
    key: 'leadership_effectiveness',
    letter: 'C',
    label: 'Leadership Effectiveness',
    blurb: 'Delegation, accountability, communication, team development, governance.',
  },
  {
    key: 'operational_execution',
    letter: 'D',
    label: 'Operational Execution',
    blurb: 'Follow-through, workflow, decision speed, completion of strategic priorities.',
  },
  {
    key: 'mission_impact',
    letter: 'E',
    label: 'Mission Impact and Sustainability',
    blurb: 'Program results, stakeholder outcomes, capacity, funding stability.',
  },
];

export const DIMENSION_MAP = DIMENSIONS.reduce((acc, d) => {
  acc[d.key] = d;
  return acc;
}, {});

export const UNITS = {
  scale_1_5: '1–5 rating',
  percent: 'Percent',
  number: 'Number',
  yes_no: 'Yes / no milestone',
  qualitative: 'Qualitative evidence',
};

export const DIRECTIONS = {
  higher_better: 'Higher is better',
  lower_better: 'Lower is better',
  milestone: 'Milestone (achieved or not)',
};

export const BEHAVIOR_STATUS = {
  not_started: { label: 'Not Started', tone: 'secondary' },
  emerging: { label: 'Emerging', tone: 'outline' },
  consistent: { label: 'Consistent', tone: 'default' },
  sustained: { label: 'Sustained', tone: 'default' },
};

export const INDICATOR_STATUS = {
  not_measured: { label: 'Not Yet Measured', tone: 'secondary' },
  on_track: { label: 'On track', tone: 'default' },
  off_track: { label: 'Needs attention', tone: 'destructive' },
  achieved: { label: 'Target met', tone: 'default' },
};

export const INDICATOR_LIBRARY = [
  { key: 'trust', dimension: 'organizational_health', name: 'Trust among leaders', definition: 'Leaders can be honest about problems without fear of fallout.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'communication', dimension: 'organizational_health', name: 'Communication quality', definition: 'Decisions and expectations reach the people who carry them out.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'morale', dimension: 'organizational_health', name: 'Staff and volunteer morale', definition: 'People feel encouraged and steady in their work.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'conflict', dimension: 'organizational_health', name: 'Conflict handled directly', definition: 'Difficult issues are raised with the person involved, not around them.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'resilience', dimension: 'organizational_health', name: 'Resilience under pressure', definition: 'The team adapts to change without losing focus.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'mission_clarity', dimension: 'strategic_alignment', name: 'Mission clarity', definition: 'Everyone can state why the organization exists and what matters now.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'priority_clarity', dimension: 'strategic_alignment', name: 'Priority clarity', definition: 'The team agrees on the few priorities that matter most this season.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'role_clarity', dimension: 'strategic_alignment', name: 'Role clarity', definition: 'People know what they own and what success looks like.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'decision_rights', dimension: 'strategic_alignment', name: 'Decision rights clarity', definition: 'It is clear who decides, who is consulted, and who is informed.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'delegation', dimension: 'leadership_effectiveness', name: 'Delegation', definition: 'Responsibility is distributed beyond one or two people.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'accountability', dimension: 'leadership_effectiveness', name: 'Accountability', definition: 'Commitments are reviewed and followed up on.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'team_development', dimension: 'leadership_effectiveness', name: 'Team development', definition: 'Leaders are being coached and grown, not just managed.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'governance', dimension: 'leadership_effectiveness', name: 'Board and governance health', definition: 'Governance bodies clarify direction and hold the mission steady.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'succession', dimension: 'leadership_effectiveness', name: 'Succession readiness', definition: 'Key roles have identified, developing successors.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'follow_through', dimension: 'operational_execution', name: 'Follow-through rate', definition: 'Share of committed actions completed by the agreed date.', unit: 'percent', improvement_direction: 'higher_better' },
  { key: 'decision_speed', dimension: 'operational_execution', name: 'Decision speed', definition: 'Decisions are made in a timely way rather than deferred.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'priority_completion', dimension: 'operational_execution', name: 'Priority completion', definition: 'Share of the season\'s strategic priorities completed.', unit: 'percent', improvement_direction: 'higher_better' },
  { key: 'meeting_effectiveness', dimension: 'operational_execution', name: 'Meeting effectiveness', definition: 'Meetings end with clear decisions, owners and dates.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'program_results', dimension: 'mission_impact', name: 'Program results', definition: 'The outcome measure your programs exist to move.', unit: 'number', improvement_direction: 'higher_better' },
  { key: 'stakeholder_outcomes', dimension: 'mission_impact', name: 'Stakeholder outcomes', definition: 'Change experienced by the people you serve.', unit: 'qualitative', improvement_direction: 'higher_better' },
  { key: 'capacity', dimension: 'mission_impact', name: 'Organizational capacity', definition: 'Staffing, systems and volunteers can carry the current load.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'funding_stability', dimension: 'mission_impact', name: 'Funding stability', definition: 'Revenue is predictable enough to plan the next season.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
  { key: 'sustainability', dimension: 'mission_impact', name: 'Long-term sustainability', definition: 'The pace and structure can hold beyond this engagement.', unit: 'scale_1_5', improvement_direction: 'higher_better' },
];

export function formatValue(value, unit) {
  if (value === null || value === undefined || value === '') return 'Not yet measured';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Not yet measured';
  if (unit === 'percent') return `${Math.round(n)}%`;
  if (unit === 'scale_1_5') return `${n.toFixed(1)} / 5`;
  if (unit === 'yes_no') return n >= 1 ? 'Achieved' : 'Not achieved';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function computeProgress(indicator) {
  const b = Number(indicator?.baseline_value);
  const t = Number(indicator?.target_value);
  const a = Number(indicator?.actual_value);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(t)) {
    return { pct: null, achieved: false };
  }
  let raw;
  if (indicator.improvement_direction === 'lower_better') {
    raw = b === t ? (a <= t ? 100 : 0) : ((b - a) / (b - t)) * 100;
  } else {
    raw = b === t ? (a >= t ? 100 : 0) : ((a - b) / (t - b)) * 100;
  }
  return { pct: Math.max(0, Math.min(100, Math.round(raw))), achieved: raw >= 100 };
}

export function indicatorStatus(indicator) {
  if (indicator?.status && indicator.status !== 'not_measured') return indicator.status;
  const { pct, achieved } = computeProgress(indicator);
  if (pct === null) return 'not_measured';
  if (achieved) return 'achieved';
  return pct >= 50 ? 'on_track' : 'off_track';
}

export function deltaFromBaseline(indicator) {
  const b = Number(indicator?.baseline_value);
  const a = Number(indicator?.actual_value);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a - b;
}