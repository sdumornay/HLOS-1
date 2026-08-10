import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Plus } from 'lucide-react';

export default function TopPriorities({ orgId }) {
  const { data: priorities = [] } = useQuery({
    queryKey: ['dash-priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const active = priorities
    .filter(p => p.status === 'active' || p.status === 'proposed')
    .sort((a, b) => (a.rank || 99) - (b.rank || 99))
    .slice(0, 5);

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">Top Priorities</CardTitle>
        </div>
        <Link to="/execute" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">No active priorities yet.</p>
            <p className="text-xs text-muted-foreground mb-3">Define what matters most right now — your team needs 3-5 clear priorities.</p>
            <Link to="/align" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Set your priorities
            </Link>
          </div>
        ) : (
          active.map((p, i) => (
            <div key={p.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-bold">
                    {p.rank || i + 1}
                  </span>
                  <p className="text-sm font-medium truncate">{p.title}</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground flex-shrink-0">{p.progress_percentage || 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-7">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${p.progress_percentage || 0}%` }}
                />
              </div>
              {p.owner && (
                <p className="text-xs text-muted-foreground ml-7">Owner: {p.owner}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}