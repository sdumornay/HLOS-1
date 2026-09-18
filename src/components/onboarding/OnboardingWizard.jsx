import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Building2, Users, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEPS = [
  { id: 'org',    title: 'Your Organization', icon: Building2 },
  { id: 'team',   title: 'Your Team',          icon: Users },
  { id: 'done',   title: "You're All Set!",    icon: CheckCircle2 },
];

const ORG_TYPES = [
  { value: 'church', label: 'Church' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function OnboardingWizard({ open, onComplete }) {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [errorMsg, setErrorMsg] = useState('');

  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('church');
  const [role, setRole] = useState('lead_pastor');
  const [leaderName, setLeaderName] = useState(user?.full_name || '');
  const [leaderEmail, setLeaderEmail] = useState(user?.email || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '' }]);

  // ── Step 1: create org + link user via backend function ──────────────────
  const createOrgMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      const response = await base44.functions.invoke('createOrganization', {
        name: orgName.trim(),
        city: city.trim(),
        state: state.trim(),
        orgType,
        role,
        leaderName: leaderName.trim(),
        leaderEmail: leaderEmail.trim(),
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

  const handleDone = () => {
    // After onboarding, go straight to the Scoreboard
    if (onComplete) {
      onComplete(true);
    }
    navigate('/scoreboard');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden [&>button]:hidden max-h-[90vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="h-1 bg-muted sticky top-0 z-10">
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
        <div className="px-8 py-6 space-y-4">

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
                  <Label>Organization Type *</Label>
                  <Select value={orgType} onValueChange={setOrgType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="leader-name">Primary Leader Name *</Label>
                  <Input
                    id="leader-name"
                    value={leaderName}
                    onChange={e => setLeaderName(e.target.value)}
                    placeholder="Pastor John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="leader-email">Leader Email *</Label>
                  <Input
                    id="leader-email"
                    type="email"
                    value={leaderEmail}
                    onChange={e => setLeaderEmail(e.target.value)}
                    placeholder="pastor@church.org"
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
                      <SelectItem value="team_member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Nashville"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
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
                disabled={!orgName.trim() || !leaderName.trim() || !leaderEmail.trim() || createOrgMutation.isPending}
              >
                {createOrgMutation.isPending ? 'Setting up...' : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </div>
          )}

          {/* ── Step 1: Team members ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add your leadership team members. They'll receive an email invitation to join your organization.
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
                <p className="font-barlow font-bold text-xl">Your organization is ready!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Next, you'll take the Leadership Health Scoreboard — a 16-question diagnostic that creates your baseline and unlocks Stage 1.
                </p>
              </div>
              <Button className="w-full" onClick={handleDone}>
                Continue to Scoreboard <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}