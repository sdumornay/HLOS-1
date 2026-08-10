import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Minus, Heart, ArrowUp, ArrowDown } from 'lucide-react';
import { SCOREBOARD_DIMENSIONS, getScoreColor } from '@/lib/scoreboardScoring';
import { cn } from '@/lib/utils';

export default function ScoreboardSummary({ current, previous }) {
  if (!current) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-12 text-center">
          <Heart className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No Leadership Health Scoreboard responses yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Have team members complete the Scoreboard to see aggregated results here.</p>
        </CardContent>
      </Card>
    );
  }

  const { overall, respondents, dimensions } = current;
  const scoreColor = getScoreColor(overall);
  const change = previous ? parseFloat((overall - previous.overall).toFixed(1)) : null;

  return (
    <div className="space-y-4">
      {/* Top row: big score + key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overall score */}
        <Card className={cn('border-border/50 shadow-sm', scoreColor.bg)}>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Overall Health Score</p>
            <p className={cn('text-4xl font-bold', scoreColor.text)}>{overall.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 10 · {scoreColor.label}</p>
          </CardContent>
        </Card>

        {/* Respondents */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Respondents</p>
            </div>
            <p className="text-4xl font-bold">{respondents}</p>
            <p className="text-xs text-muted-foreground mt-1">{current.count} response{current.count !== 1 ? 's' : ''} this round</p>
          </CardContent>
        </Card>

        {/* Previous score */}
        {previous ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Previous Score</p>
              <p className="text-4xl font-bold text-muted-foreground">{previous.overall.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">{previous.month}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Previous Score</p>
              <p className="text-4xl font-bold text-muted-foreground/30">—</p>
              <p className="text-xs text-muted-foreground mt-1">No prior data</p>
            </CardContent>
          </Card>
        )}

        {/* Change */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Change</p>
            {change != null ? (
              <>
                <div className="flex items-center justify-center gap-1">
                  {change > 0 ? (
                    <ArrowUp className="h-6 w-6 text-emerald-500" />
                  ) : change < 0 ? (
                    <ArrowDown className="h-6 w-6 text-red-500" />
                  ) : (
                    <Minus className="h-6 w-6 text-muted-foreground" />
                  )}
                  <p className={cn('text-4xl font-bold', change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs previous round</p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold text-muted-foreground/30">—</p>
                <p className="text-xs text-muted-foreground mt-1">First assessment</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category scores bar chart */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold mb-4">Category Scores</p>
          <div className="space-y-3">
            {SCOREBOARD_DIMENSIONS.map(dim => {
              const score = dimensions[dim.key] || 0;
              const color = getScoreColor(score);
              return (
                <div key={dim.key} className="flex items-center gap-3">
                  <div className="w-32 flex-shrink-0">
                    <p className="text-xs font-medium">{dim.label}</p>
                  </div>
                  <div className="flex-1 h-6 bg-muted/40 rounded-full overflow-hidden relative">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', color.text.replace('text-', 'bg-'))}
                      style={{ width: `${score * 10}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold">
                      {score.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strongest + Weakest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-semibold">Strongest Areas</p>
            </div>
            <div className="space-y-2">
              {current.strongest?.length > 0 ? current.strongest.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-sm">{s.label}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">{s.value.toFixed(1)}</Badge>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Areas Needing Attention</p>
            </div>
            <div className="space-y-2">
              {current.weakest?.length > 0 ? current.weakest.map(w => (
                <div key={w.key} className="flex items-center justify-between">
                  <span className="text-sm">{w.label}</span>
                  <Badge className={cn('border-0', getScoreColor(w.value).bg, getScoreColor(w.value).text)}>
                    {w.value.toFixed(1)}
                  </Badge>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}