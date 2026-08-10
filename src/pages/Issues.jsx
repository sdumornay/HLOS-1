import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Heart, Cog, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import IssueForm from '@/components/issues/IssueForm';
import IssueCard from '@/components/issues/IssueCard';

export default function Issues() {
  const { user, isAdmin, isCoach } = useCurrentUser();
  const orgId = user?.organization_id;
  const canOverride = isAdmin || isCoach;
  const canDelete = isAdmin || isCoach || user?.role === 'lead_pastor';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', orgId],
    queryFn: () => base44.entities.Issue.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const filtered = useMemo(() => {
    return issues
      .filter(i => filterStatus === 'all' || i.status === filterStatus)
      .filter(i => filterClass === 'all' || i.classification === filterClass)
      .filter(i => filterPriority === 'all' || i.priority === filterPriority)
      .sort((a, b) => {
        // Open first, then by priority, then by date
        const aOpen = a.status === 'open' || a.status === 'in_progress' ? 0 : 1;
        const bOpen = b.status === 'open' || b.status === 'in_progress' ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        const priOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priOrder[a.priority] !== priOrder[b.priority]) return priOrder[a.priority] - priOrder[b.priority];
        return new Date(b.date_identified || b.created_date) - new Date(a.date_identified || a.created_date);
      });
  }, [issues, filterStatus, filterClass, filterPriority]);

  const openCount = issues.filter(i => i.status === 'open' || i.status === 'in_progress').length;

  const handleCreate = async (data) => {
    try {
      await base44.entities.Issue.create({ ...data, organization_id: orgId });
      queryClient.invalidateQueries({ queryKey: ['issues', orgId] });
      queryClient.invalidateQueries({ queryKey: ['issues-summary', orgId] });
      toast({ title: 'Issue captured' });
      setFormOpen(false);
    } catch (e) {
      toast({ title: 'Could not save issue', description: e.message, variant: 'destructive' });
    }
  };

  const handleUpdate = async (data) => {
    try {
      await base44.entities.Issue.update(editing.id, data);
      queryClient.invalidateQueries({ queryKey: ['issues', orgId] });
      queryClient.invalidateQueries({ queryKey: ['issues-summary', orgId] });
      toast({ title: 'Issue updated' });
      setFormOpen(false);
      setEditing(null);
    } catch (e) {
      toast({ title: 'Could not update issue', description: e.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id, status) => {
    const patch = { status };
    if (status === 'resolved' && !issues.find(i => i.id === id)?.date_resolved) {
      patch.date_resolved = new Date().toISOString().split('T')[0];
    }
    try {
      await base44.entities.Issue.update(id, patch);
      queryClient.invalidateQueries({ queryKey: ['issues', orgId] });
      queryClient.invalidateQueries({ queryKey: ['issues-summary', orgId] });
    } catch (e) {
      toast({ title: 'Could not update status', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (issue) => {
    if (!confirm(`Delete "${issue.title}"?`)) return;
    try {
      await base44.entities.Issue.delete(issue.id);
      queryClient.invalidateQueries({ queryKey: ['issues', orgId] });
      queryClient.invalidateQueries({ queryKey: ['issues-summary', orgId] });
      toast({ title: 'Issue deleted' });
    } catch (e) {
      toast({ title: 'Could not delete issue', description: e.message, variant: 'destructive' });
    }
  };

  const openEdit = (issue) => {
    setEditing(issue);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to start capturing issues.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Healthy Leadership OS</p>
          <h1 className="text-2xl lg:text-3xl font-barlow font-bold text-foreground tracking-tight">Issues</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Capture problems, tensions, and barriers. {openCount} open.
          </p>
        </div>
        <Button onClick={openNew} className="w-fit">
          <Plus className="h-4 w-4" /> Capture Issue
        </Button>
      </div>

      {/* Classification explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-rose-500" />
            <span className="font-semibold text-sm">Relational Issue</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A problem primarily involving trust, communication, interpersonal tension, misunderstanding, unresolved conflict, or damaged relationships.
          </p>
        </div>
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2 mb-1">
            <Cog className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Operational Issue</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A problem primarily involving priorities, processes, resources, decisions, responsibilities, deadlines, or execution.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="relational">Relational</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">{filtered.length} shown</Badge>
      </div>

      {/* Issues list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">No issues found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {issues.length === 0
              ? 'Capture your first issue to start tracking problems and tensions.'
              : 'No issues match your current filters.'}
          </p>
          {issues.length === 0 && (
            <Button onClick={openNew} className="mt-4">
              <Plus className="h-4 w-4" /> Capture Issue
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <IssueForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={editing ? handleUpdate : handleCreate}
        editing={editing}
        currentUser={user}
        canOverride={canOverride}
      />
    </div>
  );
}