import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Heart, CheckCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

const currentMonth = format(new Date(), 'yyyy-MM');

const DIMENSIONS = [
  { key: 'overall_health', label: 'Overall Health', invert: false },
  { key: 'trust', label: 'Trust', invert: false },
  { key: 'clarity', label: 'Clarity', invert: false },
  { key: 'momentum', label: 'Momentum', invert: false },
  { key: 'conflict_level', label: 'Conflict Level', invert: true, note: 'Lower = healthier' },
];

export default function MonthlyHealthPulse({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    overall_health: 7, trust: 7, clarity: 7, momentum: 7, conflict_level: 3,
    highlight: '', concern: '', renewal_needed: false,
  });

  const { data: pulses = [] } = useQuery({
    queryKey: ['healthPulses', orgId],
    queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HealthPulse.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['healthPulses', orgId]); setOpen(false); },
  });

  const alreadySubmitted = pulses.some(p => p.month === currentMonth && p.respondent_email === user?.email);

  const handleSubmit = () => {
    createMutation.mutate({ ...form, organization_id: orgId, respondent_email: user?.email, month: currentMonth });
  };

  const thisMonthPulses = pulses.filter(p => p.month === currentMonth);
  const avgHealth = thisMonthPulses.length > 0
    ? (thisMonthPulses.reduce((s, p) => s + (p.overall_health || 0), 0) / thisMonthPulses.length).toFixed(1)
    : null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Monthly Health Pulse</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs">{format(new Date(), 'MMMM yyyy')}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {avgHealth && (
          <div className="flex items-center gap-3 bg-accent/10 rounded-lg px-4 py-3">
            <div className="text-2xl font-barlow font-bold text-accent">{avgHealth}</div>
            <div>
              <p className="text-xs font-semibold text-foreground">Team Average</p>
              <p className="text-xs text-muted-foreground">{thisMonthPulses.length} response{thisMonthPulses.length !== 1 ? 's' : ''} this month</p>
            </div>
          </div>
        )}

        {!open && (
          <Button
            onClick={() => setOpen(true)}
            disabled={alreadySubmitted}
            className="w-full"
            variant={alreadySubmitted ? 'outline' : 'default'}
          >
            {alreadySubmitted ? (
              <><CheckCircle className="h-4 w-4 mr-2" /> Submitted this month</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" /> Submit This Month's Pulse</>
            )}
          </Button>
        )}

        {open && (
          <div className="space-y-4 border border-border/60 rounded-lg p-4">
            {DIMENSIONS.map(({ key, label, note }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">{label} {note && <span className="text-xs text-muted-foreground ml-1">({note})</span>}</Label>
                  <span className="text-sm font-bold text-accent">{form[key]}</span>
                </div>
                <Slider
                  min={1} max={10} step={1}
                  value={[form[key]]}
                  onValueChange={([v]) => setForm(f => ({ ...f, [key]: v }))}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>One thing going well</Label>
              <Textarea placeholder="What's a highlight this month?" value={form.highlight}
                onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))} className="h-20" />
            </div>
            <div className="space-y-2">
              <Label>One concern to watch</Label>
              <Textarea placeholder="What needs attention?" value={form.concern}
                onChange={e => setForm(f => ({ ...f, concern: e.target.value }))} className="h-20" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.renewal_needed} onCheckedChange={v => setForm(f => ({ ...f, renewal_needed: v }))} />
              <Label className="text-sm">Team renewal / reset needed this month</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? 'Submitting…' : 'Submit Pulse'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Recent pulses */}
        {pulses.slice(0, 3).map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
            <div>
              <p className="text-xs font-medium">{p.respondent_email}</p>
              <p className="text-xs text-muted-foreground">{p.month}</p>
            </div>
            <div className="flex items-center gap-2">
              {p.renewal_needed && <Badge variant="destructive" className="text-xs">Renewal</Badge>}
              <span className="text-sm font-bold text-accent">{p.overall_health}/10</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}