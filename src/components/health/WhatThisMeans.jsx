import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle2, AlertTriangle, Eye, Target } from 'lucide-react';
import { STAGE_META } from '@/lib/stageMeta';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const STAGE_COLORS = {
  stabilize: 'bg-red-100 text-red-700 border-red-200',
  align: 'bg-amber-100 text-amber-700 border-amber-200',
  execute: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sustain: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function WhatThisMeans({ interpretation }) {
  if (!interpretation) return null;

  const { strongest, risks, patterns, focusStage, focusDiscipline, overall } = interpretation;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">What This Means</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall interpretation */}
        <p className="text-sm leading-relaxed">
          Your team's overall leadership health score is <span className="font-bold">{overall.toFixed(1)}/10</span>.
          {overall >= 7
            ? ' The team is in a healthy place with solid foundations in place.'
            : overall >= 5
              ? ' The team has a workable foundation but several areas need attention.'
              : ' The team is experiencing significant challenges that need focused intervention.'}
        </p>

        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Strengths</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {strongest.map(s => (
              <Badge key={s.key} className="bg-emerald-100 text-emerald-700 border-0">
                {s.label} ({s.value.toFixed(1)})
              </Badge>
            ))}
          </div>
        </div>

        {/* Risks */}
        {risks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Risks</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {risks.map(r => (
                <Badge key={r.key} className="bg-red-100 text-red-700 border-0">
                  {r.label} ({r.value.toFixed(1)})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Patterns</p>
            </div>
            <ul className="space-y-1.5">
              {patterns.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended LHOS focus area */}
        <div className="pt-3 border-t border-border/40">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Recommended LHOS Focus</p>
          </div>
          <Link to={`/${focusStage}`} className="inline-flex items-center gap-2 hover:underline">
            <Badge className={cn('border', STAGE_COLORS[focusStage])}>
              {STAGE_META[focusStage]?.name || focusStage}
            </Badge>
            <span className="text-sm font-medium">{focusDiscipline}</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1.5">
            Based on your scores, focusing on the <span className="font-medium">{focusDiscipline}</span> discipline
            within the <span className="font-medium capitalize">{focusStage}</span> stage would have the greatest impact.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}