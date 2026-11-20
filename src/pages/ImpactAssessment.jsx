import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, X, Target, Shield, Compass, Users, Rocket, Leaf, CheckCircle2, Eye, RotateCcw, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import DiagnosticJourney from '@/components/onboarding/DiagnosticJourney';
import { useOrgSnapshotStatus } from '@/lib/useOrgSnapshotStatus';
import { useBaselineStatus } from '@/lib/useBaselineStatus';
import { useImpactAssessmentStatus } from '@/lib/useImpactAssessmentStatus';
import { DIMENSIONS, questionsForDimension, impactScoresFromRecord } from '@/lib/impactAssessment';
import ImpactAssessmentResults from '@/components/impact/ImpactAssessmentResults';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Mixed / Unsure' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const DIMENSION_META = {
  organizational_health: { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  strategic_alignment: { icon: Compass, color: 'text-blue-600', bg: 'bg-blue-100' },
  leadership_effectiveness: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  operational_execution: { icon: Rocket, color: 'text-amber-600', bg: 'bg-amber-100' },
  mission_impact: { icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' },
};

export default function ImpactAssessment() {
  const navigate = useNavigate();
  const { user, loading: userLoading, isAdmin, isCoach } = useCurrentUser();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusOrgId = orgId || user?.data?.organization_id || user?.organization_id;
  const { snapshotCompleted } = useOrgSnapshotStatus(statusOrgId);
  const { baselineCompleted, isLoading: baselineLoading } = useBaselineStatus(statusOrgId);
  const { impactCompleted, latestAssessment, isLoading: impactLoading } = useImpactAssessmentStatus(statusOrgId);
  const canBypassBaseline = isAdmin || isCoach;

  const [retake, setRetake] = useState(false);
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = dimensions, 6 = results
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState(null);
  const [record, setRecord] = useState(null);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitImpactAssessment', data),
    onSuccess: (res) => {
      setScores(res?.data?.scores || res?.scores);
      setRecord(res?.data?.record || res?.record);
      queryClient.invalidateQueries({ queryKey: ['impactAssessments', orgId] });
      setStep(6);
    },
    onError: (err) => {
      toast({
        title: 'Failed to save',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const totalSteps = DIMENSIONS.length;
  const currentDim = step >= 1 && step <= totalSteps ? DIMENSIONS[step - 1] : null;
  const dimQuestions = currentDim ? questionsForDimension(currentDim.key) : [];
  const dimMeta = currentDim ? DIMENSION_META[currentDim.key] : null;
  const progress = (step / (totalSteps + 1)) * 100;

  const handleDimNext = () => {
    const allAnswered = dimQuestions.every((q) => answers[q.key] != null);
    if (!allAnswered) {
      toast({
        title: 'Please answer all questions',
        description: `Answer all ${dimQuestions.length} questions in this section to continue.`,
        variant: 'destructive',
      });
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      submitMutation.mutate({ organization_id: orgId, ...answers });
    }
  };

  const closeButton = (
    <button
      onClick={() => navigate('/impact')}
      className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Close questionnaire"
    >
      <X className="h-5 w-5" />
    </button>
  );

  if (userLoading || !statusOrgId || baselineLoading || impactLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20" role="status" aria-label="Checking assessment progress">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Prerequisite: Leadership Health Scoreboard must be completed first ──
  if (!baselineCompleted && !canBypassBaseline) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        {closeButton}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <Target className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Organizational Impact Baseline</h1>
        </div>
        <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              First, complete your Leadership Health Scoreboard. The impact baseline measures change from the
              starting point your scoreboard establishes.
            </p>
            <Button className="w-full" onClick={() => navigate('/scoreboard')}>
              Take Leadership Health Scoreboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Already taken: view answers or retake ──
  if (impactCompleted && !retake && step !== 6) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        {closeButton}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-display font-bold">Impact Baseline Already Taken</h1>
          <p className="text-sm text-muted-foreground">
            You've already completed the Organizational Impact Baseline
            {latestAssessment?.created_date ? ` on ${format(new Date(latestAssessment.created_date), 'MMM d, yyyy')}` : ''}.
          </p>
        </div>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your baseline is recorded. Continue to the impact evaluation, review your answers, or retake the
              assessment to update them.
            </p>
            <Button className="w-full whitespace-normal h-auto" onClick={() => navigate('/impact')}>
              Continue to Impact Evaluation <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setScores(impactScoresFromRecord(latestAssessment));
                  setRecord(latestAssessment);
                  setStep(6);
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
                <RotateCcw className="h-4 w-4 mr-2" /> Retake Assessment
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
        {closeButton}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <Target className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Organizational Impact Baseline</h1>
          <p className="text-muted-foreground">The starting point for measuring what changes.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This 15-question assessment records where your organization stands across the five impact
              dimensions before coaching outcomes are measured. It takes about 4 minutes.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              There are no right or wrong answers. Respond based on your current experience — this baseline is
              what later measurements are compared against.
            </p>

            <div className="rounded-lg bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Diagnostic Journey</p>
              <DiagnosticJourney
                orgSnapshotDone={snapshotCompleted}
                scoreboardDone={baselineCompleted}
                impactDone={false}
                compact
              />
            </div>

            <Button className="w-full" onClick={() => setStep(1)}>
              Begin Assessment <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Steps 1-5: Dimension questions ──
  if (currentDim) {
    const DimIcon = dimMeta?.icon || Heart;
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        {closeButton}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentDim.label} — Section {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', dimMeta?.bg)}>
            <DimIcon className={cn('h-5 w-5', dimMeta?.color)} />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">{currentDim.label}</h2>
            <p className="text-xs text-muted-foreground">{currentDim.blurb}</p>
          </div>
        </div>

        <div className="space-y-4">
          {dimQuestions.map((q, i) => (
            <Card key={q.key} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium leading-snug">{i + 1}. {q.text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  {OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt.value }))}
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

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={handleDimNext} disabled={submitMutation.isPending} className="flex-1">
            {step < totalSteps
              ? <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
              : (submitMutation.isPending ? 'Submitting...' : 'Submit Baseline')}
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 6: Results ──
  if (step === 6 && scores) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <ImpactAssessmentResults scores={scores} record={record} />
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/impact/indicators')}>
            Choose Indicators
          </Button>
          <Button className="flex-1" onClick={() => navigate('/impact')}>
            Continue to Impact Evaluation <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}