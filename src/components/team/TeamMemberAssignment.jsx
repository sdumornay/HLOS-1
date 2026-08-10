import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, X, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamMemberAssignment({ orgId }) {
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState('');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams-assign', orgId],
    queryFn: () => base44.entities.Team.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-assign', orgId],
    queryFn: () => base44.entities.User.list(),
    enabled: !!orgId,
  });

  const orgUsers = users.filter(u => u.organization_id === orgId);
  const unassigned = orgUsers.filter(u => !teams.some(t => t.members?.includes(u.email)));

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams-assign', orgId] }),
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-assign', orgId] });
      setNewTeamName('');
      toast.success('Team created.');
    },
  });

  const addToTeam = (team, email) => {
    const members = [...(team.members || []), email];
    updateTeamMutation.mutate({ id: team.id, data: { members } });
  };

  const removeFromTeam = (team, email) => {
    const members = (team.members || []).filter(m => m !== email);
    updateTeamMutation.mutate({ id: team.id, data: { members } });
  };

  const setLead = (team, email) => {
    updateTeamMutation.mutate({ id: team.id, data: { lead_email: email } });
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    createTeamMutation.mutate({
      name: newTeamName.trim(),
      organization_id: orgId,
      members: [],
    });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Team Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new team */}
        <div className="flex gap-2">
          <Input
            placeholder="New team name…"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleCreateTeam} disabled={!newTeamName.trim() || createTeamMutation.isPending}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Team
          </Button>
        </div>

        {/* Teams list */}
        {teams.map(team => {
          const teamMembers = orgUsers.filter(u => team.members?.includes(u.email));
          const available = unassigned.filter(u => !team.members?.includes(u.email));
          return (
            <div key={team.id} className="rounded-lg border border-border/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{team.name}</p>
                  <p className="text-xs text-muted-foreground">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</p>
                </div>
                {team.lead_email && (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    {teamMembers.find(m => m.email === team.lead_email)?.full_name || team.lead_email}
                  </Badge>
                )}
              </div>

              {/* Current members */}
              <div className="flex flex-wrap gap-1.5">
                {teamMembers.map(m => (
                  <div key={m.id} className="inline-flex items-center gap-1.5 rounded-md bg-primary/5 border border-border/40 px-2 py-1">
                    <span className="text-xs font-medium">{m.full_name || m.email}</span>
                    <button onClick={() => removeFromTeam(team, m.email)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {teamMembers.length === 0 && <p className="text-xs text-muted-foreground italic">No members yet</p>}
              </div>

              {/* Add member dropdown */}
              {available.length > 0 && (
                <Select onValueChange={(email) => addToTeam(team, email)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="+ Add member" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map(u => (
                      <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}

        {teams.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No teams yet. Create one above to start assigning members.</p>
        )}

        {unassigned.length > 0 && teams.length > 0 && (
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Unassigned ({unassigned.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {unassigned.map(u => (
                <span key={u.id} className="inline-flex items-center rounded-md bg-muted/40 border border-border/40 px-2 py-1 text-xs">
                  {u.full_name || u.email}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}