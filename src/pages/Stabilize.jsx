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
import { Shield } from 'lucide-react';
import NumberedTool from '@/components/stages/NumberedTool';

export default function Stabilize() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  // Fetch counts for progress indicator
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-0.5">Step 1</p>
          <h1 className="text-xl font-barlow font-bold tracking-tight">Stabilize Module</h1>
          <p className="text-sm text-muted-foreground">Surface tension, build safety, and establish communication foundations</p>
        </div>
      </div>

      {/* Progress indicator spans full width */}
      <StabilizeProgress counts={counts} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NumberedTool number={1} title="Conflict Intake" description="Surface and document active conflicts">
          <ConflictIntakeForm orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={2} title="Tension Pulse Survey" description="Baseline team tension and trust levels">
          <TensionPulseSurvey orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={3} title="Leader Interviews" description="Gather 1-on-1 perspectives from key leaders">
          <LeaderInterviewNotes orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={4} title="Communication Agreements" description="Agree on how the team will communicate">
          <CommunicationAgreements orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={5} title="Conflict Trigger Tracker" description="Map recurring patterns that spark conflict">
          <ConflictTriggerTracker orgId={orgId} />
        </NumberedTool>
        <NumberedTool number={6} title="NVC Conversations" description="Use nonviolent communication to resolve tension">
          <NVCConversationHelper orgId={orgId} />
        </NumberedTool>
      </div>
    </div>
  );
}