import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, Building2 } from 'lucide-react';

const STAGES = ['stabilize', 'align', 'execute', 'sustain'];

export default function StageCompletionMatrix() {
  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations-matrix'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: stageProgress = [] } = useQuery({
    queryKey: ['stageProgress-matrix'],
    queryFn: () => base44.entities.StageProgress.list(),
  });

  // Build a map: orgId -> { stage: status }
  const progressMap = {};
  stageProgress.forEach(sp => {
    if (!progressMap[sp.organization_id]) progressMap[sp.organization_id] = {};
    progressMap[sp.organization_id][sp.stage] = sp.status;
  });

  const getCellStatus = (orgId, stage) => {
    const orgProgress = progressMap[orgId];
    if (!orgProgress) return 'not_started';
    return orgProgress[stage] || 'not_started';
  };

  const getCellIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  };

  const getCellBg = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50';
      case 'in_progress': return 'bg-amber-50';
      default: return 'bg-muted/30';
    }
  };

  // Summary counts
  const completedCount = orgs.filter(o => {
    const stages = STAGES.map(s => getCellStatus(o.id, s));
    return stages.every(s => s === 'completed');
  }).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Stage Completion Matrix</CardTitle>
        <span className="text-xs text-muted-foreground">{completedCount}/{orgs.length} orgs completed all stages</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Organization</th>
                {STAGES.map(s => (
                  <th key={s} className="text-center py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider capitalize">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => (
                <tr key={org.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{org.name}</span>
                    </div>
                  </td>
                  {STAGES.map(stage => {
                    const status = getCellStatus(org.id, stage);
                    const isCurrent = org.current_stage === stage;
                    return (
                      <td key={stage} className="text-center py-2.5 px-3">
                        <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${getCellBg(status)} ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}>
                          {getCellIcon(status)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No organizations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}