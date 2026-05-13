import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ScoreCard({ title, score, maxScore = 10, subtitle, icon: Icon, variant = 'health' }) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  const barColor = variant === 'health'
    ? percentage >= 70 ? 'bg-emerald-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
    : percentage >= 70 ? 'bg-blue-500' : percentage >= 40 ? 'bg-indigo-400' : 'bg-slate-400';

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{score.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/{maxScore}</span></p>
          </div>
          {Icon && (
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              variant === 'health' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${percentage}%` }} />
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}