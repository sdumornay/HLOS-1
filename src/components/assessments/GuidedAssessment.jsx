import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, Check, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STEPS = [
  { key: 'trust', label: 'Trust', question: 'How much do team members trust each other?', hint: '10 = complete trust, 1 = no trust' },
  { key: 'safety', label: 'Psychological Safety', question: 'Do people feel safe to speak honestly?', hint: '10 = completely safe, 1 = not safe' },
  { key: 'clarity', label: 'Clarity', question: 'Is the vision and direction clear?', hint: '10 = crystal clear, 1 = very unclear' },
  { key: 'accountability', label: 'Accountability', question: 'Are people following through on commitments?', hint: '10 = always, 1 = rarely' },
  { key: 'meeting_effectiveness', label: 'Meeting Quality', question: 'Are meetings productive and well-run?', hint: '10 = very productive, 1 = waste of time' },
  { key: 'conflict_intensity', label: 'Conflict Level', question: 'How intense is unresolved conflict?', hint: '1 = no conflict (healthy), 10 = very intense' },
];

export default function GuidedAssessment({ open, onClose, orgId, user }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({});
  const [done, setDone] = useState(false);

  const currentStep = STEPS[step];
  const currentValue = scores[currentStep.key] ?? 5;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setDone(true);
    },
    onError: (err) => toast({
      title: 'Failed to save',
      description: err?.message || 'Unknown error',
      variant: 'destructive',
    }),
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Submit
      const allScores = STEPS.map(s => scores[s.key] ?? 5);
      const overall = parseFloat((allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(1));
      if (!orgId) {
        toast({
          title: 'No organization found',
          description: 'Please complete onboarding first.',
          variant: 'destructive',
        });
        return;
      }
      if (!user?.email) {
        toast({
          title: 'Unable to identify your account',
          description: 'Please refresh and try again.',
          variant: 'destructive',
        });
        return;
      }
      createMutation.mutate({
        organization_id: orgId,
        respondent_email: user?.email,
        type: 'pulse',
        stage: 'stabilize',
        ...scores,
        overall_health: overall,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    setStep(0);
    setScores({});
    setDone(false);
    onClose();
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" />
            {done ? 'Assessment Complete!' : 'Quick Health Check'}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">
                {STEPS.map(s => scores[s.key] ?? 5).reduce((sum, v) => sum + v, 0) / STEPS.length}
              </p>
              <p className="text-sm text-muted-foreground">Your overall health score</p>
            </div>
            <p className="text-sm text-muted-foreground">Thank you! Your responses have been saved.</p>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Question {step + 1} of {STEPS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question */}
            <Card className="border-border/50 bg-muted/20">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">{currentStep.label}</p>
                  <p className="text-base font-medium leading-snug">{currentStep.question}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">{currentStep.hint}</span>
                    <span className="text-2xl font-bold text-primary">{currentValue}</span>
                  </div>
                  <Slider
                    value={[currentValue]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([v]) => setScores(s => ({ ...s, [currentStep.key]: v }))}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground/60">
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleBack} disabled={step === 0} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleNext} disabled={createMutation.isPending} className="flex-1">
                {step < STEPS.length - 1 ? (
                  <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
                ) : (
                  createMutation.isPending ? 'Submitting...' : 'Submit'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}