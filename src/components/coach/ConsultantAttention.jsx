import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, TrendingDown, Users, Pause, Clock, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ATTENTION_REASON_LABELS } from '@/lib/portfolioScoring';

const REASON_ICONS = {
  declining_health: TrendingDown,
  relational_issues: Users,
  stalled_priorities: Pause,
  repeated_overdue: Clock,
  no_recent_activity: CalendarX,
};

const REASON_COLORS = {
  declining_health: 'text-red-600 bg-red-50',
  relational_issues: 'text-orange-600 bg-orange-50',
  stalled_priorities: 'text-amber-600 bg-amber-50',
  repeated_overdue: 'text-amber-600 bg-amber-50',
  no_recent_activity: 'text-slate-600 bg-slate-100',
};

const STAGE_COLORS = {
  stabilize: 'bg-blue-100 text-blue-700',
  align: 'bg-purple-100 text-purple-700',
  execute: 'bg-amber-100 text-amber-700',
  sustain: 'bg-emerald-100 text-emerald-700',
};

export default function ConsultantAttention({ orgs }) {
  const navigate = useNavigate();
  const attentionOrgs = orgs.filter(o => o.needsAttention);

  if (attentionOrgs.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-emerald-600" />
            Consultant Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-2">
            No organizations currently need your direct involvement. All teams are progressing steadily.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by number of attention reasons (most urgent first)
  const sorted = [...attentionOrgs].sort((a, b) => b.attentionReasons.length - a.attentionReasons.length);

  return (
    <Card className="border-amber-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Consultant Attention
          <Badge className="bg-amber-100 text-amber-700 border-0 ml-1">{sorted.length}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Organizations that may need your direct involvement
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map(org => (
          <div
            key={org.id}
            onClick={() => navigate(`/coach/${org.id}`)}
            className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-medium text-foreground">{org.name}</span>
                <Badge className={cn('text-xs capitalize border-0', STAGE_COLORS[org.current_stage])}>
                  {org.current_stage}
                </Badge>
                <span className="text-xs text-muted-foreground">{org.leaderName}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {org.attentionReasons.map(reason => {
                  const Icon = REASON_ICONS[reason];
                  const meta = ATTENTION_REASON_LABELS[reason];
                  return (
                    <span
                      key={reason}
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                        REASON_COLORS[reason]
                      )}
                      title={meta?.description}
                    >
                      <Icon className="h-3 w-3" />
                      {meta?.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs flex-shrink-0">
              <div className="text-center">
                <div className="text-muted-foreground">Health</div>
                <div className={cn('font-bold', org.healthScore >= 7 ? 'text-emerald-600' : org.healthScore >= 4 ? 'text-amber-600' : 'text-red-600')}>
                  {org.healthScore > 0 ? org.healthScore.toFixed(1) : '—'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Momentum</div>
                <div className={cn('font-bold', org.momentumScore >= 7 ? 'text-emerald-600' : org.momentumScore >= 4 ? 'text-amber-600' : 'text-red-600')}>
                  {org.momentumScore > 0 ? org.momentumScore.toFixed(1) : '—'}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}