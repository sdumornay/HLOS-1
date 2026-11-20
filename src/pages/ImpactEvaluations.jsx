import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrgId } from '@/lib/useOrgId';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import ImpactNav from '@/components/impact/ImpactNav';
import EvaluationForm from '@/components/impact/EvaluationForm';
import { INSTRUMENTS, aggregateResponses } from '@/lib/impactInstruments';
import { cn } from '@/lib/utils';

export default function ImpactEvaluations() {
  const orgId = useOrgId();
  const { user, isAdmin, isCoach, isLeadPastor } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeLevel, setActiveLevel] = useState(1);
  const canSeeAggregate = isAdmin || isCoach || isLeadPastor;

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['impactResponses', orgId],
    queryFn: () => base44.entities.EvaluationResponse.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const activeInstrument = INSTRUMENTS.find((i) => i.level === activeLevel) || INSTRUMENTS[0];

  const submitMutation = useMutation({
    mutationFn: (payload) =>
      base44.entities.EvaluationResponse.create({
        organization_id: orgId,
        level: activeInstrument.level,
        instrument: activeInstrument.key,
        respondent_email: user?.email || '',
        respondent_name: user?.full_name || '',
        responses: payload.responses,
        open_responses: payload.open_responses,
        evidence_source: payload.evidence_source,
        submitted_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impactResponses', orgId] }),
  });

  const levelResponses = responses.filter((r) => r.level === activeLevel);
  const myResponse = levelResponses.find((r) => r.respondent_email === user?.email);
  const aggregate = aggregateResponses(levelResponses, activeInstrument);
  const alreadyDone = activeInstrument.recordedBy === 'participant' && !!myResponse;

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Assign an organization to run its evaluations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ImpactNav
        title="Evaluation Instruments"
        description="Four short instruments, one per Kirkpatrick level. Level 1 and 2 are answered by participants; Level 3 and 4 are recorded by the coach from evidence."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {INSTRUMENTS.map((instrument) => {
          const count = responses.filter((r) => r.level === instrument.level).length;
          const active = activeLevel === instrument.level;
          return (
            <button
              key={instrument.level}
              type="button"
              onClick={() => setActiveLevel(instrument.level)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Level {instrument.level} · {instrument.stage}
                </span>
                {count > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-semibold text-foreground mt-1">{instrument.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {count > 0 ? `${count} response${count === 1 ? '' : 's'} recorded` : 'Not Yet Measured'}
              </p>
            </button>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Level {activeInstrument.level} — {activeInstrument.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading responses…</p>}

          {alreadyDone ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-900">
                  You submitted this on {myResponse.submitted_date || myResponse.created_date?.slice(0, 10)}
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your answers are recorded. They are shown below for reference and cannot be edited here.
                </p>
              </div>
              <div className="space-y-1.5">
                {activeInstrument.ratings.map((q) => (
                  <div key={q.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{q.label}</span>
                    <Badge variant="outline" className="flex-shrink-0">{myResponse.responses?.[q.key] ?? '—'} / 5</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EvaluationForm
              key={activeInstrument.level}
              instrument={activeInstrument}
              onSubmit={(payload) => submitMutation.mutate(payload)}
              saving={submitMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      {canSeeAggregate && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Aggregate results</CardTitle>
            <p className="text-xs text-muted-foreground">
              Averages only. Individual answers are never shown here, so confidential responses stay confidential.
            </p>
          </CardHeader>
          <CardContent>
            {aggregate.responseCount === 0 ? (
              <p className="text-sm text-muted-foreground">Not Yet Measured — no responses recorded for this level.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-barlow text-2xl font-semibold text-foreground">
                    {aggregate.overall?.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    overall average · {aggregate.responseCount} response{aggregate.responseCount === 1 ? '' : 's'}
                  </span>
                </div>
                {aggregate.rows.map((row) => (
                  <div key={row.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">
                        {row.average === null ? 'Not Yet Measured' : `${row.average.toFixed(2)} / 5`}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${row.average ? (row.average / 5) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canSeeAggregate && activeInstrument.open.length > 0 && levelResponses.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Written feedback</CardTitle>
            <p className="text-xs text-muted-foreground">
              Coach and administrator view. Attribution is withheld from reports.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {levelResponses.map((response, idx) => {
              const answers = activeInstrument.open
                .map((q) => ({ label: q.label, value: response.open_responses?.[q.key] }))
                .filter((a) => a.value);
              if (!answers.length) return null;
              return (
                <div key={response.id} className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Response {idx + 1} · {response.submitted_date || 'date not recorded'}
                  </p>
                  {answers.map((a, i) => (
                    <p key={i} className="text-xs text-foreground">
                      <span className="text-muted-foreground">{a.label}</span> {a.value}
                    </p>
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}