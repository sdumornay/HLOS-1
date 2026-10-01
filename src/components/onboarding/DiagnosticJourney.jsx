import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Shield, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Visual representation of the 3-step diagnostic journey:
 * 1. Organization — Organizational Health Snapshot
 * 2. Leadership Team — Leadership Health Scoreboard
 * 3. Individual Leader — Coming later
 *
 * Props:
 *   orgSnapshotDone: boolean
 *   scoreboardDone: boolean
 *   compact: boolean — smaller version for inline use
 */
export default function DiagnosticJourney({ orgSnapshotDone = false, scoreboardDone = false, compact = false }) {
  const navigate = useNavigate();

  const steps = [
    {
      id: 'org',
      icon: Building2,
      label: 'Organizational Health Discovery',
      title: 'Organizational Health Snapshot',
      desc: 'A broad look at the health of your entire organization.',
      done: orgSnapshotDone,
      action: !orgSnapshotDone ? () => navigate('/org-snapshot') : null,
      actionLabel: 'Take Snapshot',
    },
    {
      id: 'team',
      icon: Shield,
      label: 'Stabilize',
      title: 'Leadership Health Scoreboard',
      desc: 'A closer look at the health of your leadership team.',
      done: scoreboardDone,
      action: orgSnapshotDone && !scoreboardDone ? () => navigate('/scoreboard') : null,
      actionLabel: 'Take Scoreboard',
    },
    {
      id: 'stabilize-tools',
      icon: Users,
      label: 'Stabilize',
      title: 'Additional Stabilize Tools',
      desc: 'Conflict, communication, and trust-building activities.',
      done: false,
      coming: true,
    },
  ];

  return (
    <div className={cn('space-y-0', compact && 'space-y-0')}>
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id}>
            <div className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              step.done ? 'border-emerald-200 bg-emerald-50/40'
                : step.coming ? 'border-border/40 bg-muted/30 opacity-60'
                : 'border-accent/30 bg-accent/5'
            )}>
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                step.done ? 'bg-emerald-100'
                  : step.coming ? 'bg-muted'
                  : 'bg-accent/15'
              )}>
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : step.coming ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Icon className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {step.label}
                </p>
                <p className={cn('font-medium', compact ? 'text-sm' : 'text-sm')}>{step.title}</p>
                {!compact && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                )}
                {step.action && !compact && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1.5 h-7 px-2 text-xs"
                    onClick={step.action}
                  >
                    {step.actionLabel} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex-shrink-0">
                {step.done ? (
                  <span className="text-xs font-semibold text-emerald-600">Complete</span>
                ) : step.coming ? (
                  <span className="text-xs text-muted-foreground">Soon</span>
                ) : (
                  <span className="text-xs font-semibold text-accent">Next</span>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="flex justify-center py-1">
                <div className="h-5 w-px bg-border" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}