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
import StageGate from '@/components/stages/StageGate';

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
    <StageGate stage="sustain">
    <div className="space-y-6">
      <StageHero stage="sustain" orgId={orgId} counts={counts} />
...
      <StagePriorities stage="sustain" orgId={orgId} />
    </div>
    </StageGate>
  );
}