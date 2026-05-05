import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AlignProgress from '@/components/align/AlignProgress';
import FiveDysfunctionsDiagnostic from '@/components/align/FiveDysfunctionsDiagnostic';
import WorkstyleResults from '@/components/align/WorkstyleResults';
import RoleClarityWorksheet from '@/components/align/RoleClarityWorksheet';
import PriorityAlignmentPage from '@/components/align/PriorityAlignmentPage';
import DecisionRightsMap from '@/components/align/DecisionRightsMap';
import LeadershipCovenant from '@/components/align/LeadershipCovenant';
import { Compass } from 'lucide-react';

export default function Align() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  const { data: dysfunctions = [] } = useQuery({
    queryKey: ['fiveDysfunctions', orgId],
    queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: workstyles = [] } = useQuery({
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

  const counts = {
    five_dysfunctions: dysfunctions.length,
    workstyle: workstyles.length,
    role_clarity: roleClarity.length,
    priorities: priorities.length,
    decision_rights: decisionRights.length,
    covenant: covenants.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
          <Compass className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-0.5">Step 2</p>
          <h1 className="text-xl font-barlow font-bold tracking-tight">Align Module</h1>
          <p className="text-sm text-muted-foreground">Establish shared understanding, clarify roles, and build team cohesion</p>
        </div>
      </div>

      <AlignProgress counts={counts} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FiveDysfunctionsDiagnostic orgId={orgId} />
        <WorkstyleResults orgId={orgId} />
        <RoleClarityWorksheet orgId={orgId} />
        <PriorityAlignmentPage orgId={orgId} />
        <DecisionRightsMap orgId={orgId} />
        {/* Leadership Covenant spans full width via col-span-full on the component */}
        <LeadershipCovenant orgId={orgId} />
      </div>
    </div>
  );
}