import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useOrgId } from '@/lib/useOrgId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import MomentumSummary from '@/components/momentum/MomentumSummary';
import MomentumInterpretation from '@/components/momentum/MomentumInterpretation';
import {
  computeMomentumIndicators, interpretMomentum, getMomentumNextSteps,
} from '@/lib/momentumScoring';

export default function Momentum() {
  const { user } = useCurrentUser();
  const orgId = useOrgId();

  const { data: priorities = [], isLoading } = useQuery({
    queryKey: ['momentum-priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['momentum-actions', orgId],
    queryFn: () => base44.entities.Action.filter({ organization_id: orgId }, '-created_date', 200),
    enabled: !!orgId,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['momentum-decisions', orgId],
    queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }, '-created_date', 200),
    enabled: !!orgId,
  });

  const { data: stageProgress = [] } = useQuery({
    queryKey: ['momentum-stageProgress', orgId],
    queryFn: () => base44.entities.StageProgress.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { indicators, counts, overall, hasData } =
    computeMomentumIndicators(priorities, actions, decisions, stageProgress);
  const interpretation = hasData ? interpretMomentum(indicators, counts, overall) : null;
  const nextSteps = hasData ? getMomentumNextSteps(indicators) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Momentum Scoreboard</h1>
          <p className="text-muted-foreground mt-1">
            Are we consistently moving our most important priorities forward?
          </p>
        </div>
        <Link to="/execute">
          <Button><Rocket className="h-4 w-4 mr-2" />Go to Execution</Button>
        </Link>
      </div>

      {isLoading ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Rocket className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No momentum data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create priorities, actions, and decisions to see your momentum score here.
            </p>
            <Link to="/execute" className="inline-block mt-4">
              <Button><Rocket className="h-4 w-4 mr-2" />Go to Execution</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <MomentumSummary overall={overall} indicators={indicators} counts={counts} />
          <MomentumInterpretation interpretation={interpretation} nextSteps={nextSteps} />
        </>
      )}
    </div>
  );
}