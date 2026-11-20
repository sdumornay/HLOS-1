import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Overview', path: '/impact' },
  { label: 'Assessment', path: '/impact/assessment' },
  { label: 'Impact Agreement', path: '/impact/agreement', stage: 'Align' },
  { label: 'Indicators', path: '/impact/indicators', stage: 'Align' },
  { label: 'Behaviors', path: '/impact/behaviors', stage: 'Execute' },
  { label: 'Evaluations', path: '/impact/evaluations' },
  { label: 'Reports', path: '/impact/reports', stage: 'Sustain' },
];

export default function ImpactNav({ title = 'Organizational Impact', description }) {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
          Dumornay Coaching
        </p>
        <h1 className="text-2xl lg:text-3xl font-barlow font-bold text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
          {description ||
            'Measure what changed for this organization: reaction, learning, behavior and results, measured against the baseline set in Stabilize and Align.'}
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 px-1 min-w-max">
          {TABS.map((tab) => {
            const active =
              location.pathname === tab.path ||
              (tab.path !== '/impact' && location.pathname.startsWith(tab.path));
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap',
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
                {tab.stage && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide',
                      active ? 'bg-primary-foreground/15' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.stage}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}