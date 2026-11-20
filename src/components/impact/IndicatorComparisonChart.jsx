import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IndicatorComparisonChart({ indicators = [] }) {
  const data = indicators.slice(0, 6).map((i) => ({
    name: i.name.length > 22 ? `${i.name.slice(0, 22)}…` : i.name,
    Baseline: i.baseline_value ?? null,
    Current: i.actual_value ?? null,
    Target: i.target_value ?? null,
  }));

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Baseline vs current vs target</CardTitle>
        <p className="text-xs text-muted-foreground">
          Only measured indicators appear. Blank bars mean the data has not been recorded yet.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={56} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Baseline" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Current" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Target" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}