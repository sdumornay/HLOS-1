import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { MOMENTUM_INDICATORS, getMomentumColor } from '@/lib/momentumScoring';
import { cn } from '@/lib/utils';

export default function MomentumSummary({ overall, indicators, counts }) {
  const scoreColor = getMomentumColor(overall);

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <Card className={cn('border-border/50 shadow-sm', scoreColor.bg)}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Rocket className="h-5 w-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Momentum Score</p>
          </div>
          <p className={cn('text-5xl font-bold', scoreColor.text)}>{overall.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground mt-1">out of 10 · {scoreColor.label}</p>
        </CardContent>
      </Card>

      {/* Indicator breakdown */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold mb-4">Momentum Indicators</p>
          <div className="space-y-3">
            {MOMENTUM_INDICATORS.map(dim => {
              const score = indicators[dim.key];
              const count = counts[dim.key];

              if (score == null) {
                return (
                  <div key={dim.key} className="flex items-center gap-3">
                    <div className="w-40 flex-shrink-0">
                      <p className="text-xs font-medium">{dim.label}</p>
                      <p className="text-[10px] text-muted-foreground">{dim.description}</p>
                    </div>
                    <div className="flex-1 h-6 bg-muted/40 rounded-full" />
                    <span className="text-xs text-muted-foreground w-20 text-right">No data</span>
                  </div>
                );
              }

              const color = getMomentumColor(score);
              return (
                <div key={dim.key} className="flex items-center gap-3">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-xs font-medium">{dim.label}</p>
                    <p className="text-[10px] text-muted-foreground">{dim.description}</p>
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
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {count.value}/{count.total}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}