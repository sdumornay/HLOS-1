import React, { useState } from 'react';
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
import TeamOperatingMap from '@/components/align/TeamOperatingMap';
import TeamHealthPanel from '@/components/align/TeamHealthPanel';
import OrgClaritySummary from '@/components/align/OrgClaritySummary';
import TeamAgreements from '@/components/align/TeamAgreements';
import { Users, Footprints } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkstyleSurveyModal from '@/components/shared/WorkstyleSurveyModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StageHero from '@/components/stages/StageHero';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

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
    <div className="space-y-6">
      <StageHero stage="align" orgId={orgId} counts={counts} />
      <AlignProgress counts={counts} />

      {/* Assessment Launchers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">Team Health &amp; Culture Assessment</p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">5 Dysfunctions</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Identify gaps in trust, conflict, commitment, accountability, and results. 15 questions, 5-7 minutes.</p>
              </div>
            </div>
            <Link to="/assessments">
              <Button size="sm" className="w-full">Go to Assessments</Button>
            </Link>
          </CardContent>
        </Card>
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
                <p className="text-xs text-muted-foreground mt-0.5">Map your team's natural leadership styles across Head, Heart, Gut, and Feet. ~5 minutes.</p>
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

      {/* Area 1: Team Understanding */}
      <DisciplineSection number={3} name="Team Understanding" description="Map workstyles, strengths, and team dynamics">
        <TeamOperatingMap orgId={orgId} />
        <WorkstyleResults orgId={orgId} />
      </DisciplineSection>

      {/* Area 2: Team Health */}
      <DisciplineSection number={4} name="Team Health" description="Identify trust gaps and dysfunction patterns">
        <TeamHealthPanel orgId={orgId} />
        <FiveDysfunctionsDiagnostic orgId={orgId} />
      </DisciplineSection>

      {/* Area 3: Organizational Clarity */}
      <DisciplineSection number={5} name="Organizational Clarity" description="Define mission, priorities, roles, and decisions">
        <OrgClaritySummary orgId={orgId} />
        <PriorityAlignmentPage orgId={orgId} />
        <RoleClarityWorksheet orgId={orgId} />
        <DecisionRightsMap orgId={orgId} />
      </DisciplineSection>

      {/* Area 4: Team Agreements */}
      <DisciplineSection number={6} name="Team Agreements" description="Establish how the team will work together">
        <TeamAgreements orgId={orgId} />
        <LeadershipCovenant orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="align" orgId={orgId} />
    </div>
  );
}