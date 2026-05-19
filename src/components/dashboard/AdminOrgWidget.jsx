import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const STAGE_CONFIG = {
  stabilize: { label: 'Stabilize', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  align:     { label: 'Align',     color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  execute:   { label: 'Execute',   color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  sustain:   { label: 'Sustain',   color: 'bg-green-500/10 text-green-600 border-green-200' },
};

const STAGES = ['stabilize', 'align', 'execute', 'sustain'];

export default function AdminOrgWidget() {
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date', 200),
  });

  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage] = organizations.filter(o => (o.current_stage || 'stabilize') === stage).length;
    return acc;
  }, {});

  const recentOrgs = organizations.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Platform Overview</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">All organizations across the system</p>
          </div>
        </div>
        <Link to="/all-organizations" className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Total + Stage Breakdown */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-5 sm:col-span-1 rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
            <p className="text-2xl font-barlow font-bold text-primary">{organizations.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Total</p>
          </div>
          {STAGES.map(stage => (
            <div key={stage} className={`col-span-5 sm:col-span-1 rounded-xl border p-3 text-center ${STAGE_CONFIG[stage].color}`}>
              <p className="text-2xl font-barlow font-bold">{stageCounts[stage]}</p>
              <p className="text-xs font-medium mt-0.5">{STAGE_CONFIG[stage].label}</p>
            </div>
          ))}
        </div>

        {/* Stage progress bar */}
        {organizations.length > 0 && (
          <div>
            <div className="flex rounded-full overflow-hidden h-2 w-full bg-muted gap-0.5">
              {STAGES.map(stage => {
                const pct = (stageCounts[stage] / organizations.length) * 100;
                if (pct === 0) return null;
                const colors = {
                  stabilize: 'bg-blue-500',
                  align: 'bg-purple-500',
                  execute: 'bg-amber-500',
                  sustain: 'bg-green-500',
                };
                return <div key={stage} style={{ width: `${pct}%` }} className={`${colors[stage]} transition-all`} />;
              })}
            </div>
            <div className="flex gap-3 mt-2 flex-wrap">
              {STAGES.map(stage => (
                <div key={stage} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${{ stabilize: 'bg-blue-500', align: 'bg-purple-500', execute: 'bg-amber-500', sustain: 'bg-green-500' }[stage]}`} />
                  <span className="text-xs text-muted-foreground">{STAGE_CONFIG[stage].label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently added */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recently Added</p>
          <div className="space-y-1.5">
            {recentOrgs.map(org => (
              <div key={org.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {org.city ? `${org.city} · ` : ''}
                    Added {org.created_date ? format(new Date(org.created_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs capitalize ml-2 ${STAGE_CONFIG[org.current_stage || 'stabilize']?.color}`}>
                  {org.current_stage || 'stabilize'}
                </Badge>
              </div>
            ))}
            {organizations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No organizations yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}