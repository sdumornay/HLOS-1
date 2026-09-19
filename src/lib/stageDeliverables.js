// Stage deliverable labels for frontend display.
// The actual deliverable checking happens in the getStageAccess backend function.

export const STAGE_ORDER = ['stabilize', 'align', 'execute', 'sustain'];

export const STAGE_LABELS = {
  stabilize: 'Stabilize',
  align: 'Align',
  execute: 'Execute',
  sustain: 'Sustain',
};

export const STAGE_DESCRIPTIONS = {
  stabilize: 'Build trust, resolve tension, and create emotional safety on your leadership team.',
  align: 'Clarify mission, define roles, and get your leaders moving in the same direction.',
  execute: 'Strengthen accountability, ownership, and consistent follow-through.',
  sustain: 'Develop future leaders, build healthy rhythms, and protect long-term capacity.',
};

export const STAGE_DELIVERABLE_LABELS = {
  stabilize: [
    { key: 'tension_pulse', label: 'Tension Pulse submitted' },
    { key: 'five_dysfunctions', label: 'Team Health & Culture diagnostic completed' },
    { key: 'comm_agreements', label: 'At least 1 active Communication Agreement' },
    { key: 'conflict_resolved', label: 'No open (unresolved) conflicts' },
  ],
  align: [
    { key: 'workstyle', label: 'Workstyle Assessment completed' },
    { key: 'role_clarity', label: 'At least 1 Role Clarity agreed' },
    { key: 'priorities', label: 'At least 1 Priority active' },
    { key: 'decision_rights', label: 'At least 1 Decision Right clear' },
    { key: 'covenant', label: 'Leadership Covenant active' },
  ],
  execute: [
    { key: 'planning', label: 'At least 1 Planning Period created' },
    { key: 'meetings', label: 'At least 1 Meeting Agenda created' },
    { key: 'actions', label: 'At least 5 actions completed' },
    { key: 'completion_rate', label: 'Action completion rate above 60%' },
  ],
  sustain: [
    { key: 'health_pulse', label: 'At least 1 Health Pulse submitted' },
    { key: 'quarterly_review', label: 'At least 1 Quarterly Review completed' },
    { key: 'renewal', label: 'At least 1 Renewal Reflection completed' },
  ],
};

export const STATUS_LABELS = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In Progress',
  awaiting_approval: 'Awaiting Approval',
  completed: 'Completed',
};

export const STATUS_COLORS = {
  locked: 'text-muted-foreground',
  available: 'text-blue-600',
  in_progress: 'text-amber-600',
  awaiting_approval: 'text-purple-600',
  completed: 'text-emerald-600',
};

export const STATUS_BACKGROUNDS = {
  locked: 'bg-muted/50',
  available: 'bg-blue-50',
  in_progress: 'bg-amber-50',
  awaiting_approval: 'bg-purple-50',
  completed: 'bg-emerald-50',
};