import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import MonthlyReviewDashboard from '@/components/sustain/MonthlyReviewDashboard';
import QuarterlyReviewPanel from '@/components/sustain/QuarterlyReviewPanel';
import TrendDashboard from '@/components/sustain/TrendDashboard';
import RenewalReflection from '@/components/sustain/RenewalReflection';
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

      {/* Trend overview + pattern detection — full width */}
      <TrendDashboard orgId={orgId} />

      {/* Rhythm 1: Monthly Health + Momentum Review */}
      <DisciplineSection number={12} name="Monthly Health + Momentum Review" description="Current health, momentum, priorities, issues, and commitments at a glance">
        <MonthlyReviewDashboard orgId={orgId} />
        <RiskFlagPanel orgId={orgId} />
      </DisciplineSection>

      {/* Rhythm 2: Quarterly Reset */}
      <DisciplineSection number={13} name="Quarterly Reset" description="Guided review: what improved, what declined, what to stop, continue, and prioritize next">
        <QuarterlyReviewPanel orgId={orgId} />
      </DisciplineSection>

      {/* Rhythm 3: Renewal */}
      <DisciplineSection number={14} name="Renewal" description="Reflect on leadership sustainability, team relationships, and areas requiring renewal">
        <RenewalReflection orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="sustain" orgId={orgId} />
    </div>
  );
}