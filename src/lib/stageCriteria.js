// Stage completion criteria — defines what must be true before an org advances
// from one stage to the next. Used by the advanceStage backend function and
// the NextStepsPanel component.

export const STAGE_CRITERIA = {
  stabilize: {
    label: 'Stabilize',
    nextStage: 'align',
    requirements: [
      { key: 'tension_pulse', label: 'At least 1 Tension Pulse submitted', check: (d) => d.tensionPulses?.length > 0 },
      { key: 'comm_agreements', label: 'At least 1 active Communication Agreement', check: (d) => d.commAgreements?.some(a => a.status === 'active') },
      { key: 'conflict_intake', label: 'No open (unresolved) conflicts', check: (d) => !d.conflictIntakes?.some(c => c.status === 'open') },
      { key: 'low_tension', label: 'Average team tension below 4', check: (d) => {
        if (!d.tensionPulses?.length) return false;
        const avg = d.tensionPulses.reduce((s, p) => s + (p.team_tension || 0), 0) / d.tensionPulses.length;
        return avg < 4;
      }},
    ],
  },
  align: {
    label: 'Align',
    nextStage: 'execute',
    requirements: [
      { key: 'five_dysfunctions', label: 'At least 1 Team Health Diagnostic completed', check: (d) => d.dysfunctions?.length > 0 },
      { key: 'workstyle', label: 'At least 1 Workstyle Assessment completed', check: (d) => d.workstyles?.length > 0 },
      { key: 'role_clarity', label: 'At least 1 Role Clarity agreed', check: (d) => d.roleClarity?.some(r => r.status === 'agreed') },
      { key: 'priorities', label: 'At least 1 Priority active', check: (d) => d.priorities?.some(p => p.status === 'active') },
      { key: 'decision_rights', label: 'At least 1 Decision Right clear', check: (d) => d.decisionRights?.some(r => r.clarity_status === 'clear') },
      { key: 'covenant', label: 'Leadership Covenant active', check: (d) => d.covenants?.some(c => c.status === 'active') },
    ],
  },
  execute: {
    label: 'Execute',
    nextStage: 'sustain',
    requirements: [
      { key: 'planning', label: 'At least 1 Planning Period created', check: (d) => d.planPeriods?.length > 0 },
      { key: 'meetings', label: 'At least 1 Meeting Agenda created', check: (d) => d.meetingAgendas?.length > 0 },
      { key: 'actions', label: 'At least 5 actions completed', check: (d) => d.actions?.filter(a => a.status === 'completed').length >= 5 },
      { key: 'completion_rate', label: 'Action completion rate above 60%', check: (d) => {
        if (!d.actions?.length) return false;
        const completed = d.actions.filter(a => a.status === 'completed').length;
        return (completed / d.actions.length) >= 0.6;
      }},
    ],
  },
  sustain: {
    label: 'Sustain',
    nextStage: null,
    requirements: [],
  },
};

export function checkStageComplete(stage, data) {
  const criteria = STAGE_CRITERIA[stage];
  if (!criteria || !criteria.requirements.length) return { complete: false, reason: 'Final stage', results: [] };
  const results = criteria.requirements.map(r => ({ label: r.label, met: r.check(data) }));
  const complete = results.every(r => r.met);
  return { complete, results, nextStage: criteria.nextStage };
}