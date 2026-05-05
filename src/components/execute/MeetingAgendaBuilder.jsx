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
import { CalendarDays, Plus, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

const ITEM_TYPES = {
  inform: { label: 'Inform', color: 'bg-blue-100 text-blue-800' },
  discuss: { label: 'Discuss', color: 'bg-amber-100 text-amber-800' },
  decide: { label: 'Decide', color: 'bg-green-100 text-green-800' },
  pray: { label: 'Pray / Reflect', color: 'bg-purple-100 text-purple-800' },
};

const BLANK_AGENDA = { title: '', date: '', duration_minutes: 60, facilitator: '', attendees: '', recap_notes: '', status: 'draft' };
const BLANK_ITEM = { title: '', type: 'discuss', owner: '', duration_minutes: 10, notes: '' };

export default function MeetingAgendaBuilder({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ ...BLANK_AGENDA });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ ...BLANK_ITEM });

  const { data: agendas = [] } = useQuery({
    queryKey: ['agendas', orgId],
    queryFn: () => base44.entities.MeetingAgenda.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingAgenda.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas', orgId] });
      setOpen(false);
      setForm({ ...BLANK_AGENDA });
      setItems([]);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MeetingAgenda.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendas', orgId] }),
  });

  const addItem = () => {
    if (!newItem.title) return;
    setItems([...items, { ...newItem }]);
    setNewItem({ ...BLANK_ITEM });
  };

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const totalMins = items.reduce((s, it) => s + (it.duration_minutes || 0), 0);

  const sorted = [...agendas].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base font-semibold">Meeting Agenda Builder</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> New Agenda</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Meeting Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekly Leadership Huddle" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Facilitator</Label>
                <Input value={form.facilitator} onChange={e => setForm({ ...form, facilitator: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Attendees (comma separated)</Label>
                <Input value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Agenda Items <span className="text-muted-foreground font-normal">({totalMins} min planned)</span></Label>
              <div className="space-y-2 mt-1.5">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white border border-border/50 rounded-lg text-sm">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ITEM_TYPES[it.type].color}`}>{ITEM_TYPES[it.type].label}</span>
                    <span className="flex-1">{it.title}</span>
                    {it.owner && <span className="text-xs text-muted-foreground">{it.owner}</span>}
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Clock className="h-3 w-3" />{it.duration_minutes}m</span>
                    <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center">
                  <Select value={newItem.type} onValueChange={v => setNewItem({ ...newItem, type: v })}>
                    <SelectTrigger className="w-28 text-xs h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ITEM_TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Agenda item..." value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Owner" value={newItem.owner} onChange={e => setNewItem({ ...newItem, owner: e.target.value })} className="h-8 text-sm w-24" />
                  <Input type="number" value={newItem.duration_minutes} onChange={e => setNewItem({ ...newItem, duration_minutes: parseInt(e.target.value) })} className="h-8 text-sm w-16" />
                  <Button size="sm" variant="outline" className="h-8" onClick={addItem}>Add</Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Recap / Notes (post-meeting)</Label>
              <Textarea value={form.recap_notes} onChange={e => setForm({ ...form, recap_notes: e.target.value })} rows={2} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate({ ...form, items, attendees: form.attendees ? form.attendees.split(',').map(s => s.trim()) : [] })} disabled={!form.title || !form.date}>Save Agenda</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map(a => (
            <div key={a.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(a.date), 'MMM d, yyyy')} · {a.duration_minutes} min{a.facilitator ? ` · ${a.facilitator}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'completed' ? 'secondary' : a.status === 'active' ? 'default' : 'outline'} className="capitalize text-xs">{a.status}</Badge>
                  {expanded === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expanded === a.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-3">
                  {a.items?.length > 0 && (
                    <div className="space-y-1.5">
                      {a.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ITEM_TYPES[it.type]?.color}`}>{ITEM_TYPES[it.type]?.label}</span>
                          <span className="flex-1">{it.title}</span>
                          {it.owner && <span className="text-xs text-muted-foreground">{it.owner}</span>}
                          <span className="text-xs text-muted-foreground">{it.duration_minutes}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {a.recap_notes && <p className="text-sm text-muted-foreground border-t border-border/40 pt-2">{a.recap_notes}</p>}
                  <div className="flex gap-2">
                    {a.status === 'draft' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: a.id, status: 'active' })}>Start Meeting</Button>}
                    {a.status === 'active' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: a.id, status: 'completed' })}>Mark Complete</Button>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {agendas.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No agendas yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}