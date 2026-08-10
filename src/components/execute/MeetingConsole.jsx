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
import {
  CalendarDays, Plus, Heart, TrendingUp, Target, AlertCircle,
  AlertTriangle, BookOpen, CheckSquare, FileText, X, Check,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const MEETING_TYPES = {
  weekly: 'Weekly Huddle',
  monthly: 'Monthly Review',
  quarterly: 'Quarterly Review',
  planning: 'Planning Session',
  special: 'Special Meeting',
};

export default function MeetingConsole({ orgId }) {
  const queryClient = useQueryClient();
  const [active, setActive] = useState(null); // meeting agenda id
  const [showNew, setShowNew] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '', date: new Date().toISOString().split('T')[0], type: 'weekly', facilitator: '',
  });
  const [decisionForm, setDecisionForm] = useState({ issue_question: '', decision: '', made_by: '', participants: '' });
  const [actionForm, setActionForm] = useState({ title: '', owner: '', due_date: '', priority_id: '' });

  // Fetch all the data the meeting reviews
  const { data: agendas = [] } = useQuery({
    queryKey: ['agendas', orgId],
    queryFn: () => base44.entities.MeetingAgenda.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: org } = useQuery({
    queryKey: ['org-meeting', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId, status: 'active' }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues-meeting', orgId],
    queryFn: () => base44.entities.Issue.filter({ organization_id: orgId, status: 'open' }),
    enabled: !!orgId,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments-meeting', orgId],
    queryFn: () => base44.entities.Assessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions-meeting', orgId],
    queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingAgenda.create({
      ...data, organization_id: orgId, status: 'active',
      attendees: [], items: [],
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agendas', orgId] });
      setShowNew(false);
      setActive(result.id);
      setNewMeeting({ title: '', date: new Date().toISOString().split('T')[0], type: 'weekly', facilitator: '' });
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MeetingAgenda.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendas', orgId] }),
  });

  const createDecisionMutation = useMutation({
    mutationFn: (data) => base44.entities.DecisionLog.create({
      ...data, organization_id: orgId, session_id: active,
      date: new Date().toISOString().split('T')[0],
      category: 'ministry', impact: 'medium', status: 'active',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions-meeting', orgId] });
      setDecisionForm({ issue_question: '', decision: '', made_by: '', participants: '' });
    },
  });

  const createActionMutation = useMutation({
    mutationFn: (data) => base44.entities.Action.create({
      ...data, organization_id: orgId, stage: 'execute',
      status: 'pending', priority: 'medium', plan_period: '30_day',
      session_id: active,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', orgId] });
      setActionForm({ title: '', owner: '', due_date: '', priority_id: '' });
    },
  });

  // Derived data for the active meeting
  const activeMeeting = agendas.find(a => a.id === active);
  const healthScore = org?.health_score || 0;
  const momentumScore = org?.momentum_score || 0;

  const overdueActions = actions.filter(a =>
    a.status !== 'completed' && a.status !== 'cancelled' &&
    a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date))
  );

  const meetingDecisions = decisions.filter(d => d.session_id === active);
  const meetingActions = actions.filter(a => a.session_id === active);

  const generateSummary = () => {
    if (!activeMeeting) return;
    const lines = [];

    lines.push(`MEETING SUMMARY: ${activeMeeting.title}`);
    lines.push(`Date: ${format(new Date(activeMeeting.date), 'MMMM d, yyyy')}`);
    if (activeMeeting.facilitator) lines.push(`Facilitator: ${activeMeeting.facilitator}`);
    lines.push('');

    lines.push('DECISIONS MADE:');
    if (meetingDecisions.length > 0) {
      meetingDecisions.forEach((d, i) => {
        lines.push(`  ${i + 1}. ${d.decision}`);
        if (d.made_by) lines.push(`     Owner: ${d.made_by}`);
      });
    } else {
      lines.push('  No decisions recorded.');
    }
    lines.push('');

    lines.push('ACTIONS ASSIGNED:');
    if (meetingActions.length > 0) {
      meetingActions.forEach((a, i) => {
        lines.push(`  ${i + 1}. ${a.title}`);
        lines.push(`     Owner: ${a.owner || 'TBD'}`);
        if (a.due_date) lines.push(`     Due: ${format(new Date(a.due_date), 'MMM d, yyyy')}`);
      });
    } else {
      lines.push('  No actions assigned.');
    }
    lines.push('');

    const openIssues = issues.filter(i => i.status === 'open');
    if (openIssues.length > 0) {
      lines.push('ISSUES CARRIED FORWARD:');
      openIssues.forEach((iss, i) => {
        lines.push(`  ${i + 1}. ${iss.title}${iss.owner ? ` (Owner: ${iss.owner})` : ''}`);
      });
    }

    updateMeetingMutation.mutate({
      id: active,
      data: { meeting_summary: lines.join('\n'), status: 'completed' },
    });
  };

  const sortedAgendas = [...agendas].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base font-semibold">Meeting Console</CardTitle>
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>
          <Plus className="h-4 w-4 mr-1" /> New Meeting
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New meeting form */}
        {showNew && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Meeting Title</Label>
                <Input value={newMeeting.title} onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g. Weekly Leadership Huddle" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newMeeting.date} onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newMeeting.type} onValueChange={v => setNewMeeting({ ...newMeeting, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEETING_TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Facilitator</Label>
                <Input value={newMeeting.facilitator} onChange={e => setNewMeeting({ ...newMeeting, facilitator: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMeetingMutation.mutate(newMeeting)} disabled={!newMeeting.title}>
                Start Meeting
              </Button>
            </div>
          </div>
        )}

        {/* Active meeting console */}
        {activeMeeting && (
          <div className="border-2 border-blue-300 rounded-lg p-4 space-y-4 bg-blue-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{activeMeeting.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(activeMeeting.date), 'MMM d, yyyy')}
                  {activeMeeting.facilitator && ` · ${activeMeeting.facilitator}`}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setActive(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Review panels — the meeting agenda items */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review</p>

              {/* 1. Health indicators */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-border/50">
                <Heart className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <span className="text-sm font-medium flex-shrink-0">Health Score</span>
                <span className="text-lg font-bold text-rose-600">{healthScore.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>

              {/* 2. Momentum scoreboard */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-border/50">
                <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium flex-shrink-0">Momentum Score</span>
                <span className="text-lg font-bold text-emerald-600">{momentumScore.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>

              {/* 3. Active priorities */}
              <div className="p-2.5 rounded-lg bg-white border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Target className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Active Priorities</span>
                  <Badge variant="outline" className="text-xs ml-auto">{priorities.length}</Badge>
                </div>
                {priorities.length > 0 ? (
                  <div className="space-y-1">
                    {priorities.slice(0, 5).map(p => (
                      <div key={p.id} className="text-xs flex items-center gap-2">
                        <span className="font-medium flex-1 truncate">{p.title}</span>
                        <span className="text-muted-foreground">{p.progress_percentage || 0}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress_percentage || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No active priorities.</p>}
              </div>

              {/* 4. Overdue actions */}
              <div className="p-2.5 rounded-lg bg-white border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Overdue Actions</span>
                  <Badge variant="destructive" className="text-xs ml-auto">{overdueActions.length}</Badge>
                </div>
                {overdueActions.length > 0 ? (
                  <div className="space-y-1">
                    {overdueActions.slice(0, 5).map(a => (
                      <div key={a.id} className="text-xs flex justify-between">
                        <span className="truncate">{a.title}</span>
                        <span className="text-red-600 ml-2 flex-shrink-0">{a.owner || 'Unassigned'}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-emerald-600">✓ No overdue actions</p>}
              </div>

              {/* 5. Unresolved issues */}
              <div className="p-2.5 rounded-lg bg-white border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Unresolved Issues</span>
                  <Badge variant="outline" className="text-xs ml-auto">{issues.length}</Badge>
                </div>
                {issues.length > 0 ? (
                  <div className="space-y-1">
                    {issues.slice(0, 5).map(i => (
                      <div key={i.id} className="text-xs flex justify-between">
                        <span className="truncate">{i.title}</span>
                        <Badge variant="outline" className="text-[10px] capitalize ml-2 flex-shrink-0">{i.classification}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-emerald-600">✓ No open issues</p>}
              </div>
            </div>

            {/* Decision recorder */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Record a Decision
              </p>
              <Input
                placeholder="Issue / question..."
                value={decisionForm.issue_question}
                onChange={e => setDecisionForm({ ...decisionForm, issue_question: e.target.value })}
                className="text-sm"
              />
              <Textarea
                placeholder="Decision made..."
                value={decisionForm.decision}
                onChange={e => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                rows={2}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Decision owner"
                  value={decisionForm.made_by}
                  onChange={e => setDecisionForm({ ...decisionForm, made_by: e.target.value })}
                  className="text-sm"
                />
                <Input
                  placeholder="Participants"
                  value={decisionForm.participants}
                  onChange={e => setDecisionForm({ ...decisionForm, participants: e.target.value })}
                  className="text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => createDecisionMutation.mutate(decisionForm)}
                disabled={!decisionForm.decision}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Decision
              </Button>
              {meetingDecisions.length > 0 && (
                <div className="space-y-1">
                  {meetingDecisions.map(d => (
                    <div key={d.id} className="text-xs p-2 rounded bg-emerald-50 border border-emerald-200">
                      <p className="font-medium">{d.decision}</p>
                      <p className="text-muted-foreground">Owner: {d.made_by}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action creator */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" /> Create an Action
              </p>
              <Input
                placeholder="Action item..."
                value={actionForm.title}
                onChange={e => setActionForm({ ...actionForm, title: e.target.value })}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Owner"
                  value={actionForm.owner}
                  onChange={e => setActionForm({ ...actionForm, owner: e.target.value })}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={actionForm.due_date}
                  onChange={e => setActionForm({ ...actionForm, due_date: e.target.value })}
                  className="text-sm"
                />
              </div>
              {priorities.length > 0 && (
                <Select value={actionForm.priority_id} onValueChange={v => setActionForm({ ...actionForm, priority_id: v })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Link to priority (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {priorities.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => createActionMutation.mutate(actionForm)}
                disabled={!actionForm.title || !actionForm.owner}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Action
              </Button>
              {meetingActions.length > 0 && (
                <div className="space-y-1">
                  {meetingActions.map(a => (
                    <div key={a.id} className="text-xs p-2 rounded bg-blue-50 border border-blue-200">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-muted-foreground">
                        Owner: {a.owner}
                        {a.due_date && ` · Due ${format(new Date(a.due_date), 'MMM d')}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generate summary */}
            <div className="pt-2 border-t border-border/50">
              <Button
                className="w-full"
                onClick={generateSummary}
                disabled={updateMeetingMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Meeting Summary & Complete
              </Button>
            </div>

            {/* Show generated summary */}
            {activeMeeting.meeting_summary && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Meeting Summary</p>
                <pre className="text-xs whitespace-pre-wrap font-mono">{activeMeeting.meeting_summary}</pre>
              </div>
            )}
          </div>
        )}

        {/* Meeting list */}
        {!activeMeeting && (
          <div className="space-y-2">
            {sortedAgendas.map(a => (
              <div
                key={a.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/20',
                  a.status === 'active' ? 'border-blue-300 bg-blue-50/30' : 'border-border/50'
                )}
                onClick={() => a.status === 'active' ? setActive(a.id) : setActive(a.id)}
              >
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.date), 'MMM d, yyyy')}
                    {a.facilitator && ` · ${a.facilitator}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'active' ? 'default' : a.status === 'completed' ? 'secondary' : 'outline'} className="text-xs capitalize">
                    {a.status}
                  </Badge>
                  {a.status === 'active' && <Button size="sm" variant="ghost" className="h-7 text-xs">Open</Button>}
                </div>
              </div>
            ))}
            {agendas.length === 0 && !showNew && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No meetings yet. Start a new meeting to review health, priorities, actions, and issues together.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}