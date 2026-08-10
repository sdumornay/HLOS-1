import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import ExecutionDashboard from '@/components/execute/ExecutionDashboard';
import MeetingAgendaBuilder from '@/components/execute/MeetingAgendaBuilder';
import DecisionLogPanel from '@/components/execute/DecisionLogPanel';
import ActionTracker from '@/components/execute/ActionTracker';
import PlanningBoard from '@/components/execute/PlanningBoard';
import StageHero from '@/components/stages/StageHero';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

export default function Execute() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  const counts = { planning: 1, meetings: 1, actions: 1, decisions: 1 };

  return (
    <div className="space-y-6">
      <StageHero stage="execute" orgId={orgId} counts={counts} />

      {/* Execution overview — full width */}
      <ExecutionDashboard orgId={orgId} />

      {/* Discipline 5: Execution Rhythm */}
      <DisciplineSection number={5} name="Execution Rhythm" description="Plan, meet, and execute with cadence">
        <PlanningBoard orgId={orgId} />
        <MeetingAgendaBuilder orgId={orgId} />
      </DisciplineSection>

      {/* Discipline 6: Accountability */}
      <DisciplineSection number={6} name="Accountability" description="Track actions and log decisions">
        <ActionTracker orgId={orgId} />
        <DecisionLogPanel orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="execute" orgId={orgId} />
    </div>
  );
}