import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Edit2, Check, X } from 'lucide-react';

function CoachRow({ org, onSave }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(org.coach_email || '');
  const [stage, setStage] = useState(org.current_stage || 'stabilize');

  const handleSave = () => {
    onSave(org.id, { coach_email: email, current_stage: stage });
    setEditing(false);
  };

  const stageColors = {
    stabilize: 'bg-red-100 text-red-700',
    align: 'bg-amber-100 text-amber-700',
    execute: 'bg-emerald-100 text-emerald-700',
    sustain: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{org.name}</p>
              <Badge className={`text-xs border-0 capitalize ${stageColors[org.current_stage] || 'bg-muted text-muted-foreground'}`}>
                {org.current_stage || 'stabilize'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">{org.type}</Badge>
            </div>
            {!editing ? (
              <p className="text-xs text-muted-foreground mt-1">
                Coach: {org.coach_email ? (
                  <span className="text-primary font-medium">{org.coach_email}</span>
                ) : (
                  <span className="text-destructive italic">Unassigned</span>
                )}
              </p>
            ) : (
              <div className="flex gap-2 mt-2 flex-wrap">
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="coach@email.com"
                  className="h-7 text-xs w-52"
                />
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stabilize">Stabilize</SelectItem>
                    <SelectItem value="align">Align</SelectItem>
                    <SelectItem value="execute">Execute</SelectItem>
                    <SelectItem value="sustain">Sustain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!editing ? (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditing(true)}>
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
            ) : (
              <>
                <Button size="icon" className="h-7 w-7" onClick={handleSave}><Check className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>Health: <strong className="text-foreground">{org.health_score || '—'}</strong></span>
          <span>Momentum: <strong className="text-foreground">{org.momentum_score || '—'}</strong></span>
          {org.city && <span>{org.city}{org.state ? `, ${org.state}` : ''}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoachAssignmentPanel({ organizations }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.functions.invoke('updateOrganization', { id, data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });

  const unassigned = organizations.filter(o => !o.coach_email).length;

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-barlow font-bold">Coach Assignment Dashboard</h2>
        {unassigned > 0 && (
          <Badge className="bg-destructive/10 text-destructive border-0 text-xs">
            {unassigned} unassigned
          </Badge>
        )}
      </div>
      <div className="grid gap-3">
        {organizations.map(org => (
          <CoachRow
            key={org.id}
            org={org}
            onSave={(id, data) => updateMutation.mutate({ id, data })}
          />
        ))}
      </div>
    </div>
  );
}