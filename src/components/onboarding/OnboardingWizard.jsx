import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Building2, Users, ChevronRight, Heart, Plus, X, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEPS = [
  { id: 'org',    title: 'Your Organization', icon: Building2 },
  { id: 'team',   title: 'Your Team',          icon: Users },
  { id: 'done',   title: "You're All Set!",    icon: CheckCircle2 },
];

export default function OnboardingWizard({ open, onComplete }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [errorMsg, setErrorMsg] = React.useState('');

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('lead_pastor');
  const [leaderName, setLeaderName] = useState('');
  const [city, setCity] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '' }]);

  // ── Step 1: create org + link user via backend function ──────────────────
  const createOrgMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      const response = await base44.functions.invoke('createOrganization', {
        name: orgName.trim(),
        city: city.trim(),
        role,
        leaderName: leaderName.trim(),
      });
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      return response.data?.org;
    },
    onSuccess: () => setStep(1),
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Setup failed. Please try again.';
      console.error('Onboarding error:', msg, err);
      setErrorMsg(msg);
      toast({ title: 'Setup failed', description: msg, variant: 'destructive' });
    },
  });

  // ── Step 2: invite team members ───────────────────────────────────────────
  const inviteTeamMutation = useMutation({
    mutationFn: async () => {
      const valid = members.filter(m => m.email.trim());
      await Promise.allSettled(
        valid.map(m => base44.users.inviteUser(m.email.trim(), 'team_member'))
      );
    },
    onSuccess: () => setStep(2),
    onError: () => setStep(2), // non-blocking — proceed even on partial failure
  });

  const addMember = () => setMembers(ms => [...ms, { name: '', email: '' }]);
  const removeMember = (i) => setMembers(ms => ms.filter((_, idx) => idx !== i));
  const updateMember = (i, field, val) =>
    setMembers(ms => ms.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const hasAnyEmail = members.some(m => m.email.trim());

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden [&>button]:hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-1 bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="px-8 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {React.createElement(STEPS[step].icon, { className: 'h-5 w-5 text-accent' })}
            <h2 className="font-barlow font-bold text-xl">{STEPS[step].title}</h2>
          </div>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 px-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : i < step ? 'w-3 bg-accent/40' : 'w-3 bg-muted'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-4 min-h-[300px]">

          {/* ── Step 0: Organization info ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-white">
                <p className="font-barlow font-bold text-xl mb-1">Welcome to HLOS</p>
                <p className="text-white/70 text-sm">Let's set up your organization so you can start tracking team health.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="First Baptist Church"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="leader-name">Your Name *</Label>
                  <Input
                    id="leader-name"
                    value={leaderName}
                    onChange={e => setLeaderName(e.target.value)}
                    placeholder="Pastor John Smith"
                  />
                </div>
                <div>
                  <Label>Your Role *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead_pastor">Lead Pastor</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="team_member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Nashville"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => createOrgMutation.mutate()}
                disabled={!orgName.trim() || !leaderName.trim() || createOrgMutation.isPending}
              >
                {createOrgMutation.isPending ? 'Setting up...' : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
              </Button>
              <button
                onClick={onComplete}
                className="w-full text-xs text-muted-foreground hover:underline pt-1"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* ── Step 1: Team members ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add your team members. They'll receive an email invitation to join your organization.
              </p>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={m.name}
                      onChange={e => updateMember(i, 'name', e.target.value)}
                      placeholder="Name"
                      className="w-36 shrink-0"
                    />
                    <Input
                      value={m.email}
                      onChange={e => updateMember(i, 'email', e.target.value)}
                      placeholder="email@church.org"
                      type="email"
                      className="flex-1"
                    />
                    {members.length > 1 && (
                      <button onClick={() => removeMember(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addMember}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add another member
              </button>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => inviteTeamMutation.mutate()}
                  disabled={!hasAnyEmail || inviteTeamMutation.isPending}
                >
                  {inviteTeamMutation.isPending ? 'Inviting...' : <>Invite Team <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Done ── */}
          {step === 2 && (
            <div className="space-y-4 text-center pt-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-barlow font-bold text-xl">You're ready to go!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your organization is live. Start by taking a health assessment to baseline where your team is today.
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 flex items-center gap-3 text-left">
                <Heart className="h-5 w-5 text-accent shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Next step:</span> Head to Assessments and run your first Health Pulse to see where your team stands.
                </p>
              </div>
              <Button className="w-full" onClick={() => onComplete(true)}>
                Go to My Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}