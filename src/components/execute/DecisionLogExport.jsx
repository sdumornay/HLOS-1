import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';

export default function DecisionLogExport({ orgId }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { data: org } = useQuery({
    queryKey: ['orgDocLink', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await base44.functions.invoke('syncDecisionLogToDoc', { organization_id: orgId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orgDocLink', orgId] }),
    onError: (err) => setError(err?.response?.data?.error || 'Could not update the Google Doc.'),
  });

  const docUrl = org?.decision_log_doc_url;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {docUrl && (
          <Button asChild size="sm" variant="outline">
            <a href={docUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> Google Doc
            </a>
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => syncMutation.mutate()} disabled={!orgId || syncMutation.isPending}>
          {syncMutation.isPending
            ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            : <FileText className="h-4 w-4 mr-1" />}
          {docUrl ? 'Sync Doc' : 'Export to Doc'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive max-w-[240px] text-right">{error}</p>}
    </div>
  );
}