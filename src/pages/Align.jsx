import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import AlignProgress from '@/components/align/AlignProgress';
import FiveDysfunctionsDiagnostic from '@/components/align/FiveDysfunctionsDiagnostic';
import WorkstyleResults from '@/components/align/WorkstyleResults';
import RoleClarityWorksheet from '@/components/align/RoleClarityWorksheet';
import PriorityAlignmentPage from '@/components/align/PriorityAlignmentPage';
import DecisionRightsMap from '@/components/align/DecisionRightsMap';
import LeadershipCovenant from '@/components/align/LeadershipCovenant';
import TeamOperatingMap from '@/components/align/TeamOperatingMap';
import OrgClaritySummary from '@/components/align/OrgClaritySummary';
import TeamAgreements from '@/components/align/TeamAgreements';
import { Footprints } from 'lucide-react';
import WorkstyleSurveyModal from '@/components/shared/WorkstyleSurveyModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StageHero from '@/components/stages/StageHero';
import StageGuide from '@/components/stages/StageGuide';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';
import StageGate from '@/components/stages/StageGate';

export default function Align() {
  const [showWorkstyleModal, setShowWorkstyleModal] = useState(false);
  const orgId = useOrgId();

  const { data: dysfunctions = [] } = useQuery({
    queryKey: ['fiveDysfunctions', orgId],
    queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: workstyles = [], refetch: refetchWorkstyles } = useQuery({
    queryKey: ['workstyleAssessments', orgId],
    queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: roleClarity = [] } = useQuery({
    queryKey: ['roleClarity', orgId],
    queryFn: () => base44.entities.RoleClarity.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: decisionRights = [] } = useQuery({
    queryKey: ['decisionRights', orgId],
    queryFn: () => base44.entities.DecisionRight.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: covenants = [] } = useQuery({
    queryKey: ['covenants', orgId],
    queryFn: () => base44.entities.LeadershipCovenant.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: commAgreements = [] } = useQuery({
    queryKey: ['commAgreements', orgId],
    queryFn: () => base44.entities.CommAgreement.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: org } = useQuery({
    queryKey: ['org-clarity', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const counts = {
    five_dysfunctions: dysfunctions.length,
    workstyle: workstyles.length,
    role_clarity: roleClarity.length,
    priorities: priorities.length,
    decision_rights: decisionRights.length,
    covenant: covenants.length,
    comm_agreements: commAgreements.length,
    mission: org?.mission ? 1 : 0,
  };

  return (
    <StageGate stage="align">
    <div className="space-y-6">
      <StageHero stage="align" orgId={orgId} counts={counts} />
...
      <StagePriorities stage="align" orgId={orgId} />
    </div>
    </StageGate>
  );
}