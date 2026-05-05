import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const DEFAULT_MILESTONES = {
  stabilize: [
    'Initial assessment completed',
    'Trust baseline established',
    'Conflict areas identified',
    'Safety agreements created',
    'First coaching session held',
    'Team charter drafted',
  ],
  align: [
    'Vision statement clarified',
    'Core values defined',
    'Top 3 priorities identified',
    'Roles and responsibilities mapped',
    'Communication norms established',
    'Alignment assessment completed',
  ],
  execute: [
    'Meeting rhythm established',
    'Decision-making process defined',
    'Accountability structure created',
    '30-day action plan created',
    'Weekly check-in rhythm started',
    'First milestone review completed',
  ],
  sustain: [
    'Monthly pulse survey launched',
    'Quarterly review scheduled',
    '90-day plan in place',
    'Leadership development plan created',
    'Succession planning started',
    'Health maintenance rhythm established',
  ],
};

export default function MilestoneList({ stage, milestones = [], onToggle }) {
  const defaults = DEFAULT_MILESTONES[stage] || [];
  const items = defaults.map((title, i) => {
    const existing = milestones.find(m => m.title === title);
    return { title, completed: existing?.completed || false, index: i };
  });

  const completedCount = items.filter(i => i.completed).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Stage Milestones</CardTitle>
          <span className="text-xs text-muted-foreground">{completedCount}/{items.length} complete</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(item => (
          <label
            key={item.title}
            className={cn(
              "flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors",
              item.completed ? "bg-muted/50" : "hover:bg-muted/30"
            )}
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => onToggle?.(item.title, !item.completed)}
            />
            <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.title}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}