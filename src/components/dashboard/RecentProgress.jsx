import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { TrendingUp, CheckCircle2, Heart, Target, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentProgress({
  priorities = [], issues = [], actions = [], healthTrend = 'stable',
}) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const completedPriorities = priorities.filter(p => p.status === 'completed').slice(0, 3);
  const resolvedIssues = issues.filter(i => i.status === 'resolved' || i.status === 'closed').slice(0, 3);
  const completedActions = actions
    .filter(a => a.status === 'completed' && a.completed_date && new Date(a.completed_date) >= sevenDaysAgo)
    .slice(0, 5);
  const healthImproving = healthTrend === 'improving';

  const items = [
    ...completedPriorities.map(p => ({
      icon: Target,
      color: 'text-emerald-600 bg-emerald-50',
      title: p.title,
      sub: 'Priority completed',
      link: '/execute',
    })),
    ...resolvedIssues.map(i => ({
      icon: CheckCircle2,
      color: 'text-blue-600 bg-blue-50',
      title: i.title,
      sub: 'Issue resolved',
      link: '/issues',
    })),
    ...completedActions.map(a => ({
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
      title: a.title,
      sub: `Completed · ${a.owner || a.owner_email || 'Team'}`,
      link: '/actions',
    })),
  ];

  if (healthImproving) {
    items.unshift({
      icon: Heart,
      color: 'text-rose-600 bg-rose-50',
      title: 'Leadership health improving',
      sub: 'Health trend is moving in the right direction',
      link: '/org-health',
    });
  }

  const hasProgress = items.length > 0;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <CardTitle className="text-base font-semibold">Recent Progress</CardTitle>
        </div>
        {hasProgress && (
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{items.length} recent</Badge>
        )}
      </CardHeader>
      <CardContent>
        {!hasProgress ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No completed items in the past 7 days. Progress builds with each step.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.slice(0, 6).map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  to={item.link}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${item.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}