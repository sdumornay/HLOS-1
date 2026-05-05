export const STAGES = [
  { key: 'stabilize', label: 'Stabilize', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: 'Shield' },
  { key: 'align', label: 'Align', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: 'Compass' },
  { key: 'execute', label: 'Execute', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'Rocket' },
  { key: 'sustain', label: 'Sustain', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'RefreshCw' },
];

export const HEALTH_DIMENSIONS = ['trust', 'safety', 'clarity', 'accountability', 'meeting_effectiveness', 'conflict_intensity'];
export const MOMENTUM_DIMENSIONS = ['decisions_made', 'actions_completed', 'priority_progress', 'milestone_completion'];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  coach: 'Coach',
  lead_pastor: 'Lead Pastor',
  team_member: 'Team Member',
};

export const STAGE_DESCRIPTIONS = {
  stabilize: 'Reduce conflict, rebuild trust, and create psychological safety.',
  align: 'Clarify vision, values, and priorities. Get everyone on the same page.',
  execute: 'Improve meetings, decisions, accountability, and follow-through.',
  sustain: 'Build rhythms, track momentum, and ensure long-term health.',
};