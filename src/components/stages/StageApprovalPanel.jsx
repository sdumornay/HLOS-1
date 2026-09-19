import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Unlock, Lock, RotateCcw, ShieldCheck, Loader2 } from 'lucide-react';
import { useStageAccess } from '@/lib/useStageAccess';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useOrgId } from '@/lib/useOrgId';
import { STAGE_LABELS, STATUS_LABELS } from '@/lib/stageDeliverables';
import { toast } from 'sonner';

export default function StageApprovalPanel() {
  const { user } = useCurrentUser();
  const orgId = useOrgId();
  const { stages, refetch } = useStageAccess();
  const queryClient = useQueryClient();

  const [approveOpen, setApproveOpen] = useState(null);
  const [overrideOpen, setOverrideOpen] = useState(null);
  const [overrideAction, setOverrideAction] = useState('unlock');
  const [overrideStage, setOverrideStage] = useState('stabilize');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = ['super_admin', 'coach', 'admin'].includes(user?.role);
  if (!isAdmin) return null;

  const awaitingApproval = stages.filter((s) => s.status === 'awaiting_approval');

  const handleApprove = async (stage) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('approveStageCompletion', { organizationId: orgId, stage });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || `${STAGE_LABELS[stage]} approved`);
        setApproveOpen(null);
        queryClient.invalidateQueries({ queryKey: ['stageAccess'] });
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        refetch();
      }
    } catch (e) {
      toast.error('Failed to approve: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      toast.error('Please provide a meaningful reason (at least 5 characters)');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('overrideStageProgress', {
        organizationId: orgId,
        stage: overrideStage,
        action: overrideAction,
        reason: overrideReason,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || 'Override successful');
        setOverrideOpen(false);
        setOverrideReason('');
        queryClient.invalidateQueries({ queryKey: ['stageAccess'] });
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        refetch();
      }
    } catch (e) {
      toast.error('Failed to override: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Stage Administration</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOverrideOpen(true)}>
            <Unlock className="h-3.5 w-3.5 mr-1" /> Manual Override
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {awaitingApproval.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No stages awaiting approval. Stages unlock automatically when deliverables are complete.
          </p>
        ) : (
          awaitingApproval.map((s) => (
            <div key={s.stage} className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    <p className="text-sm font-semibold">{STAGE_LABELS[s.stage]} — Ready for Approval</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All {s.deliverables?.length || 0} deliverables complete. Review and approve to unlock the next stage.
                  </p>
                  {/* Deliverable checklist */}
                  <div className="mt-2 space-y-1">
                    {s.deliverables?.map((d) => (
                      <div key={d.key} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setApproveOpen(s.stage)}
                  disabled={loading}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))
        )}

        {/* Stage status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {stages.map((s) => (
            <div key={s.stage} className="rounded-lg border border-border/40 p-2 text-center">
              <p className="text-xs font-semibold">{STAGE_LABELS[s.stage]}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{STATUS_LABELS[s.status]}</p>
              <p className="text-xs font-bold mt-0.5">{s.completion_percentage}%</p>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Approve dialog */}
      <Dialog open={!!approveOpen} onOpenChange={(v) => !v && setApproveOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Approve {approveOpen ? STAGE_LABELS[approveOpen] : ''}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will mark {approveOpen ? STAGE_LABELS[approveOpen] : ''} as completed and unlock the next stage for this organization.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(null)}>Cancel</Button>
            <Button onClick={() => handleApprove(approveOpen)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Approve & Unlock Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-amber-500" />
              Manual Stage Override
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Stage</Label>
              <Select value={overrideStage} onValueChange={setOverrideStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['stabilize', 'align', 'execute', 'sustain'].map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Action</Label>
              <Select value={overrideAction} onValueChange={setOverrideAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlock">Unlock (make available)</SelectItem>
                  <SelectItem value="complete">Mark completed (unlocks next stage)</SelectItem>
                  <SelectItem value="relock">Lock stage</SelectItem>
                  <SelectItem value="reset">Reset to in progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (required)</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this override is necessary..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This action will be logged with your name, the date, and this reason.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}