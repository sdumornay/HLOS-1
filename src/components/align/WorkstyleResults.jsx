import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const STYLES = {
  head: { label: 'Head', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', desc: 'Analytical & Strategic', emoji: '🧠' },
  heart: { label: 'Heart', color: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'Empathetic & Relational', emoji: '❤️' },
  gut: { label: 'Gut', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Intuitive & Decisive', emoji: '🔥' },
  feet: { label: 'Feet', color: 'bg-green-100 text-green-800 border-green-200', desc: 'Practical & Action-Oriented', emoji: '👟' },
};

const BLANK = { member_name: '', member_email: '', workstyle_type: 'head', secondary_type: '', strengths: '', blindspots: '', communication_preference: '', decision_style: '', stress_response: '', coach_notes: '' };

export default function WorkstyleResults({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ ...BLANK });

  const { data: assessments = [] } = useQuery({
    queryKey: ['workstyleAssessments', orgId],
    queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkstyleAssessment.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstyleAssessments', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
    },
  });

  const styleCounts = Object.keys(STYLES).map(k => ({ key: k, count: assessments.filter(a => a.workstyle_type === k).length }));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-violet-500" />
          <CardTitle className="text-base font-semibold">Workstyle Assessment Results</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Member
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Style legend */}
        <div className="grid grid-cols-2 gap-2">
          {styleCounts.map(s => (
            <div key={s.key} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${STYLES[s.key].color}`}>
              <span>{STYLES[s.key].emoji}</span>
              <div>
                <p className="font-semibold">{STYLES[s.key].label}</p>
                <p className="opacity-70">{s.count} member{s.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>

        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Member Name</Label>
                <Input value={form.member_name} onChange={e => setForm({ ...form, member_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.member_email} onChange={e => setForm({ ...form, member_email: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Primary Workstyle</Label>
                <Select value={form.workstyle_type} onValueChange={v => setForm({ ...form, workstyle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STYLES).map(([v, s]) => <SelectItem key={v} value={v}>{s.emoji} {s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Secondary Workstyle</Label>
                <Select value={form.secondary_type} onValueChange={v => setForm({ ...form, secondary_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STYLES).map(([v, s]) => <SelectItem key={v} value={v}>{s.emoji} {s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {[
              { key: 'strengths', label: 'Strengths', ph: 'Key strengths this person brings...' },
              { key: 'blindspots', label: 'Blind Spots', ph: 'Common blind spots for this style...' },
              { key: 'communication_preference', label: 'Communication Preference', ph: 'How they prefer to receive info...' },
              { key: 'decision_style', label: 'Decision Style', ph: 'How they approach decisions...' },
              { key: 'stress_response', label: 'Stress Response', ph: 'How they behave under pressure...' },
              { key: 'coach_notes', label: "Coach's Notes", ph: 'Additional observations...' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Textarea placeholder={f.ph} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={2} />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.member_name}>Save</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {assessments.map(a => (
            <div key={a.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                <div className="flex items-center gap-2">
                  <span>{STYLES[a.workstyle_type]?.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{a.member_name}</p>
                    <p className="text-xs text-muted-foreground">{STYLES[a.workstyle_type]?.label}{a.secondary_type ? ` / ${STYLES[a.secondary_type]?.label}` : ''}</p>
                  </div>
                </div>
                {expanded === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {expanded === a.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-2 text-sm">
                  <p className="text-xs italic text-muted-foreground">{STYLES[a.workstyle_type]?.desc}</p>
                  {a.strengths && <p><span className="font-medium">Strengths:</span> {a.strengths}</p>}
                  {a.blindspots && <p><span className="font-medium">Blind Spots:</span> {a.blindspots}</p>}
                  {a.communication_preference && <p><span className="font-medium">Comm Style:</span> {a.communication_preference}</p>}
                  {a.decision_style && <p><span className="font-medium">Decision Style:</span> {a.decision_style}</p>}
                  {a.stress_response && <p><span className="font-medium">Under Stress:</span> {a.stress_response}</p>}
                  {a.coach_notes && <p><span className="font-medium">Coach Notes:</span> {a.coach_notes}</p>}
                </div>
              )}
            </div>
          ))}
          {assessments.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No workstyle assessments yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}