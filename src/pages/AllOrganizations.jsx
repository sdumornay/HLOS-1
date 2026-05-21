import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Users, Calendar, Search, ArrowRight, Shield, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const STAGE_COLORS = {
  stabilize: 'bg-blue-100 text-blue-700',
  align:     'bg-amber-100 text-amber-700',
  execute:   'bg-green-100 text-green-700',
  sustain:   'bg-purple-100 text-purple-700',
};

export default function AllOrganizations() {
  const { user, isAdmin, loading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteOrganization', { organizationId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-organizations'] }),
  });

  const handleDelete = async (e, orgId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this organization? This cannot be undone.')) return;
    setDeletingId(orgId);
    await deleteMutation.mutateAsync(orgId);
    setDeletingId(null);
  };

  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date'),
    enabled: isAdmin,
  });

  // Fetch all users to resolve leader names and member counts
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-admin'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const orgData = useMemo(() => {
    return organizations.map(org => {
      const members = allUsers.filter(u => u.organization_id === org.id);
      const leader = members.find(u => u.role === 'lead_pastor');
      return {
        ...org,
        leaderName: leader?.full_name || '—',
        memberCount: members.length,
      };
    });
  }, [organizations, allUsers]);

  const cities = useMemo(() => {
    const all = orgData.map(o => o.city).filter(Boolean);
    return [...new Set(all)].sort();
  }, [orgData]);

  const filtered = useMemo(() => {
    return orgData.filter(org => {
      const matchSearch =
        !search ||
        org.name?.toLowerCase().includes(search.toLowerCase()) ||
        org.leaderName?.toLowerCase().includes(search.toLowerCase()) ||
        org.city?.toLowerCase().includes(search.toLowerCase());
      const matchCity = filterCity === 'all' || org.city === filterCity;
      const matchStage = filterStage === 'all' || org.current_stage === filterStage;
      return matchSearch && matchCity && matchStage;
    });
  }, [orgData, search, filterCity, filterStage]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">All Organizations</h1>
        <p className="text-muted-foreground mt-1">
          Global view — {orgsLoading ? '…' : organizations.length} organization{organizations.length !== 1 ? 's' : ''} across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, leader, or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="stabilize">Stabilize</SelectItem>
            <SelectItem value="align">Align</SelectItem>
            <SelectItem value="execute">Execute</SelectItem>
            <SelectItem value="sustain">Sustain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table / Card list */}
      {orgsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-14 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No organizations match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
            <span>Organization</span>
            <span>Leader</span>
            <span>City</span>
            <span>Members</span>
            <span>Stage</span>
            <span>Created</span>
            <span />
          </div>

          <div className="divide-y divide-border/50 bg-card">
            {filtered.map(org => (
              <div
                key={org.id}
                onClick={() => navigate('/organizations')}
                className="group cursor-pointer hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{org.type}</p>
                  </div>
                </div>
                <span className="text-sm truncate">{org.leaderName}</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {org.city ? <><MapPin className="h-3 w-3 flex-shrink-0" />{org.city}</> : '—'}
                </span>
                <span className="text-sm flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />{org.memberCount}
                </span>
                <Badge className={`text-xs capitalize border-0 ${STAGE_COLORS[org.current_stage] || 'bg-muted text-muted-foreground'}`}>
                  {org.current_stage || 'stabilize'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {org.created_date ? format(new Date(org.created_date), 'MMM d, yyyy') : '—'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, org.id)}
                    disabled={deletingId === org.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}

            {/* Mobile cards */}
            {filtered.map(org => (
              <div
                key={`m-${org.id}`}
                onClick={() => navigate('/organizations')}
                className="md:hidden cursor-pointer p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{org.type}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs capitalize border-0 flex-shrink-0 ${STAGE_COLORS[org.current_stage] || 'bg-muted text-muted-foreground'}`}>
                    {org.current_stage || 'stabilize'}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{org.leaderName}</span>
                  {org.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.city}</span>}
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{org.memberCount} members</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {org.created_date ? format(new Date(org.created_date), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => handleDelete(e, org.id)}
                    disabled={deletingId === org.id}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}