import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const STAGE_COLORS = {
  stabilize: 'bg-blue-100 text-blue-700',
  align: 'bg-amber-100 text-amber-700',
  execute: 'bg-green-100 text-green-700',
  sustain: 'bg-purple-100 text-purple-700',
};

export default function CrossOrgComparison({ orgs, assessments, risks, sessions }) {
  if (!orgs || orgs.length === 0) return null;

  const summaries = orgs.map(org => {
    const orgAssessments = assessments.filter(a => a.organization_id === org.id);
    const orgRisks = risks.filter(r => r.organization_id === org.id && r.status === 'open');
    const orgSessions = sessions.filter(s => s.organization_id === org.id);
    const avgHealth = orgAssessments.length > 0
      ? orgAssessments.reduce((s, a) => s + (a.overall_health || 0), 0) / orgAssessments.length
      : 0;
    return { ...org, avgHealth, openRisks: orgRisks.length, sessionCount: orgSessions.length };
  });

  const sorted = [...summaries].sort((a, b) => b.avgHealth - a.avgHealth);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Cross-Org Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Best / Worst highlights */}
        {orgs.length >= 2 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Healthiest</span>
              </div>
              <p className="text-sm font-bold">{best.name}</p>
              <p className="text-xs text-muted-foreground">Health: {best.avgHealth.toFixed(1)}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-100 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Needs Focus</span>
              </div>
              <p className="text-sm font-bold">{worst.name}</p>
              <p className="text-xs text-muted-foreground">Health: {worst.avgHealth.toFixed(1)}</p>
            </div>
          </div>
        )}

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Org</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Stage</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Health</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Risks</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(org => (
                <tr key={org.id} className="border-b border-border/40 last:border-0">
                  <td className="py-2 px-2 font-medium truncate max-w-[160px]">{org.name}</td>
                  <td className="text-center py-2 px-2">
                    <Badge className={`text-xs capitalize border-0 ${STAGE_COLORS[org.current_stage || 'stabilize']}`}>
                      {org.current_stage || 'stabilize'}
                    </Badge>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className={`font-bold ${org.avgHealth >= 7 ? 'text-emerald-600' : org.avgHealth >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                      {org.avgHealth.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span className={org.openRisks > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                      {org.openRisks}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2 text-muted-foreground">{org.sessionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}