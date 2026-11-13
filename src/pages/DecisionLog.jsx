import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { AlertCircle } from 'lucide-react';
import DecisionsTable from '@/components/decisions/DecisionsTable';
import DecisionLogExport from '@/components/execute/DecisionLogExport';

export default function DecisionLog() {
  const orgId = useOrgId();

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['decisionLog', orgId],
    queryFn: () => base44.entities.DecisionLog.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to view its decision log.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Healthy Leadership OS</p>
          <h1 className="text-2xl lg:text-3xl font-barlow font-bold text-foreground tracking-tight">Decision Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every decision recorded in your meetings, with the commitments that followed.
          </p>
        </div>
        <DecisionLogExport orgId={orgId} />
      </div>

      <DecisionsTable decisions={decisions} isLoading={isLoading} />
    </div>
  );
}