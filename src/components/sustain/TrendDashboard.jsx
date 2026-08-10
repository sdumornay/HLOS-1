import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Eye } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { detectPatterns, SEVERITY_LABELS, SEVERITY_STYLES } from '@/lib/patternDetection';

function trendIcon(arr, key) {
  if (arr.length < 2) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const last = arr[arr.length - 1][key];
  const prev = arr[arr.length - 2][key];
  if (last > prev) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (last < prev) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function TrendDashboard({ orgId }) {
  const { data: pulses = [] } = useQuery({
    queryKey: ['healthPulses', orgId],
    queryFn: () => base44.entities.HealthPulse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues', orgId],
    queryFn: () => base44.entities.Issue.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  // Group pulses by month, average scores
  const monthMap = {};
  pulses.forEach(p => {
    if (!monthMap[p.month]) monthMap[p.month] = { month: p.month, health: [], momentum: [], trust: [], clarity: [] };
    monthMap[p.month].health.push(p.overall_health || 0);
    monthMap[p.month].momentum.push(p.momentum || 0);
    monthMap[p.month].trust.push(p.trust || 0);
    monthMap[p.month].clarity.push(p.clarity || 0);
  });

  const avg = arr => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;

  const chartData = Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      month: m.month,
      Health: avg(m.health),
      Momentum: avg(m.momentum),
      Trust: avg(m.trust),
      Clarity: avg(m.clarity),
    }));

  const latestHealth = chartData.length ? chartData[chartData.length - 1].Health : null;
  const latestMomentum = chartData.length ? chartData[chartData.length - 1].Momentum : null;

  // Pattern detection
  const patterns = detectPatterns({ pulses, issues, actions, priorities });

  return (
    <div className="space-y-4 col-span-full">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">Health & Momentum Trends</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {latestHealth !== null && (
              <span className="flex items-center gap-1">
                {trendIcon(chartData, 'Health')}
                <span className="font-semibold">Health {latestHealth}</span>
              </span>
            )}
            {latestMomentum !== null && (
              <span className="flex items-center gap-1">
                {trendIcon(chartData, 'Momentum')}
                <span className="font-semibold">Momentum {latestMomentum}</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Submit at least 2 months of health pulses to see trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Health" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Momentum" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Trust" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="Clarity" stroke="hsl(var(--chart-4))" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pattern Detection */}
      {patterns.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-base">Patterns to Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              These observations are surfaced to build self-awareness — not to diagnose or alarm. Use them as starting points for team conversation.
            </p>
            {patterns.map((p, i) => (
              <div key={i} className={`border rounded-lg p-3 ${SEVERITY_STYLES[p.severity]}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-xs mt-0.5 opacity-90">{p.detail}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wide mt-1 inline-block">
                      {SEVERITY_LABELS[p.severity]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}