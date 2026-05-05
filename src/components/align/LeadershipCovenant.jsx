import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Plus, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['Integrity', 'Communication', 'Conflict', 'Commitment', 'Accountability', 'Mission', 'Other'];

const STATUS_COLORS = { draft: 'secondary', active: 'default', under_review: 'outline' };

export default function LeadershipCovenant({ orgId }) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newCommitment, setNewCommitment] = useState({ text: '', category: 'Integrity' });
  const [newSignatory, setNewSignatory] = useState({ name: '', role: '' });
  const [form, setForm] = useState({
    title: 'Leadership Team Covenant',
    preamble: '',
    commitments: [],
    signatories: [],
    review_date: '',
    status: 'draft',
  });

  const { data: covenants = [] } = useQuery({
    queryKey: ['covenants', orgId],
    queryFn: () => base44.entities.LeadershipCovenant.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadershipCovenant.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['covenants', orgId] });
      setCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadershipCovenant.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['covenants', orgId] }),
  });

  const addCommitment = () => {
    if (!newCommitment.text) return;
    setForm({ ...form, commitments: [...form.commitments, { ...newCommitment }] });
    setNewCommitment({ text: '', category: 'Integrity' });
  };

  const removeCommitment = (i) => setForm({ ...form, commitments: form.commitments.filter((_, idx) => idx !== i) });

  const addSignatory = () => {
    if (!newSignatory.name) return;
    setForm({ ...form, signatories: [...form.signatories, { ...newSignatory, signed_date: new Date().toISOString().split('T')[0] }] });
    setNewSignatory({ name: '', role: '' });
  };

  const activeCovenant = covenants.find(c => c.status === 'active') || covenants[0];

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-rose-600" />
          <CardTitle className="text-base font-semibold">Leadership Covenant</CardTitle>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> {covenants.length === 0 ? 'Create Covenant' : 'New Version'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {creating && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Covenant Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Preamble / Introduction</Label>
                <Textarea placeholder="Why this covenant exists and what it represents for our team..." value={form.preamble}
                  onChange={e => setForm({ ...form, preamble: e.target.value })} rows={3} />
              </div>
            </div>

            {/* Commitments builder */}
            <div>
              <Label className="text-xs font-semibold">Commitments</Label>
              <div className="space-y-2 mt-2">
                {form.commitments.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white border border-border/50 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground w-24 flex-shrink-0">{c.category}</span>
                    <p className="text-sm flex-1">{c.text}</p>
                    <button onClick={() => removeCommitment(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select className="text-xs border border-input rounded-md px-2 py-1.5 bg-background"
                    value={newCommitment.category} onChange={e => setNewCommitment({ ...newCommitment, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Input placeholder="We commit to..." value={newCommitment.text}
                    onChange={e => setNewCommitment({ ...newCommitment, text: e.target.value })} className="text-sm" />
                  <Button size="sm" variant="outline" onClick={addCommitment}>Add</Button>
                </div>
              </div>
            </div>

            {/* Signatories */}
            <div>
              <Label className="text-xs font-semibold">Signatories</Label>
              <div className="space-y-2 mt-2">
                {form.signatories.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 bg-white border border-border/50 rounded-lg">
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{s.name}</span>
                    {s.role && <span className="text-muted-foreground">— {s.role}</span>}
                    <span className="ml-auto text-xs text-muted-foreground">{s.signed_date}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Name" value={newSignatory.name} onChange={e => setNewSignatory({ ...newSignatory, name: e.target.value })} />
                  <Input placeholder="Role" value={newSignatory.role} onChange={e => setNewSignatory({ ...newSignatory, role: e.target.value })} />
                  <Button size="sm" variant="outline" onClick={addSignatory}>Add</Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Review Date</Label>
              <Input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} className="max-w-xs" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
              <Button size="sm" variant="outline" onClick={() => createMutation.mutate({ ...form, status: 'draft' })} disabled={!form.title}>Save Draft</Button>
              <Button size="sm" onClick={() => createMutation.mutate({ ...form, status: 'active' })} disabled={!form.title || form.commitments.length === 0}>Activate Covenant</Button>
            </div>
          </div>
        )}

        {/* Display active covenant */}
        {!creating && activeCovenant && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{activeCovenant.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_COLORS[activeCovenant.status]} className="capitalize">{activeCovenant.status?.replace('_', ' ')}</Badge>
                {activeCovenant.status === 'draft' && (
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: activeCovenant.id, data: { status: 'active' } })}>Activate</Button>
                )}
              </div>
            </div>
            {activeCovenant.preamble && <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{activeCovenant.preamble}</p>}

            {activeCovenant.commitments?.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commitments</Label>
                {activeCovenant.commitments.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                    <span className="text-xs font-medium text-muted-foreground w-24 flex-shrink-0 mt-0.5">{c.category}</span>
                    <p className="text-sm flex-1">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {activeCovenant.signatories?.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signatories ({activeCovenant.signatories.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {activeCovenant.signatories.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs bg-white border border-border/50 rounded-full px-3 py-1">
                      <span className="font-medium">{s.name}</span>
                      {s.role && <span className="text-muted-foreground">· {s.role}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCovenant.review_date && (
              <p className="text-xs text-muted-foreground">Next review: {format(new Date(activeCovenant.review_date), 'MMMM d, yyyy')}</p>
            )}
          </div>
        )}

        {!creating && covenants.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No covenant created yet.</p>
        )}
      </CardContent>
    </Card>
  );
}