import React from 'react';
import { Building2, Users, UserCircle, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Visual indicator showing the HLOS diagnostic journey:
 *   ORGANIZATION → LEADERSHIP TEAM → INDIVIDUAL LEADER
 *
 * Props:
 *   currentStep: 'organization' | 'leadership_team' | 'individual_leader'
 *   orgComplete: boolean
 *   leadershipComplete: boolean
 */
export default function DiagnosticJourney({ currentStep, orgComplete, leadershipComplete }) {
  const steps = [
    {
      key: 'organization',
      label: 'Organization',
      title: 'Organizational Health Snapshot',
      icon: Building2,
      complete: orgComplete,
      locked: false,
    },
    {
      key: 'leadership_team',
      label: 'Leadership Team',
      title: 'Leadership Health Scoreboard',
      icon: Users,
      complete: leadershipComplete,
      locked: !orgComplete,
    },
    {
      key: 'individual_leader',
      label: 'Individual Leader',
      title: 'Coming later',
      icon: UserCircle,
      complete: false,
      locked: true,
    },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const isCurrent = currentStep === step.key;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div
              className={cn(
                'flex flex-col items-center text-center rounded-lg px-2 py-3 sm:px-4 sm:py-3 transition-all min-w-0',
                isCurrent && 'bg-accent/10 border border-accent/30',
                !isCurrent && !step.locked && 'bg-card border border-border/50',
                step.locked && 'opacity-50'
              )}
              style={{ flex: '1 1 0' }}
            >
              <div
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center mb-1.5 transition-colors',
                  step.complete ? 'bg-emerald-100' : isCurrent ? 'bg-accent/20' : 'bg-muted'
                )}
              >
                {step.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : step.locked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', isCurrent ? 'text-accent' : 'text-muted-foreground')}>
                {step.label}
              </p>
              <p className={cn('text-xs leading-tight mt-0.5', isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {step.title}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex items-center self-start mt-7', step.locked && 'opacity-30')}>
                <div className={cn('h-px w-3 sm:w-6', orgComplete && step.key === 'organization' ? 'bg-accent/40' : 'bg-border')} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}