import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-700 border-0',
  medium: 'bg-amber-100 text-amber-700 border-0',
  high: 'bg-orange-100 text-orange-700 border-0',
  critical: 'bg-red-100 text-red-700 border-0',
};

export default function RiskFlagSummary() {
  const { user, isAdmin, isCoach } = useCurrentUser();
  const orgId = user?.organization_id;

  const { data: risks = [] } = useQuery({
    queryKey: ['riskFlags', orgId],
    queryFn: () => isAdmin
      ? base44.entities.RiskFlag.list('-created_date', 50)
      : base44.entities.RiskFlag.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const openRisks = risks.filter(r => r.status === 'open');
  const criticalCount = openRisks.filter(r => r.severity === 'critical').length;

  if (openRisks.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-emerald-500" />
          <CardTitle className="text-base font-semibold">Risk Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No open risks. Your team is in a healthy place.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Risk Flags</CardTitle>
          <Badge className="bg-red-100 text-red-700 border-0 text-xs">{openRisks.length} open</Badge>
        </div>
        <Link to="/sustain" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {criticalCount > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700 font-medium">
            {criticalCount} critical risk{criticalCount !== 1 ? 's' : ''} need immediate attention
          </div>
        )}
        {openRisks.slice(0, 4).map(risk => (
          <div key={risk.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{risk.title}</p>
              <p className="text-xs text-muted-foreground capitalize">{risk.type?.replace(/_/g, ' ')}</p>
            </div>
            <Badge className={`text-xs capitalize ml-2 ${SEVERITY_COLORS[risk.severity] || SEVERITY_COLORS.medium}`}>
              {risk.severity}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}