import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, X, Building2, Compass, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DIMENSIONS, QUESTIONS, RESPONSE_OPTIONS } from '@/lib/orgSnapshotScoring';
import DiagnosticJourney from '@/components/health/DiagnosticJourney';
import OrgSnapshotResults from '@/components/health/OrgSnapshotResults';
import { exportElementToPDF } from '@/lib/exportPDF';

export default function OrgHealthSnapshot() {
  const navigate = useNavigate();
  const orgId = useOrgId();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0 = intro, 1-6 = dimensions, 7 = results
  const [answers, setAnswers] = useState({});
  const [submittedSnapshot, setSubmittedSnapshot] = useState(null);
  const resultsRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      await exportElementToPDF({
        element: resultsRef.current,
        filename: 'organizational-health-snapshot.pdf',
      });
    } catch {
      // non-blocking
    } finally {
      setExporting(false);
    }
  };

  // Check for existing snapshot by this user
  const { data: existingSnapshots = [] } = useQuery({
    queryKey: ['orgHealthSnapshots', orgId, user?.email],
    queryFn: () => base44.entities.OrganizationalHealthSnapshot.filter(
      { organization_id: orgId, respondent_email: user?.email },
      '-created_date', 5
    ),
    enabled: !!orgId && !!user?.email,
  });

  const mySnapshot = existingSnapshots[0] || submittedSnapshot;

  // If user already has a snapshot, jump to results
  useEffect(() => {
    if (existingSnapshots.length > 0 && step === 0 && !submittedSnapshot) {
      setStep(7);
    }
  }, [existingSnapshots, step, submittedSnapshot]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('submitOrgSnapshot', data);
      const record = res?.data?.record || res?.record;
      if (!record) throw new Error('No record returned');
      return record;
    },
    onSuccess: (record) => {
      setSubmittedSnapshot(record);
      queryClient.invalidateQueries({ queryKey: ['orgHealthSnapshots', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['stageAccess'] });
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

  const currentDim = DIMENSIONS[step - 1]; // step 1-6 maps to dimensions 0-5
  const totalSteps = 6;
  const progress = (step / (totalSteps + 1)) * 100;

  const handleDimNext = () => {
    const dimQuestions = QUESTIONS.filter(q => q.dimension === currentDim.key);
    const allAnswered = dimQuestions.every(q => answers[q.key] != null);
    if (!allAnswered) {
      toast({
        title: 'Please answer all questions',
        description: `Answer all ${dimQuestions.length} questions in the ${currentDim.label} section to continue.`,
        variant: 'destructive',
      });
      return;
    }
    if (step < 6) {
      setStep(step + 1);
    } else {
      // Submit — the backend function computes scores and sets baseline_completed
      submitMutation.mutate({
        organization_id: orgId,
        ...answers,
      });
    }
  };

  // ── Results ──
  if (step === 7 && mySnapshot) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div ref={resultsRef} className="space-y-6">
          <div className="pb-2">
            <DiagnosticJourney
              currentStep="organization"
              orgComplete={true}
              leadershipComplete={false}
            />
          </div>
          <OrgSnapshotResults snapshot={mySnapshot} orgComplete={true} leadershipComplete={false} />
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" /> {exporting ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Intro ──
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

        <div className="pb-2">
          <DiagnosticJourney
            currentStep="organization"
            orgComplete={false}
            leadershipComplete={false}
          />
        </div>

        <div className="text-center space-y-2 pt-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <Building2 className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Organizational Health Snapshot</h1>
          <p className="text-sm text-muted-foreground">How is your organization doing?</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This 20-question snapshot gives you a broad initial perspective on the health of your entire organization.
              It takes about 5 minutes.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              There are no right or wrong answers. Respond based on what feels true for your organization right now.
              Your responses will create a starting point — not a final diagnosis.
            </p>
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What you'll see</p>
              <p className="text-xs text-muted-foreground">Six dimensions of organizational health, each with 3–4 questions on a 1–5 scale.</p>
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
    const dimQuestions = QUESTIONS.filter(q => q.dimension === currentDim.key);
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
            <span>{currentDim.label} — Section {step} of 6</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Dimension header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Compass className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">{currentDim.label}</h2>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {dimQuestions.map((q, i) => {
            const globalIndex = QUESTIONS.findIndex(qq => qq.key === q.key) + 1;
            return (
              <Card key={q.key} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium leading-snug">{globalIndex}. {q.text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                    {RESPONSE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setAnswers(a => ({ ...a, [q.key]: opt.value }))}
                        className={`text-xs font-medium px-2 py-2 rounded-lg border transition-all ${
                          answers[q.key] === opt.value
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border bg-card hover:bg-muted/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

  return null;
}