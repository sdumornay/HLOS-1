import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2 } from 'lucide-react';

const QUESTIONS = [
  { id: 'q1', text: 'When making decisions, I prefer to:', options: [
    { label: 'Act quickly and decisively', style: 'driver' },
    { label: 'Get input from the whole team', style: 'amiable' },
    { label: 'Analyze all the data first', style: 'analytical' },
    { label: 'Follow my gut and intuition', style: 'expressive' },
  ]},
  { id: 'q2', text: 'In a team meeting, I tend to:', options: [
    { label: 'Take charge and drive the agenda', style: 'driver' },
    { label: 'Encourage others and keep energy high', style: 'expressive' },
    { label: 'Listen carefully and support the group', style: 'amiable' },
    { label: 'Take detailed notes and ask clarifying questions', style: 'analytical' },
  ]},
  { id: 'q3', text: 'When conflict arises, I typically:', options: [
    { label: 'Address it head-on immediately', style: 'driver' },
    { label: 'Try to find a compromise everyone likes', style: 'amiable' },
    { label: 'Look for the logical resolution', style: 'analytical' },
    { label: 'Appeal to shared values and vision', style: 'expressive' },
  ]},
  { id: 'q4', text: 'My greatest strength on a team is:', options: [
    { label: 'Getting things done fast', style: 'driver' },
    { label: 'Inspiring and motivating others', style: 'expressive' },
    { label: 'Keeping harmony and morale high', style: 'amiable' },
    { label: 'Ensuring quality and accuracy', style: 'analytical' },
  ]},
  { id: 'q5', text: 'Under pressure, I tend to:', options: [
    { label: 'Become more demanding and controlling', style: 'driver' },
    { label: 'Overcommit or become disorganized', style: 'expressive' },
    { label: 'Avoid conflict and become passive', style: 'amiable' },
    { label: 'Over-analyze and struggle to decide', style: 'analytical' },
  ]},
  { id: 'q6', text: 'I prefer to receive feedback that is:', options: [
    { label: 'Direct and to the point', style: 'driver' },
    { label: 'Encouraging and story-driven', style: 'expressive' },
    { label: 'Kind and relationship-focused', style: 'amiable' },
    { label: 'Evidence-based and specific', style: 'analytical' },
  ]},
  { id: 'q7', text: 'My ideal work environment is:', options: [
    { label: 'Fast-paced with clear goals', style: 'driver' },
    { label: 'Creative and collaborative', style: 'expressive' },
    { label: 'Stable, cooperative, and supportive', style: 'amiable' },
    { label: 'Structured with clear processes', style: 'analytical' },
  ]},
  { id: 'q8', text: 'When starting a new project, I first:', options: [
    { label: 'Define the goal and get moving', style: 'driver' },
    { label: 'Brainstorm ideas with the team', style: 'expressive' },
    { label: 'Make sure everyone is aligned and on board', style: 'amiable' },
    { label: 'Research and plan thoroughly', style: 'analytical' },
  ]},
];

const STYLES = {
  driver: { label: 'Driver', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-200', desc: 'Results-focused, decisive, direct, and competitive. You thrive on challenges and move fast.' },
  expressive: { label: 'Expressive', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', desc: 'Enthusiastic, creative, and relationship-oriented. You inspire others and bring energy to the team.' },
  amiable: { label: 'Amiable', emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-200', desc: 'Supportive, patient, and empathetic. You are a peacemaker who values harmony and collaboration.' },
  analytical: { label: 'Analytical', emoji: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Detail-oriented, systematic, and logical. You ensure accuracy and think through all the angles.' },
};

function computeResult(answers) {
  const counts = { driver: 0, expressive: 0, amiable: 0, analytical: 0 };
  Object.values(answers).forEach(style => { if (counts[style] !== undefined) counts[style]++; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], secondary: sorted[1][0] };
}

export default function WorkstyleSurveyModal({ open, onClose, orgId, userName, userEmail, onSaved }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(-1); // -1 = name entry, 0 = survey, 1 = results
  const [nameInput, setNameInput] = useState(userName || '');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showManualCopy, setShowManualCopy] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkstyleAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstyleAssessments', orgId] });
      if (onSaved) onSaved();
      toast.success('Workstyle saved to your profile!');
    },
    onError: (err) => toast.error('Failed to save: ' + (err?.message || 'Unknown error')),
  });

  const handleAnswer = (qId, style) => {
    const updated = { ...answers, [qId]: style };
    setAnswers(updated);
    if (Object.keys(updated).length === QUESTIONS.length) {
      const res = computeResult(updated);
      setResult(res);
      setStep(1);
      saveMutation.mutate({
        organization_id: orgId,
        member_name: nameInput.trim() || userName || userEmail || 'Unknown',
        member_email: userEmail || '',
        workstyle_type: res.primary,
        secondary_type: res.secondary,
        strengths: STYLES[res.primary].desc,
      });
    }
  };

  const handleShare = () => {
    if (!result) return;
    setShowManualCopy(true);
  };

  const handleClose = () => {
    setStep(-1);
    setNameInput(userName || '');
    setAnswers({});
    setResult(null);
    setShowManualCopy(false);
    onClose();

  };

  const currentQ = QUESTIONS[Object.keys(answers).length] || QUESTIONS[QUESTIONS.length - 1];
  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg overflow-y-auto" style={{ maxHeight: '90dvh' }}>
        <DialogHeader>
          <DialogTitle>Workstyle Assessment</DialogTitle>
        </DialogHeader>

        {step === -1 && (
          <div className="space-y-5 mt-2">
            <p className="text-sm text-muted-foreground">Before we begin, please enter your name so your results can be recorded.</p>
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder={userName || 'Enter your name...'}
                onKeyDown={e => e.key === 'Enter' && nameInput.trim() && setStep(0)}
                autoFocus
              />
            </div>
            <Button className="w-full" onClick={() => setStep(0)} disabled={!nameInput.trim()}>
              Start Assessment
            </Button>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5 mt-2">
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Question {Math.min(Object.keys(answers).length + 1, QUESTIONS.length)} of {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <p className="text-sm font-medium leading-relaxed">{currentQ.text}</p>
              <div className="space-y-2">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQ.id, opt.style)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-sm transition-all"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && result && (
          <div className="space-y-4 mt-2">
            <div className={`rounded-xl border p-5 text-center ${STYLES[result.primary].color}`}>
              <div className="text-4xl mb-2">{STYLES[result.primary].emoji}</div>
              <h2 className="text-xl font-bold">{STYLES[result.primary].label}</h2>
              <p className="text-sm mt-2 opacity-90">{STYLES[result.primary].desc}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Secondary style:</span>
              <Badge variant="outline" className="text-xs">
                {STYLES[result.secondary].emoji} {STYLES[result.secondary].label}
              </Badge>
            </div>

            {saveMutation.isPending && (
              <p className="text-xs text-muted-foreground text-center">Saving your results...</p>
            )}

            {showManualCopy && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Click the text below to select, then copy (Ctrl+C / Cmd+C):</p>
                <textarea
                  readOnly
                  autoFocus
                  onClick={e => e.target.select()}
                  onFocus={e => e.target.select()}
                  className="w-full text-xs border border-primary rounded-md p-2 bg-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={4}
                  value={`My workstyle is ${STYLES[result.primary].emoji} ${STYLES[result.primary].label} (secondary: ${STYLES[result.secondary].label}). "${STYLES[result.primary].desc}"`}
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Results
              </Button>
              <Button type="button" onClick={handleClose} className="flex-1">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}