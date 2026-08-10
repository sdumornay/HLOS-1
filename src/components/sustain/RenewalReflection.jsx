import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Plus, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const DIMENSIONS = [
  { key: 'leadership_sustainability', label: 'Leadership Sustainability', desc: 'How sustainable is your leadership pace right now?' },
  { key: 'team_relationships', label: 'Team Relationships', desc: 'Health and quality of relationships within the team' },
  { key: 'communication_health', label: 'Communication Health', desc: 'Openness, honesty, and clarity in communication' },
  { key: 'workload', label: 'Workload', desc: 'How manageable is the current workload? (10 = sustainable)' },
  { key: 'leadership_pressure', label: 'Leadership Pressure', desc: 'How much pressure is on leadership? (10 = healthy/balanced)' },
  { key: 'ministry_rhythm', label: 'Ministry Rhythm', desc: 'Health of ministry rhythm, pace, and seasonal flow' },
];

const EMPTY_FORM = {
  leadership_sustainability: 5, team_relationships: 5, communication_health: 5,
  workload: 5, leadership_pressure: 5, ministry_rhythm: 5,
  renewal_areas: '', reflection_notes: '',
};

function scoreColor(v) {
  if (v >= 7) return 'text-emerald-600';
  if (v >= 4) return 'text-amber-600';
  return 'text-red-600';
}

export default function RenewalReflection({ orgId }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: reflections = [] } = useQuery({
    queryKey: ['renewalReflections', orgId],
    queryFn: () => base44.entities.RenewalReflection.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RenewalReflection.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['renewalReflections', orgId]); setOpen(false); setForm(EMPTY_FORM); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const today = format(new Date(), 'yyyy-MM-dd');
  const avgScore = DIMENSIONS.reduce((s, d) => s + (form[d.key] || 0), 0) / DIMENSIONS.length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Renewal Reflection</CardTitle>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}>
          <Plus className="h-3 w-3 mr-1" /> New Reflection
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <div className="space-y-4 border border-border/60 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Reflect on each area below. These scores help the team identify where renewal is needed — not to diagnose, but to build self-awareness.
            </p>

            {DIMENSIONS.map(({ key, label, desc }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <span className={`text-lg font-bold ${scoreColor(form[key])}`}>{form[key]}</span>
                </div>
                <Slider
                  min={1} max={10} step={1}
                  value={[form[key]]}
                  onValueChange={([v]) => set(key, v)}
                />
              </div>
            ))}

            <div className="flex items-center gap-3 bg-accent/5 rounded-lg px-4 py-3">
              <div className="text-2xl font-barlow font-bold text-accent">{avgScore.toFixed(1)}</div>
              <div>
                <p className="text-xs font-semibold text-foreground">Overall Renewal Score</p>
                <p className="text-xs text-muted-foreground">Average across all 6 areas</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Areas Requiring Renewal</Label>
              <Textarea
                value={form.renewal_areas}
                onChange={e => set('renewal_areas', e.target.value)}
                className="h-20"
                placeholder="Which areas need the most attention? What renewal practices would help?"
              />
            </div>
            <div className="space-y-1">
              <Label>Reflection Notes</Label>
              <Textarea
                value={form.reflection_notes}
                onChange={e => set('reflection_notes', e.target.value)}
                className="h-20"
                placeholder="Any additional reflections on team sustainability..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate({
                  ...form,
                  organization_id: orgId,
                  reflection_date: today,
                  respondent_email: user?.email,
                  status: 'complete',
                })}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Saving…' : 'Save Reflection'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {reflections.length === 0 && !open && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No renewal reflections yet. Start a reflection to assess team sustainability and identify areas needing renewal.
          </p>
        )}

        {reflections.map(r => {
          const avg = DIMENSIONS.reduce((s, d) => s + (r[d.key] || 0), 0) / DIMENSIONS.length;
          return (
            <div key={r.id} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">{r.reflection_date ? format(new Date(r.reflection_date), 'MMM d, yyyy') : '—'}</span>
                  <Badge className={`text-xs border-0 ${avg >= 7 ? 'bg-emerald-100 text-emerald-700' : avg >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {avg.toFixed(1)} avg
                  </Badge>
                  {r.respondent_email && <span className="text-xs text-muted-foreground">{r.respondent_email}</span>}
                </div>
                {expanded === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {expanded === r.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {DIMENSIONS.map(({ key, label }) => (
                      <div key={key} className="bg-muted/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">{label.split(' ')[0]}</p>
                        <p className={`text-lg font-bold ${scoreColor(r[key] || 0)}`}>{r[key] || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {r.renewal_areas && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mt-2 mb-1">AREAS REQUIRING RENEWAL</p>
                      <p className="text-sm">{r.renewal_areas}</p>
                    </div>
                  )}
                  {r.reflection_notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">NOTES</p>
                      <p className="text-sm">{r.reflection_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}