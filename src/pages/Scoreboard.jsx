import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useOrgSnapshotStatus } from '@/lib/useOrgSnapshotStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Check, Heart, Shield, Compass, Rocket, Leaf, Download, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { exportElementToPDF } from '@/lib/exportPDF';
import ScoreboardResults from '@/components/health/ScoreboardResults';

const STAGES = [
  {
    key: 'stabilize',
    name: 'Stabilize',
    icon: Shield,
    description: 'Build trust, resolve tension, and create emotional safety on your leadership team.',
    questions: [
      { key: 'q1', text: 'Our leadership team addresses conflict directly and respectfully.' },
      { key: 'q2', text: 'There is a strong level of trust among key leaders.' },
      { key: 'q3', text: 'Leaders feel emotionally safe enough to raise concerns.' },
      { key: 'q4', text: 'Unresolved tension is not quietly slowing down our work.' },
    ],
  },
  {
    key: 'align',
    name: 'Align',
    icon: Compass,
    description: 'Clarify mission, define roles, and get your leaders moving in the same direction.',
    questions: [
      { key: 'q5', text: 'Our leaders are clear about the organization\u2019s mission and priorities.' },
      { key: 'q6', text: 'Roles and responsibilities are clearly understood.' },
      { key: 'q7', text: 'Our leadership team is aligned around major decisions.' },
      { key: 'q8', text: 'We have a shared understanding of what success looks like.' },
    ],
  },
  {
    key: 'execute',
    name: 'Execute',
    icon: Rocket,
    description: 'Strengthen accountability, ownership, and consistent follow-through.',
    questions: [
      { key: 'q9', text: 'Leaders take ownership of their commitments.' },
      { key: 'q10', text: 'Important decisions are made in a timely and healthy way.' },
      { key: 'q11', text: 'We have clear rhythms for follow-up and accountability.' },
      { key: 'q12', text: 'Our team consistently follows through on agreed-upon priorities.' },
    ],
  },
  {
    key: 'sustain',
    name: 'Sustain',
    icon: Leaf,
    description: 'Develop future leaders, build healthy rhythms, and protect long-term capacity.',
    questions: [
      { key: 'q13', text: 'We are developing future leaders intentionally.' },
      { key: 'q14', text: 'Our leadership rhythms are sustainable and not constantly reactive.' },
      { key: 'q15', text: 'Leaders have space for reflection, learning, and renewal.' },
      { key: 'q16', text: 'Our current leadership system can support long-term growth.' },
    ],
  },
];

const OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral / Unsure' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const TIMELINE_OPTIONS = [
  'Just exploring',
  'Within 1-3 months',
  'Within 3-6 months',
  'Not sure yet',
];

export default function Scoreboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoach } = useCurrentUser();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { snapshotCompleted } = useOrgSnapshotStatus(orgId);
  const canBypassSnapshot = isAdmin || isCoach;

  const [step, setStep] = useState(0); // 0 = context, 1-4 = stages, 5 = results, 6 = begin
  const [answers, setAnswers] = useState({});
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [timeline, setTimeline] = useState('');
  const [scores, setScores] = useState(null);
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef(null);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitScoreboard', data),
    onSuccess: (res) => {
      const resultScores = res?.data?.scores || res?.scores || res?.data?.record || res?.record;
      setScores(resultScores);
      queryClient.invalidateQueries({ queryKey: ['leadershipHealthScoreboard', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.removeQueries({ queryKey: ['stageAccess'] });
      setStep(5);
    },
    onError: (err) => {
      toast({
        title: 'Failed to save',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const currentStage = STAGES[step - 1]; // step 1-4 maps to stages 0-3
  const totalSteps = 5; // context + 4 stages before results
  const progress = (step / totalSteps) * 100;

  const handleStageNext = () => {
    const stageQuestions = currentStage.questions;
    const allAnswered = stageQuestions.every(q => answers[q.key] != null);
    if (!allAnswered) {
      toast({
        title: 'Please answer all questions',
        description: `Answer all ${stageQuestions.length} questions in the ${currentStage.name} section to continue.`,
        variant: 'destructive',
      });
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit
      submitMutation.mutate({
        organization_id: orgId,
        biggest_challenge: biggestChallenge,
        timeline,
        ...answers,
      });
    }
  };

  const handleExport = async () => {
    if (!scores || !resultsRef.current) return;
    setExporting(true);
    try {
      await exportElementToPDF({
        element: resultsRef.current,
        filename: 'leadership-health-scoreboard-results.pdf',
      });
    } catch (err) {
      toast({ title: 'Export failed', description: 'Could not generate PDF. Please try again.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // ── Prerequisite: Org Health Snapshot must be completed first ──
  if (!snapshotCompleted && !canBypassSnapshot) {
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
            <Heart className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Leadership Health Scoreboard</h1>
        </div>
        <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              First, complete your Organizational Health Snapshot. This gives you a broad picture of your
              organization before you begin looking more closely at the health of your leadership team.
            </p>
            <Button className="w-full" onClick={() => navigate('/org-snapshot')}>
              Take Organizational Health Snapshot <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 0: Context ──
  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close questionnaire"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <Heart className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Leadership Health Scoreboard</h1>
          <p className="text-muted-foreground">Health First. Momentum Next.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              A 16-question diagnostic across the four HLOS stages. Takes about 10 minutes.
              Your responses create your organization\u2019s baseline and unlock Stage 1.
            </p>

            <div>
              <Label htmlFor="challenge">Biggest Leadership Challenge (optional)</Label>
              <Textarea
                id="challenge"
                value={biggestChallenge}
                onChange={e => setBiggestChallenge(e.target.value)}
                placeholder="What's the biggest challenge your leadership team is facing right now?"
                rows={3}
              />
            </div>

            <div>
              <Label>Timeline for Help (optional)</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger><SelectValue placeholder="When are you looking for support?" /></SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={() => setStep(1)}>
              Begin Scorecard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Steps 1-4: Stage questions ──
  if (step >= 1 && step <= 4) {
    const StageIcon = currentStage.icon;
    return (
      <div className="max-w-2xl mx-auto space-y-6 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-2 right-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close questionnaire"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentStage.name} — Stage {step} of 4</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stage header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <StageIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">{currentStage.name}</h2>
            <p className="text-xs text-muted-foreground">{currentStage.description}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {currentStage.questions.map((q, i) => (
            <Card key={q.key} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium leading-snug">{i + 1}. {q.text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  {OPTIONS.map(opt => (
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
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={handleStageNext} disabled={submitMutation.isPending} className="flex-1">
            {step < 4 ? <>Next <ArrowRight className="h-4 w-4 ml-1" /></> : (submitMutation.isPending ? 'Submitting...' : 'Submit Scorecard')}
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 5: Results ──
  if (step === 5 && scores) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div ref={resultsRef} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-display font-bold">Your Scoreboard Results</h1>
            <p className="text-sm text-muted-foreground">Health First. Momentum Next.</p>
          </div>

          <ScoreboardResults scores={scores} orgId={orgId} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting} className="flex-1">
            <Download className="h-4 w-4 mr-1" /> {exporting ? 'Generating...' : 'Export PDF'}
          </Button>
          <Button onClick={() => setStep(6)} className="flex-1">
            Continue <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 6: Begin Stabilize ──
  if (step === 6) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 pt-8">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold">Your Leadership Health Scoreboard is complete.</h1>
          <p className="text-base text-muted-foreground">You are ready to begin Stage 1: Stabilize.</p>
          <p className="text-sm font-semibold text-accent mt-3">Health First. Momentum Next.</p>
        </div>
        <Button size="lg" onClick={() => navigate('/stabilize')} className="px-8">
          Begin Stabilize <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return null;
}