import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Eye, Lightbulb } from 'lucide-react';

const METRIC_LABELS = {
  trust_level: 'Trust',
  communication_safety: 'Communication Safety',
  team_morale: 'Team Morale',
  leadership_confidence: 'Leadership Confidence',
  unresolved_conflicts: 'Unresolved Conflicts',
  team_tension: 'Team Tension',
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
  const strongest = sorted.slice(0, 2);
  const risks = sorted.slice(-2).filter(r => r.healthy < 6);

  const patterns = [];
  if (pulse.team_tension >= 7) patterns.push('Team tension is running high — consider a structured conflict intake to surface root causes.');
  if (pulse.trust_level <= 4) patterns.push('Trust scores are low — relational safety needs attention before pushing for alignment.');
  if (pulse.communication_safety <= 4) patterns.push('Communication safety is fragile — team members may be holding back difficult conversations.');
  if (pulse.unresolved_conflicts >= 7) patterns.push('Unresolved conflicts are accumulating — schedule a guided conflict conversation soon.');
  if (pulse.leadership_confidence <= 4) patterns.push('Confidence in leadership is wavering — a leader interview can clarify gaps and hopes.');
  if (pulse.team_morale <= 4) patterns.push('Morale is low — consider a renewal reflection to identify what would re-energize the team.');
  if (patterns.length === 0) patterns.push('No critical risk signals — maintain regular pulse checks to catch shifts early.');

  let focusStage = 'stabilize';
  let focusDiscipline = 'Leadership Health';
  if (pulse.trust_level <= 4 || pulse.communication_safety <= 4) {
    focusStage = 'stabilize';
    focusDiscipline = 'Healthy Conflict & Communication';
  } else if (pulse.unresolved_conflicts >= 7) {
    focusStage = 'stabilize';
    focusDiscipline = 'Conflict Resolution';
  } else if (pulse.leadership_confidence <= 5) {
    focusStage = 'align';
    focusDiscipline = 'Leadership Clarity';
  } else if (pulse.team_morale <= 5) {
    focusStage = 'sustain';
    focusDiscipline = 'Renewal & Rhythm';
  }

  return { overall, strongest, risks, patterns, focusStage, focusDiscipline };
}

export default function TensionPulseInterpretation({ pulse }) {
  const interpretation = interpretTensionPulse(pulse);
  if (!interpretation) return null;

  const { overall, strongest, risks, patterns, focusStage, focusDiscipline } = interpretation;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold">What This Means</p>
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