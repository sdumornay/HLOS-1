import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Layers, Plus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const DYSFUNCTIONS = [
  { key: 'trust', label: 'Trust', description: 'Team members are vulnerable and open with each other', inverse: false },
  { key: 'conflict', label: 'Conflict', description: 'Team engages in passionate debate around ideas', inverse: false },
  { key: 'commitment', label: 'Commitment', description: 'Team commits to decisions and plans of action', inverse: false },
  { key: 'accountability', label: 'Accountability', description: 'Team calls out peers on behaviors that hurt the team', inverse: false },
  { key: 'results', label: 'Results', description: 'Team focuses on collective outcomes, not individual status', inverse: false },
];

const NOTES_FIELDS = [
  { key: 'trust_notes', label: 'Trust Notes' },
  { key: 'conflict_notes', label: 'Healthy Conflict Notes' },
  { key: 'commitment_notes', label: 'Commitment Notes' },
  { key: 'accountability_notes', label: 'Accountability Notes' },
  { key: 'results_notes', label: 'Results Notes' },
];

const BLANK = { trust: 3, conflict: 3, commitment: 3, accountability: 3, results: 3, trust_notes: '', conflict_notes: '', commitment_notes: '', accountability_notes: '', results_notes: '' };

export default function FiveDysfunctionsDiagnostic({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...BLANK });

  const { data: responses = [] } = useQuery({
    queryKey: ['fiveDysfunctions', orgId],
    queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitFiveDysfunctions', { ...data, organization_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiveDysfunctions', orgId] });
      setOpen(false);
      setForm({ ...BLANK });
    },
  });

  const avgData = DYSFUNCTIONS.map(d => {
    const vals = responses.map(r => r[d.key] || 3);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { subject: d.label, value: parseFloat(avg.toFixed(1)), fullMark: 5 };
  });

  const getColor = (val) => val >= 4 ? 'text-emerald-600' : val >= 3 ? 'text-amber-600' : 'text-red-600';
  const getBar = (val) => val >= 4 ? 'bg-emerald-500' : val >= 3 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-base font-semibold">Five Dysfunctions Diagnostic</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4 mr-1" /> Submit Response
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">Rate each dimension 1 (very low) to 5 (very high) as it currently exists on your team.</p>
            {DYSFUNCTIONS.map((d, i) => (
              <div key={d.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">{i + 1}. {d.label}: {form[d.key]}/5</Label>
                </div>
                <p className="text-xs text-muted-foreground italic">{d.description}</p>
                <Slider min={1} max={5} step={1} value={[form[d.key]]}
                  onValueChange={([v]) => setForm({ ...form, [d.key]: v })} />
                <Textarea placeholder="Optional notes..." value={form[NOTES_FIELDS[i].key]}
                  onChange={e => setForm({ ...form, [NOTES_FIELDS[i].key]: e.target.value })} rows={1} className="text-xs" />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(form)}>Submit</Button>
            </div>
          </div>
        )}

        {responses.length > 0 && !open && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={avgData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.25} />
                <Tooltip formatter={(v) => `${v}/5`} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {avgData.map(d => (
                <div key={d.subject}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{d.subject}</span>
                    <span className={`font-semibold ${getColor(d.value)}`}>{d.value}/5</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getBar(d.value)}`} style={{ width: `${(d.value / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{responses.length} response(s) averaged</p>
          </div>
        )}

        {responses.length === 0 && !open && (
          <p className="text-sm text-muted-foreground text-center py-4">No diagnostic responses yet.</p>
        )}
      </CardContent>
    </Card>
  );
}