import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Eye, Lightbulb, Info } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const METRIC_LABELS = {
  trust_level: 'Trust',
  communication_safety: 'Healthy Conflict',
  unresolved_conflicts: 'Conflict Avoidance',
  leadership_confidence: 'Commitment',
  team_morale: 'Accountability',
  team_tension: 'Results Drift',
};

// Maps each metric to its Lencioni dysfunction
const DYSFUNCTION_MAP = {
  trust_level: 'Absence of Trust',
  communication_safety: 'Fear of Conflict',
  unresolved_conflicts: 'Fear of Conflict',
  leadership_confidence: 'Lack of Commitment',
  team_morale: 'Avoidance of Accountability',
  team_tension: 'Inattention to Results',
};

// inverted = true means lower score is healthier
const INVERTED = ['unresolved_conflicts', 'team_tension'];

function healthyValue(pulse, key) {
  const v = pulse[key] ?? 5;
  return INVERTED.includes(key) ? 11 - v : v;
}

export function interpretTensionPulse(pulse) {
  if (!pulse) return null;

  const keys = Object.keys(METRIC_LABELS);
  const scored = keys.map(key => ({
    key,
    label: METRIC_LABELS[key],
    raw: pulse[key] ?? 5,
    healthy: healthyValue(pulse, key),
  }));

  const overall = scored.reduce((sum, s) => sum + s.healthy, 0) / scored.length;
  const sorted = [...scored].sort((a, b) => b.healthy - a.healthy);
  // Strength = healthy value >= 7 (raw >= 7 for positive metrics, raw <= 4 for inverted)
  const strongest = sorted.filter(s => s.healthy >= 7);
  // Needs attention = healthy value <= 4 (raw <= 4 for positive, raw >= 7 for inverted)
  const risks = sorted.filter(s => s.healthy <= 4).reverse();

  // Per-dimension commentary (always rendered for all six metrics)
  const dimensionCommentary = scored.map(s => {
    const h = s.healthy;
    let level, note;
    if (h >= 8) {
      level = 'strong';
      note = INVERTED.includes(s.key)
        ? `${s.label} is well-managed — keep monitoring.`
        : `${s.label} is a clear strength — protect and build on it.`;
    } else if (h >= 6) {
      level = 'stable';
      note = INVERTED.includes(s.key)
        ? `${s.label} is manageable but worth watching.`
        : `${s.label} is solid, with room to grow.`;
    } else if (h >= 4) {
      level = 'watch';
      note = INVERTED.includes(s.key)
        ? `${s.label} is elevated — consider a structured conversation.`
        : `${s.label} needs focused attention.`;
    } else {
      level = 'risk';
      note = INVERTED.includes(s.key)
        ? `${s.label} is high — prioritize intervention.`
        : `${s.label} is low — address before pushing forward.`;
    }
    return { ...s, level, note };
  });

  const patterns = [];
  if (pulse.trust_level <= 4) patterns.push('Trust is low — vulnerability-based trust is the foundation of Lencioni\u2019s pyramid; address this before pushing for alignment.');
  if (pulse.communication_safety <= 4) patterns.push('Healthy conflict is fragile — the team may be avoiding the passionate debate that produces better decisions (Fear of Conflict).');
  if (pulse.unresolved_conflicts >= 7) patterns.push('Conflict avoidance is high — unresolved tensions are piling up; schedule a structured conflict conversation soon.');
  if (pulse.leadership_confidence <= 4) patterns.push('Commitment is wavering — team members may not be genuinely buying in to decisions (Lack of Commitment).');
  if (pulse.team_morale <= 4) patterns.push('Accountability is low — peers may be hesitating to call each other out on unproductive behaviors (Avoidance of Accountability).');
  if (pulse.team_tension >= 7) patterns.push('Results drift is high — individual needs and egos may be overshadowing collective team goals (Inattention to Results).');
  if (patterns.length === 0) patterns.push('No critical dysfunction signals — maintain regular pulse checks to catch shifts early.');

  let focusStage = 'stabilize';
  let focusDiscipline = 'Trust & Healthy Conflict';
  if (pulse.trust_level <= 4 || pulse.communication_safety <= 4) {
    focusStage = 'stabilize';
    focusDiscipline = 'Trust & Healthy Conflict';
  } else if (pulse.unresolved_conflicts >= 7) {
    focusStage = 'stabilize';
    focusDiscipline = 'Conflict Resolution';
  } else if (pulse.leadership_confidence <= 5) {
    focusStage = 'align';
    focusDiscipline = 'Commitment & Clarity';
  } else if (pulse.team_morale <= 5) {
    focusStage = 'execute';
    focusDiscipline = 'Accountability';
  } else if (pulse.team_tension >= 7) {
    focusStage = 'sustain';
    focusDiscipline = 'Results Focus';
  }

  return { overall, strongest, risks, patterns, focusStage, focusDiscipline, dimensionCommentary };
}

export default function TensionPulseInterpretation({ pulse }) {
  const interpretation = interpretTensionPulse(pulse);
  if (!interpretation) return null;

  const { overall, strongest, risks, patterns, focusStage, focusDiscipline, dimensionCommentary } = interpretation;

  // Build chart data for this individual pulse (healthy-adjusted: higher = better)
  const chartData = Object.keys(METRIC_LABELS).map(key => {
    const raw = pulse[key] ?? 5;
    return { subject: METRIC_LABELS[key], value: healthyValue(pulse, key), raw };
  });

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold">What This Means</p>
        <span className="text-[10px] text-muted-foreground ml-auto">Lencioni's Five Dysfunctions</span>
      </div>

      <div className="rounded-lg bg-background/50 p-2">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            <Tooltip
              formatter={(v, _name, props) => [`${v.toFixed(1)} (raw: ${props.payload.raw}/10)`, 'Health']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-sm leading-relaxed">
        Your overall tension health score is{' '}
        <span className="font-bold">{overall.toFixed(1)}/10</span>.
        {overall >= 7
          ? ' The team is in a relatively stable place — keep monitoring with regular pulses.'
          : overall >= 5
            ? ' The team has a workable foundation, but a few areas need focused attention.'
            : ' The team is under significant strain — consider prioritizing a stabilization conversation.'}
      </p>

      {strongest.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Strengths</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strongest.map(s => (
              <Badge key={s.key} className="bg-emerald-100 text-emerald-700 border-0">
                {s.label} ({s.raw}/10)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Needs Attention</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {risks.map(r => (
              <Badge key={r.key} className="bg-red-100 text-red-700 border-0">
                {r.label} ({r.raw}/10)
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Eye className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Dimension Commentary</p>
        </div>
        <ul className="space-y-1.5">
          {dimensionCommentary.map(d => (
            <li key={d.key} className="text-xs leading-relaxed flex items-start gap-2">
              <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                d.level === 'strong' ? 'bg-emerald-500'
                : d.level === 'stable' ? 'bg-blue-400'
                : d.level === 'watch' ? 'bg-amber-500'
                : 'bg-red-500'
              }`} />
              <span>
                <span className="font-medium text-foreground">{d.label} ({d.raw}/10):</span>{' '}
                <span className="text-muted-foreground">{d.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Info className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Observations</p>
        </div>
        <ul className="space-y-1">
          {patterns.map((p, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 border-t border-border/40">
        <p className="text-xs text-muted-foreground">
          Recommended focus:{' '}
          <span className="font-medium text-foreground">{focusDiscipline}</span> in the{' '}
          <span className="font-medium text-foreground capitalize">{focusStage}</span> stage.
        </p>
      </div>
    </div>
  );
}