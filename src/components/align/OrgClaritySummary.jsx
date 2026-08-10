import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Compass, Target, ClipboardList, Map, Pencil, Check, X } from 'lucide-react';

export default function OrgClaritySummary({ orgId }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [mission, setMission] = useState('');
  const [outcomes, setOutcomes] = useState('');

  const { data: org } = useQuery({
    queryKey: ['org-clarity', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['priorities', orgId],
    queryFn: () => base44.entities.PriorityAlignment.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roleClarity', orgId],
    queryFn: () => base44.entities.RoleClarity.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisionRights', orgId],
    queryFn: () => base44.entities.DecisionRight.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  React.useEffect(() => {
    if (org) {
      setMission(org.mission || '');
      setOutcomes(org.desired_outcomes || '');
    }
  }, [org]);

  const save = async () => {
    try {
      await base44.functions.invoke('updateOrganization', {
        organizationId: orgId,
        updates: { mission, desired_outcomes: outcomes },
      });
      queryClient.invalidateQueries({ queryKey: ['org-clarity', orgId] });
      setEditing(false);
    } catch (e) {
      // fallback to direct update
      try {
        await base44.entities.Organization.update(orgId, { mission, desired_outcomes: outcomes });
        queryClient.invalidateQueries({ queryKey: ['org-clarity', orgId] });
        setEditing(false);
      } catch (err) {
        console.error('Could not save org clarity:', err);
      }
    }
  };

  const activePriorities = priorities.filter(p => p.status === 'active' || p.status === 'proposed').slice(0, 5);
  const clearRoles = roles.filter(r => r.status === 'agreed' || r.status === 'reviewed' || r.status === 'draft');
  const clearDecisions = decisions.filter(d => d.clarity_status === 'clear');

  return (
    <Card className="border-border/50 shadow-sm col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Organizational Clarity</CardTitle>
        </div>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mission & Outcomes */}
        {editing ? (
          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <Label className="text-xs">Current Mission or Ministry Focus</Label>
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="What is God calling us to in this season?"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs">Desired Outcomes</Label>
              <Textarea
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                placeholder="What does success look like for us right now?"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={save}>
                <Check className="h-3.5 w-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Mission Focus</p>
              <p className="text-sm text-foreground">{mission || 'Not yet defined. Click Edit to add your current mission or ministry focus.'}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Desired Outcomes</p>
              <p className="text-sm text-foreground">{outcomes || 'Not yet defined. What does success look like this season?'}</p>
            </div>
          </div>
        )}

        {/* Clarity snapshot — answers the 4 key questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* What matters most? */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">What Matters Most?</p>
              <Badge variant="outline" className="text-xs ml-auto">{activePriorities.length} priorities</Badge>
            </div>
            {activePriorities.length > 0 ? (
              <ol className="space-y-1">
                {activePriorities.slice(0, 5).map((p, i) => (
                  <li key={p.id} className="text-xs flex gap-1.5">
                    <span className="font-bold text-muted-foreground">{i + 1}.</span>
                    <span className="flex-1">{p.title}</span>
                    {p.owner && <span className="text-muted-foreground">— {p.owner}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">No priorities defined yet. Use the Priority Alignment tool below.</p>
            )}
          </div>

          {/* Who owns what? */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <ClipboardList className="h-4 w-4 text-teal-500" />
              <p className="text-sm font-semibold">Who Owns What?</p>
              <Badge variant="outline" className="text-xs ml-auto">{clearRoles.length} roles</Badge>
            </div>
            {clearRoles.length > 0 ? (
              <div className="space-y-1">
                {clearRoles.slice(0, 5).map(r => (
                  <div key={r.id} className="text-xs flex justify-between">
                    <span className="font-medium">{r.member_name}</span>
                    <span className="text-muted-foreground">{r.role_title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No roles defined yet. Use the Role Clarity tool below.</p>
            )}
          </div>

          {/* How do we make decisions? */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Map className="h-4 w-4 text-cyan-500" />
              <p className="text-sm font-semibold">How Do We Decide?</p>
              <Badge variant="outline" className="text-xs ml-auto">{clearDecisions.length} clear</Badge>
            </div>
            {clearDecisions.length > 0 ? (
              <div className="space-y-1">
                {clearDecisions.slice(0, 5).map(d => (
                  <div key={d.id} className="text-xs flex justify-between">
                    <span className="truncate flex-1">{d.decision_area}</span>
                    <span className="text-muted-foreground ml-2">{d.decider}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No decisions mapped yet. Use the Decision-Rights Map below.</p>
            )}
          </div>

          {/* How have we agreed to work together? */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Check className="h-4 w-4 text-rose-500" />
              <p className="text-sm font-semibold">How We Work Together</p>
              <Badge variant="outline" className="text-xs ml-auto">See Team Agreements below</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Scroll to the Team Agreements section to see your covenant and communication norms.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}