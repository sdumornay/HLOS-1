import React from 'react';
import { cn } from '@/lib/utils';

export default function NumberedTool({ number, title, description, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
          {number}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          {description && <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}