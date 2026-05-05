import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Rocket } from 'lucide-react';
import ExecutionDashboard from '@/components/execute/ExecutionDashboard';
import MeetingAgendaBuilder from '@/components/execute/MeetingAgendaBuilder';
import DecisionLogPanel from '@/components/execute/DecisionLogPanel';
import ActionTracker from '@/components/execute/ActionTracker';
import PlanningBoard from '@/components/execute/PlanningBoard';

export default function Execute() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-0.5">Step 3</p>
          <h1 className="text-xl font-barlow font-bold tracking-tight">Execute Module</h1>
          <p className="text-sm text-muted-foreground">Drive accountability, track decisions, and execute your 30/60/90-day plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full-width execution dashboard */}
        <ExecutionDashboard orgId={orgId} />

        {/* Full-width 30/60/90 planning board */}
        <PlanningBoard orgId={orgId} />

        {/* Action tracker — full width */}
        <div className="col-span-full">
          <ActionTracker orgId={orgId} />
        </div>

        {/* Two column: agenda + decision log */}
        <MeetingAgendaBuilder orgId={orgId} />
        <DecisionLogPanel orgId={orgId} />
      </div>
    </div>
  );
}