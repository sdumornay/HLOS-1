import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { interpretTensionPulse, PRESSURE_POINTS } from '@/components/stabilize/TensionPulseInterpretation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, CheckCircle2, Eye, Info, Lightbulb, Download, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportToPDF } from '@/lib/exportPDF';

const getBarColor = (score) => {
  if (score >= 7) return '#ef4444'; // red — high pressure
  if (score >= 4) return '#f59e0b'; // amber — moderate
  return '#10b981';                // green — low pressure
};

export default function TensionPulseReport({ pulse, onClose }) {
  const interp = interpretTensionPulse(pulse);
  if (!interp) return null;

  const { overallPressure, hotSpots, coolSpots, patterns, focusArea, dimensionCommentary } = interp;

  // Bar chart data — sorted by score (highest = most pressure first)
  const chartData = PRESSURE_POINTS
    .map(p => ({ name: p.label, shortName: p.shortLabel, score: pulse[p.key] ?? 5 }))
    .sort((a, b) => b.score - a.score);

  const pressureColor = overallPressure >= 7 ? 'text-red-600' : overallPressure >= 4 ? 'text-amber-600' : 'text-emerald-600';
  const pressureBg = overallPressure >= 7 ? 'bg-red-50 border-red-200'
    : overallPressure >= 4 ? 'bg-amber-50 border-amber-200'
    : 'bg-emerald-50 border-emerald-200';

  const handleExport = () => {
    exportToPDF({
      title: 'Relational Pressure Pulse Report',
      subtitle: `Submitted ${format(new Date(pulse.created_date), 'MMM d, yyyy')} by ${pulse.respondent_email}`,
      filename: 'tension-pulse-report.pdf',
      sections: [
        {
          heading: 'Pressure Point Scores',
          table: {
            headers: ['Pressure Point', 'Score (1-10, higher = more pressure)'],
            rows: chartData.map(d => [d.name, String(d.score)]),
          },
        },
        { heading: 'Open Responses', items: [
          { label: 'Where pressure is showing up most', value: pulse.biggest_tension || '—' },
          { label: 'One change that would relieve pressure', value: pulse.one_change || '—' },
        ]},
        { heading: 'Interpretation', items: [
          { label: 'Overall pressure level', value: `${overallPressure.toFixed(1)}/10` },
          { label: 'Hottest pressure points', value: hotSpots.length ? hotSpots.map(s => s.label).join(', ') : 'None elevated' },
          { label: 'Cooler areas', value: coolSpots.length ? coolSpots.map(s => s.label).join(', ') : 'None' },
          { label: 'Recommended focus', value: focusArea },
        ]},
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with overall score */}
      <div className={cn('rounded-lg border p-4 flex items-center justify-between', pressureBg)}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Relational Pressure Pulse</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted {format(new Date(pulse.created_date), 'MMM d, yyyy')} by {pulse.respondent_email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Pressure</p>
          <p className={cn('text-3xl font-bold', pressureColor)}>
            {overallPressure.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span>
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-1">Pressure Point Scores</p>
        <p className="text-xs text-muted-foreground mb-3">Higher bars mean more pressure. Sorted from most to least.</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11 }} width={80} />
            <Tooltip formatter={(v) => [`${v}/10 pressure`, 'Score']} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
              <LabelList dataKey="score" position="right" style={{ fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hot and cool spots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hotSpots.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-red-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Hottest Pressure Points</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hotSpots.map(s => (
                <Badge key={s.key} className="bg-red-100 text-red-700 border-0">{s.label} ({s.raw}/10)</Badge>
              ))}
            </div>
          </div>
        )}
        {coolSpots.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Cooler Areas</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {coolSpots.map(s => (
                <Badge key={s.key} className="bg-emerald-100 text-emerald-700 border-0">{s.label} ({s.raw}/10)</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pressure point detail */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-semibold">Pressure Point Detail</p>
        </div>
        <ul className="space-y-2">
          {dimensionCommentary.map(d => (
            <li key={d.key} className="text-sm leading-relaxed flex items-start gap-2">
              <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0',
                d.level === 'critical' ? 'bg-red-500'
                : d.level === 'watch' ? 'bg-amber-500'
                : d.level === 'moderate' ? 'bg-blue-400'
                : 'bg-emerald-500'
              )} />
              <div>
                <span className="font-medium">{d.label} ({d.raw}/10):</span>{' '}
                <span className="text-muted-foreground">{d.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Open responses */}
      {(pulse.biggest_tension || pulse.one_change) && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Your Responses</p>
          {pulse.biggest_tension && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Where pressure is showing up most</p>
              <p className="text-sm">{pulse.biggest_tension}</p>
            </div>
          )}
          {pulse.one_change && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">One change that would relieve pressure</p>
              <p className="text-sm">{pulse.one_change}</p>
            </div>
          )}
        </div>
      )}

      {/* Observations */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-semibold">Observations</p>
        </div>
        <ul className="space-y-1.5">
          {patterns.map((p, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended focus */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold">Recommended Focus</p>
        </div>
        <p className="text-sm text-foreground">{focusArea}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        {onClose && (
          <Button onClick={onClose}>Done</Button>
        )}
      </div>
    </div>
  );
}