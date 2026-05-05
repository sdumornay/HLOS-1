import React from 'react';
import { Shield, Compass, Rocket, RefreshCw } from 'lucide-react';
import { STAGE_DESCRIPTIONS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

const ICONS = { stabilize: Shield, align: Compass, execute: Rocket, sustain: RefreshCw };
const COLORS = {
  stabilize: 'from-red-500/10 to-red-500/5 border-red-200',
  align: 'from-amber-500/10 to-amber-500/5 border-amber-200',
  execute: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200',
  sustain: 'from-blue-500/10 to-blue-500/5 border-blue-200',
};
const TEXT_COLORS = {
  stabilize: 'text-red-600',
  align: 'text-amber-600',
  execute: 'text-emerald-600',
  sustain: 'text-blue-600',
};

export default function StageHeader({ stage, status }) {
  const Icon = ICONS[stage];

  return (
    <div className={`rounded-xl bg-gradient-to-r ${COLORS[stage]} border p-6`}>
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl bg-white/80 flex items-center justify-center ${TEXT_COLORS[stage]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold capitalize">{stage}</h1>
            {status && <Badge variant="outline" className="capitalize text-xs">{status.replace('_', ' ')}</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">{STAGE_DESCRIPTIONS[stage]}</p>
        </div>
      </div>
    </div>
  );
}