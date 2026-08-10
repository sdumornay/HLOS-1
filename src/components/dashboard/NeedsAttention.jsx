import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, AlertTriangle, Clock, TrendingDown, Heart } from 'lucide-react';

export default function NeedsAttention({ issues = [], actions = [], healthTrend = 'stable' }) {
  const now = new Date();

  const highPriorityIssues = issues.filter(
    i => (i.status === 'open' || i.status === 'in_progress') &&
    (i.priority === 'high' || i.priority === 'critical')
  );
  const overdueActions = actions.filter(
    a => a.status !== 'completed' && a.due_date && new Date(a.due_date) < now
  );
  const relationalIssues = issues.filter(
    i => (i.status === 'open' || i.status === 'in_progress') && i.classification === 'relational'
  );
  const decliningIndicators = healthTrend === 'declining';

  const items = [
    ...highPriorityIssues.map(i => ({
      type: 'high_priority',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      title: i.title,
      sub: `High priority · ${i.classification || 'unclassified'}`,
      link: '/issues',
    })),
    ...overdueActions.map(a => ({
      type: 'overdue',
      icon: Clock,
      color: 'text-red-600',
      bg: 'bg-red-50',
      title: a.title,
      sub: `Overdue · ${a.owner || a.owner_email || 'Unassigned'}`,
      link: '/actions',
    })),
    ...relationalIssues.map(i => ({
      type: 'relational',
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      title: i.title,
      sub: `Relational · Unresolved`,
      link: '/issues',
    })),
  ];

  if (decliningIndicators) {
    items.push({
      type: 'declining',
      icon: TrendingDown,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      title: 'Leadership health declining',
      sub: 'Health trend has been declining — consider reviewing',
      link: '/org-health',
    });
  }

  // Deduplicate by title
  const seen = new Set();
  const unique = items.filter(item => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  const attentionCount = unique.length;

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Needs Attention</CardTitle>
        </div>
        {attentionCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{attentionCount}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {attentionCount === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Nothing needs immediate attention.</p>
            <p className="text-xs text-muted-foreground mt-1">Your team is in a healthy place.</p>
          </div>
        ) : (
          unique.slice(0, 8).map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                to={item.link}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${item.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 mt-1" />
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}