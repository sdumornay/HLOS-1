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
import { HandshakeIcon, Plus, CheckCircle2, Archive } from 'lucide-react';

const CATEGORIES = {
  meeting_norms: 'Meeting Norms',
  conflict_protocol: 'Conflict Protocol',
  feedback: 'Feedback',
  decision_making: 'Decision Making',
  communication_channels: 'Comm Channels',
  other: 'Other',
};

const CAT_COLORS = {
  meeting_norms: 'bg-blue-50 text-blue-700 border-blue-200',
  conflict_protocol: 'bg-red-50 text-red-700 border-red-200',
  feedback: 'bg-green-50 text-green-700 border-green-200',
  decision_making: 'bg-purple-50 text-purple-700 border-purple-200',
  communication_channels: 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function CommunicationAgreements({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ agreement_text: '', category: 'meeting_norms', notes: '' });

  const { data: agreements = [] } = useQuery({
    queryKey: ['commAgreements', orgId],
    queryFn: () => base44.entities.CommAgreement.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CommAgreement.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commAgreements', orgId] });
      setOpen(false);
      setForm({ agreement_text: '', category: 'meeting_norms', notes: '' });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CommAgreement.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['commAgreements', orgId] }),
  });

  const active = agreements.filter(a => a.status !== 'retired');
  const retired = agreements.filter(a => a.status === 'retired');

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <HandshakeIcon className="h-4 w-4 text-green-600" />
          <CardTitle className="text-base font-semibold">Communication Agreements</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Agreement
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div>
              <Label className="text-xs">Agreement Statement</Label>
              <Textarea placeholder="e.g. We agree to address conflict directly with the person involved before escalating..." value={form.agreement_text}
                onChange={e => setForm({ ...form, agreement_text: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input placeholder="Any context or caveats..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.agreement_text}>Save</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {active.map(ag => (
            <div key={ag.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20">
              <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${ag.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{ag.agreement_text}</p>
                {ag.notes && <p className="text-xs text-muted-foreground mt-0.5">{ag.notes}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${CAT_COLORS[ag.category]}`}>
                  {CATEGORIES[ag.category]}
                </span>
                {ag.status === 'proposed' && (
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => updateStatus.mutate({ id: ag.id, status: 'active' })}>Activate</Button>
                )}
                <button onClick={() => updateStatus.mutate({ id: ag.id, status: 'retired' })} className="text-muted-foreground hover:text-foreground">
                  <Archive className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {active.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No agreements yet.</p>}
          {retired.length > 0 && <p className="text-xs text-muted-foreground pt-1">{retired.length} retired agreement(s)</p>}
        </div>
      </CardContent>
    </Card>
  );
}