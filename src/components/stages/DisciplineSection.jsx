import React from 'react';
import { cn } from '@/lib/utils';

export default function DisciplineSection({ number, name, description, children, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Discipline header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/40">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
          {number}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-barlow font-bold tracking-tight">{name}</h2>
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