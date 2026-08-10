import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PriorityTracker from '@/components/execute/PriorityTracker';
import MeetingConsole from '@/components/execute/MeetingConsole';
import DecisionLogPanel from '@/components/execute/DecisionLogPanel';
import ActionTracker from '@/components/execute/ActionTracker';
import AccountabilityView from '@/components/execute/AccountabilityView';
import ExecutionDashboard from '@/components/execute/ExecutionDashboard';
import StageHero from '@/components/stages/StageHero';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

export default function Execute() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

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

  const counts = {
    priorities: priorities.length,
    meetings: agendas.length,
    decisions: decisions.length,
    actions: actions.length,
    accountability: actions.length,
  };

  return (
    <div className="space-y-6">
      <StageHero stage="execute" orgId={orgId} counts={counts} />

      {/* Execution overview — full width */}
      <ExecutionDashboard orgId={orgId} />

      {/* Pillar 1: Priorities */}
      <DisciplineSection number={7} name="Priorities" description="3-5 active priorities with owners, milestones, and progress">
        <PriorityTracker orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 2: Meetings */}
      <DisciplineSection number={8} name="Meetings" description="Review, decide, and assign in a clear rhythm">
        <MeetingConsole orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 3: Decisions */}
      <DisciplineSection number={9} name="Decisions" description="Log decisions with context, participants, and resulting actions">
        <DecisionLogPanel orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 4: Actions */}
      <DisciplineSection number={10} name="Actions" description="Clear owners, due dates, and linked priorities">
        <ActionTracker orgId={orgId} />
      </DisciplineSection>

      {/* Pillar 5: Accountability */}
      <DisciplineSection number={11} name="Accountability" description="Follow-through view grouped by owner">
        <AccountabilityView orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="execute" orgId={orgId} />
    </div>
  );
}