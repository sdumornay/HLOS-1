import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_COLORS = {
  stabilize: 'bg-red-100 text-red-700 border-red-200',
  align: 'bg-amber-100 text-amber-700 border-amber-200',
  execute: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sustain: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function RecommendedNextSteps({ steps }) {
  if (!steps || steps.length === 0) return null;

  // Group by stage
  const byStage = {};
  steps.forEach(s => {
    if (!byStage[s.stage]) byStage[s.stage] = [];
    byStage[s.stage].push(s);
  });

  const stageOrder = ['stabilize', 'align', 'execute', 'sustain'];
  const orderedStages = stageOrder.filter(s => byStage[s]);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Recommended Next Steps</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedStages.map(stage => (
          <div key={stage}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn('border', STAGE_COLORS[stage])}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">{byStage[stage][0].discipline}</span>
            </div>
            <div className="space-y-2 pl-2">
              {byStage[stage].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary text-sm mt-0.5">→</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-border/40">
          <Link to={`/${orderedStages[0]}`}>
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              Go to {orderedStages[0].charAt(0).toUpperCase() + orderedStages[0].slice(1)} Stage
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}