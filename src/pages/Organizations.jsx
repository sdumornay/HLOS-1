import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2, MapPin, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import StageProgressBar from '@/components/dashboard/StageProgressBar';
import CoachAssignmentPanel from '@/components/organizations/CoachAssignmentPanel';
import BulkImport from '@/components/shared/BulkImport';
import ExportPDFButton from '@/components/shared/ExportPDFButton';

export default function Organizations() {
  const { canManageAll, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'church', city: '', state: '' });
  const [editOrg, setEditOrg] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organization.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setEditOrg(null);
      toast.success('Organization updated.');
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err?.message || 'Permission denied or unknown error'));
    },
  });

  const openEdit = (org) => {
    setEditOrg(org);
    setEditForm({ name: org.name, type: org.type || 'church', city: org.city || '', state: org.state || '' });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOpen(false);
      setForm({ name: '', type: 'church', city: '', state: '' });
    },
  });

  if (!canManageAll) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">Manage churches and organizations</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkImport organizationId={user?.organization_id} />
          <ExportPDFButton
            title="Organizations Report"
            subtitle={`${organizations.length} organizations — ${new Date().toLocaleDateString()}`}
            filename="organizations.pdf"
            sections={[{
              heading: 'Organization List',
              table: {
                headers: ['Name', 'Type', 'Stage', 'Coach', 'City/State'],
                rows: organizations.map(o => [o.name, o.type, o.current_stage || 'stabilize', o.coach_email || 'Unassigned', [o.city, o.state].filter(Boolean).join(', ')])
              }
            }]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Organization</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Church or org name" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
                </div>
              </div>
              <Button onClick={() => createMutation.mutate(form)} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {organizations.map(org => (
          <Card key={org.id} className="border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{org.name}</h3>
                    <Badge variant="outline" className="text-xs capitalize">{org.type}</Badge>
                  </div>
                  {(org.city || org.state) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {[org.city, org.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="w-full sm:w-64">
                  <StageProgressBar currentStage={org.current_stage || 'stabilize'} />
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(org)} title="Edit organization">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {organizations.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No organizations yet. Add your first church or org.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <CoachAssignmentPanel organizations={organizations} />

      {/* Edit Organization Dialog */}
      <Dialog open={!!editOrg} onOpenChange={(v) => !v && setEditOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Church or org name" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={editForm.type} onValueChange={v => setEditForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="church">Church</SelectItem>
                  <SelectItem value="ministry">Ministry</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input value={editForm.city || ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
              </div>
              <div>
                <Label>State</Label>
                <Select value={editForm.state} onValueChange={v => setEditForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => updateMutation.mutate({ id: editOrg.id, data: editForm })}
              className="w-full"
              disabled={!editForm.name?.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}