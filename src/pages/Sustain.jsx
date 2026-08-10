import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import MonthlyReviewDashboard from '@/components/sustain/MonthlyReviewDashboard';
import QuarterlyReviewPanel from '@/components/sustain/QuarterlyReviewPanel';
import TrendDashboard from '@/components/sustain/TrendDashboard';
import RenewalReflection from '@/components/sustain/RenewalReflection';
import RiskFlagPanel from '@/components/sustain/RiskFlagPanel';
import StageHero from '@/components/stages/StageHero';
import StageGuide from '@/components/stages/StageGuide';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

export default function Sustain() {
  const orgId = useOrgId();

  const { data: healthPulses = [] } = useQuery({
    queryKey: ['healthPulses-sustain', orgId],
    queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: riskFlags = [] } = useQuery({
    queryKey: ['riskFlags-sustain', orgId],
    queryFn: () => base44.entities.RiskFlag.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: quarterlyReviews = [] } = useQuery({
    queryKey: ['quarterlyReviews-sustain', orgId],
    queryFn: () => base44.entities.QuarterlyReview.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const counts = {
    health_pulse: healthPulses.length,
    risk_flags: riskFlags.length,
    quarterly_review: quarterlyReviews.length,
    renewal: quarterlyReviews.filter(r => r.renewal_action).length,
  };

  return (
    <div className="space-y-6">
      <StageHero stage="sustain" orgId={orgId} counts={counts} />
      <StageGuide stage="sustain" counts={counts} />

      {/* Trend overview + pattern detection — full width */}
      <TrendDashboard orgId={orgId} />

      {/* Rhythm 1: Monthly Health + Momentum Review */}
      <DisciplineSection number={12} name="Monthly Health + Momentum Review" description="Current health, momentum, priorities, issues, and commitments at a glance" audience="leader">
        <MonthlyReviewDashboard orgId={orgId} />
        <RiskFlagPanel orgId={orgId} />
      </DisciplineSection>

      {/* Rhythm 2: Quarterly Reset */}
      <DisciplineSection number={13} name="Quarterly Reset" description="Guided review: what improved, what declined, what to stop, continue, and prioritize next" audience="leader">
        <QuarterlyReviewPanel orgId={orgId} />
      </DisciplineSection>

      {/* Rhythm 3: Renewal */}
      <DisciplineSection number={14} name="Renewal" description="Reflect on leadership sustainability, team relationships, and areas requiring renewal" audience="team">
        <RenewalReflection orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="sustain" orgId={orgId} />
    </div>
  );
}