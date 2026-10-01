import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, TrendingDown, Info, Heart } from 'lucide-react';
import { DIMENSIONS, getInterpretation, getStrongAreas, getAttentionAreas, WHAT_THIS_MEANS_MESSAGE } from '@/lib/orgSnapshotScoring';
import { cn } from '@/lib/utils';

const getBarColor = (score) => {
  if (score >= 4.2) return '#10b981'; // emerald
  if (score >= 3.4) return '#3b82f6';  // blue
  if (score >= 2.6) return '#f59e0b'; // amber
  if (score >= 1.8) return '#f97316'; // orange
  return '#ef4444';                    // red
};

export default function OrgSnapshotResults({ snapshot, orgComplete = true, leadershipComplete = false }) {
  const navigate = useNavigate();

  const overall = snapshot.overall_score ?? 0;
  const dimScores = {};
  for (const dim of DIMENSIONS) {
    dimScores[dim.key] = snapshot[`${dim.key}_score`] ?? 0;
  }

  const overallInterp = getInterpretation(overall);
  const strongAreas = getStrongAreas(dimScores);
  const attentionAreas = getAttentionAreas(dimScores);

  // Bar chart data — sorted highest to lowest
  const chartData = DIMENSIONS
    .map(d => ({ name: d.label, shortName: d.shortLabel, score: dimScores[d.key] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
            <Heart className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Your Organizational Health Snapshot</h1>
          <p className="text-sm text-muted-foreground">A starting point for understanding your organization.</p>
        </div>

        {/* Overall score */}
        <Card className={cn('border-2', overall >= 4.2 ? 'border-emerald-200' : overall >= 3.4 ? 'border-blue-200' : overall >= 2.6 ? 'border-amber-200' : 'border-red-200')}>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Organizational Health</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-foreground">{overall.toFixed(1)}</span>
              <span className="text-xl text-muted-foreground">/ 5</span>
            </div>
            <Badge className={cn('text-sm font-medium border-0', overallInterp.badge)}>
              {overallInterp.label}
            </Badge>
          </CardContent>
        </Card>

        {/* Dimension chart */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-1">How Your Organization Scores Across Six Dimensions</p>
            <p className="text-xs text-muted-foreground mb-4">Higher bars indicate stronger areas. Each dimension is scored 1–5.</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11 }} width={85} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} / 5`, 'Score']} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                  ))}
                  <LabelList dataKey="score" position="right" formatter={(v) => Number(v).toFixed(1)} style={{ fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dimension scores list */}
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold mb-2">Dimension Scores</p>
            {DIMENSIONS.map(dim => {
              const score = dimScores[dim.key] ?? 0;
              const interp = getInterpretation(score);
              return (
                <div key={dim.key} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-sm font-medium">{dim.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{score.toFixed(1)}</span>
                    <Badge className={cn('text-xs border-0', interp.badge)}>{interp.label}</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* What Appears Strong */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">What Appears Strong</p>
            </div>
            <div className="space-y-1.5">
              {strongAreas.map(area => (
                <div key={area.key}>
                  <p className="text-sm font-medium">{area.label} — {area.score.toFixed(1)}/5</p>
                  <p className="text-xs text-muted-foreground">
                    {area.score >= 4.2
                      ? 'This is a clear strength. The patterns here can serve as a foundation to build on.'
                      : 'This area is generally solid. It provides stability you can lean into while addressing other areas.'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What Needs Attention */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-700">What Needs Attention</p>
            </div>
            <div className="space-y-1.5">
              {attentionAreas.map(area => (
                <div key={area.key}>
                  <p className="text-sm font-medium">{area.label} — {area.score.toFixed(1)}/5</p>
                  <p className="text-xs text-muted-foreground">
                    {area.score < 2.6
                      ? 'This area is currently under strain. It may be worth exploring what is contributing to the challenge.'
                      : 'This area has room to grow. Small adjustments here could meaningfully strengthen the organization.'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What This Means */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">What This Means</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{WHAT_THIS_MEANS_MESSAGE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transition to Stabilize / Leadership Health Scoreboard */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">You've looked at the organization. Now let's look at the leadership team.</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Organizational patterns are often shaped by what happens within the leadership team—how leaders communicate,
                make decisions, handle conflict, build trust, and hold one another accountable.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Leadership Health Scoreboard will help you take a closer look at the health of the team leading the organization.
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => navigate('/scoreboard')}>
            Continue to Leadership Health Scoreboard <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}