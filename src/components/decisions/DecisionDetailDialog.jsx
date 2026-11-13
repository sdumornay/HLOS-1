import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, CalendarClock, Users } from 'lucide-react';

const IMPACT_STYLES = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-sky-100 text-sky-800',
  high: 'bg-amber-100 text-amber-900',
  critical: 'bg-rose-100 text-rose-800',
};
const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-800',
  reversed: 'bg-rose-100 text-rose-800',
  superseded: 'bg-slate-100 text-slate-700',
};
const CATEGORY_LABEL = {
  financial: 'Financial', staffing: 'Staffing', ministry: 'Ministry', strategy: 'Strategy',
  operations: 'Operations', communications: 'Communications', other: 'Other',
};

function formatDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(parsed, 'MMM d, yyyy');
}

function Field({ label, children }) {
  if (!children) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-line">{children}</p>
    </div>
  );
}

export default function DecisionDetailDialog({ decision, onClose }) {
  const date = decision ? formatDate(decision.date || decision.created_date) : null;
  const review = decision ? formatDate(decision.review_date) : null;

  return (
    <Dialog open={!!decision} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl border-border/70">
        {decision && (
          <>
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[decision.status] || STATUS_STYLES.active}`}>
                  {decision.status || 'active'}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${IMPACT_STYLES[decision.impact] || IMPACT_STYLES.medium}`}>
                  {decision.impact || 'medium'} impact
                </span>
                {decision.category && (
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABEL[decision.category] || decision.category}
                  </span>
                )}
              </div>
              <DialogTitle className="font-barlow text-xl leading-snug text-primary pr-6">
                {decision.decision}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span>{date || 'Date not recorded'}</span>
                <span>Made by {decision.made_by || 'unattributed'}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 max-h-[62vh] space-y-4 overflow-y-auto pr-1">
              <Field label="Issue / question">{decision.issue_question}</Field>
              <Field label="Why this was decided">{decision.context}</Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Participants</p>
                  <p className="flex items-start gap-2 text-sm text-foreground">
                    <Users className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    {decision.participants || 'Not recorded'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review by</p>
                  <p className="flex items-start gap-2 text-sm text-foreground">
                    <CalendarClock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    {review || 'No review date set'}
                  </p>
                </div>
              </div>

              <Field label="Affected teams">{decision.affected_teams}</Field>

              {decision.resulting_actions && (
                <div className="space-y-1 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5 text-secondary" /> Commitments that followed
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">{decision.resulting_actions}</p>
                </div>
              )}

              <Field label="Notes">{decision.notes}</Field>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}