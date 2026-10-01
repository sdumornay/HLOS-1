import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Eye, Lightbulb, Info, Flame } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

// All fields: higher = more pressure (less healthy)
export const PRESSURE_POINTS = [
  { key: 'side_conversations', label: 'Side Conversations', shortLabel: 'Side Convo' },
  { key: 'decision_aftermath', label: 'Decision Aftermath', shortLabel: 'Decisions' },
  { key: 'ownership_confusion', label: 'Ownership Confusion', shortLabel: 'Ownership' },
  { key: 'meeting_atmosphere', label: 'Meeting Atmosphere', shortLabel: 'Meetings' },
  { key: 'disengagement', label: 'Disengagement', shortLabel: 'Disengage' },
  { key: 'faction_pressure', label: 'Faction Pressure', shortLabel: 'Factions' },
];

const HIGH_PRESSURE = 7;
const LOW_PRESSURE = 3;

export function interpretTensionPulse(pulse) {
  if (!pulse) return null;

  const scored = PRESSURE_POINTS.map(p => ({
    key: p.key,
    label: p.label,
    raw: pulse[p.key] ?? 5,
  }));

  const overallPressure = scored.reduce((s, p) => s + p.raw, 0) / scored.length;
  const sorted = [...scored].sort((a, b) => b.raw - a.raw);

  // Hot spots: high pressure (>= 7)
  const hotSpots = sorted.filter(s => s.raw >= HIGH_PRESSURE);
  // Cool spots: low pressure (<= 3)
  const coolSpots = [...scored].sort((a, b) => a.raw - b.raw).filter(s => s.raw <= LOW_PRESSURE);

  // Per-point commentary
  const dimensionCommentary = scored.map(s => {
    let level, note;
    if (s.raw >= 8) {
      level = 'critical';
      note = 'A significant pressure point — address this before it hardens into a pattern.';
    } else if (s.raw >= 6) {
      level = 'watch';
      note = 'Elevated — worth a direct conversation before it escalates.';
    } else if (s.raw >= 4) {
      level = 'moderate';
      note = 'Present but manageable — keep an eye on it.';
    } else {
      level = 'calm';
      note = 'Not a significant source of pressure right now.';
    }
    return { ...s, level, note };
  });

  // Pattern detection
  const patterns = [];
  if (pulse.side_conversations >= 7) patterns.push('Side conversations are replacing direct communication — people may not feel safe raising concerns openly.');
  if (pulse.meeting_atmosphere >= 7) patterns.push('Meeting tension is high — the team may be avoiding real issues in the room.');
  if (pulse.disengagement >= 7) patterns.push('Key people are withdrawing — this often signals trust erosion or burnout.');
  if (pulse.faction_pressure >= 7) patterns.push('Factions are forming — the team may be splitting along unresolved lines of tension.');
  if (pulse.ownership_confusion >= 7) patterns.push('Role overlap is creating friction — clarify who owns what before it deepens.');
  if (pulse.decision_aftermath >= 7) patterns.push('Decisions are not landing — people are still processing privately after the fact.');
  if (overallPressure >= 6) patterns.push('Overall relational pressure is high — consider a structured conflict intake to surface root causes.');
  if (patterns.length === 0 && overallPressure <= 3) patterns.push('Relational pressure is low — the team is in a healthy place. Keep monitoring with regular pulses.');
  else if (patterns.length === 0) patterns.push('No single pressure point is critical, but stay attentive to shifts between people.');

  // Recommended focus based on highest pressure point
  let focusArea = 'Maintain regular pulse checks to catch shifts early';
  const hottest = sorted[0];
  if (hottest && hottest.raw >= 6) {
    const focusMap = {
      side_conversations: 'Establish communication agreements so concerns go directly to the person involved',
      decision_aftermath: 'Strengthen decision-making clarity — confirm commitment before moving on',
      ownership_confusion: 'Clarify roles and responsibilities to reduce overlap and dropped balls',
      meeting_atmosphere: 'Address meeting tension — create space for honest, direct conversation',
      disengagement: 'Reach out to disengaging team members — name what you are noticing',
      faction_pressure: 'Address subgroup dynamics — name the tension and bring the team back together',
    };
    focusArea = focusMap[hottest.key] || focusArea;
  }

  return { overallPressure, hotSpots, coolSpots, patterns, focusArea, dimensionCommentary };
}

export default function TensionPulseInterpretation({ pulse }) {
  const interpretation = interpretTensionPulse(pulse);
  if (!interpretation) return null;

  const { overallPressure, hotSpots, coolSpots, patterns, focusArea, dimensionCommentary } = interpretation;

  // Build chart data — show raw pressure (higher = more pressure)
  const chartData = PRESSURE_POINTS.map(p => ({
    subject: p.shortLabel,
    value: pulse[p.key] ?? 5,
  }));

  const pressureColor = overallPressure >= 7 ? 'text-red-600' : overallPressure >= 4 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold">Pressure Map — What This Means</p>
      </div>

      <div className="rounded-lg bg-background/50 p-2">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            <Tooltip formatter={(v) => [`${v.toFixed(1)}/10 pressure`, 'Pressure']} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-sm leading-relaxed">
        Your overall relational pressure level is{' '}
        <span className={cn('font-bold', pressureColor)}>{overallPressure.toFixed(1)}/10</span>.
        {overallPressure >= 7
          ? ' Pressure is high — several areas between people need direct attention.'
          : overallPressure >= 4
            ? ' Pressure is moderate — a few areas between people are worth watching.'
            : ' Pressure is low — relationships between people are in a relatively healthy place.'}
      </p>

      {hotSpots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Flame className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Hottest Pressure Points</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hotSpots.map(s => (
              <Badge key={s.key} className="bg-red-100 text-red-700 border-0">
                {s.label} ({s.raw}/10)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {coolSpots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Cooler Areas</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coolSpots.map(s => (
              <Badge key={s.key} className="bg-emerald-100 text-emerald-700 border-0">
                {s.label} ({s.raw}/10)
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Eye className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Pressure Point Detail</p>
        </div>
        <ul className="space-y-1.5">
          {dimensionCommentary.map(d => (
            <li key={d.key} className="text-xs leading-relaxed flex items-start gap-2">
              <span className={cn('mt-1 h-1.5 w-1.5 rounded-full shrink-0',
                d.level === 'critical' ? 'bg-red-500'
                : d.level === 'watch' ? 'bg-amber-500'
                : d.level === 'moderate' ? 'bg-blue-400'
                : 'bg-emerald-500'
              )} />
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
          <span className="font-medium text-foreground">{focusArea}</span>
        </p>
      </div>
    </div>
  );
}