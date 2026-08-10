import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useOrgId } from '@/lib/useOrgId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Shield, Activity } from 'lucide-react';
import ScoreCard from '@/components/dashboard/ScoreCard';
import HealthRadar from '@/components/dashboard/HealthRadar';
import TeamMemberAssignment from '@/components/team/TeamMemberAssignment';
import InviteMembersButton from '@/components/team/InviteMembersButton';

export default function TeamDashboard() {
  const { user, canManageAll } = useCurrentUser();
  const orgId = useOrgId();
  const [selectedTeamId, setSelectedTeamId] = useState('all');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 50),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const myTeams = canManageAll ? teams : teams.filter(t => t.organization_id === orgId);
  const selectedTeam = selectedTeamId !== 'all' ? myTeams.find(t => t.id === selectedTeamId) : null;

  const teamAssessments = selectedTeam
    ? assessments.filter(a => a.team_id === selectedTeam.id)
    : canManageAll ? assessments : assessments.filter(a => a.organization_id === orgId);

  const teamMembers = selectedTeam
    ? allUsers.filter(u => selectedTeam.members?.includes(u.email))
    : canManageAll ? allUsers : allUsers.filter(u => u.organization_id === orgId);

  const avgHealth = teamAssessments.length > 0
    ? teamAssessments.reduce((s, a) => s + (a.overall_health || 0), 0) / teamAssessments.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Team Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor team health and member engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {myTeams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManageAll && <InviteMembersButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Team Health" score={avgHealth} icon={Shield} variant="health" subtitle="Average score" />
        <ScoreCard title="Members" score={teamMembers.length} maxScore={20} icon={Users} variant="momentum" subtitle="Active team members" />
        <ScoreCard title="Assessments" score={teamAssessments.length} maxScore={50} icon={Activity} variant="momentum" subtitle="Responses collected" />
        <ScoreCard title="Participation" score={teamMembers.length > 0 ? Math.min(10, (teamAssessments.length / teamMembers.length) * 2) : 0} icon={UserCheck} variant="health" subtitle="Engagement level" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthRadar assessments={teamAssessments} />

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.slice(0, 10).map(member => {
              const initials = member.full_name
                ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : '?';
              return (
                <div key={member.id} className="flex items-center gap-3 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.full_name || member.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role?.replace('_', ' ') || 'Team Member'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{member.title || 'Member'}</Badge>
                </div>
              );
            })}
            {teamMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No team members found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* F9: Team Member Assignment */}
      {orgId && <TeamMemberAssignment orgId={orgId} />}
    </div>
  );
}