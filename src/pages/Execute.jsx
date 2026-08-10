import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import PriorityTracker from '@/components/execute/PriorityTracker';
import MeetingConsole from '@/components/execute/MeetingConsole';
import DecisionLogPanel from '@/components/execute/DecisionLogPanel';
import ActionTracker from '@/components/execute/ActionTracker';
import AccountabilityView from '@/components/execute/AccountabilityView';
import ExecutionDashboard from '@/components/execute/ExecutionDashboard';
import StageHero from '@/components/stages/StageHero';
import StageGuide from '@/components/stages/StageGuide';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

export default function Execute() {
  const orgId = useOrgId();

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId, status: 'active' }),
    enabled: !!orgId,
  });
  const { data: agendas = [] } = useQuery({
    queryKey: ['agendas', orgId],
    queryFn: () => base44.entities.MeetingAgenda.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: decisions = [] } = useQuery({
    queryKey: ['decisionLog', orgId],
    queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: actions = [] } = useQuery({
    queryKey: ['actions', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: planPeriods = [] } = useQuery({
    queryKey: ['planningPeriods', orgId],
    queryFn: () => base44.entities.PlanningPeriod.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const counts = {
    priorities: priorities.length,
    meetings: agendas.length,
    decisions: decisions.length,
    actions: actions.filter(a => a.status === 'completed').length,
    planning: planPeriods.length,
  };

  return (
    <div className="space-y-6">
      <StageHero stage="execute" orgId={orgId} counts={counts} />
      <StageGuide stage="execute" counts={counts} />

      {/* Execution overview — full width */}
      <ExecutionDashboard orgId={orgId} />

      {/* Pillar 1: Priorities */}
      <DisciplineSection number={7} name="Priorities" description="3-5 active priorities with owners, milestones, and progress" audience="leader">
        <PriorityTracker orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 2: Meetings */}
      <DisciplineSection number={8} name="Meetings" description="Review, decide, and assign in a clear rhythm" audience="leader">
        <MeetingConsole orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 3: Decisions */}
      <DisciplineSection number={9} name="Decisions" description="Log decisions with context, participants, and resulting actions" audience="leader">
        <DecisionLogPanel orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 4: Actions */}
      <DisciplineSection number={10} name="Actions" description="Clear owners, due dates, and linked priorities" audience="team">
        <ActionTracker orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 5: Accountability */}
      <DisciplineSection number={11} name="Accountability" description="Follow-through view grouped by owner" audience="leader">
        <AccountabilityView orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="execute" orgId={orgId} />
    </div>
  );
}