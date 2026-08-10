import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, Calendar, Heart, ArrowRight, Handshake } from 'lucide-react';
import CrossOrgComparison from '@/components/coach/CrossOrgComparison';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const STAGE_COLORS = {
  stabilize: 'bg-blue-100 text-blue-700',
  align: 'bg-amber-100 text-amber-700',
  execute: 'bg-green-100 text-green-700',
  sustain: 'bg-purple-100 text-purple-700',
};

export default function CoachWorkspace() {
  const { user, isCoach, isAdmin } = useCurrentUser();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['coach-orgs', user?.email],
    queryFn: () => base44.entities.Organization.filter({ coach_email: user?.email }),
    enabled: !!user?.email,
  });

  const orgIds = orgs.map(o => o.id);

  const { data: assessments = [] } = useQuery({
    queryKey: ['all-assessments-coach'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['all-risks-coach'],
    queryFn: () => base44.entities.RiskFlag.list('-created_date', 200),
    enabled: orgIds.length > 0,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['all-sessions-coach'],
    queryFn: () => base44.entities.Session.list('-date', 50),
    enabled: orgIds.length > 0,
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements-coach', user?.email],
    queryFn: () => base44.entities.Engagement.filter({ coach_email: user?.email }),
    enabled: !!user?.email,
  });

  const myAssessments = assessments.filter(a => orgIds.includes(a.organization_id));
  const myRisks = risks.filter(r => orgIds.includes(r.organization_id));
  const mySessions = sessions.filter(s => orgIds.includes(s.organization_id));

  const orgSummaries = orgs.map(org => {
    const orgAssessments = myAssessments.filter(a => a.organization_id === org.id);
    const orgRisks = myRisks.filter(r => r.organization_id === org.id && r.status === 'open');
    const orgSessions = mySessions.filter(s => s.organization_id === org.id);
    const avgHealth = orgAssessments.length > 0
      ? orgAssessments.reduce((s, a) => s + (a.overall_health || 0), 0) / orgAssessments.length
      : 0;
    return { ...org, avgHealth, openRisks: orgRisks.length, sessionCount: orgSessions.length, recentSessions: orgSessions.slice(0, 3) };
  });

  const totalOpenRisks = orgSummaries.reduce((s, o) => s + o.openRisks, 0);
  const totalSessions = orgSummaries.reduce((s, o) => s + o.sessionCount, 0);
  const avgHealthAcross = orgSummaries.length > 0
    ? orgSummaries.reduce((s, o) => s + o.avgHealth, 0) / orgSummaries.length
    : 0;

  if (!isCoach && !isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Coach Workspace</h1>
        <p className="text-muted-foreground mt-1">Your assigned organizations at a glance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orgs.length}</p>
              <p className="text-xs text-muted-foreground">Organizations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgHealthAcross.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Health</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOpenRisks}</p>
              <p className="text-xs text-muted-foreground">Open Risks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* F3: Cross-org comparison */}
      {orgs.length > 0 && (
        <CrossOrgComparison orgs={orgs} assessments={myAssessments} risks={myRisks} sessions={mySessions} />
      )}

      {/* F5: Active Engagements */}
      {engagements.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Handshake className="h-4 w-4 text-primary" />
              Active Engagements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {engagements.map(eng => {
              const org = orgs.find(o => o.id === eng.organization_id);
              return (
                <div key={eng.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{org?.name || 'Unknown org'}</p>
                    <p className="text-xs text-muted-foreground">Since {eng.start_date || '—'} · <span className="capitalize">{eng.status}</span></p>
                  </div>
                  <Badge className={`text-xs capitalize border-0 ${STAGE_COLORS[eng.current_stage] || 'bg-muted'}`}>
                    {eng.current_stage}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No organizations assigned to you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orgSummaries.map(org => (
            <Card key={org.id} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{org.name}</h3>
                      <Badge className={`text-xs capitalize border-0 ${STAGE_COLORS[org.current_stage || 'stabilize']}`}>
                        {org.current_stage || 'stabilize'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span>Health: <span className="font-semibold text-foreground">{org.avgHealth.toFixed(1)}</span></span>
                      {org.openRisks > 0 && <span className="text-red-600 font-medium">{org.openRisks} open risk{org.openRisks !== 1 ? 's' : ''}</span>}
                      <span>{org.sessionCount} session{org.sessionCount !== 1 ? 's' : ''}</span>
                    </p>
                  </div>
                  <Link to="/organizations" className="flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                      View <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                </div>

                {org.recentSessions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Upcoming Sessions</p>
                    <div className="space-y-1">
                      {org.recentSessions.map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{s.title}</span>
                          <span className="text-muted-foreground">{s.date ? format(new Date(s.date), 'MMM d, yyyy') : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}