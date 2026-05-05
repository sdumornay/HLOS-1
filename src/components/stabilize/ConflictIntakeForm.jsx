import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_LABELS = {
  interpersonal: 'Interpersonal', vision_values: 'Vision / Values',
  role_clarity: 'Role Clarity', workload: 'Workload', communication: 'Communication',
  leadership_style: 'Leadership Style', other: 'Other',
};
const STATUS_COLORS = { open: 'destructive', in_process: 'secondary', resolved: 'default' };

export default function ConflictIntakeForm({ orgId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    parties_involved: '', conflict_description: '', conflict_type: 'interpersonal',
    intensity: 5, duration: 'weeks', impact_on_team: '', desired_outcome: '',
  });

  const { data: intakes = [] } = useQuery({
    queryKey: ['conflictIntakes', orgId],
    queryFn: () => base44.entities.ConflictIntake.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConflictIntake.create({ ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflictIntakes', orgId] });
      setOpen(false);
      setForm({ parties_involved: '', conflict_description: '', conflict_type: 'interpersonal', intensity: 5, duration: 'weeks', impact_on_team: '', desired_outcome: '' });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ConflictIntake.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conflictIntakes', orgId] }),
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Conflict Intake</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> New Intake
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Parties Involved</Label>
                <Input placeholder="e.g. Pastor Mike & Elder James" value={form.parties_involved}
                  onChange={e => setForm({ ...form, parties_involved: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Describe the Conflict</Label>
                <Textarea placeholder="What is the nature of the conflict?" value={form.conflict_description}
                  onChange={e => setForm({ ...form, conflict_description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.conflict_type} onValueChange={v => setForm({ ...form, conflict_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Duration</Label>
                <Select value={form.duration} onValueChange={v => setForm({ ...form, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="over_a_year">Over a Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Intensity: {form.intensity}/10</Label>
                <Slider min={1} max={10} step={1} value={[form.intensity]}
                  onValueChange={([v]) => setForm({ ...form, intensity: v })} className="mt-2" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Impact on Team</Label>
                <Textarea placeholder="How is this affecting the team?" value={form.impact_on_team}
                  onChange={e => setForm({ ...form, impact_on_team: e.target.value })} rows={2} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Desired Outcome</Label>
                <Textarea placeholder="What resolution are you hoping for?" value={form.desired_outcome}
                  onChange={e => setForm({ ...form, desired_outcome: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.conflict_description}>Submit</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {intakes.map(intake => (
            <div key={intake.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === intake.id ? null : intake.id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{intake.parties_involved || 'Unnamed Conflict'}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[intake.conflict_type]} • Intensity {intake.intensity}/10 • {format(new Date(intake.created_date), 'MMM d')}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant={STATUS_COLORS[intake.status]}>{intake.status?.replace('_', ' ')}</Badge>
                  {expanded === intake.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expanded === intake.id && (
                <div className="border-t border-border/50 p-3 bg-muted/20 space-y-2 text-sm">
                  <p><span className="font-medium">Description:</span> {intake.conflict_description}</p>
                  {intake.impact_on_team && <p><span className="font-medium">Impact:</span> {intake.impact_on_team}</p>}
                  {intake.desired_outcome && <p><span className="font-medium">Desired Outcome:</span> {intake.desired_outcome}</p>}
                  <div className="flex gap-2 pt-1">
                    {intake.status !== 'in_process' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: intake.id, status: 'in_process' })}>Mark In Process</Button>}
                    {intake.status !== 'resolved' && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: intake.id, status: 'resolved' })}>Mark Resolved</Button>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {intakes.length === 0 && !open && <p className="text-sm text-muted-foreground text-center py-4">No conflict intakes yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}