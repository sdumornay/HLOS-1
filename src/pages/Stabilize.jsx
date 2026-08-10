import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import StabilizeProgress from '@/components/stabilize/StabilizeProgress';
import ConflictIntakeForm from '@/components/stabilize/ConflictIntakeForm';
import TensionPulseSurvey from '@/components/stabilize/TensionPulseSurvey';
import LeaderInterviewNotes from '@/components/stabilize/LeaderInterviewNotes';
import CommunicationAgreements from '@/components/stabilize/CommunicationAgreements';
import ConflictTriggerTracker from '@/components/stabilize/ConflictTriggerTracker';
import NVCConversationHelper from '@/components/stabilize/NVCConversationHelper';
import StageHero from '@/components/stages/StageHero';
import DisciplineSection from '@/components/stages/DisciplineSection';
import StagePriorities from '@/components/stages/StagePriorities';

export default function Stabilize() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  const { data: intakes = [] } = useQuery({
    queryKey: ['conflictIntakes', orgId],
    queryFn: () => base44.entities.ConflictIntake.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: pulses = [] } = useQuery({
    queryKey: ['tensionPulses', orgId],
    queryFn: () => base44.entities.TensionPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: interviews = [] } = useQuery({
    queryKey: ['leaderInterviews', orgId],
    queryFn: () => base44.entities.LeaderInterview.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: agreements = [] } = useQuery({
    queryKey: ['commAgreements', orgId],
    queryFn: () => base44.entities.CommAgreement.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: triggers = [] } = useQuery({
    queryKey: ['conflictTriggers', orgId],
    queryFn: () => base44.entities.ConflictTrigger.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ['nvcConversations', orgId],
    queryFn: () => base44.entities.NVCConversation.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const counts = {
    conflict_intake: intakes.length,
    tension_pulse: pulses.length,
    leader_interviews: interviews.length,
    comm_agreements: agreements.length,
    conflict_triggers: triggers.length,
    nvc_conversations: conversations.length,
  };

  return (
    <div className="space-y-6">
      <StageHero stage="stabilize" orgId={orgId} counts={counts} />
      <StabilizeProgress counts={counts} />

      {/* Discipline 1: Leadership Health */}
      <DisciplineSection number={1} name="Leadership Health" description="Baseline team tension, trust, and leadership health">
        <TensionPulseSurvey orgId={orgId} />
        <LeaderInterviewNotes orgId={orgId} />
      </DisciplineSection>

      {/* Discipline 2: Healthy Conflict */}
      <DisciplineSection number={2} name="Healthy Conflict" description="Surface, understand, and resolve conflict constructively">
        <ConflictIntakeForm orgId={orgId} />
        <CommunicationAgreements orgId={orgId} />
        <ConflictTriggerTracker orgId={orgId} />
        <NVCConversationHelper orgId={orgId} />
      </DisciplineSection>

      <StagePriorities stage="stabilize" orgId={orgId} />
    </div>
  );
}