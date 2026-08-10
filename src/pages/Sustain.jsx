import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Leaf } from 'lucide-react';
import MonthlyHealthPulse from '@/components/sustain/MonthlyHealthPulse';
import QuarterlyReviewPanel from '@/components/sustain/QuarterlyReviewPanel';
import TrendDashboard from '@/components/sustain/TrendDashboard';
import RenewalPrompts from '@/components/sustain/RenewalPrompts';
import RiskFlagPanel from '@/components/sustain/RiskFlagPanel';
import NumberedTool from '@/components/stages/NumberedTool';

export default function Sustain() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-0.5">Step 4</p>
          <h1 className="text-xl font-barlow font-bold tracking-tight">Sustain Module</h1>
          <p className="text-sm text-muted-foreground">Maintain health momentum, review progress, and renew team commitments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendDashboard orgId={orgId} />
        <NumberedTool number={1} title="Monthly Health Pulse" description="Track health and momentum trends over time">
          <MonthlyHealthPulse orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={2} title="Risk Flags" description="Surface emerging issues before they escalate">
          <RiskFlagPanel orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={3} title="Quarterly Review" description="Reflect on wins, misses, and key learnings">
          <QuarterlyReviewPanel orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={4} title="Renewal Prompts" description="Reset and re-energize the team">
          <RenewalPrompts orgId={orgId} />
        </NumberedTool>
      </div>
    </div>
  );
}