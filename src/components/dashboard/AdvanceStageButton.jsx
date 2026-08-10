import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvanceStageButton({ orgId, currentStage }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const STAGE_NAMES = { stabilize: 'Stabilize', align: 'Align', execute: 'Execute', sustain: 'Sustain' };
  const nextStageMap = { stabilize: 'Align', align: 'Execute', execute: 'Sustain' };
  const nextStageName = nextStageMap[currentStage];

  if (!nextStageName) return null;

  const handleCheck = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke('advanceStage', { organizationId: orgId });
      setResults(res);
      if (res.advanced) {
        toast.success(`Advanced to ${STAGE_NAMES[res.nextStage]}!`);
        queryClient.invalidateQueries();
        setOpen(false);
      }
    } catch (e) {
      toast.error('Could not check readiness: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => { setOpen(true); setResults(null); }} className="w-full" size="sm">
        <ArrowRight className="h-4 w-4 mr-1" /> Advance to {nextStageName}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Advance to {nextStageName}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              We'll check your readiness and advance your organization to {nextStageName} if all criteria are met.
            </p>
            {results && !results.advanced && results.results && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <p className="text-sm font-semibold text-amber-700">Not quite ready yet:</p>
                {results.results.filter(r => !r.met).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
            {results && results.advanced && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">Advanced successfully!</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCheck} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Checking...</> : 'Check & Advance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}