import React from 'react';
import { cn } from '@/lib/utils';

export default function DisciplineSection({ number, name, description, children, className, audience }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Discipline header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/40">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-barlow font-bold tracking-tight">{name}</h2>
            {audience === 'leader' && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 border border-primary/20">
                Leadership
              </span>
            )}
            {audience === 'team' && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary/70 border border-secondary/20">
                Team
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}