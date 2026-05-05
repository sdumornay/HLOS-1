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
import { Map, Plus } from 'lucide-react';

const CATEGORIES = {
  financial: 'Financial', staffing: 'Staffing', ministry: 'Ministry',
  strategy: 'Strategy', operations: 'Operations', communications: 'Communications', other: 'Other',
};
const CAT_COLORS = {
  financial: 'bg-emerald-50 text-emerald-700', staffing: 'bg-blue-50 text-blue-700',
  ministry: 'bg-purple-50 text-purple-700', strategy: 'bg-amber-50 text-amber-700',
  operations: 'bg-slate-50 text-slate-700', communications: 'bg-rose-50 text-rose-700', other: 'bg-gray-50 text-gray-700',
};
const CLARITY_COLORS = { clear: 'default', disputed: 'destructive', unclear: 'secondary' };
const BLANK = { decision_area: '', description: '', decider: '', consulted: '', informed: '', category: 'ministry', clarity_status: 'unclear', notes: '' };

export default function DecisionRightsMap({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({ ...BLANK });

  const { data: rights = [] } = useQuery({
    queryKey: ['decisionRights', orgId],
    queryFn: () => base44.entities.DecisionRight.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DecisionRight.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisionRights', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
    },
  });

  const updateClarity = useMutation({
    mutationFn: ({ id, clarity_status }) => base44.entities.DecisionRight.update(id, { clarity_status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decisionRights', orgId] }),
  });

  const filtered = filterCat === 'all' ? rights : rights.filter(r => r.category === filterCat);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-cyan-500" />
          <CardTitle className="text-base font-semibold">Decision-Rights Map</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Decision
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilterCat('all')}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
            All
          </button>
          {Object.entries(CATEGORIES).map(([k, l]) => (
            <button key={k} onClick={() => setFilterCat(k)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${filterCat === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              {l}
            </button>
          ))}
        </div>

        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Decision Area</Label>
                <Input placeholder="e.g. Budget approval over $5k" value={form.decision_area}
                  onChange={e => setForm({ ...form, decision_area: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div>
                <Label className="text-xs">Decider (has final say)</Label>
                <Input placeholder="Name or role" value={form.decider} onChange={e => setForm({ ...form, decider: e.target.value })} />
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
              <div className="col-span-2">
                <Label className="text-xs">Consulted Before Decision</Label>
                <Input placeholder="Who must be consulted?" value={form.consulted} onChange={e => setForm({ ...form, consulted: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Informed After Decision</Label>
                <Input placeholder="Who must be informed?" value={form.informed} onChange={e => setForm({ ...form, informed: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Clarity Status</Label>
                <Select value={form.clarity_status} onValueChange={v => setForm({ ...form, clarity_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="unclear">Unclear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.decision_area || !form.decider}>Save</Button>
            </div>
          </div>
        )}

        {/* Table-style layout */}
        {filtered.length > 0 && (
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs font-semibold text-muted-foreground bg-muted/40 px-3 py-2">
              <span>Decision Area</span><span>Decider</span><span>Category</span><span>Clarity</span>
            </div>
            {filtered.map(r => (
              <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2.5 border-t border-border/40 hover:bg-muted/20 text-sm">
                <div>
                  <p className="font-medium text-sm">{r.decision_area}</p>
                  {r.consulted && <p className="text-xs text-muted-foreground">Consult: {r.consulted}</p>}
                </div>
                <span className="text-xs whitespace-nowrap">{r.decider}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CAT_COLORS[r.category]}`}>{CATEGORIES[r.category]}</span>
                <div>
                  <Badge variant={CLARITY_COLORS[r.clarity_status]} className="text-xs capitalize cursor-pointer"
                    onClick={() => updateClarity.mutate({ id: r.id, clarity_status: r.clarity_status === 'unclear' ? 'clear' : r.clarity_status === 'disputed' ? 'unclear' : 'clear' })}>
                    {r.clarity_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {filtered.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No decisions mapped yet.</p>}
      </CardContent>
    </Card>
  );
}