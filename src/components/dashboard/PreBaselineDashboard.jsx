import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle2, TrendingUp, Heart, Lock } from 'lucide-react';
import EditOrganizationDialog from '@/components/organizations/EditOrganizationDialog';
import DiagnosticJourney from '@/components/onboarding/DiagnosticJourney';
import { useOrgSnapshotStatus } from '@/lib/useOrgSnapshotStatus';
import { cn } from '@/lib/utils';

export default function PreBaselineDashboard({ org, orgId }) {
  const navigate = useNavigate();
  const { snapshotCompleted } = useOrgSnapshotStatus(orgId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold">Welcome to HLOS</h1>
        <p className="text-sm text-muted-foreground">Health First. Momentum Next.</p>
      </div>

      {/* Step 1: Organization Setup — complete */}
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Organization Setup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {org?.name ? `${org.name} is set up and ready.` : 'Your organization is set up and ready.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs font-semibold text-emerald-600">Complete</span>
            <EditOrganizationDialog
              org={org}
              buttonVariant="ghost"
              buttonClassName="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-100 gap-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Organizational Health Snapshot */}
      <Card className={cn(
        'border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5',
        snapshotCompleted && 'border-emerald-200 bg-emerald-50/40'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
              snapshotCompleted ? 'bg-emerald-100' : 'bg-accent/15'
            )}>
              {snapshotCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Organizational Health Snapshot</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A 20-question assessment that gives you a broad perspective on the health of your entire organization. Takes about 5 minutes.
              </p>
            </div>
            {snapshotCompleted && (
              <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">Complete</span>
            )}
          </div>
          {!snapshotCompleted && (
            <Button className="w-full" onClick={() => navigate('/org-snapshot')}>
              Take the Snapshot <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {snapshotCompleted && (
            <Button variant="outline" className="w-full" onClick={() => navigate('/org-snapshot')}>
              Retake Snapshot <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Leadership Health Scoreboard — locked until snapshot is done */}
      <Card className={cn(
        snapshotCompleted
          ? 'border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5'
          : 'border-border/50 border-dashed opacity-60'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
              snapshotCompleted ? 'bg-accent/15' : 'bg-muted'
            )}>
              {snapshotCompleted ? (
                <Heart className="h-5 w-5 text-accent" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A 16-question diagnostic that looks at the health of your leadership team. This creates your baseline and unlocks Stage 1.
              </p>
            </div>
          </div>
          {snapshotCompleted ? (
            <Button className="w-full" onClick={() => navigate('/scoreboard')}>
              Take the Scoreboard <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Complete the Organizational Health Snapshot first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Locked stages preview */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Your Journey
          </p>
          <div className="space-y-2">
            {[
              { name: 'Stage 1: Stabilize', desc: 'Build trust, resolve tension, create safety' },
              { name: 'Stage 2: Align', desc: 'Clarify mission, roles, and direction' },
              { name: 'Stage 3: Execute', desc: 'Strengthen accountability and follow-through' },
              { name: 'Stage 4: Sustain', desc: 'Build healthy rhythms for the long term' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 opacity-50">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground">Locked</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Complete both assessments to unlock Stage 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}