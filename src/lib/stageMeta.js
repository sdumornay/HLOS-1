// Stage and discipline definitions for the 4-stage, 13-discipline framework.
// Used by StageHero, DisciplineSection, StageJourney, and stage pages.

export const STAGE_META = {
  stabilize: {
    number: 1,
    name: 'Stabilize',
    icon: 'Shield',
    color: 'blue',
    what: 'Surface tension, build safety, and establish communication foundations',
    why: 'Before a team can align or execute, it must first be stable. Unresolved conflict and unclear communication erode trust and make every subsequent step harder.',
    toolKeys: ['tension_pulse', 'leader_interviews', 'conflict_intake', 'comm_agreements', 'conflict_triggers', 'nvc_conversations'],
    disciplines: [
      { number: 1, name: 'Leadership Health', description: 'Baseline team tension, trust, and leadership health' },
      { number: 2, name: 'Healthy Conflict', description: 'Surface, understand, and resolve conflict constructively' },
    ],
  },
  align: {
    number: 2,
    name: 'Align',
    icon: 'Compass',
    color: 'amber',
    what: 'Establish shared understanding, clarify roles, and build team cohesion',
    why: 'Alignment ensures everyone knows their role, shares the same priorities, and commits to the same decisions. Without it, execution creates friction.',
    toolKeys: ['five_dysfunctions', 'workstyle', 'role_clarity', 'priorities', 'decision_rights', 'covenant', 'comm_agreements', 'mission'],
    disciplines: [
      { number: 3, name: 'Team Understanding', description: 'Map workstyles, strengths, and team dynamics' },
      { number: 4, name: 'Team Health', description: 'Identify trust gaps and dysfunction patterns' },
      { number: 5, name: 'Organizational Clarity', description: 'Define mission, priorities, roles, and decisions' },
      { number: 6, name: 'Team Agreements', description: 'Establish how the team will work together' },
    ],
  },
  execute: {
    number: 3,
    name: 'Execute',
    icon: 'Rocket',
    color: 'emerald',
    what: 'Turn priorities and decisions into completed action',
    why: 'Execution is the operating engine. A simple rhythm of priorities, meetings, decisions, actions, and accountability turns alignment into momentum.',
    toolKeys: ['priorities', 'meetings', 'decisions', 'actions', 'accountability'],
    disciplines: [
      { number: 7, name: 'Priorities', description: '3-5 active priorities with owners, milestones, and progress' },
      { number: 8, name: 'Meetings', description: 'Review, decide, and assign in a clear rhythm' },
      { number: 9, name: 'Decisions', description: 'Log decisions with context, participants, and resulting actions' },
      { number: 10, name: 'Actions', description: 'Clear owners, due dates, and linked priorities' },
      { number: 11, name: 'Accountability', description: 'Follow-through view grouped by owner' },
    ],
  },
  sustain: {
    number: 4,
    name: 'Sustain',
    icon: 'Leaf',
    color: 'purple',
    what: 'Maintain health momentum, review progress, and renew team commitments',
    why: 'Sustaining health requires ongoing measurement and intentional renewal. Without it, teams drift back into old patterns.',
    toolKeys: ['health_pulse', 'risk_flags', 'quarterly_review', 'renewal'],
    disciplines: [
      { number: 12, name: 'Measurement', description: 'Track trends, flag risks, and review quarterly' },
      { number: 13, name: 'Renewal', description: 'Reset and re-energize the team' },
    ],
  },
};

export const STAGE_ORDER = ['stabilize', 'align', 'execute', 'sustain'];

export function computeStageProgress(stage, counts) {
  const meta = STAGE_META[stage];
  if (!meta || !meta.toolKeys.length) return 0;
  const completed = meta.toolKeys.filter(key => (counts[key] || 0) > 0).length;
  return Math.round((completed / meta.toolKeys.length) * 100);
}