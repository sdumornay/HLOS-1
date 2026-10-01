import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, CheckCircle2, ChevronRight, Building2, Lock } from 'lucide-react';
import EditOrganizationDialog from '@/components/organizations/EditOrganizationDialog';
import DiagnosticJourney from '@/components/health/DiagnosticJourney';

export default function PreBaselineDashboard({ org, orgId }) {
  const navigate = useNavigate();

  // Check if the user has completed the Org Health Snapshot
  const { data: snapshots = [] } = useQuery({
    queryKey: ['orgHealthSnapshots', orgId],
    queryFn: () => base44.entities.OrganizationalHealthSnapshot.filter({ organization_id: orgId }, '-created_date', 5),
    enabled: !!orgId,
  });
  const snapshotComplete = snapshots.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold">Welcome to HLOS</h1>
        <p className="text-sm text-muted-foreground">Health First. Momentum Next.</p>
      </div>

      {/* Diagnostic journey indicator */}
      <DiagnosticJourney
        currentStep="organization"
        orgComplete={snapshotComplete}
        leadershipComplete={false}
      />

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

      {/* Step 2: Organizational Health Snapshot — first assessment */}
      {!snapshotComplete ? (
        <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Organizational Health Snapshot</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A 20-question assessment that gives you a broad perspective on the health of your organization.
                  Takes about 5 minutes. This is the first step in your diagnostic journey.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate('/org-snapshot')}>
              Take the Snapshot <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Organizational Health Snapshot</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your snapshot is complete.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/org-snapshot')}>
              View Results <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Leadership Health Scoreboard — second assessment (in Stabilize) */}
      <Card className={snapshotComplete ? 'border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5' : 'border-border/50 border-dashed'}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${snapshotComplete ? 'bg-accent/15' : 'bg-muted'}`}>
              {snapshotComplete ? <Heart className="h-5 w-5 text-accent" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {snapshotComplete
                  ? 'A 16-question diagnostic across the four HLOS stages. Available inside Stage 1: Stabilize.'
                  : 'Available after you complete the Organizational Health Snapshot.'}
              </p>
            </div>
          </div>
          {snapshotComplete && (
            <Button className="w-full" onClick={() => navigate('/scoreboard')}>
              Take the Scoreboard <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
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
            Complete the Organizational Health Snapshot to begin your journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}