import React from 'react';
import { cn } from '@/lib/utils';
import { Filter, X } from 'lucide-react';

const STAGE_FILTERS = [
  { key: 'stabilize', label: 'Stabilize', color: 'bg-blue-500' },
  { key: 'align', label: 'Align', color: 'bg-purple-500' },
  { key: 'execute', label: 'Execute', color: 'bg-amber-500' },
  { key: 'sustain', label: 'Sustain', color: 'bg-emerald-500' },
];

const ALERT_FILTERS = [
  { key: 'declining_health', label: 'Declining Health' },
  { key: 'declining_momentum', label: 'Declining Momentum' },
  { key: 'overdue', label: 'Overdue Priorities/Actions' },
  { key: 'high_priority_issues', label: 'High-Priority Unresolved Issues' },
];

export default function PortfolioFilters({ activeFilters, onToggle, onClear, resultCount }) {
  const hasFilters = activeFilters.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        {STAGE_FILTERS.map(f => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={activeFilters.includes(f.key)}
            onClick={() => onToggle(f.key)}
            dotColor={f.color}
          />
        ))}
        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
        {ALERT_FILTERS.map(f => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={activeFilters.includes(f.key)}
            onClick={() => onToggle(f.key)}
            alert
          />
        ))}
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {resultCount} {resultCount === 1 ? 'organization' : 'organizations'}
        </span>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, dotColor, alert }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        active
          ? alert
            ? 'bg-amber-500 text-white border-amber-500'
            : 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border hover:bg-muted'
      )}
    >
      {dotColor && (
        <span className={cn('h-2 w-2 rounded-full', active ? 'bg-white/80' : dotColor)} />
      )}
      {label}
    </button>
  );
}