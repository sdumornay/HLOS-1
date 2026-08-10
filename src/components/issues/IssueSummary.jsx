import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { AlertCircle, Heart, Cog, AlertTriangle, ArrowRight } from 'lucide-react';

export default function IssueSummary({ issues = [] }) {
  const open = issues.filter(i => i.status === 'open' || i.status === 'in_progress');
  const highPriority = open.filter(i => i.priority === 'high' || i.priority === 'critical');
  const relational = open.filter(i => i.classification === 'relational');
  const operational = open.filter(i => i.classification === 'operational');
  const overdue = open.filter(i =>
    i.date_identified && new Date(i.date_identified) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const stats = [
    { label: 'Open Issues', value: open.length, icon: AlertCircle, color: 'text-primary' },
    { label: 'High Priority', value: highPriority.length, icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'Relational', value: relational.length, icon: Heart, color: 'text-rose-600' },
    { label: 'Operational', value: operational.length, icon: Cog, color: 'text-blue-600' },
    { label: 'Overdue', value: overdue.length, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Issues</CardTitle>
        <Link to="/issues" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                to="/issues"
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-center"
              >
                <Icon className={`h-5 w-5 mb-1.5 ${stat.color}`} />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}