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
import { Compass, Users, Footprints } from 'lucide-react';
import SurveyLaunchCard from '@/components/shared/SurveyLaunchCard';
import WorkstyleSurveyModal from '@/components/shared/WorkstyleSurveyModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Align() {
  const { user } = useCurrentUser();
  const [showWorkstyleModal, setShowWorkstyleModal] = useState(false);
  const orgId = user?.organization_id;

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

      {/* External Survey Launchers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <SurveyLaunchCard
          title="Team Health & Culture Assessment"
          description="Based on Lencioni's Five Dysfunctions — identify gaps in trust, conflict, commitment, accountability, and results. 15 questions, 5-7 minutes."
          url="https://org-pulse-check.base44.app"
          icon={Users}
          accentColor="text-secondary"
          badgeLabel="5 Dysfunctions"
        />
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Footprints className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">Workstyle Assessment</p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Workstyle</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Map your team's natural leadership styles across Head (Analytical), Heart (Relational), Gut (Decisive), and Feet (Action-Oriented). ~5 minutes.</p>
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={() => setShowWorkstyleModal(true)}>
              Launch
            </Button>
          </CardContent>
        </Card>

        <WorkstyleSurveyModal
          open={showWorkstyleModal}
          onClose={() => setShowWorkstyleModal(false)}
          orgId={orgId}
          userName={user?.full_name || ''}
          userEmail={user?.email || ''}
          onSaved={() => refetchWorkstyles()}
        />
      </div>

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