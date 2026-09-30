import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useScoreboardConfig } from '@/lib/useScoreboardConfig';
import { DEFAULT_CONFIG, mergeConfig } from '@/lib/scoreboardRecommendations';
import { STAGE_META, STAGE_ORDER } from '@/lib/stageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, RotateCcw, Settings } from 'lucide-react';

const SEVERITY_KEYS = ['strong', 'stable', 'needs_attention', 'critical'];
const DIAGNOSIS_KEYS = ['low', 'moderate', 'strong'];

// Build an editable form object from the merged config (defaults + stored overrides).
function buildForm(merged) {
  return {
    thresholds: { ...merged.thresholds },
    severity_labels: { ...merged.severity_labels },
    starting_point_template: merged.starting_point_template,
    starting_point_all_strong_template: merged.starting_point_all_strong_template,
    stage_configs: STAGE_ORDER.reduce((acc, stage) => {
      const sc = merged.stage_configs[stage];
      acc[stage] = {
        diagnosis: { ...sc.diagnosis },
        current_action: { ...sc.current_action },
        future_priority: { ...sc.future_priority },
        bridging: sc.bridging,
        tools: [...sc.tools],
      };
      return acc;
    }, {}),
  };
}

export default function ScoreboardConfigEditor() {
  const { isAdmin } = useCurrentUser();
  const { configRecord, config, isLoading } = useScoreboardConfig();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!isLoading) setForm(buildForm(mergeConfig(config)));
  }, [config, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      const payload = {
        config_key: 'default',
        thresholds: data.thresholds,
        severity_labels: data.severity_labels,
        starting_point_template: data.starting_point_template,
        starting_point_all_strong_template: data.starting_point_all_strong_template,
        stage_configs: data.stage_configs,
        updated_by: me?.email || 'admin',
      };
      if (configRecord?.id) {
        return base44.entities.ScoreboardConfig.update(configRecord.id, payload);
      }
      return base44.entities.ScoreboardConfig.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreboardConfig', 'default'] });
      toast.success('Scoreboard recommendation config saved.');
    },
    onError: (err) => toast.error('Failed to save: ' + (err?.message || 'Unknown error')),
  });

  const resetToDefaults = () => {
    setForm(buildForm(DEFAULT_CONFIG));
    toast.info('Reset to built-in defaults (not yet saved).');
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-sm text-muted-foreground">Only Global Administrators can edit this configuration.</p>
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const set = (path, value) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const setTool = (stage, idx, value) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.stage_configs[stage].tools[idx] = value;
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold">Scoreboard Recommendation Config</h1>
            <p className="text-xs text-muted-foreground">Edit diagnosis templates, recommendations, thresholds, and tool references — no code changes required.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Defaults
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            <Save className="h-3.5 w-3.5 mr-1" /> {saveMutation.isPending ? 'Saving...' : 'Save Config'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          {STAGE_ORDER.map((s) => (
            <TabsTrigger key={s} value={s}>{STAGE_META[s].name}</TabsTrigger>
          ))}
        </TabsList>

        {/* General: thresholds, labels, starting point */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-base">Severity Thresholds & Labels</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label>Strong ≥</Label>
                  <Input type="number" step="0.1" value={form.thresholds.strong} onChange={(e) => set('thresholds.strong', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Stable ≥</Label>
                  <Input type="number" step="0.1" value={form.thresholds.stable} onChange={(e) => set('thresholds.stable', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Needs Attention ≥</Label>
                  <Input type="number" step="0.1" value={form.thresholds.needs_attention} onChange={(e) => set('thresholds.needs_attention', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Critical (below Needs Attention)</Label>
                  <Input value="—" disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SEVERITY_KEYS.map((k) => (
                  <div key={k}>
                    <Label>{k.replace('_', ' ')} label</Label>
                    <Input value={form.severity_labels[k]} onChange={(e) => set(`severity_labels.${k}`, e.target.value)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-base">Starting Point Message</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Starting point template <span className="text-xs text-muted-foreground">(use {'{currentStage}'})</span></Label>
                <Textarea rows={3} value={form.starting_point_template} onChange={(e) => set('starting_point_template', e.target.value)} />
              </div>
              <div>
                <Label>All-strong template <span className="text-xs text-muted-foreground">(use {'{currentStage}'})</span></Label>
                <Textarea rows={3} value={form.starting_point_all_strong_template} onChange={(e) => set('starting_point_all_strong_template', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per-stage tabs */}
        {STAGE_ORDER.map((stage) => {
          const sc = form.stage_configs[stage];
          return (
            <TabsContent key={stage} value={stage} className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-base">{STAGE_META[stage].name} — Diagnosis</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {DIAGNOSIS_KEYS.map((dk) => (
                    <div key={dk}>
                      <Label className="capitalize">{dk}</Label>
                      <Textarea rows={3} value={sc.diagnosis[dk]} onChange={(e) => set(`stage_configs.${stage}.diagnosis.${dk}`, e.target.value)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-base">{STAGE_META[stage].name} — Current Action Recommendations</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {SEVERITY_KEYS.map((sk) => (
                    <div key={sk}>
                      <Label className="capitalize">{sk.replace('_', ' ')}</Label>
                      <Textarea rows={3} value={sc.current_action[sk]} onChange={(e) => set(`stage_configs.${stage}.current_action.${sk}`, e.target.value)} />
                    </div>
                  ))}
                  <div>
                    <Label>Bridging sentence <span className="text-xs text-muted-foreground">(use {'{concernStage}'}; empty disables)</span></Label>
                    <Textarea rows={2} value={sc.bridging} onChange={(e) => set(`stage_configs.${stage}.bridging`, e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-base">{STAGE_META[stage].name} — Future Priority Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {SEVERITY_KEYS.map((sk) => (
                    <div key={sk}>
                      <Label className="capitalize">{sk.replace('_', ' ')}</Label>
                      <Textarea rows={2} value={sc.future_priority[sk]} onChange={(e) => set(`stage_configs.${stage}.future_priority.${sk}`, e.target.value)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-base">{STAGE_META[stage].name} — Tool References</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {sc.tools.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={t} onChange={(e) => setTool(stage, i, e.target.value)} />
                      <Button variant="ghost" size="sm" onClick={() => set(`stage_configs.${stage}.tools`, sc.tools.filter((_, idx) => idx !== i))}>Remove</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => set(`stage_configs.${stage}.tools`, [...sc.tools, 'New tool'])}>+ Add tool</Button>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}