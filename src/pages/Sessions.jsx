import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import ExportPDFButton from '@/components/shared/ExportPDFButton';

export default function Sessions() {
  const { user, canManageAll } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [form, setForm] = useState({
    title: '', date: '', stage: 'stabilize', type: 'team_meeting', notes: '', summary: '',
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-date', 50),
  });

  const orgId = user?.organization_id;
  const mySessions = canManageAll ? sessions : sessions.filter(s => s.organization_id === orgId);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpen(false);
      setForm({ title: '', date: '', stage: 'stabilize', type: 'team_meeting', notes: '', summary: '' });
    },
  });

  const typeLabels = { coaching: 'Coaching', team_meeting: 'Team Meeting', review: 'Review', planning: 'Planning' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Sessions & Decision Log</h1>
          <p className="text-muted-foreground mt-1">Track meetings, coaching sessions, and decisions</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPDFButton
            title="Sessions & Decision Log"
            subtitle={`${mySessions.length} sessions`}
            filename="sessions.pdf"
            sections={[{
              heading: 'Session History',
              table: {
                headers: ['Title', 'Date', 'Type', 'Stage', 'Summary'],
                rows: mySessions.map(s => [s.title, s.date ? format(new Date(s.date), 'MMM d, yyyy') : '—', s.type, s.stage || '—', s.summary ? s.summary.slice(0, 60) + (s.summary.length > 60 ? '…' : '') : '—'])
              }
            }]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Log Session</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log a Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Session title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coaching">Coaching</SelectItem>
                      <SelectItem value="team_meeting">Team Meeting</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <div>
                <Label>Summary</Label>
                <Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Key takeaways..." />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Detailed notes..." />
              </div>
              <Button onClick={() => createMutation.mutate({ ...form, organization_id: orgId })} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Session'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3">
        {mySessions.map(session => (
          <Card
            key={session.id}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{session.title}</p>
                    <Badge variant="outline" className="text-xs capitalize">{session.stage}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session.date ? format(new Date(session.date), 'EEEE, MMM d, yyyy') : 'No date'} • {typeLabels[session.type] || session.type}
                  </p>
                </div>
              </div>
              {selectedSession?.id === session.id && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  {session.summary && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-sm">{session.summary}</p>
                    </div>
                  )}
                  {session.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{session.notes}</p>
                    </div>
                  )}
                  {session.decisions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Decisions</p>
                      {session.decisions.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{d.description}</span>
                          {d.owner && <Badge variant="secondary" className="text-xs">{d.owner}</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {mySessions.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No sessions logged yet. Start by logging your first meeting.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}