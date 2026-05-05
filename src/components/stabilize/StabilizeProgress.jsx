import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULES = [
  { key: 'conflict_intake', label: 'Conflict Intake' },
  { key: 'tension_pulse', label: 'Tension Pulse Survey' },
  { key: 'leader_interviews', label: 'Leader Interviews' },
  { key: 'comm_agreements', label: 'Communication Agreements' },
  { key: 'conflict_triggers', label: 'Conflict Trigger Tracker' },
  { key: 'nvc_conversations', label: 'NVC Conversations' },
];

export default function StabilizeProgress({ counts = {} }) {
  const completed = MODULES.filter(m => (counts[m.key] || 0) > 0).length;
  const pct = Math.round((completed / MODULES.length) * 100);

  return (
    <div className="bg-white border border-border/50 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Stabilize Module Progress</h3>
        <span className="text-sm font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
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