import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function MomentumChart({ assessments = [] }) {
  const sorted = [...assessments].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const data = sorted.map(a => ({
    date: format(new Date(a.created_date), 'MMM d'),
    health: a.overall_health || 0,
  }));

  if (data.length === 0) {
    data.push({ date: 'No data', health: 0 });
  }

  const delta = data.length >= 2
    ? parseFloat((data[data.length - 1].health - data[data.length - 2].health).toFixed(1))
    : null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Health Trend</CardTitle>
          {delta !== null && delta !== 0 && (
            <span className={`text-xs font-semibold flex items-center gap-1 ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} since last
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="health" stroke="hsl(var(--chart-2))" fill="url(#healthGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}