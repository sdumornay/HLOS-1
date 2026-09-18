import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Heart, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function PreBaselineDashboard({ org, orgId }) {
  const navigate = useNavigate();

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
          <span className="text-xs font-semibold text-emerald-600">Complete</span>
        </CardContent>
      </Card>

      {/* Step 2: Leadership Health Scoreboard — action required */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Leadership Health Scoreboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A 16-question diagnostic across the four HLOS stages. Takes about 10 minutes.
                This is the only assessment available before Stage 1.
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => navigate('/scoreboard')}>
            Take the Scoreboard <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
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
            Complete the Leadership Health Scoreboard to unlock Stage 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}