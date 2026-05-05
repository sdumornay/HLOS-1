import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS = { draft: 'secondary', reviewed: 'outline', agreed: 'default' };
const BLANK = { member_name: '', member_email: '', role_title: '', primary_responsibilities: '', success_looks_like: '', decisions_i_own: '', decisions_i_influence: '', decisions_i_defer: '', overlaps_with: '', gaps_identified: '', clarity_score: 5, status: 'draft' };

export default function RoleClarityWorksheet({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ ...BLANK });

  const { data: worksheets = [] } = useQuery({
    queryKey: ['roleClarity', orgId],
    queryFn: () => base44.entities.RoleClarity.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RoleClarity.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleClarity', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.RoleClarity.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roleClarity', orgId] }),
  });

  const avgClarity = worksheets.length ? worksheets.reduce((a, w) => a + (w.clarity_score || 5), 0) / worksheets.length : 0;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-teal-500" />
          <CardTitle className="text-base font-semibold">Role Clarity Worksheets</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Add Role
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {worksheets.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Avg Clarity Score</p>
              <p className="text-lg font-bold">{avgClarity.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/10</span></p>
            </div>
            <div className="flex-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(avgClarity / 10) * 100}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{worksheets.length} role(s)</p>
          </div>
        )}

        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Member Name</Label>
                <Input value={form.member_name} onChange={e => setForm({ ...form, member_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Role Title</Label>
                <Input value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.member_email} onChange={e => setForm({ ...form, member_email: e.target.value })} />
              </div>
            </div>
            {[
              { key: 'primary_responsibilities', label: 'Primary Responsibilities', ph: 'Core duties and ownership areas...' },
              { key: 'success_looks_like', label: 'Success Looks Like', ph: 'How would we know this role is being done well?' },
              { key: 'decisions_i_own', label: 'Decisions I Own', ph: 'What decisions am I fully authorized to make?' },
              { key: 'decisions_i_influence', label: 'Decisions I Influence', ph: 'Where do I have a voice but not the final call?' },
              { key: 'decisions_i_defer', label: 'Decisions I Defer', ph: 'What decisions do I leave to others?' },
              { key: 'overlaps_with', label: 'Overlaps With', ph: 'Which other roles does mine overlap or interface with?' },
              { key: 'gaps_identified', label: 'Gaps Identified', ph: 'Areas of the role that feel unclear or uncovered...' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Textarea placeholder={f.ph} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={2} />
              </div>
            ))}
            <div>
              <Label className="text-xs">Self-Reported Clarity Score: {form.clarity_score}/10</Label>
              <Slider min={1} max={10} step={1} value={[form.clarity_score]} onValueChange={([v]) => setForm({ ...form, clarity_score: v })} className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.member_name || !form.role_title}>Save</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {worksheets.map(w => (
            <div key={w.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                <div>
                  <p className="text-sm font-medium">{w.member_name}</p>
                  <p className="text-xs text-muted-foreground">{w.role_title} • Clarity {w.clarity_score}/10</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_COLORS[w.status]} className="capitalize text-xs">{w.status}</Badge>
                  {expanded === w.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expanded === w.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-2 text-sm">
                  {w.primary_responsibilities && <p><span className="font-medium">Responsibilities:</span> {w.primary_responsibilities}</p>}
                  {w.success_looks_like && <p><span className="font-medium">Success:</span> {w.success_looks_like}</p>}
                  {w.decisions_i_own && <p><span className="font-medium">Owns:</span> {w.decisions_i_own}</p>}
                  {w.decisions_i_influence && <p><span className="font-medium">Influences:</span> {w.decisions_i_influence}</p>}
                  {w.gaps_identified && <p><span className="font-medium">Gaps:</span> {w.gaps_identified}</p>}
                  <div className="flex gap-2 pt-1">
                    {w.status === 'draft' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: w.id, status: 'reviewed' })}>Mark Reviewed</Button>}
                    {w.status === 'reviewed' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: w.id, status: 'agreed' })}>Mark Agreed</Button>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {worksheets.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No role worksheets yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}