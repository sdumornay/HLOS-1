import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Rocket, ArrowUp, ArrowDown, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreColor } from '@/lib/scoreboardScoring';
import { getMomentumColor } from '@/lib/momentumScoring';

function TrendBadge({ direction }) {
  const icon = direction === 'improving' ? <ArrowUp className="h-4 w-4" />
    : direction === 'declining' ? <ArrowDown className="h-4 w-4" />
    : <Minus className="h-4 w-4" />;
  const label = direction === 'improving' ? 'Improving'
    : direction === 'declining' ? 'Declining'
    : 'Stable';
  const color = direction === 'improving' ? 'text-emerald-600'
    : direction === 'declining' ? 'text-red-500'
    : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className={cn('text-xs font-semibold', color)}>{label}</span>
    </div>
  );
}

export default function DualScoreboard({ healthScore, healthTrend, momentumScore, momentumTrend }) {
  const healthColor = getScoreColor(healthScore);
  const momentumColor = getMomentumColor(momentumScore);

  return (
    <div className="space-y-3">
      {/* Tagline banner */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-accent">Health First</span>
        <span className="h-3 w-px bg-border" />
        <span className="text-xs font-bold uppercase tracking-widest text-secondary">Momentum Next</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* HEALTH */}
        <Link to="/org-health" className="block">
          <Card className={cn(
            'border-border/50 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full',
            healthColor.bg
          )}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leadership Health</p>
                    <p className="text-[10px] text-muted-foreground">How healthy are we as a team?</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <div className="flex items-end gap-2">
                <p className={cn('text-4xl font-bold', healthColor.text)}>{healthScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mb-1">/ 10</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <TrendBadge direction={healthTrend} />
                <span className="text-xs text-muted-foreground">· {healthColor.label}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* MOMENTUM */}
        <Link to="/momentum" className="block">
          <Card className={cn(
            'border-border/50 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all cursor-pointer h-full',
            momentumColor.bg
          )}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Rocket className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Momentum</p>
                    <p className="text-[10px] text-muted-foreground">Are we moving priorities forward?</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <div className="flex items-end gap-2">
                <p className={cn('text-4xl font-bold', momentumColor.text)}>{momentumScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mb-1">/ 10</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <TrendBadge direction={momentumTrend} />
                <span className="text-xs text-muted-foreground">· {momentumColor.label}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}