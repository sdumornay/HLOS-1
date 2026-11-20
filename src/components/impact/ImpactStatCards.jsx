import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const TREND_STYLES = {
  up: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  down: 'border-rose-200 bg-rose-50 text-rose-800',
  flat: 'border-border bg-muted text-muted-foreground',
};

function TrendIcon({ dir }) {
  if (dir === 'up') return <TrendingUp className="h-3.5 w-3.5" />;
  if (dir === 'down') return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

/**
 * Expandable metric cards: a label chip, a circular toggle, a large value with
 * its unit, a progress track against target and a trend chip.
 */
export default function ImpactStatCards({ cards = [] }) {
  const [openId, setOpenId] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && cards.length > 0) {
      initialized.current = true;
      setOpenId(cards[0].id);
    }
  }, [cards]);

  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {cards.map((card) => {
        const isOpen = openId === card.id;
        const pct = card.pct ?? 0;
        const trendStyle = TREND_STYLES[card.trend?.dir || 'flat'];

        return (
          <div
            key={card.id}
            className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <div
              className={cn(
                'relative p-4 transition-all duration-500',
                isOpen && 'sm:p-5'
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.04] via-transparent to-secondary/[0.05]"
              />
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : card.id)}
                aria-expanded={isOpen}
                className="relative flex w-full items-center gap-3 text-left"
              >
                <span className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[13px] font-medium text-primary truncate">
                  {card.label}
                </span>
                <span
                  className={cn(
                    'ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-foreground transition-transform duration-500'
                  )}
                  style={{ transform: isOpen ? 'rotate(135deg)' : 'none' }}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>

              <div
                className={cn(
                  'relative grid transition-all duration-500 ease-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <div className="pt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-barlow text-4xl font-light tracking-tight tabular-nums text-foreground">
                        {card.value}
                      </span>
                      {card.unit && (
                        <span className="text-sm text-muted-foreground">{card.unit}</span>
                      )}
                    </div>

                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        <strong className="font-semibold text-foreground">
                          {card.pct == null ? '—' : `${card.pct}%`}
                        </strong>{' '}
                        {card.goalText}
                      </span>
                      {card.trend && (
                        <span
                          className={cn(
                            'ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                            trendStyle
                          )}
                        >
                          <TrendIcon dir={card.trend.dir} />
                          {card.trend.text}
                          {card.trend.period && (
                            <span className="font-normal opacity-70">{card.trend.period}</span>
                          )}
                        </span>
                      )}
                    </div>

                    {card.note && (
                      <p className="mt-2 text-xs text-muted-foreground">{card.note}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}