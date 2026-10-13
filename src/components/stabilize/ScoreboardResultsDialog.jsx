import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ScoreboardResults from '@/components/health/ScoreboardResults';

/**
 * Dialog that shows the full Leadership Health Scoreboard results
 * (overall score, phase diagnoses, recommendations) from a previous assessment.
 */
export default function ScoreboardResultsDialog({ open, onOpenChange, scores, orgId }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leadership Health Scoreboard Results</DialogTitle>
        </DialogHeader>
        {scores ? (
          <ScoreboardResults scores={scores} orgId={orgId} />
        ) : (
          <p className="text-sm text-muted-foreground">No results available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}