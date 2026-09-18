import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Check, Heart, Shield, Compass, Rocket, Leaf, Download, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { exportToPDF } from '@/lib/exportPDF';
import { format } from 'date-fns';

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

function getScoreTier(score) {
  if (score >= 8) return { label: 'Thriving', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'This stage is a strength. Keep investing here.' };
  if (score >= 6) return { label: 'Healthy', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'You\u2019re building well. Small adjustments will strengthen this area.' };
  if (score >= 4) return { label: 'Needs Attention', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'This area needs focused attention. The tools in this stage will help.' };
  return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', desc: 'This is a pressing concern. We recommend starting here.' };
}

export default function Scoreboard() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0 = context, 1-4 = stages, 5 = results, 6 = begin
  const [answers, setAnswers] = useState({});
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [timeline, setTimeline] = useState('');
  const [scores, setScores] = useState(null);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitScoreboard', data),
    onSuccess: (res) => {
      const resultScores = res?.data?.scores || res?.scores || res?.data?.record || res?.record;
      setScores(resultScores);
      queryClient.invalidateQueries({ queryKey: ['leadershipHealthScoreboard', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
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

  const handleExport = () => {
    if (!scores) return;
    exportToPDF({
      title: 'Leadership Health Scoreboard Results',
      subtitle: `Completed ${format(new Date(), 'MMM d, yyyy')} by ${user?.email || 'Unknown'}`,
      filename: 'leadership-health-scoreboard.pdf',
      sections: [
        {
          heading: 'Stage Scores',
          table: {
            headers: ['Stage', 'Score (1-10)', 'Tier'],
            rows: [
              ['Stabilize', String(scores.stabilize_score), getScoreTier(scores.stabilize_score).label],
              ['Align', String(scores.align_score), getScoreTier(scores.align_score).label],
              ['Execute', String(scores.execute_score), getScoreTier(scores.execute_score).label],
              ['Sustain', String(scores.sustain_score), getScoreTier(scores.sustain_score).label],
              ['Overall', String(scores.overall_score), getScoreTier(scores.overall_score).label],
            ],
          },
        },
      ],
    });
  };

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
    const overallTier = getScoreTier(scores.overall_score);
    const stageScores = [
      { name: 'Stabilize', score: scores.stabilize_score, icon: Shield },
      { name: 'Align', score: scores.align_score, icon: Compass },
      { name: 'Execute', score: scores.execute_score, icon: Rocket },
      { name: 'Sustain', score: scores.sustain_score, icon: Leaf },
    ];
    const lowestStage = stageScores.reduce((min, s) => s.score < min.score ? s : min, stageScores[0]);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-display font-bold">Your Scoreboard Results</h1>
          <p className="text-sm text-muted-foreground">Health First. Momentum Next.</p>
        </div>

        {/* Overall score */}
        <Card className={`border-border/50 ${overallTier.bg}`}>
          <CardContent className="p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Leadership Health</p>
            <p className={`text-5xl font-bold ${overallTier.color}`}>{scores.overall_score}<span className="text-lg text-muted-foreground">/10</span></p>
            <p className={`text-sm font-semibold ${overallTier.color} mt-1`}>{overallTier.label}</p>
          </CardContent>
        </Card>

        {/* Stage scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stageScores.map(s => {
            const tier = getScoreTier(s.score);
            const Icon = s.icon;
            return (
              <Card key={s.name} className={`border-border/50 ${tier.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">{s.name}</p>
                    </div>
                    <p className={`text-xl font-bold ${tier.color}`}>{s.score}</p>
                  </div>
                  <p className={`text-xs font-medium ${tier.color}`}>{tier.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tier.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recommendation */}
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">Recommended Starting Point</p>
            <p className="text-sm">
              Your lowest-scoring stage is <strong>{lowestStage.name}</strong> ({lowestStage.score}/10).
              We recommend beginning with Stage 1: Stabilize to build a strong foundation of trust and health.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex-1">
            <Download className="h-4 w-4 mr-1" /> Export PDF
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