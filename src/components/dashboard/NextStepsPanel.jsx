import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export const STAGE_STEPS = {
  stabilize: [
    { key: 'tension_pulse', label: 'Complete a Tension Pulse Survey', desc: 'Baseline your team tension and trust levels', link: '/stabilize' },
    { key: 'conflict_intake', label: 'Document any active conflicts', desc: 'Surface and categorize ongoing conflicts', link: '/stabilize' },
    { key: 'leader_interviews', label: 'Conduct leader interviews', desc: 'Gather 1-on-1 perspectives from key leaders', link: '/stabilize' },
    { key: 'comm_agreements', label: 'Establish communication agreements', desc: 'Agree on how the team will communicate', link: '/stabilize' },
    { key: 'conflict_triggers', label: 'Identify conflict triggers', desc: 'Map recurring patterns that spark conflict', link: '/stabilize' },
    { key: 'nvc_conversations', label: 'Practice NVC conversations', desc: 'Use nonviolent communication to resolve tension', link: '/stabilize' },
  ],
  align: [
    { key: 'five_dysfunctions', label: 'Run the Team Health Diagnostic', desc: 'Assess trust, conflict, commitment, accountability, results', link: '/align' },
    { key: 'workstyle', label: 'Complete Workstyle Assessments', desc: 'Map team leadership styles (Head, Heart, Gut, Feet)', link: '/align' },
    { key: 'role_clarity', label: 'Fill out Role Clarity Worksheets', desc: 'Define responsibilities and decision authority', link: '/align' },
    { key: 'priorities', label: 'Align on priorities', desc: 'Agree on what matters most right now', link: '/align' },
    { key: 'decision_rights', label: 'Map decision rights', desc: 'Clarify who decides, who is consulted, who is informed', link: '/align' },
    { key: 'covenant', label: 'Create a Leadership Covenant', desc: 'Document team commitments and sign together', link: '/align' },
  ],
  execute: [
    { key: 'planning', label: 'Create your 30/60/90-day plan', desc: 'Set themes, goals, and key risks for each period', link: '/execute' },
    { key: 'actions', label: 'Add and assign action items', desc: 'Break goals into concrete, owned tasks', link: '/execute' },
    { key: 'meetings', label: 'Build meeting agendas', desc: 'Structure meetings for decisions, not just updates', link: '/execute' },
    { key: 'decisions', label: 'Log key decisions', desc: 'Record what was decided, why, and who was involved', link: '/execute' },
  ],
  sustain: [
    { key: 'health_pulse', label: 'Submit a monthly health pulse', desc: 'Track health and momentum trends over time', link: '/sustain' },
    { key: 'risk_flags', label: 'Review and flag risks', desc: 'Surface emerging issues before they escalate', link: '/sustain' },
    { key: 'quarterly_review', label: 'Complete a quarterly review', desc: 'Reflect on wins, misses, and key learnings', link: '/sustain' },
    { key: 'renewal', label: 'Plan a team renewal', desc: 'Reset and re-energize the team', link: '/sustain' },
  ],
};

export default function NextStepsPanel({ stage = 'stabilize', orgId }) {
  // Stabilize queries
  const { data: tensionPulses = [] } = useQuery({
    queryKey: ['tensionPulses-next', orgId], queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'stabilize',
  });
  const { data: conflictIntakes = [] } = useQuery({
    queryKey: ['conflictIntakes-next', orgId], queryFn: () => base44.entities.ConflictIntake.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'stabilize',
  });
  const { data: leaderInterviews = [] } = useQuery({
    queryKey: ['leaderInterviews-next', orgId], queryFn: () => base44.entities.LeaderInterview.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'stabilize',
  });
  const { data: commAgreements = [] } = useQuery({
    queryKey: ['commAgreements-next', orgId], queryFn: () => base44.entities.CommAgreement.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'stabilize',
  });
  const { data: conflictTriggers = [] } = useQuery({
    queryKey: ['conflictTriggers-next', orgId], queryFn: () => base44.entities.ConflictTrigger.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'stabilize',
  });
  const { data: nvcConversations = [] } = useQuery({
    queryKey: ['nvcConversations-next', orgId], queryFn: () => base44.entities.NVCConversation.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'stabilize',
  });

  // Align queries
  const { data: dysfunctions = [] } = useQuery({
    queryKey: ['fiveDysfunctions-next', orgId], queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'align',
  });
  const { data: workstyles = [] } = useQuery({
    queryKey: ['workstyleAssessments-next', orgId], queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'align',
  });
  const { data: roleClarity = [] } = useQuery({
    queryKey: ['roleClarity-next', orgId], queryFn: () => base44.entities.RoleClarity.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'align',
  });
  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities-next', orgId], queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'align',
  });
  const { data: decisionRights = [] } = useQuery({
    queryKey: ['decisionRights-next', orgId], queryFn: () => base44.entities.DecisionRight.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'align',
  });
  const { data: covenants = [] } = useQuery({
    queryKey: ['covenants-next', orgId], queryFn: () => base44.entities.LeadershipCovenant.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'align',
  });

  // Execute queries
  const { data: planPeriods = [] } = useQuery({
    queryKey: ['planningPeriods-next', orgId], queryFn: () => base44.entities.PlanningPeriod.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'execute',
  });
  const { data: meetingAgendas = [] } = useQuery({
    queryKey: ['meetingAgendas-next', orgId], queryFn: () => base44.entities.MeetingAgenda.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'execute',
  });
  const { data: decisions = [] } = useQuery({
    queryKey: ['decisionLog-next', orgId], queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'execute',
  });
  const { data: execActions = [] } = useQuery({
    queryKey: ['actions-next', orgId], queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'execute',
  });

  // Sustain queries
  const { data: healthPulses = [] } = useQuery({
    queryKey: ['healthPulses-next', orgId], queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'sustain',
  });
  const { data: riskFlags = [] } = useQuery({
    queryKey: ['riskFlags-next', orgId], queryFn: () => base44.entities.RiskFlag.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'sustain',
  });
  const { data: quarterlyReviews = [] } = useQuery({
    queryKey: ['quarterlyReviews-next', orgId], queryFn: () => base44.entities.QuarterlyReview.filter({ organization_id: orgId }),
    enabled: !!orgId && stage === 'sustain',
  });

  const counts = {
    tension_pulse: tensionPulses.length,
    conflict_intake: conflictIntakes.length,
    leader_interviews: leaderInterviews.length,
    comm_agreements: commAgreements.length,
    conflict_triggers: conflictTriggers.length,
    nvc_conversations: nvcConversations.length,
    five_dysfunctions: dysfunctions.length,
    workstyle: workstyles.length,
    role_clarity: roleClarity.length,
    priorities: priorities.length,
    decision_rights: decisionRights.length,
    covenant: covenants.length,
    planning: planPeriods.length,
    meetings: meetingAgendas.length,
    decisions: decisions.length,
    actions: execActions.filter(a => a.status === 'completed').length,
    health_pulse: healthPulses.length,
    risk_flags: riskFlags.length,
    quarterly_review: quarterlyReviews.length,
    renewal: quarterlyReviews.filter(r => r.renewal_action).length,
  };

  const steps = STAGE_STEPS[stage] || [];
  const completedCount = steps.filter(s => (counts[s.key] || 0) > 0).length;
  const nextStep = steps.find(s => (counts[s.key] || 0) === 0);
  const pct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">Recommended Next Steps</CardTitle>
        </div>
        <span className="text-sm font-bold text-primary">{pct}%</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {nextStep ? (
          <Link to={nextStep.link} className="block rounded-lg bg-accent/10 border border-accent/20 p-3 hover:bg-accent/15 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Up Next</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{nextStep.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{nextStep.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-accent flex-shrink-0 ml-2" />
            </div>
          </Link>
        ) : (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-sm font-semibold text-emerald-700">All steps complete for this stage!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Consider advancing to the next stage.</p>
          </div>
        )}

        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {steps.map((step, i) => {
            const done = (counts[step.key] || 0) > 0;
            return (
              <div key={step.key} className="flex items-center gap-2 text-xs">
                {done
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  : <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}