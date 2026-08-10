import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2, MapPin, Pencil, Search, Users, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import StageProgressBar from '@/components/dashboard/StageProgressBar';
import CoachAssignmentPanel from '@/components/organizations/CoachAssignmentPanel';
import BulkImport from '@/components/shared/BulkImport';
import ExportPDFButton from '@/components/shared/ExportPDFButton';
import { format } from 'date-fns';

const STAGE_COLORS = {
  stabilize: 'bg-blue-100 text-blue-700',
  align: 'bg-amber-100 text-amber-700',
  execute: 'bg-green-100 text-green-700',
  sustain: 'bg-purple-100 text-purple-700',
};

export default function Organizations() {
  const { canManageAll, isAdmin, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'church', city: '', state: '' });
  const [editOrg, setEditOrg] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-orgs'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteOrganization', { organizationId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });

  const handleDelete = async (e, orgId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this organization? This cannot be undone.')) return;
    setDeletingId(orgId);
    await deleteMutation.mutateAsync(orgId);
    setDeletingId(null);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.functions.invoke('updateOrganization', { id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setEditOrg(null);
      toast.success('Organization updated.');
    },
    onError: (err) => toast.error('Failed to save: ' + (err?.message || 'Unknown error')),
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

  // Enrich orgs with member counts and leader names (admin only)
  const orgData = useMemo(() => {
    if (!isAdmin) return organizations.map(o => ({ ...o, leaderName: '—', memberCount: 0 }));
    return organizations.map(org => {
      const members = allUsers.filter(u => u.organization_id === org.id);
      const leader = members.find(u => u.role === 'lead_pastor');
      return { ...org, leaderName: leader?.full_name || '—', memberCount: members.length };
    });
  }, [organizations, allUsers, isAdmin]);

  const cities = useMemo(() => {
    const all = orgData.map(o => o.city).filter(Boolean);
    return [...new Set(all)].sort();
  }, [orgData]);

  const filtered = useMemo(() => {
    return orgData.filter(org => {
      const matchSearch = !search ||
        org.name?.toLowerCase().includes(search.toLowerCase()) ||
        (isAdmin && org.leaderName?.toLowerCase().includes(search.toLowerCase())) ||
        org.city?.toLowerCase().includes(search.toLowerCase());
      const matchCity = filterCity === 'all' || org.city === filterCity;
      const matchStage = filterStage === 'all' || org.current_stage === filterStage;
      return matchSearch && matchCity && matchStage;
    });
  }, [orgData, search, filterCity, filterStage, isAdmin]);

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
        <div className="flex items-center gap-2 flex-wrap">
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
              <DialogHeader><DialogTitle>Add Organization</DialogTitle></DialogHeader>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, leader, or city…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Cities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="stabilize">Stabilize</SelectItem>
            <SelectItem value="align">Align</SelectItem>
            <SelectItem value="execute">Execute</SelectItem>
            <SelectItem value="sustain">Sustain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organization list */}
      <div className="grid gap-4">
        {filtered.map(org => (
          <Card key={org.id} className="border-border/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{org.name}</h3>
                    <Badge variant="outline" className="text-xs capitalize">{org.type}</Badge>
                    <Badge className={`text-xs capitalize border-0 ${STAGE_COLORS[org.current_stage || 'stabilize']}`}>
                      {org.current_stage || 'stabilize'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                    {(org.city || org.state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[org.city, org.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {isAdmin && org.memberCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{org.memberCount} members
                      </span>
                    )}
                    {isAdmin && org.leaderName !== '—' && <span>Leader: {org.leaderName}</span>}
                    {org.coach_email && <span>Coach: {org.coach_email}</span>}
                  </p>
                </div>
                <div className="w-full sm:w-48">
                  <StageProgressBar currentStage={org.current_stage || 'stabilize'} />
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(org)} title="Edit organization">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(e, org.id)}
                      disabled={deletingId === org.id}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Delete organization"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No organizations match your filters.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <CoachAssignmentPanel organizations={organizations} />

      {/* Edit Organization Dialog */}
      <Dialog open={!!editOrg} onOpenChange={(v) => !v && setEditOrg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Organization</DialogTitle></DialogHeader>
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
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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