import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ClipboardCheck, Activity, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ExportPDFButton from '@/components/shared/ExportPDFButton';
import TeamHealthTrends from '@/components/assessments/TeamHealthTrends';
import WorkstyleSurveyModal from '@/components/shared/WorkstyleSurveyModal';
import FiveDysfunctionsModal from '@/components/shared/FiveDysfunctionsModal';

const DIMENSIONS = [
  { key: 'trust', label: 'Trust', desc: 'How much do team members trust each other?' },
  { key: 'safety', label: 'Psychological Safety', desc: 'Do people feel safe to speak honestly?' },
  { key: 'clarity', label: 'Clarity', desc: 'Is the vision and direction clear?' },
  { key: 'accountability', label: 'Accountability', desc: 'Are people following through on commitments?' },
  { key: 'meeting_effectiveness', label: 'Meeting Effectiveness', desc: 'Are meetings productive and well-run?' },
  { key: 'conflict_intensity', label: 'Conflict Intensity', desc: 'How intense is unresolved conflict? (lower = healthier)' },
];

const WORKSTYLE_MAP = {
  head: { emoji: '🧠', label: 'Head' },
  heart: { emoji: '❤️', label: 'Heart' },
  gut: { emoji: '🔥', label: 'Gut' },
  feet: { emoji: '👟', label: 'Feet' },
};

export default function Assessments() {
  const { user, canManageAll } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [workstyleOpen, setWorkstyleOpen] = useState(false);
  const [fiveDysOpen, setFiveDysOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'pulse',
    stage: 'stabilize',
    trust: 5, safety: 5, clarity: 5, accountability: 5, meeting_effectiveness: 5, conflict_intensity: 5,
    notes: '',
  });

  const orgId = user?.organization_id;

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 50),
  });

  const { data: workstyleResults = [], refetch: refetchWorkstyles } = useQuery({
    queryKey: ['workstyleAssessments', orgId],
    queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }, '-created_date', 50),
    enabled: !!orgId,
  });

  const myAssessments = canManageAll ? assessments : assessments.filter(a => a.organization_id === orgId);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setOpen(false);
      toast.success('Assessment saved.');
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err?.message || 'Unknown error'));
    },
  });

  const handleSubmit = () => {
    if (!orgId) {
      toast.error('No organization found. Please complete onboarding first.');
      return;
    }
    const scores = DIMENSIONS.map(d => form[d.key]);
    const healthSum = scores.reduce((s, v) => s + v, 0);
    const overall = parseFloat((healthSum / scores.length).toFixed(1));
    createMutation.mutate({
      ...form,
      organization_id: orgId,
      respondent_email: user?.email,
      overall_health: overall,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Assessments</h1>
          <p className="text-muted-foreground mt-1">Pulse surveys and health check-ins</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPDFButton
            title="Assessments Report"
            subtitle={`${myAssessments.length} assessments`}
            filename="assessments.pdf"
            sections={[{
              heading: 'Assessment History',
              table: {
                headers: ['Date', 'Respondent', 'Type', 'Stage', 'Health Score'],
                rows: myAssessments.map(a => [
                  a.created_date ? format(new Date(a.created_date), 'MMM d, yyyy') : '—',
                  a.respondent_email, a.type, a.stage || '—',
                  a.overall_health?.toFixed(1) || '—'
                ])
              }
            }]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Assessment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Take Assessment</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Initial</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="exit">Exit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stage</Label>
                    <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stabilize">Stabilize</SelectItem>
                        <SelectItem value="align">Align</SelectItem>
                        <SelectItem value="execute">Execute</SelectItem>
                        <SelectItem value="sustain">Sustain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {DIMENSIONS.map(dim => (
                  <div key={dim.key} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <Label>{dim.label}</Label>
                      <span className="text-sm font-semibold text-primary">{form[dim.key]}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{dim.desc}</p>
                    <Slider
                      value={[form[dim.key]]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([v]) => setForm(f => ({ ...f, [dim.key]: v }))}
                    />
                  </div>
                ))}

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any additional observations..."
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Survey Launchers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">Team Health &amp; Culture Assessment</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">5 Dysfunctions</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Based on Lencioni&#39;s Five Dysfunctions — rate trust, conflict, commitment, accountability, and results. Takes 3-5 minutes.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFiveDysOpen(true)} className="flex-shrink-0 gap-1.5">Start</Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">Workstyle Assessment</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground border border-accent/30">Workstyle</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Discover your natural leadership style — Head, Heart, Gut, or Feet. Results save to your profile and can be shared. ~3 minutes.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setWorkstyleOpen(true)} className="flex-shrink-0 gap-1.5">Start</Button>
          </CardContent>
        </Card>
      </div>

      <FiveDysfunctionsModal
        open={fiveDysOpen}
        onClose={() => setFiveDysOpen(false)}
        orgId={orgId}
      />
      <WorkstyleSurveyModal
        open={workstyleOpen}
        onClose={() => setWorkstyleOpen(false)}
        orgId={orgId}
        userName={user?.full_name}
        userEmail={user?.email}
        onSaved={() => refetchWorkstyles()}
      />

      {/* Team Health Trends */}
      {myAssessments.length > 0 && (
        <TeamHealthTrends assessments={myAssessments} />
      )}

      {/* Workstyle Results */}
      {workstyleResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Workstyle Results</h2>
          <div className="grid gap-3">
            {workstyleResults.map(w => {
              const p = WORKSTYLE_MAP[w.workstyle_type] || { emoji: '⚪', label: w.workstyle_type };
              const s = WORKSTYLE_MAP[w.secondary_type] || { emoji: '⚪', label: w.secondary_type };
              return (
                <Card key={w.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-xl">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{w.member_name}</p>
                        <Badge variant="outline" className="text-xs">{p.label}</Badge>
                        {w.secondary_type && (
                          <Badge variant="outline" className="text-xs opacity-70">{s.emoji} {s.label}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {w.member_email && <span>{w.member_email} &bull; </span>}
                        {w.created_date ? format(new Date(w.created_date), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Pulse Assessment History */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Assessment History</h2>
        <div className="grid gap-3">
          {myAssessments.map(a => (
            <Card key={a.id} className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium capitalize">{a.type} Assessment</p>
                    <Badge variant="outline" className="text-xs capitalize">{a.stage}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.respondent_email} &bull; {a.created_date ? format(new Date(a.created_date), 'MMM d, yyyy') : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-lg">{a.overall_health?.toFixed(1) || '—'}</p>
                    <p className="text-xs text-muted-foreground">Health</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {myAssessments.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No assessments yet. Start your first pulse survey.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}