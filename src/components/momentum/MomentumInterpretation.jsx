import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MomentumInterpretation({ interpretation, nextSteps }) {
  if (!interpretation) return null;
  const { patterns, focusStage, focusDiscipline } = interpretation;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* What This Means */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold">What This Means</p>
          </div>
          <div className="space-y-2">
            {patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">•</span>
                <p className="text-muted-foreground">{p}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-1">Recommended LHOS Focus</p>
            <Badge className="capitalize bg-primary text-primary-foreground border-0">
              {focusStage} — {focusDiscipline}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Next Steps */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Recommended Next Steps</p>
          </div>
          <div className="space-y-1">
            {nextSteps.map((step, i) => (
              <Link key={i} to={step.link} className="block">
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{step.stage} · {step.discipline}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}