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
import StageGate from '@/components/stages/StageGate';

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
    <StageGate stage="execute">
    <div className="space-y-6">
      <StageHero stage="execute" orgId={orgId} counts={counts} />
...
      <StagePriorities stage="execute" orgId={orgId} />
    </div>
    </StageGate>
  );
}