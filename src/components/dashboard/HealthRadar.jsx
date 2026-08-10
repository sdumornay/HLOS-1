import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DIMENSION_LABELS = {
  trust: 'Trust',
  safety: 'Safety',
  clarity: 'Clarity',
  accountability: 'Accountability',
  meeting_effectiveness: 'Meeting Quality',
  conflict_intensity: 'Low Conflict',
};

export default function HealthRadar({ assessments = [] }) {
  const sorted = [...assessments].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const avgData = Object.entries(DIMENSION_LABELS).map(([key, label]) => {
    const values = assessments.map(a => a[key]).filter(v => v != null);
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    // Invert conflict_intensity so higher = better
    const score = key === 'conflict_intensity' ? (10 - avg) : avg;
    return { dimension: label, score: parseFloat(score.toFixed(1)), fullMark: 10 };
  });

  const deltas = latest && prev
    ? Object.entries(DIMENSION_LABELS).map(([key, label]) => {
        const latestVal = latest[key];
        const prevVal = prev[key];
        if (latestVal == null || prevVal == null) return null;
        const d = key === 'conflict_intensity' ? prevVal - latestVal : latestVal - prevVal;
        return { label, delta: parseFloat(d.toFixed(1)) };
      }).filter(Boolean)
    : [];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Team Health Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={avgData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
            <Radar name="Health" dataKey="score" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>

        {deltas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/40">
            {deltas.map(d => (
              <span key={d.label} className={`text-xs flex items-center gap-1 ${d.delta > 0 ? 'text-emerald-600' : d.delta < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {d.delta > 0 ? '↑' : d.delta < 0 ? '↓' : '→'} {d.label} {Math.abs(d.delta)}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}