import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function BenchmarkPanel({ orgId }) {
  const { user } = useCurrentUser();

  const { data: allAssessments = [] } = useQuery({
    queryKey: ['all-assessments-benchmark'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 200),
    enabled: !!user,
  });

  const dims = [
    { key: 'trust', label: 'Trust' },
    { key: 'safety', label: 'Safety' },
    { key: 'clarity', label: 'Clarity' },
    { key: 'accountability', label: 'Acct.' },
    { key: 'meeting_effectiveness', label: 'Meetings' },
  ];

  const myAssessments = allAssessments.filter(a => a.organization_id === orgId);
  const otherAssessments = allAssessments.filter(a => a.organization_id !== orgId);

  const avg = (arr, key) => {
    const vals = arr.map(a => a[key]).filter(v => v != null && v > 0);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };

  const data = dims.map(d => ({
    name: d.label,
    mine: parseFloat(avg(myAssessments, d.key).toFixed(1)),
    benchmark: parseFloat(avg(otherAssessments, d.key).toFixed(1)),
  }));

  const myOverall = parseFloat(avg(myAssessments, 'overall_health').toFixed(1));
  const benchOverall = parseFloat(avg(otherAssessments, 'overall_health').toFixed(1));

  if (myAssessments.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">Benchmarking</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
              Your Org ({myOverall > 0 ? myOverall : '—'})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary inline-block" />
              Network Avg ({benchOverall > 0 ? benchOverall : '—'})
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Anonymized comparison across all organizations</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
              formatter={(v, name) => [v, name === 'mine' ? 'Your Org' : 'Network Avg']}
            />
            <Bar dataKey="mine" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="benchmark" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}