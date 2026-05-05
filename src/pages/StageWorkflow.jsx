import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import StageHeader from '@/components/stages/StageHeader';
import MilestoneList from '@/components/stages/MilestoneList';

export default function StageWorkflow() {
  const { stage } = useParams();
  const { user, canManageAll } = useCurrentUser();
  const queryClient = useQueryClient();

  const orgId = user?.organization_id;

  const { data: stageProgress = [] } = useQuery({
    queryKey: ['stageProgress', stage],
    queryFn: () => base44.entities.StageProgress.filter({ stage }),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', stage],
    queryFn: () => base44.entities.Action.filter({ stage }),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', stage],
    queryFn: () => base44.entities.Session.filter({ stage }),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', stage],
    queryFn: () => base44.entities.Assessment.filter({ stage }),
  });

  const myProgress = canManageAll
    ? stageProgress
    : stageProgress.filter(sp => sp.organization_id === orgId);
  const currentProgress = myProgress[0];

  const myActions = canManageAll ? actions : actions.filter(a => a.organization_id === orgId);
  const mySessions = canManageAll ? sessions : sessions.filter(s => s.organization_id === orgId);
  const myAssessments = canManageAll ? assessments : assessments.filter(a => a.organization_id === orgId);

  const completedActions = myActions.filter(a => a.status === 'completed').length;

  const updateMilestone = useMutation({
    mutationFn: async ({ title, completed }) => {
      if (!currentProgress) {
        await base44.entities.StageProgress.create({
          organization_id: orgId,
          stage,
          status: 'in_progress',
          started_date: new Date().toISOString().split('T')[0],
          milestones: [{ title, completed, completed_date: completed ? new Date().toISOString() : null }],
        });
      } else {
        const milestones = [...(currentProgress.milestones || [])];
        const idx = milestones.findIndex(m => m.title === title);
        if (idx >= 0) {
          milestones[idx] = { ...milestones[idx], completed, completed_date: completed ? new Date().toISOString() : null };
        } else {
          milestones.push({ title, completed, completed_date: completed ? new Date().toISOString() : null });
        }
        await base44.entities.StageProgress.update(currentProgress.id, { milestones });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stageProgress', stage] }),
  });

  return (
    <div className="space-y-6">
      <StageHeader stage={stage} status={currentProgress?.status} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedActions}/{myActions.length}</p>
              <p className="text-xs text-muted-foreground">Actions completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mySessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions held</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myAssessments.length}</p>
              <p className="text-xs text-muted-foreground">Assessments taken</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MilestoneList
          stage={stage}
          milestones={currentProgress?.milestones || []}
          onToggle={(title, completed) => updateMilestone.mutate({ title, completed })}
        />

        {/* Stage Actions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Stage Actions</CardTitle>
            <Link to="/actions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {myActions.slice(0, 8).map(action => (
              <div key={action.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.due_date ? `Due ${format(new Date(action.due_date), 'MMM d')}` : 'No deadline'} • {action.owner_email || 'Unassigned'}
                  </p>
                </div>
                <Badge variant={action.status === 'completed' ? 'default' : action.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs ml-2">
                  {action.status?.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {myActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No actions for this stage yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}