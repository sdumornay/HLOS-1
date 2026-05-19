import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircleHeart, Plus, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { format } from 'date-fns';

const NVC_STEPS = [
  {
    key: 'situation',
    label: '1. Observation',
    color: 'bg-blue-50 border-blue-200',
    hint: 'Describe ONLY what you observe — no judgments or interpretations. "When I see/hear/notice..."',
    placeholder: 'e.g. When I notice meetings consistently run over time and my agenda items are skipped...',
    rows: 2,
  },
  {
    key: 'feelings_a',
    label: "2. Person A's Feelings",
    color: 'bg-amber-50 border-amber-200',
    hint: 'How does Person A genuinely feel? Use feeling words — not thoughts or evaluations.',
    placeholder: 'e.g. I feel frustrated, overlooked, and anxious...',
    rows: 2,
    participant: 'a',
  },
  {
    key: 'needs_a',
    label: "3. Person A's Needs",
    color: 'bg-amber-50 border-amber-200',
    hint: 'What underlying needs or values are unmet for Person A? (respect, safety, clarity, belonging...)',
    placeholder: 'e.g. I need to feel that my contributions are valued and that I have a voice...',
    rows: 2,
    participant: 'a',
  },
  {
    key: 'request_a',
    label: "4. Person A's Request",
    color: 'bg-amber-50 border-amber-200',
    hint: 'What specific, actionable request would address the need? "Would you be willing to...?"',
    placeholder: 'e.g. Would you be willing to protect 10 minutes for my item at the start of each meeting?',
    rows: 2,
    participant: 'a',
  },
  {
    key: 'feelings_b',
    label: "5. Person B's Feelings",
    color: 'bg-purple-50 border-purple-200',
    hint: "Now Person B responds — how do they feel upon hearing Person A's share?",
    placeholder: 'e.g. I feel surprised, and also a bit defensive...',
    rows: 2,
    participant: 'b',
  },
  {
    key: 'needs_b',
    label: "6. Person B's Needs",
    color: 'bg-purple-50 border-purple-200',
    hint: "What needs does Person B have in this situation?",
    placeholder: 'e.g. I need to feel trusted to lead meetings without micromanagement...',
    rows: 2,
    participant: 'b',
  },
  {
    key: 'request_b',
    label: "7. Person B's Request",
    color: 'bg-purple-50 border-purple-200',
    hint: "What does Person B request?",
    placeholder: 'e.g. Would you be willing to share concerns with me privately before the meeting?',
    rows: 2,
    participant: 'b',
  },
  {
    key: 'agreements_reached',
    label: '8. Agreements Reached',
    color: 'bg-green-50 border-green-200',
    hint: 'Document any mutual commitments or next steps both parties agreed to.',
    placeholder: 'e.g. We agreed to reserve the first 10 min for announcements, and to meet 1:1 before each meeting...',
    rows: 3,
  },
];

const STATUS_COLORS = { draft: 'secondary', in_progress: 'default', resolved: 'outline' };
const BLANK = { participant_a: '', participant_b: '', situation: '', feelings_a: '', needs_a: '', request_a: '', feelings_b: '', needs_b: '', request_b: '', agreements_reached: '', follow_up_date: '', status: 'draft' };

export default function NVCConversationHelper({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [form, setForm] = useState({ ...BLANK });

  const { data: conversations = [] } = useQuery({
    queryKey: ['nvcConversations', orgId],
    queryFn: () => base44.entities.NVCConversation.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NVCConversation.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nvcConversations', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
      toast.success('Conversation saved.');
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err?.message || 'Permission denied. Make sure your organization is set up.'));
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.NVCConversation.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvcConversations', orgId] }),
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircleHeart className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-base font-semibold">NVC Conversation Helper</CardTitle>
          <button onClick={() => setShowGuide(!showGuide)} className="text-muted-foreground hover:text-foreground">
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> New Conversation
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGuide && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Nonviolent Communication (NVC) — Marshall Rosenberg</p>
            <p>NVC guides conflict resolution through 4 components: <strong>Observation</strong> (what happened, without judgment), <strong>Feelings</strong> (how you genuinely feel), <strong>Needs</strong> (the underlying values at stake), and <strong>Requests</strong> (specific, actionable asks). Use this tool to facilitate structured conversations between two parties.</p>
          </div>
        )}

        {open && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Person A</Label>
                <Input placeholder="Name or role" value={form.participant_a} onChange={e => setForm({ ...form, participant_a: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Person B</Label>
                <Input placeholder="Name or role" value={form.participant_b} onChange={e => setForm({ ...form, participant_b: e.target.value })} />
              </div>
            </div>

            {NVC_STEPS.map(step => (
              <div key={step.key} className={`rounded-lg border p-3 space-y-1.5 ${step.color}`}>
                <Label className="text-xs font-semibold">{step.label}</Label>
                <p className="text-xs text-muted-foreground italic">{step.hint}</p>
                <Textarea
                  placeholder={step.placeholder}
                  value={form[step.key]}
                  onChange={e => setForm({ ...form, [step.key]: e.target.value })}
                  rows={step.rows}
                  className="bg-white/80"
                />
              </div>
            ))}

            <div>
              <Label className="text-xs">Follow-Up Date</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate({ ...form, status: 'in_progress' })} disabled={!form.situation}>Save Conversation</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {conversations.map(cv => (
            <div key={cv.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === cv.id ? null : cv.id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cv.participant_a} & {cv.participant_b}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{cv.situation}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant={STATUS_COLORS[cv.status]} className="capitalize text-xs">{cv.status?.replace('_', ' ')}</Badge>
                  {expanded === cv.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expanded === cv.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-3 text-sm">
                  {NVC_STEPS.filter(s => cv[s.key]).map(s => (
                    <div key={s.key}>
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <p className="mt-0.5">{cv[s.key]}</p>
                    </div>
                  ))}
                  {cv.follow_up_date && <p className="text-xs text-muted-foreground">Follow-up: {format(new Date(cv.follow_up_date), 'MMM d, yyyy')}</p>}
                  {cv.status !== 'resolved' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: cv.id, status: 'resolved' })}>Mark Resolved</Button>
                  )}
                </div>
              )}
            </div>
          ))}
          {conversations.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No NVC conversations logged yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}