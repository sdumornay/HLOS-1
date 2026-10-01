import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, X, TrendingUp, Compass, Users, Shield, Rocket, Leaf } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { DIMENSIONS } from '@/lib/orgSnapshotScoring';
import OrgSnapshotResults from '@/components/health/OrgSnapshotResults';
import DiagnosticJourney from '@/components/onboarding/DiagnosticJourney';
import { useOrgSnapshotStatus } from '@/lib/useOrgSnapshotStatus';
import { cn } from '@/lib/utils';
import { CheckCircle2, Eye, RotateCcw } from 'lucide-react';

const OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Mixed / Unsure' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const DIMENSION_META = [
  { icon: Compass, color: 'text-blue-600', bg: 'bg-blue-100' },
  { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  { icon: Rocket, color: 'text-amber-600', bg: 'bg-amber-100' },
  { icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' },
];

const QUESTIONS = [
  // Mission & Direction (q1-q4)
  { key: 'q1', text: 'Our organization has a clear understanding of its mission and why it exists.', dim: 0 },
  { key: 'q2', text: 'Our current priorities are clear to the people responsible for carrying them out.', dim: 0 },
  { key: 'q3', text: 'We are able to distinguish what is most important from what is merely urgent.', dim: 0 },
  { key: 'q4', text: 'Our activities and programs generally support our stated mission and priorities.', dim: 0 },
  // Culture & Trust (q5-q8)
  { key: 'q5', text: 'People in our organization generally feel safe raising concerns or offering a different perspective.', dim: 1 },
  { key: 'q6', text: 'Difficult issues are more likely to be addressed directly than discussed through side conversations.', dim: 1 },
  { key: 'q7', text: 'People generally assume positive intent when disagreements occur.', dim: 1 },
  { key: 'q8', text: 'The culture encourages honesty, respect, and responsibility.', dim: 1 },
  // Role & Decision Clarity (q9-q11)
  { key: 'q9', text: 'People generally understand their responsibilities and what is expected of them.', dim: 2 },
  { key: 'q10', text: 'It is clear who has authority to make important decisions.', dim: 2 },
  { key: 'q11', text: 'Leaders know when they can make a decision independently and when others need to be involved.', dim: 2 },
  // Execution & Accountability (q12-q14)
  { key: 'q12', text: 'Meetings generally result in clear decisions and next steps.', dim: 3 },
  { key: 'q13', text: 'Important commitments have a clear owner and deadline.', dim: 3 },
  { key: 'q14', text: 'People are appropriately held accountable for following through on their commitments.', dim: 3 },
  // Momentum & Adaptability (q15-q17)
  { key: 'q15', text: 'Our most important priorities are making measurable progress.', dim: 4 },
  { key: 'q16', text: 'We address recurring problems rather than repeatedly working around them.', dim: 4 },
  { key: 'q17', text: 'Our organization is able to adjust when circumstances change without losing sight of our mission.', dim: 4 },
  // Sustainability & Capacity (q18-q20)
  { key: 'q18', text: 'Responsibilities are distributed in a way that does not depend excessively on one or two people.', dim: 5 },
  { key: 'q19', text: 'Our leaders and key team members have sufficient capacity to fulfill their responsibilities effectively.', dim: 5 },
  { key: 'q20', text: 'Our current pace and way of operating feel sustainable over time.', dim: 5 },
];

export default function OrgHealthSnapshot() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const snapshotOrgId = orgId || user?.data?.organization_id || user?.organization_id;
  const { snapshotCompleted, latestSnapshot, isLoading: snapshotLoading } = useOrgSnapshotStatus(snapshotOrgId);
  const [retake, setRetake] = useState(false);
  const [step, setStep] = useState(0); // 0 = intro, 1-6 = dimensions, 7 = results
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState(null);
  const [record, setRecord] = useState(null);

  // Build a scores object from an existing snapshot record (for "view answers")
  const scoresFromRecord = (snap) => ({
    overall_score: snap?.overall_score,
    mission_direction_score: snap?.mission_direction_score,
    culture_trust_score: snap?.culture_trust_score,
    role_clarity_score: snap?.role_clarity_score,
    execution_accountability_score: snap?.execution_accountability_score,
    momentum_adaptability_score: snap?.momentum_adaptability_score,
    sustainability_capacity_score: snap?.sustainability_capacity_score,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitOrgHealthSnapshot', data),
    onSuccess: (res) => {
      const resultScores = res?.data?.scores || res?.scores;
      const resultRecord = res?.data?.record || res?.record;
      setScores(resultScores);
      setRecord(resultRecord);
      queryClient.invalidateQueries({ queryKey: ['orgHealthSnapshots', orgId] });
      setStep(7);
    },
    onError: (err) => {
      toast({
        title: 'Failed to save',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const currentDim = step - 1; // step 1-6 maps to dimensions 0-5
  const totalSteps = 6;
  const progress = (step / (totalSteps + 1)) * 100;

  const dimQuestions = QUESTIONS.filter(q => q.dim === currentDim);
  const dimInfo = DIMENSIONS[currentDim];
  const dimMeta = DIMENSION_META[currentDim];

  const handleDimNext = () => {
    const allAnswered = dimQuestions.every(q => answers[q.key] != null);
    if (!allAnswered) {
      toast({
        title: 'Please answer all questions',
        description: `Answer all ${dimQuestions.length} questions in this section to continue.`,
        variant: 'destructive',
      });
      return;
    }
    if (step < 6) {
      setStep(step + 1);
    } else {
      submitMutation.mutate({
        organization_id: orgId,
        ...answers,
      });
    }
  };

  // ── Wait for snapshot status to load before showing intro or already-taken ──
  if (snapshotOrgId && snapshotLoading && !retake) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Already taken: show options to view answers or retake ──
  if (snapshotCompleted && !retake && step !== 7) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-display font-bold">Snapshot Already Taken</h1>
          <p className="text-sm text-muted-foreground">
            You've already completed the Organizational Health Snapshot
            {latestSnapshot?.created_date ? ` on ${format(new Date(latestSnapshot.created_date), 'MMM d, yyyy')}` : ''}.
          </p>
        </div>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your snapshot is complete. Continue to the Leadership Health Scoreboard, review your results,
              or retake the snapshot to update them.
            </p>
            <Button className="w-full whitespace-normal h-auto" onClick={() => navigate(`/scoreboard?org=${encodeURIComponent(snapshotOrgId)}`)}>
              Continue to Leadership Health Scoreboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setScores(scoresFromRecord(latestSnapshot));
                  setRecord(latestSnapshot);
                  setStep(7);
                }}
              >
                <Eye className="h-4 w-4 mr-2" /> View My Answers
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRetake(true);
                  setStep(0);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Retake Snapshot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 0: Intro ──
  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <TrendingUp className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Organizational Health Snapshot</h1>
          <p className="text-muted-foreground">A broad look at the health of your organization.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This 20-question snapshot gives you a broad initial perspective on the health of your entire
              organization across six dimensions. It takes about 5 minutes.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              There are no right or wrong answers. Respond honestly based on your current experience.
              This is a starting point for discovery, not a clinical diagnosis.
            </p>

            <div className="rounded-lg bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Diagnostic Journey</p>
              <DiagnosticJourney orgSnapshotDone={false} scoreboardDone={false} compact />
            </div>

            <Button className="w-full" onClick={() => setStep(1)}>
              Begin Snapshot <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Steps 1-6: Dimension questions ──
  if (step >= 1 && step <= 6) {
    const DimIcon = dimMeta?.icon || Compass;
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{dimInfo?.label} — Section {step} of 6</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Dimension header */}
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', dimMeta?.bg)}>
            <DimIcon className={cn('h-5 w-5', dimMeta?.color)} />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">{dimInfo?.label}</h2>
            <p className="text-xs text-muted-foreground">{dimInfo?.description}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {dimQuestions.map((q, i) => (
            <Card key={q.key} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium leading-snug">{q.key.replace('q', '')}. {q.text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers(a => ({ ...a, [q.key]: opt.value }))}
                      className={cn(
                        'text-xs font-medium px-2 py-2 rounded-lg border transition-all text-center',
                        answers[q.key] === opt.value
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <span className="block font-bold">{opt.value}</span>
                      <span className="block text-[10px] mt-0.5">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={handleDimNext} disabled={submitMutation.isPending} className="flex-1">
            {step < 6 ? <>Next <ArrowRight className="h-4 w-4 ml-1" /></> : (submitMutation.isPending ? 'Submitting...' : 'Submit Snapshot')}
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 7: Results ──
  if (step === 7 && scores) {
    return (
      <OrgSnapshotResults
        scores={scores}
        record={record}
        orgName={user?.data?.org_name || ''}
      />
    );
  }

  return null;
}