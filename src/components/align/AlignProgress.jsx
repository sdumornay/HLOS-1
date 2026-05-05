import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULES = [
  { key: 'five_dysfunctions', label: 'Team Health Diagnostic' },
  { key: 'workstyle', label: 'Workstyle Assessments' },
  { key: 'role_clarity', label: 'Role Clarity Worksheets' },
  { key: 'priorities', label: 'Priority Alignment' },
  { key: 'decision_rights', label: 'Decision-Rights Map' },
  { key: 'covenant', label: 'Leadership Covenant' },
];

export default function AlignProgress({ counts = {} }) {
  const completed = MODULES.filter(m => (counts[m.key] || 0) > 0).length;
  const pct = Math.round((completed / MODULES.length) * 100);

  return (
    <div className="bg-white border border-border/50 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Align Module Progress</h3>
        <span className="text-sm font-bold text-secondary">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MODULES.map(m => {
          const done = (counts[m.key] || 0) > 0;
          return (
            <div key={m.key} className="flex items-center gap-2 text-xs">
              {done
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                : <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{m.label}</span>
              {(counts[m.key] || 0) > 0 && (
                <span className="ml-auto text-muted-foreground">({counts[m.key]})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}