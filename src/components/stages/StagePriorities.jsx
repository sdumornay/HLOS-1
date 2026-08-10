import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, ListChecks } from 'lucide-react';
import { format } from 'date-fns';

export default function StagePriorities({ stage, orgId }) {
  const { data: actions = [] } = useQuery({
    queryKey: ['stage-priorities', orgId, stage],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId, stage }),
    enabled: !!orgId,
  });

  const active = actions.filter(a => a.status !== 'completed');
  const completed = actions.filter(a => a.status === 'completed');

  if (actions.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Current Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No actions tagged for this stage yet. Create action items to track your priorities.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Current Priorities</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{active.length} active</Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{completed.length} done</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.slice(0, 5).map(action => (
          <div key={action.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Target className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{action.title}</p>
                <p className="text-xs text-muted-foreground">
                  {action.owner || action.owner_email || 'Unassigned'}
                  {action.due_date && ` · due ${format(new Date(action.due_date), 'MMM d')}`}
                </p>
              </div>
            </div>
            <Badge
              className={`text-xs ml-2 border-0 ${
                action.priority === 'critical' ? 'bg-red-100 text-red-700'
                : action.priority === 'high' ? 'bg-orange-100 text-orange-700'
                : action.priority === 'medium' ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
              }`}
            >
              {action.priority}
            </Badge>
          </div>
        ))}
        {active.length === 0 && (
          <p className="text-sm text-emerald-600 font-medium py-2">All stage actions completed! 🎉</p>
        )}
        <Link to="/actions" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1">
          View all actions <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}