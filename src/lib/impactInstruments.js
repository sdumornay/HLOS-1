export const RATING_SCALE = [
  { value: 1, label: 'Not at all' },
  { value: 2, label: 'Slightly' },
  { value: 3, label: 'Moderately' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Fully' },
];

export const INSTRUMENTS = [
  {
    level: 1,
    key: 'reaction',
    stage: 'Stabilize',
    title: 'Reaction Pulse',
    minutes: '2 minutes',
    audience: 'Participants',
    summary:
      'How relevant, useful and clear the coaching or development experience felt, and how confident leaders are about applying it.',
    recordedBy: 'participant',
    ratings: [
      { key: 'relevance', label: 'The work was relevant to the real challenges our organization faces.' },
      { key: 'practical_value', label: 'What we worked on was practical enough to use right away.' },
      { key: 'clarity', label: 'The expectations and next steps were clear to me.' },
      { key: 'engagement', label: 'I was genuinely engaged in the sessions and conversations.' },
      { key: 'confidence', label: 'I feel confident applying what we covered.' },
    ],
    open: [
      {
        key: 'improvement',
        label: 'What is one thing that would make this more useful?',
        placeholder: 'Be as specific as you can.',
      },
    ],
  },
  {
    level: 2,
    key: 'learning',
    stage: 'Align',
    title: 'Learning and Alignment Check',
    minutes: '4 minutes',
    audience: 'Leaders and team',
    summary:
      'Whether understanding, practical skills, shared priorities and commitment to action have actually grown since the engagement began.',
    recordedBy: 'participant',
    ratings: [
      { key: 'understanding', label: 'I understand our priorities and why they matter better than when we started.' },
      { key: 'skills', label: 'I have practical skills I did not have before (handling conflict, delegating, running meetings).' },
      { key: 'shared_priorities', label: 'Our leadership team shares the same top priorities.' },
      { key: 'role_clarity', label: 'I am clearer about what I own and what others own.' },
      { key: 'commitment', label: 'I am personally committed to the behaviors we agreed on.' },
    ],
    open: [
      {
        key: 'scenario',
        label: 'A decision is needed this week and two leaders disagree. What would you do differently now?',
        placeholder: 'Describe the steps you would take.',
      },
      {
        key: 'reflection',
        label: 'What have you learned that you are already using?',
        placeholder: 'A practice, a phrase, a habit.',
      },
    ],
  },
  {
    level: 3,
    key: 'behavior',
    stage: 'Execute',
    title: 'Behavioral Change Review',
    minutes: '5 minutes',
    audience: 'Coach, with authorized team feedback',
    summary:
      'Whether the agreed leadership behaviors are actually being practiced, based on action tracking, observation and team feedback.',
    recordedBy: 'coach',
    ratings: [
      { key: 'accountability_meetings', label: 'Accountability meetings happen on the agreed rhythm.' },
      { key: 'delegation', label: 'Responsibilities are clearly delegated rather than held by one or two people.' },
      { key: 'decision_timeliness', label: 'Decisions are made on time instead of being deferred.' },
      { key: 'conflict_management', label: 'Conflict is addressed directly and early.' },
      { key: 'communication', label: 'Communication of decisions and expectations is clear and consistent.' },
      { key: 'follow_through', label: 'Leaders follow through on commitments between meetings.' },
      { key: 'collaboration', label: 'Board or team collaboration has improved.' },
    ],
    open: [
      {
        key: 'observations',
        label: 'What have you directly observed that supports these ratings?',
        placeholder: 'Meetings held, decisions made, actions closed, people consulted.',
      },
      {
        key: 'feedback_source',
        label: 'Whose authorized feedback informed this review?',
        placeholder: 'Names or roles, with their permission.',
      },
      {
        key: 'counter_evidence',
        label: 'What evidence runs against these ratings?',
        placeholder: 'Missed commitments, repeated patterns, unresolved issues.',
      },
    ],
  },
  {
    level: 4,
    key: 'results',
    stage: 'Sustain',
    title: 'Organizational Results Review',
    minutes: '6 minutes',
    audience: 'Coach and executive sponsor',
    summary:
      'A direct comparison of the agreed success metrics against baseline and target, with the evidence behind each result.',
    recordedBy: 'coach',
    ratings: [
      { key: 'evidence_quality', label: 'The evidence for these results is documented and verifiable.' },
      { key: 'result_progress', label: 'The agreed organizational results are progressing as planned.' },
      { key: 'health_improvement', label: 'Organizational health has measurably improved since baseline.' },
      { key: 'capacity', label: 'The team can carry this without depending on the coach.' },
    ],
    open: [
      {
        key: 'contributing_factors',
        label: 'What most likely contributed to the results?',
        placeholder: 'Name specific practices, decisions or people.',
      },
      {
        key: 'limiting_factors',
        label: 'What limited progress?',
        placeholder: 'Capacity, funding, turnover, external events.',
      },
      {
        key: 'attribution_note',
        label: 'What can and cannot reasonably be attributed to this engagement?',
        placeholder: 'Be conservative. Note other influences.',
      },
    ],
  },
];

export const INSTRUMENT_BY_LEVEL = INSTRUMENTS.reduce((acc, i) => {
  acc[i.level] = i;
  return acc;
}, {});

/**
 * Aggregate numeric responses per question. Never returns individual answers,
 * so confidential responses can be shown as averages to anyone allowed to read.
 */
export function aggregateResponses(responses, instrument) {
  const rows = instrument.ratings.map((q) => {
    const values = responses
      .map((r) => Number(r.responses?.[q.key]))
      .filter((v) => Number.isFinite(v) && v > 0);
    const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { key: q.key, label: q.label, average, count: values.length };
  });
  const scored = rows.filter((r) => r.average !== null);
  const overall = scored.length
    ? scored.reduce((a, r) => a + r.average, 0) / scored.length
    : null;
  return { rows, overall, responseCount: responses.length };
}