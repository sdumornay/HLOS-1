import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Heart, TrendingUp, AlertCircle } from 'lucide-react';

export default function PortfolioSummary({ totalOrgs, avgHealth, avgMomentum, needsAttentionCount }) {
  const stats = [
    {
      label: 'Active Organizations',
      value: totalOrgs,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Avg Leadership Health',
      value: avgHealth > 0 ? avgHealth.toFixed(1) : '—',
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Avg Momentum',
      value: avgMomentum > 0 ? avgMomentum.toFixed(1) : '—',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Need Your Attention',
      value: needsAttentionCount,
      icon: AlertCircle,
      color: needsAttentionCount > 0 ? 'text-amber-600' : 'text-emerald-600',
      bg: needsAttentionCount > 0 ? 'bg-amber-50' : 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="border-border/50 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-barlow font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}