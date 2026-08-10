import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function ParticipationReport({ orgId }) {
  const { data: users = [] } = useQuery({
    queryKey: ['users-participation', orgId],
    queryFn: () => base44.entities.User.list(),
    enabled: !!orgId,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments-participation', orgId],
    queryFn: () => base44.entities.Assessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: workstyles = [] } = useQuery({
    queryKey: ['workstyles-participation', orgId],
    queryFn: () => base44.entities.WorkstyleAssessment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: dysfunctions = [] } = useQuery({
    queryKey: ['dysfunctions-participation', orgId],
    queryFn: () => base44.entities.FiveDysfunctions.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const orgUsers = users.filter(u => u.organization_id === orgId);

  const getUserStatus = (email) => {
    const hasAssessment = assessments.some(a => a.respondent_email === email);
    const hasWorkstyle = workstyles.some(w => w.member_email === email);
    const hasDysfunctions = dysfunctions.some(d => d.respondent_email === email);
    const completed = [hasAssessment, hasWorkstyle, hasDysfunctions].filter(Boolean).length;
    return { hasAssessment, hasWorkstyle, hasDysfunctions, completed, total: 3 };
  };

  const participating = orgUsers.filter(u => getUserStatus(u.email).completed > 0);
  const notParticipating = orgUsers.filter(u => getUserStatus(u.email).completed === 0);
  const participationRate = orgUsers.length > 0 ? Math.round((participating.length / orgUsers.length) * 100) : 0;

  if (orgUsers.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Assessment Participation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No team members found. Invite team members to see participation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Assessment Participation</CardTitle>
        </div>
        <Badge className={`text-xs border-0 ${participationRate >= 70 ? 'bg-emerald-100 text-emerald-700' : participationRate >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {participationRate}% participation
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${participationRate >= 70 ? 'bg-emerald-500' : participationRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${participationRate}%` }} />
        </div>

        {/* Not participating — needs attention */}
        {notParticipating.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-2">Needs Reminder ({notParticipating.length})</p>
            <div className="space-y-1.5">
              {notParticipating.map(u => {
                const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
                return (
                  <div key={u.id} className="flex items-center gap-2.5 py-1">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-red-50 text-red-600 text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.role?.replace('_', ' ') || 'Member'}</p>
                    </div>
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Participating */}
        {participating.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Completed ({participating.length})</p>
            <div className="space-y-1.5">
              {participating.map(u => {
                const status = getUserStatus(u.email);
                const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
                const lastAssessment = assessments
                  .filter(a => a.respondent_email === u.email)
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
                return (
                  <div key={u.id} className="flex items-center gap-2.5 py-1">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-emerald-50 text-emerald-600 text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {status.completed}/{status.total} assessments
                        {lastAssessment && ` · last ${format(new Date(lastAssessment.created_date), 'MMM d')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {status.hasAssessment && <span title="Pulse" className="text-xs">💚</span>}
                      {status.hasWorkstyle && <span title="Workstyle" className="text-xs">👟</span>}
                      {status.hasDysfunctions && <span title="5 Dysfunctions" className="text-xs">📊</span>}
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}