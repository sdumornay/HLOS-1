import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RATING_SCALE } from '@/lib/impactInstruments';
import { cn } from '@/lib/utils';

export default function EvaluationForm({ instrument, onSubmit, saving, readOnly = false }) {
  const [ratings, setRatings] = useState({});
  const [open, setOpen] = useState({});
  const [evidenceSource, setEvidenceSource] = useState('');

  const complete = instrument.ratings.every((q) => ratings[q.key]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-sm text-foreground">{instrument.summary}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px]">{instrument.minutes}</Badge>
          <Badge variant="secondary" className="text-[10px]">{instrument.audience}</Badge>
          <Badge variant="outline" className="text-[10px]">HLOS stage: {instrument.stage}</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {instrument.ratings.map((q) => (
          <div key={q.key} className="space-y-2">
            <p className="text-sm text-foreground">{q.label}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {RATING_SCALE.map((option) => {
                const active = ratings[q.key] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setRatings({ ...ratings, [q.key]: option.value })}
                    className={cn(
                      'rounded-lg border px-1 py-2 text-center transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <span className="block text-sm font-semibold">{option.value}</span>
                    <span className="block text-[9px] leading-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {instrument.open.map((q) => (
          <div key={q.key}>
            <Label className="text-xs">{q.label}</Label>
            <Textarea
              rows={2}
              disabled={readOnly}
              placeholder={q.placeholder}
              value={open[q.key] || ''}
              onChange={(e) => setOpen({ ...open, [q.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {instrument.recordedBy === 'coach' && (
        <div>
          <Label className="text-xs">Evidence source</Label>
          <Input
            disabled={readOnly}
            placeholder="Action tracker, observation notes, authorized team feedback"
            value={evidenceSource}
            onChange={(e) => setEvidenceSource(e.target.value)}
          />
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {complete ? 'All rating questions answered.' : 'Answer every rating question to submit.'}
          </p>
          <Button
            disabled={!complete || saving}
            onClick={() => onSubmit({ responses: ratings, open_responses: open, evidence_source: evidenceSource })}
          >
            {saving ? 'Saving…' : 'Submit evaluation'}
          </Button>
        </div>
      )}
    </div>
  );
}