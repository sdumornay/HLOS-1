import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ClipboardCheck, Activity, Users } from 'lucide-react';
import { format } from 'date-fns';
import ExportPDFButton from '@/components/shared/ExportPDFButton';
import SurveyLaunchCard from '@/components/shared/SurveyLaunchCard';

const DIMENSIONS = [
  { key: 'trust', label: 'Trust', desc: 'How much do team members trust each other?' },
  { key: 'safety', label: 'Psychological Safety', desc: 'Do people feel safe to speak honestly?' },
  { key: 'clarity', label: 'Clarity', desc: 'Is the vision and direction clear?' },
  { key: 'accountability', label: 'Accountability', desc: 'Are people following through on commitments?' },
  { key: 'meeting_effectiveness', label: 'Meeting Effectiveness', desc: 'Are meetings productive and well-run?' },
  { key: 'conflict_intensity', label: 'Conflict Intensity', desc: 'How intense is unresolved conflict? (lower = healthier)' },
];

export default function Assessments() {
  const { user, canManageAll } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'pulse',
    stage: 'stabilize',
    trust: 5, safety: 5, clarity: 5, accountability: 5, meeting_effectiveness: 5, conflict_intensity: 5,
    notes: '',
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 50),
  });

  const orgId = user?.organization_id;
  const myAssessments = canManageAll ? assessments : assessments.filter(a => a.organization_id === orgId);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setOpen(false);
    },
  });

  const handleSubmit = () => {
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

      {/* External Survey Launchers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <SurveyLaunchCard
          title="Team Health & Culture Assessment"
          description="Based on Lencioni's Five Dysfunctions — 15 questions on trust, conflict, commitment, accountability, and results. Takes 5-7 minutes."
          url="https://org-pulse-check.base44.app"
          icon={Users}
          accentColor="text-secondary"
          badgeLabel="5 Dysfunctions"
        />
        <SurveyLaunchCard
          title="Workstyle Assessment"
          description="Discover your natural leadership approach across Head, Heart, Gut, and Feet dimensions. 20 questions, ~5 minutes."
          url="https://workstyle-nav-go.base44.app"
          icon={Activity}
          accentColor="text-accent"
          badgeLabel="Workstyle"
        />
      </div>

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
                  {a.respondent_email} • {a.created_date ? format(new Date(a.created_date), 'MMM d, yyyy') : ''}
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
  );
}