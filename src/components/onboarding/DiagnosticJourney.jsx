import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Shield, CheckCircle2, ArrowRight, Lock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Visual representation of the diagnostic journey:
 * 1. Organization — Organizational Health Snapshot
 * 2. Leadership Team — Leadership Health Scoreboard
 * 3. Evaluation — Organizational Impact Baseline
 *
 * Props:
 *   orgSnapshotDone: boolean
 *   scoreboardDone: boolean
 *   impactDone: boolean
 *   compact: boolean — smaller version for inline use
 */
export default function DiagnosticJourney({ orgSnapshotDone = false, scoreboardDone = false, impactDone = false, compact = false }) {
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
      id: 'impact',
      icon: Target,
      label: 'Evaluation',
      title: 'Organizational Impact Baseline',
      desc: 'A 15-question baseline across the five impact dimensions.',
      done: impactDone,
      locked: !scoreboardDone && !impactDone,
      action: scoreboardDone && !impactDone ? () => navigate('/impact/assessment') : null,
      actionLabel: 'Take Assessment',
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
        const inactive = step.coming || step.locked;
        return (
          <div key={step.id}>
            <div className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              step.done ? 'border-emerald-200 bg-emerald-50/40'
                : inactive ? 'border-border/40 bg-muted/30 opacity-60'
                : 'border-accent/30 bg-accent/5'
            )}>
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                step.done ? 'bg-emerald-100'
                  : inactive ? 'bg-muted'
                  : 'bg-accent/15'
              )}>
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : inactive ? (
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
                ) : step.locked ? (
                  <span className="text-xs text-muted-foreground">Locked</span>
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