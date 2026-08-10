import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Handshake, Plus, Trash2, CheckCircle2, MessageSquare, Swords, Calendar, GitBranch, Eye, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'communication_channels', label: 'Communication', icon: MessageSquare, color: 'text-blue-600', desc: 'How we share information' },
  { value: 'conflict_protocol', label: 'Conflict', icon: Swords, color: 'text-rose-600', desc: 'How we handle disagreement' },
  { value: 'meeting_norms', label: 'Meetings', icon: Calendar, color: 'text-amber-600', desc: 'How we meet together' },
  { value: 'decision_making', label: 'Decisions', icon: GitBranch, color: 'text-cyan-600', desc: 'How we make decisions' },
  { value: 'feedback', label: 'Accountability', icon: Eye, color: 'text-emerald-600', desc: 'How we hold each other accountable' },
  { value: 'other', label: 'Follow-Through', icon: ArrowRight, color: 'text-violet-600', desc: 'How we ensure things get done' },
];

const STATUS_VARIANT = { proposed: 'secondary', active: 'default', retired: 'outline' };

export default function TeamAgreements({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ agreement_text: '', category: 'communication_channels', notes: '' });

  const { data: agreements = [] } = useQuery({
    queryKey: ['commAgreements', orgId],
    queryFn: () => base44.entities.CommAgreement.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: covenants = [] } = useQuery({
    queryKey: ['covenants', orgId],
    queryFn: () => base44.entities.LeadershipCovenant.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CommAgreement.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commAgreements', orgId] });
      setOpen(false);
      setForm({ agreement_text: '', category: 'communication_channels', notes: '' });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CommAgreement.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['commAgreements', orgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CommAgreement.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['commAgreements', orgId] }),
  });

  const activeCovenant = covenants.find(c => c.status === 'active') || covenants[0];
  const activeAgreements = agreements.filter(a => a.status !== 'retired');

  const byCategory = (cat) => activeAgreements.filter(a => a.category === cat);

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-base font-semibold">Team Agreements</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Agreement
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Context or rationale" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Agreement</Label>
              <Textarea
                value={form.agreement_text}
                onChange={(e) => setForm({ ...form, agreement_text: e.target.value })}
                placeholder="We agree to..."
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.agreement_text}>Save</Button>
            </div>
          </div>
        )}

        {/* Leadership Covenant reference */}
        {activeCovenant && (
          <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-rose-600" />
              <p className="text-sm font-semibold">{activeCovenant.title}</p>
              <Badge variant={STATUS_VARIANT[activeCovenant.status]} className="text-xs capitalize ml-auto">
                {activeCovenant.status?.replace('_', ' ')}
              </Badge>
            </div>
            {activeCovenant.commitments?.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {activeCovenant.commitments.length} commitments · {activeCovenant.signatories?.length || 0} signatories
              </p>
            )}
          </div>
        )}

        {/* Agreements by category */}
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const items = byCategory(cat.value);
            const Icon = cat.icon;
            return (
              <div key={cat.value}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={cn('h-4 w-4', cat.color)} />
                  <p className="text-sm font-semibold">{cat.label}</p>
                  <span className="text-xs text-muted-foreground">— {cat.desc}</span>
                  {items.length > 0 && <Badge variant="outline" className="text-xs ml-auto">{items.length}</Badge>}
                </div>
                {items.length > 0 ? (
                  <div className="space-y-1.5 ml-6">
                    {items.map(a => (
                      <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{a.agreement_text}</p>
                          {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge
                            variant={STATUS_VARIANT[a.status]}
                            className="text-xs capitalize cursor-pointer"
                            onClick={() => updateStatus.mutate({
                              id: a.id,
                              status: a.status === 'proposed' ? 'active' : a.status === 'active' ? 'retired' : 'proposed',
                            })}
                          >
                            {a.status}
                          </Badge>
                          <button
                            onClick={() => deleteMutation.mutate(a.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground ml-6 italic">No agreements yet for this category.</p>
                )}
              </div>
            );
          })}
        </div>

        {activeAgreements.length === 0 && !open && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team agreements yet. Start by adding how your team will handle communication, conflict, meetings, and decisions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}