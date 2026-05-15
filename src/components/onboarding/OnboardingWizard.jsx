import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2, Building2, Users, Target, ChevronRight, ChevronLeft, X } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome to HLOS', icon: Building2 },
  { id: 'org', title: 'Your Organization', icon: Building2 },
  { id: 'team', title: 'Invite Your Team', icon: Users },
  { id: 'priority', title: 'First Priority', icon: Target },
  { id: 'done', title: "You're Set Up!", icon: CheckCircle2 },
];

export default function OnboardingWizard({ open, onClose }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [orgData, setOrgData] = useState({ name: '', type: 'church', city: '', state: '' });
  const [teamEmails, setTeamEmails] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [createdOrgId, setCreatedOrgId] = useState(null);

  const createOrg = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: async (org) => {
      setCreatedOrgId(org.id);
      await base44.auth.updateMe({ organization_id: org.id });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setStep(2);
    },
  });

  const inviteTeam = useMutation({
    mutationFn: async (emails) => {
      const list = emails.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
      await Promise.allSettled(list.map(email => base44.users.inviteUser(email, 'team_member')));
    },
    onSuccess: () => setStep(3),
  });

  const createAction = useMutation({
    mutationFn: (title) => base44.entities.Action.create({
      title,
      organization_id: createdOrgId,
      owner_email: user?.email,
      priority: 'high',
      stage: 'stabilize',
      status: 'pending',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      setStep(4);
    },
  });

  const handleOrgNext = () => {
    if (!orgData.name.trim()) return;
    createOrg.mutate({ ...orgData, coach_email: user?.email, current_stage: 'stabilize' });
  };

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" hideClose>
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            {step > 0 && (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 px-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : i < step ? 'w-3 bg-accent/40' : 'w-3 bg-muted'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-4 min-h-[280px]">

          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
                <p className="font-barlow font-bold text-2xl mb-2">Health First. Momentum Next.</p>
                <p className="text-white/70 text-sm">HLOS guides your leadership team through a proven 4-stage framework: Stabilize → Align → Execute → Sustain.</p>
              </div>
              <p className="text-sm text-muted-foreground">This quick setup takes about 2 minutes. You'll set up your organization, invite your team, and create your first action item.</p>
              <Button className="w-full" onClick={() => setStep(1)}>
                Get Started <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <Label>Organization Name *</Label>
                <Input
                  value={orgData.name}
                  onChange={e => setOrgData(d => ({ ...d, name: e.target.value }))}
                  placeholder="First Baptist Church"
                  autoFocus
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={orgData.type} onValueChange={v => setOrgData(d => ({ ...d, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input value={orgData.city} onChange={e => setOrgData(d => ({ ...d, city: e.target.value }))} placeholder="City" /></div>
                <div>
                  <Label>State</Label>
                  <Select value={orgData.state} onValueChange={v => setOrgData(d => ({ ...d, state: v }))}>
                    <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleOrgNext} disabled={!orgData.name.trim() || createOrg.isPending}>
                {createOrg.isPending ? 'Creating...' : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter email addresses of team members to invite (one per line or comma-separated). They'll receive an invitation email.</p>
              <Textarea
                value={teamEmails}
                onChange={e => setTeamEmails(e.target.value)}
                placeholder="pastor@church.org&#10;worship@church.org&#10;admin@church.org"
                className="h-28"
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Skip for now</Button>
                <Button className="flex-1" onClick={() => inviteTeam.mutate(teamEmails)} disabled={!teamEmails.trim() || inviteTeam.isPending}>
                  {inviteTeam.isPending ? 'Inviting...' : <>Invite Team <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">What's the most important thing your team needs to work on right now? This becomes your first action item.</p>
              <Input
                value={actionTitle}
                onChange={e => setActionTitle(e.target.value)}
                placeholder="e.g. Schedule initial team assessment"
                autoFocus
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Skip for now</Button>
                <Button className="flex-1" onClick={() => createAction.mutate(actionTitle)} disabled={!actionTitle.trim() || createAction.isPending}>
                  {createAction.isPending ? 'Creating...' : <>Create Action <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-barlow font-bold text-xl">You're ready to go!</p>
                <p className="text-sm text-muted-foreground mt-1">Your organization is set up. Start by taking a health assessment to baseline where your team is today.</p>
              </div>
              <Button className="w-full" onClick={onClose}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}