import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DIMENSIONS = [
  { key: 'trust', label: 'Trust', color: '#3b82f6' },
  { key: 'safety', label: 'Safety', color: '#10b981' },
  { key: 'clarity', label: 'Clarity', color: '#f59e0b' },
  { key: 'accountability', label: 'Accountability', color: '#8b5cf6' },
  { key: 'meeting_effectiveness', label: 'Meetings', color: '#06b6d4' },
  { key: 'conflict_intensity', label: 'Conflict ↓', color: '#ef4444' },
];

const STAGE_COLORS = {
  stabilize: 'bg-red-100 text-red-700 border-red-200',
  align: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  execute: 'bg-blue-100 text-blue-700 border-blue-200',
  sustain: 'bg-green-100 text-green-700 border-green-200',
};

function getTrend(data, key) {
  if (data.length < 2) return null;
  const last = data[data.length - 1][key];
  const prev = data[data.length - 2][key];
  if (last == null || prev == null) return null;
  if (last > prev) return 'up';
  if (last < prev) return 'down';
  return 'flat';
}

function TrendArrow({ direction, invertGood }) {
  if (!direction) return null;
  const isGood = invertGood ? direction === 'down' : direction === 'up';
  if (direction === 'flat') return <span className="text-muted-foreground text-xs">→</span>;
  return (
    <span className={isGood ? 'text-green-600 text-xs font-bold' : 'text-red-500 text-xs font-bold'}>
      {direction === 'up' ? '↑' : '↓'}
    </span>
  );
}

export default function TeamHealthTrends({ assessments }) {
  const [activeLines, setActiveLines] = useState(
    Object.fromEntries(DIMENSIONS.map(d => [d.key, true]))
  );

  if (!assessments || assessments.length === 0) return null;

  // Build time-series: group by date, average across respondents per date
  const byDate = {};
  assessments.forEach(a => {
    const dateKey = a.created_date ? format(new Date(a.created_date), 'MMM d') : 'Unknown';
    if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, stage: a.stage, _counts: {} };
    DIMENSIONS.forEach(d => {
      if (a[d.key] != null) {
        byDate[dateKey][d.key] = (byDate[dateKey][d.key] || 0) + a[d.key];
        byDate[dateKey]._counts[d.key] = (byDate[dateKey]._counts[d.key] || 0) + 1;
      }
    });
  });

  const chartData = Object.values(byDate).map(entry => {
    const point = { date: entry.date, stage: entry.stage };
    DIMENSIONS.forEach(d => {
      if (entry[d.key] != null) {
        point[d.key] = parseFloat((entry[d.key] / entry._counts[d.key]).toFixed(1));
      }
    });
    return point;
  });

  // Latest snapshot for summary cards
  const latest = chartData[chartData.length - 1] || {};

  const toggleLine = (key) => {
    setActiveLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Team Health Trends</h2>
        <span className="text-xs text-muted-foreground">{chartData.length} data point{chartData.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Latest snapshot summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {DIMENSIONS.map(dim => {
          const val = latest[dim.key];
          const trend = getTrend(chartData, dim.key);
          return (
            <Card
              key={dim.key}
              className={`border-border/50 cursor-pointer transition-opacity ${activeLines[dim.key] ? '' : 'opacity-40'}`}
              onClick={() => toggleLine(dim.key)}
            >
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold" style={{ color: dim.color }}>
                    {val != null ? val : '—'}
                  </span>
                  <TrendArrow direction={trend} invertGood={dim.key === 'conflict_intensity'} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{dim.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Line chart */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 pt-5">
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Complete at least 2 assessments to see trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const dim = DIMENSIONS.find(d => d.key === name);
                    return [value, dim?.label || name];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const dim = DIMENSIONS.find(d => d.key === value);
                    return <span style={{ fontSize: 11 }}>{dim?.label || value}</span>;
                  }}
                />
                {DIMENSIONS.map(dim => (
                  activeLines[dim.key] && (
                    <Line
                      key={dim.key}
                      type="monotone"
                      dataKey={dim.key}
                      stroke={dim.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: dim.color }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Stage markers */}
          {chartData.some(d => d.stage) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
              {chartData.map((d, i) => d.stage && (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{d.date}:</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${STAGE_COLORS[d.stage] || ''}`}>
                    {d.stage}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}