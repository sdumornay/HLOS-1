import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import MonthlyHealthPulse from '@/components/sustain/MonthlyHealthPulse';
import QuarterlyReviewPanel from '@/components/sustain/QuarterlyReviewPanel';
import TrendDashboard from '@/components/sustain/TrendDashboard';
import RenewalPrompts from '@/components/sustain/RenewalPrompts';
import RiskFlagPanel from '@/components/sustain/RiskFlagPanel';
import StageHero from '@/components/stages/StageHero';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

export default function Sustain() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  const counts = { health_pulse: 1, risk_flags: 1, quarterly_review: 1, renewal: 1 };

  return (
    <div className="space-y-6">
      <StageHero stage="sustain" orgId={orgId} counts={counts} />

      {/* Trend overview — full width */}
      <TrendDashboard orgId={orgId} />

      {/* Discipline 7: Measurement */}
      <DisciplineSection number={7} name="Measurement" description="Track trends, flag risks, and review quarterly">
        <MonthlyHealthPulse orgId={orgId} />
        <RiskFlagPanel orgId={orgId} />
        <QuarterlyReviewPanel orgId={orgId} />
      </DisciplineSection>

      {/* Discipline 8: Renewal */}
      <DisciplineSection number={8} name="Renewal" description="Reset and re-energize the team">
        <RenewalPrompts orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="sustain" orgId={orgId} />
    </div>
  );
}