import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Plus } from 'lucide-react';
import ScoreboardSummary from '@/components/health/ScoreboardSummary';
import WhatThisMeans from '@/components/health/WhatThisMeans';
import RecommendedNextSteps from '@/components/health/RecommendedNextSteps';
import HealthRadar from '@/components/dashboard/HealthRadar';
import {
  getRoundComparison, interpretHealth, getRecommendedSteps, getStrongestAndWeakest,
} from '@/lib/scoreboardScoring';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const MONTH_LABELS = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

export default function OrgHealth() {
  const { user } = useCurrentUser();
  const orgId = user?.organization_id;

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['scoreboard-assessments', orgId],
    queryFn: () => base44.entities.Assessment.filter({ organization_id: orgId }, '-created_date', 200),
    enabled: !!orgId,
  });

  const { current, previous, rounds } = getRoundComparison(assessments);
  const interpretation = current ? interpretHealth(current, previous) : null;
  const recommendedSteps = current ? getRecommendedSteps(current.dimensions) : [];

  // Enrich current round with strongest/weakest
  const enrichedCurrent = current ? { ...current, ...getStrongestAndWeakest(current.dimensions) } : null;

  // Trend chart data
  const trendData = rounds.map(r => ({
    month: `${MONTH_LABELS[r.month.substring(5)] || r.month.substring(5)} ${r.month.substring(0, 4)}`,
    score: r.overall,
    respondents: r.respondents,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Organization Health</h1>
          <p className="text-muted-foreground mt-1">Leadership Health Scoreboard — aggregated team results</p>
        </div>
        <Link to="/assessments">
          <Button><Plus className="h-4 w-4 mr-2" />Take Scoreboard</Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="border-border/50"><CardContent className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
        </CardContent></Card>
      ) : assessments.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No Leadership Health Scoreboard responses yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Have your leadership team complete the Scoreboard to see aggregated health results here.</p>
            <Link to="/assessments" className="inline-block mt-4">
              <Button><Plus className="h-4 w-4 mr-2" />Take Scoreboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary: overall score, respondents, previous, change, category bars, strongest/weakest */}
          <ScoreboardSummary current={enrichedCurrent} previous={previous} />

          {/* Charts: radar + trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HealthRadar assessments={assessments} />

            {/* Overall score trend */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-semibold mb-3">Overall Score Trend</p>
                {trendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(value, name) => name === 'score' ? [value, 'Health Score'] : [value, name]}
                      />
                      <ReferenceLine y={6} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Healthy', fontSize: 10, fill: '#10b981', position: 'right' }} />
                      <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'At Risk', fontSize: 10, fill: '#f59e0b', position: 'right' }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 5, fill: 'hsl(var(--chart-2))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">
                      Complete assessments in at least 2 different months to see the trend.
                    </p>
                  </div>
                )}
                {trendData.length > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                    <span>{rounds.length} assessment round{rounds.length !== 1 ? 's' : ''}</span>
                    <span>{rounds.reduce((s, r) => s + r.respondents, 0)} total responses</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* What This Means + Recommended Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WhatThisMeans interpretation={interpretation} />
            <RecommendedNextSteps steps={recommendedSteps} />
          </div>
        </>
      )}
    </div>
  );
}