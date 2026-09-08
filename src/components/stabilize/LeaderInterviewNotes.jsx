import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const FIELDS = [
  { key: 'strengths_observed', label: 'Perceived Strengths', placeholder: "What strengths do you see in yourself as a leader?" },
  { key: 'weaknesses', label: 'Weaknesses', placeholder: "What weaknesses or areas do you struggle with?" },
  { key: 'leadership_gaps', label: 'Leadership Gaps', placeholder: "Where do you notice gaps or blind spots in your leadership?" },
  { key: 'tensions_perceived', label: 'Tensions', placeholder: "What tensions are you currently carrying?" },
  { key: 'hopes_for_team', label: 'Hopes for the Team', placeholder: "What do you hope for in your team's future?" },
  { key: 'concerns', label: 'Concerns', placeholder: "What concerns or fears do you have?" },
];

const BLANK = { interviewee_name: '', interviewee_role: '', date: '', strengths_observed: '', weaknesses: '', tensions_perceived: '', leadership_gaps: '', hopes_for_team: '', concerns: '' };

export default function LeaderInterviewNotes({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ ...BLANK, interviewee_name: user?.full_name || '', date: new Date().toISOString().split('T')[0] });

  const { data: interviews = [] } = useQuery({
    queryKey: ['leaderInterviews', orgId],
    queryFn: () => base44.entities.LeaderInterview.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaderInterview.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderInterviews', orgId] });
      setOpen(false);
      setForm({ ...BLANK, interviewee_name: user?.full_name || '', date: new Date().toISOString().split('T')[0] });
    },
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-base font-semibold">Leader Self-Assessment</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> New Reflection
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Your Name</Label>
                <Input value={form.interviewee_name} onChange={e => setForm({ ...form, interviewee_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Role / Title</Label>
                <Input value={form.interviewee_role} onChange={e => setForm({ ...form, interviewee_role: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            {FIELDS.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Textarea placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={2} />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.interviewee_name}>Save Reflection</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {interviews.map(iv => (
            <div key={iv.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === iv.id ? null : iv.id)}>
                <div>
                  <p className="text-sm font-medium">{iv.interviewee_name}</p>
                  <p className="text-xs text-muted-foreground">{iv.interviewee_role} {iv.date && `• ${format(new Date(iv.date), 'MMM d, yyyy')}`}</p>
                </div>
                {expanded === iv.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {expanded === iv.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-2 text-sm">
                  {FIELDS.filter(f => iv[f.key]).map(f => (
                    <div key={f.key}>
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="mt-0.5">{iv[f.key]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {interviews.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No reflections logged yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}