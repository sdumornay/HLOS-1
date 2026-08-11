import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Activity, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AssessmentStatusPanel({ assessments = [], dysfunctions = [], workstyles = [] }) {
  const latestAssessment = assessments[0];
  const latestDysfunction = dysfunctions[0];
  const latestWorkstyle = workstyles[0];

  const items = [
    {
      key: 'quick-health',
      title: 'Quick Health Check',
      subtitle: '6-question leadership health pulse',
      icon: Heart,
      iconBg: 'bg-accent/15',
      iconColor: 'text-accent',
      done: !!latestAssessment,
      date: latestAssessment?.created_date,
      value: latestAssessment?.overall_health != null ? `${latestAssessment.overall_health.toFixed(1)}/10` : null,
      valueLabel: 'Health score',
    },
    {
      key: 'team-culture',
      title: 'Team Health & Culture',
      subtitle: 'Five Dysfunctions diagnostic',
      icon: Users,
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
      done: !!latestDysfunction,
      date: latestDysfunction?.created_date,
      value: latestDysfunction ? 'Completed' : null,
      valueLabel: 'Diagnostic',
    },
    {
      key: 'workstyle',
      title: 'Workstyle Assessment',
      subtitle: 'Head, Heart, Gut, or Feet',
      icon: Activity,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      done: !!latestWorkstyle,
      date: latestWorkstyle?.created_date,
      value: latestWorkstyle?.workstyle_type ? latestWorkstyle.workstyle_type.charAt(0).toUpperCase() + latestWorkstyle.workstyle_type.slice(1) : null,
      valueLabel: 'Style',
    },
  ];

  const completedCount = items.filter(i => i.done).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Assessment Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount === 3 ? 'All assessments completed' : `${completedCount} of 3 completed`}
            </p>
          </div>
          <Link to="/assessments">
            <Button size="sm" variant="ghost" className="gap-1 text-xs">
              {completedCount < 3 ? 'Complete' : 'View'} <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`rounded-lg border p-3 ${item.done ? 'border-border/50 bg-card' : 'border-dashed border-border/40 bg-muted/30'}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`h-8 w-8 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                {item.done ? (
                  <div className="mt-2.5 pt-2.5 border-t border-border/30">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold">{item.value}</span>
                      <span className="text-[10px] text-muted-foreground">{item.date ? format(new Date(item.date), 'MMM d, yyyy') : ''}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.valueLabel}</p>
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2.5 border-t border-border/30">
                    <p className="text-[11px] text-muted-foreground">Not yet taken</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}