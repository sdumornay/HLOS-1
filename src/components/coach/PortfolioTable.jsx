import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ChevronRight, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STAGE_COLORS = {
  stabilize: 'bg-blue-100 text-blue-700',
  align: 'bg-purple-100 text-purple-700',
  execute: 'bg-amber-100 text-amber-700',
  sustain: 'bg-emerald-100 text-emerald-700',
};

const TREND_META = {
  improving: { icon: TrendingUp, color: 'text-emerald-600', label: 'Improving' },
  declining: { icon: TrendingDown, color: 'text-red-600', label: 'Declining' },
  stable: { icon: Minus, color: 'text-muted-foreground', label: 'Stable' },
};

function ScoreCell({ score, trend }) {
  const trendMeta = TREND_META[trend] || TREND_META.stable;
  const TrendIcon = trendMeta.icon;
  const scoreColor = score >= 7 ? 'text-emerald-600' : score >= 4 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('font-bold', scoreColor)}>
        {score > 0 ? score.toFixed(1) : '—'}
      </span>
      <TrendIcon className={cn('h-3.5 w-3.5', trendMeta.color)} />
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '—';
  try {
    return format(new Date(dt), 'MMM d');
  } catch {
    return '—';
  }
}

function formatRelative(dt) {
  if (!dt) return '—';
  try {
    return formatDistanceToNow(new Date(dt), { addSuffix: true });
  } catch {
    return '—';
  }
}

export default function PortfolioTable({ orgs }) {
  const navigate = useNavigate();

  const handleClick = (orgId) => {
    navigate(`/coach/${orgId}`);
  };

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Organization</th>
                <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Leader</th>
                <th className="text-center py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Stage</th>
                <th className="text-center py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Health</th>
                <th className="text-center py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Momentum</th>
                <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Activity</th>
                <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Next Scheduled</th>
                <th className="text-center py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Attention</th>
                <th className="w-8 py-3 px-2" />
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => {
                const attentionCount =
                  org.overdueActions +
                  org.highPriorityIssues +
                  org.unresolvedRelational +
                  org.stalledPriorities;
                return (
                  <tr
                    key={org.id}
                    onClick={() => handleClick(org.id)}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{org.name}</div>
                      {(org.city || org.state) && (
                        <div className="text-xs text-muted-foreground">
                          {[org.city, org.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{org.leaderName}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge className={cn('text-xs capitalize border-0', STAGE_COLORS[org.current_stage])}>
                        {org.current_stage}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <ScoreCell score={org.healthScore} trend={org.healthTrend} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <ScoreCell score={org.momentumScore} trend={org.momentumTrend} />
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {org.lastActivity ? (
                        <div>
                          <div>{formatDate(org.lastActivity)}</div>
                          <div className="text-[10px]">{formatRelative(org.lastActivity)}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {org.nextScheduled ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-accent flex-shrink-0" />
                          <div>
                            <div>{formatDate(org.nextScheduled.date)}</div>
                            <div className="text-[10px] truncate max-w-[120px]">{org.nextScheduled.label}</div>
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {attentionCount > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-600">{attentionCount}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orgs.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No organizations match your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}