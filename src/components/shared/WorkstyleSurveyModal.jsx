import React, { useState, useEffect } from 'react';
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
  { id: 'q1', text: 'When tackling a new challenge, I first:', options: [
    { label: 'Research, analyze data, and map out a strategy', style: 'head' },
    { label: 'Talk it through with the team and check in on how everyone feels', style: 'heart' },
    { label: 'Trust my instincts and make a bold move', style: 'gut' },
    { label: 'Jump in, try something, and figure it out as I go', style: 'feet' },
  ]},
  { id: 'q2', text: 'In a team meeting, I naturally:', options: [
    { label: 'Come prepared with facts, data, and a structured plan', style: 'head' },
    { label: 'Focus on group dynamics and make sure everyone is heard', style: 'heart' },
    { label: 'Push for a decision and challenge the status quo', style: 'gut' },
    { label: 'Focus on next steps and who is doing what by when', style: 'feet' },
  ]},
  { id: 'q3', text: 'When I make decisions, I rely most on:', options: [
    { label: 'Logic, evidence, and careful analysis', style: 'head' },
    { label: 'How the decision will affect relationships and team morale', style: 'heart' },
    { label: "A strong inner sense of what's right", style: 'gut' },
    { label: 'Past experience and what has worked practically before', style: 'feet' },
  ]},
  { id: 'q4', text: 'Under pressure, I tend to:', options: [
    { label: 'Withdraw to think and analyze the situation deeply', style: 'head' },
    { label: 'Seek support from others and worry about the team', style: 'heart' },
    { label: 'Become more intense and decisive, sometimes dismissing input', style: 'gut' },
    { label: 'Work harder and longer, focusing on execution', style: 'feet' },
  ]},
  { id: 'q5', text: 'My greatest contribution to a team is:', options: [
    { label: 'Providing clear thinking, frameworks, and well-reasoned plans', style: 'head' },
    { label: 'Building trust, keeping the peace, and caring for people', style: 'heart' },
    { label: 'Providing vision, inspiration, and bold direction', style: 'gut' },
    { label: 'Getting things done reliably and moving projects forward', style: 'feet' },
  ]},
  { id: 'q6', text: 'I prefer to receive feedback that is:', options: [
    { label: 'Specific, data-based, and logically structured', style: 'head' },
    { label: 'Warm, encouraging, and relationship-preserving', style: 'heart' },
    { label: 'Direct, honest, and forward-looking', style: 'gut' },
    { label: 'Tied to concrete actions I can take immediately', style: 'feet' },
  ]},
  { id: 'q7', text: 'My ideal work environment is:', options: [
    { label: 'Structured, systematic, and intellectually stimulating', style: 'head' },
    { label: 'Collaborative, harmonious, and relational', style: 'heart' },
    { label: 'Dynamic, high-stakes, and vision-driven', style: 'gut' },
    { label: 'Hands-on, results-focused, and efficient', style: 'feet' },
  ]},
  { id: 'q8', text: 'When conflict arises on my team, I:', options: [
    { label: 'Step back, assess the situation objectively, and propose a rational solution', style: 'head' },
    { label: 'Try to mediate, keep relationships intact, and ensure everyone feels respected', style: 'heart' },
    { label: 'Confront it directly and push for a quick resolution', style: 'gut' },
    { label: 'Focus on fixing the practical issue causing the conflict', style: 'feet' },
  ]},
  { id: 'q9', text: 'When planning a new initiative, I focus on:', options: [
    { label: 'The strategy, timelines, risks, and metrics for success', style: 'head' },
    { label: 'Who will be affected and how to bring everyone along', style: 'heart' },
    { label: 'The big-picture vision and why it matters', style: 'gut' },
    { label: 'The specific tasks, resources, and execution steps', style: 'feet' },
  ]},
  { id: 'q10', text: 'My blind spot as a leader is often:', options: [
    { label: 'Over-analyzing and getting stuck in planning mode', style: 'head' },
    { label: 'Avoiding hard decisions to protect relationships', style: 'heart' },
    { label: 'Acting too quickly without consulting others', style: 'gut' },
    { label: 'Focusing on tasks at the expense of bigger-picture thinking', style: 'feet' },
  ]},
  { id: 'q11', text: 'I feel most energized when I am:', options: [
    { label: 'Solving complex problems and thinking strategically', style: 'head' },
    { label: 'Connecting with people and investing in relationships', style: 'heart' },
    { label: 'Casting vision and inspiring others toward something new', style: 'gut' },
    { label: 'Completing tasks and seeing real, tangible progress', style: 'feet' },
  ]},
  { id: 'q12', text: 'When evaluating a new idea, I ask:', options: [
    { label: 'Does the data support this? What are the risks?', style: 'head' },
    { label: 'How will this affect the people involved?', style: 'heart' },
    { label: 'Does this feel right? Is this the bold move we need?', style: 'gut' },
    { label: "Can we actually implement this? What's the first step?", style: 'feet' },
  ]},
  { id: 'q13', text: 'My communication style is best described as:', options: [
    { label: 'Precise, measured, and evidence-driven', style: 'head' },
    { label: 'Warm, empathetic, and people-centered', style: 'heart' },
    { label: 'Passionate, direct, and inspiring', style: 'gut' },
    { label: 'Clear, concise, and action-oriented', style: 'feet' },
  ]},
  { id: 'q14', text: 'I am most frustrated when:', options: [
    { label: 'Decisions are made without sufficient data or careful thought', style: 'head' },
    { label: 'People are treated as resources rather than as valued human beings', style: 'heart' },
    { label: 'The team lacks courage, vision, or a willingness to take risks', style: 'gut' },
    { label: 'Progress is slow, meetings are unproductive, and nothing gets done', style: 'feet' },
  ]},
  { id: 'q15', text: 'When leading a project, I am most known for:', options: [
    { label: 'Thorough planning and attention to quality and detail', style: 'head' },
    { label: 'Creating a culture where people feel safe and valued', style: 'heart' },
    { label: 'Setting a bold direction and inspiring commitment', style: 'gut' },
    { label: 'Delivering results on time and keeping things moving', style: 'feet' },
  ]},
  { id: 'q16', text: 'I tend to trust leaders who:', options: [
    { label: 'Are knowledgeable, competent, and think carefully before acting', style: 'head' },
    { label: 'Genuinely care about people and lead with humility', style: 'heart' },
    { label: 'Are courageous, visionary, and willing to take bold risks', style: 'gut' },
    { label: 'Are reliable, consistent, and get results', style: 'feet' },
  ]},
  { id: 'q17', text: 'In a crisis, I naturally:', options: [
    { label: 'Slow down, gather information, and create a structured response plan', style: 'head' },
    { label: 'Prioritize caring for the people affected and maintaining trust', style: 'heart' },
    { label: 'Take decisive action based on intuition and experience', style: 'gut' },
    { label: 'Mobilize resources quickly and focus on solving the immediate problem', style: 'feet' },
  ]},
  { id: 'q18', text: 'My approach to learning and growth is:', options: [
    { label: 'Reading, research, and deepening expertise in specific areas', style: 'head' },
    { label: 'Learning through conversations, mentoring, and relationship', style: 'heart' },
    { label: 'Reflection, spiritual insight, and pursuing transformational experiences', style: 'gut' },
    { label: 'Hands-on experience, trial and error, and learning by doing', style: 'feet' },
  ]},
  { id: 'q19', text: 'When a team member is struggling, I tend to:', options: [
    { label: 'Diagnose the root cause and offer a clear plan to improve', style: 'head' },
    { label: 'Check in personally, listen deeply, and offer emotional support', style: 'heart' },
    { label: 'Speak candidly about what I sense is really going on', style: 'gut' },
    { label: 'Help them identify practical next steps and get back on track', style: 'feet' },
  ]},
  { id: 'q20', text: 'Others would describe my leadership as:', options: [
    { label: 'Strategic, thoughtful, and thorough', style: 'head' },
    { label: 'Caring, relational, and people-first', style: 'heart' },
    { label: 'Bold, visionary, and courageous', style: 'gut' },
    { label: 'Dependable, driven, and results-oriented', style: 'feet' },
  ]},
];

const STYLES = {
  head:  { label: 'Head',  emoji: '🧠', color: 'bg-cyan-100 text-cyan-800 border-cyan-200',   desc: 'Analytical & Strategic — You lead with data, careful thinking, and structured plans. You ensure decisions are well-reasoned and risks are managed.' },
  heart: { label: 'Heart', emoji: '❤️', color: 'bg-rose-100 text-rose-800 border-rose-200',   desc: 'Empathetic & Relational — You lead with care for people. You build trust, maintain harmony, and ensure everyone feels heard and valued.' },
  gut:   { label: 'Gut',   emoji: '🔥', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: "Intuitive & Decisive — You lead with instinct and vision. You are bold, courageous, and willing to take risks others won't." },
  feet:  { label: 'Feet',  emoji: '👟', color: 'bg-green-100 text-green-800 border-green-200', desc: 'Practical & Action-Oriented — You lead through execution. You get things done, keep projects moving, and deliver consistent results.' },
};

function computeResult(answers) {
  const counts = { head: 0, heart: 0, gut: 0, feet: 0 };
  Object.values(answers).forEach(style => { if (counts[style] !== undefined) counts[style]++; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], secondary: sorted[1][0] };
}

export default function WorkstyleSurveyModal({ open, onClose, orgId, userName, userEmail, onSaved }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(-1);
  const [nameInput, setNameInput] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showManualCopy, setShowManualCopy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(-1);
      setNameInput(userName || '');
      setAnswers({});
      setResult(null);
      setShowManualCopy(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkstyleAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstyleAssessments', orgId] });
      queryClient.invalidateQueries({ queryKey: ['workstyle-mine', userEmail] });
      if (onSaved) onSaved();
      toast.success('Workstyle saved!');
    },
    onError: (err) => toast.error('Failed to save: ' + (err?.message || 'Unknown error')),
  });

  const currentQIndex = Object.keys(answers).length;
  const currentQ = QUESTIONS[currentQIndex];
  const progress = (currentQIndex / QUESTIONS.length) * 100;

  const handleAnswer = (qId, style) => {
    const updated = { ...answers, [qId]: style };
    setAnswers(updated);
    if (Object.keys(updated).length === QUESTIONS.length) {
      const res = computeResult(updated);
      setResult(res);
      setStep('results');
      saveMutation.mutate({
        organization_id: orgId || '',
        member_name: nameInput.trim() || userName || userEmail || 'Unknown',
        member_email: userEmail || '',
        workstyle_type: res.primary,
        secondary_type: res.secondary,
        strengths: STYLES[res.primary].desc,
      });
    }
  };

  const handleClose = () => {
    setStep(-1);
    setNameInput(userName || '');
    setAnswers({});
    setResult(null);
    setShowManualCopy(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg overflow-y-auto" style={{ maxHeight: '90dvh' }}>
        <DialogHeader>
          <DialogTitle>Workstyle Assessment</DialogTitle>
        </DialogHeader>

        {/* Step -1: Name entry */}
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
              Start Assessment →
            </Button>
          </div>
        )}

        {/* Survey questions */}
        {step !== -1 && step !== 'results' && currentQ && (
          <div className="space-y-5 mt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Question {currentQIndex + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
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

        {/* Results */}
        {step === 'results' && result && (
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
                <p className="text-xs text-muted-foreground font-medium">Click to select, then copy (Ctrl+C / Cmd+C):</p>
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
              <Button type="button" variant="outline" onClick={() => setShowManualCopy(true)} className="flex-1 gap-2">
                <Share2 className="h-4 w-4" /> Share Results
              </Button>
              <Button type="button" onClick={handleClose} className="flex-1">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}