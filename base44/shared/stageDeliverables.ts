// Stage deliverable definitions — shared across backend functions.
// Each deliverable has a key, label, and a check function that receives
// the fetched entity arrays and returns true when the deliverable is met.

export const STAGE_ORDER = ['stabilize', 'align', 'execute', 'sustain'];

export const STAGE_LABELS: Record<string, string> = {
  stabilize: 'Stabilize',
  align: 'Align',
  execute: 'Execute',
  sustain: 'Sustain',
};

export interface Deliverable {
  key: string;
  label: string;
  check: (d: any) => boolean;
}

export const STAGE_DELIVERABLES: Record<string, Deliverable[]> = {
  stabilize: [
    {
      key: 'tension_pulse',
      label: 'Tension Pulse submitted',
      check: (d) => d.tensionPulses?.length > 0,
    },
    {
      key: 'five_dysfunctions',
      label: 'Team Health & Culture diagnostic completed',
      check: (d) => d.fiveDysfunctions?.length > 0,
    },
    {
      key: 'comm_agreements',
      label: 'At least 1 active Communication Agreement',
      check: (d) => d.commAgreements?.some((a: any) => a.status === 'active'),
    },
    {
      key: 'conflict_resolved',
      label: 'No open (unresolved) conflicts',
      check: (d) => !d.conflictIntakes?.some((c: any) => c.status === 'open'),
    },
  ],
  align: [
    {
      key: 'workstyle',
      label: 'Workstyle Assessment completed',
      check: (d) => d.workstyles?.length > 0,
    },
    {
      key: 'role_clarity',
      label: 'At least 1 Role Clarity agreed',
      check: (d) => d.roleClarity?.some((r: any) => r.status === 'agreed'),
    },
    {
      key: 'priorities',
      label: 'At least 1 Priority active',
      check: (d) => d.priorities?.some((p: any) => p.status === 'active'),
    },
    {
      key: 'decision_rights',
      label: 'At least 1 Decision Right clear',
      check: (d) => d.decisionRights?.some((r: any) => r.clarity_status === 'clear'),
    },
    {
      key: 'covenant',
      label: 'Leadership Covenant active',
      check: (d) => d.covenants?.some((c: any) => c.status === 'active'),
    },
  ],
  execute: [
    {
      key: 'planning',
      label: 'At least 1 Planning Period created',
      check: (d) => d.planPeriods?.length > 0,
    },
    {
      key: 'meetings',
      label: 'At least 1 Meeting Agenda created',
      check: (d) => d.meetingAgendas?.length > 0,
    },
    {
      key: 'actions',
      label: 'At least 5 actions completed',
      check: (d) => d.actions?.filter((a: any) => a.status === 'completed').length >= 5,
    },
    {
      key: 'completion_rate',
      label: 'Action completion rate above 60%',
      check: (d) => {
        if (!d.actions?.length) return false;
        const completed = d.actions.filter((a: any) => a.status === 'completed').length;
        return (completed / d.actions.length) >= 0.6;
      },
    },
  ],
  sustain: [
    {
      key: 'health_pulse',
      label: 'At least 1 Health Pulse submitted',
      check: (d) => d.healthPulses?.length > 0,
    },
    {
      key: 'quarterly_review',
      label: 'At least 1 Quarterly Review completed',
      check: (d) => d.quarterlyReviews?.some((r: any) => r.status === 'complete'),
    },
    {
      key: 'renewal',
      label: 'At least 1 Renewal Reflection completed',
      check: (d) => d.renewalReflections?.some((r: any) => r.status === 'complete'),
    },
  ],
};

export function evaluateDeliverables(stage: string, data: any) {
  const deliverables = STAGE_DELIVERABLES[stage] || [];
  const results = deliverables.map((d) => ({
    key: d.key,
    label: d.label,
    met: d.check(data),
  }));
  const completed = results.filter((r) => r.met).map((r) => r.key);
  const allMet = results.length > 0 && results.every((r) => r.met);
  const percentage = results.length > 0
    ? Math.round((completed.length / results.length) * 100)
    : 0;
  return { results, completed, allMet, percentage };
}

// Assessment-to-stage mapping: which assessment submissions are allowed in which stage.
export const ASSESSMENT_STAGE_MAP: Record<string, string> = {
  tension_pulse: 'stabilize',
  five_dysfunctions: 'stabilize',
  workstyle: 'align',
  health_pulse: 'sustain',
};