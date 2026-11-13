import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Gavel } from 'lucide-react';
import DecisionDetailDialog from './DecisionDetailDialog';
import './decisionsTable.css';

const PER_PAGE = 8;
const STATUS_ORDER = { active: 0, reversed: 1, superseded: 2 };
const IMPACT_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
const STATUS_LABEL = { active: 'Active', reversed: 'Reversed', superseded: 'Superseded' };
const IMPACT_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const CATEGORY_LABEL = {
  financial: 'Financial', staffing: 'Staffing', ministry: 'Ministry', strategy: 'Strategy',
  operations: 'Operations', communications: 'Communications', other: 'Other',
};

const FILTERS = [
  {
    key: 'all', label: 'All',
    accent: '#94a3b8',
    fill: 'linear-gradient(180deg, #3b4a63 0%, #1e2b40 100%)',
    ink: '#f5f7fa',
    cap: '#f5b52a',
    capInk: '#10244c',
  },
  {
    key: 'active', label: 'Active',
    accent: '#10b981',
    fill: 'linear-gradient(180deg, #34d399 0%, #a7f3d0 100%)',
    ink: '#04331f',
  },
  {
    key: 'reversed', label: 'Reversed',
    accent: '#e11d48',
    fill: 'linear-gradient(180deg, #fb7185 0%, #fecdd3 100%)',
    ink: '#4c0519',
  },
  {
    key: 'superseded', label: 'Superseded',
    accent: '#64748b',
    fill: 'linear-gradient(180deg, #94a3b8 0%, #e2e8f0 100%)',
    ink: '#0f172a',
  },
];

const SORT_COLUMNS = [
  { key: 'order', label: 'Date', className: 'dl-th--order' },
  { key: 'key', label: 'Decision', className: 'dl-th--dec' },
  { key: 'customer', label: 'Made by', className: 'dl-th--cust' },
  { key: 'email', label: 'Category', className: 'dl-th--email' },
  { key: 'total', label: 'Impact', className: 'dl-th--total' },
  { key: 'status', label: 'Status', className: 'dl-th--status' },
];

function SortMark() {
  return (
    <svg className="dl-sort-ind" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'MMM d, yyyy');
}

function initials(name) {
  if (!name) return '—';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function DecisionsTable({ decisions = [], isLoading = false }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'order', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState([]);
  const [detail, setDetail] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [entering, setEntering] = useState(true);

  const toastTimer = useRef(null);
  const wrapRef = useRef(null);
  const markerRef = useRef(null);
  const markerY = useRef(0);
  const selectAllRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const records = useMemo(() => decisions.map((d) => {
    const ts = new Date(d.date || d.created_date || 0).getTime();
    return {
      ...d,
      _ts: Number.isNaN(ts) ? 0 : ts,
      _impactRank: IMPACT_RANK[d.impact] || 0,
      _statusRank: STATUS_ORDER[d.status] ?? 3,
    };
  }), [decisions]);

  const counts = useMemo(() => ({
    all: records.length,
    active: records.filter((r) => r.status === 'active').length,
    reversed: records.filter((r) => r.status === 'reversed').length,
    superseded: records.filter((r) => r.status === 'superseded').length,
  }), [records]);

  const list = useMemo(() => {
    const filtered = records.filter((r) => statusFilter === 'all' || r.status === statusFilter);
    const dir = sort.dir === 'asc' ? 1 : -1;
    const valueOf = (r) => {
      switch (sort.key) {
        case 'order': return r._ts;
        case 'total': return r._impactRank;
        case 'status': return r._statusRank;
        case 'customer': return (r.made_by || '').toLowerCase();
        case 'email': return (r.category || '').toLowerCase();
        default: return (r.decision || '').toLowerCase();
      }
    };
    return [...filtered].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [records, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageRows = list.slice(start, start + PER_PAGE);
  const hasAny = records.length > 0;
  const showTable = !isLoading && list.length > 0;

  const pageIds = pageRows.map((r) => r.id);
  const visiblePicked = pageIds.filter((id) => picked.includes(id)).length;
  const allSelected = pageIds.length > 0 && visiblePicked === pageIds.length;
  const someSelected = visiblePicked > 0 && visiblePicked < pageIds.length;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const hideMarker = () => {
    if (markerRef.current) markerRef.current.dataset.on = '0';
    markerY.current = 0;
  };

  useEffect(() => { hideMarker(); }, [page, statusFilter, sort.key, sort.dir]);

  /* The single highlight band that follows the pointer from row to row. */
  const handlePointerOver = (e) => {
    const row = e.target.closest?.('[data-dl-row]');
    const wrap = wrapRef.current;
    const marker = markerRef.current;
    if (!row || !wrap || !marker) return;

    const wrapRect = wrap.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const y = rowRect.top - wrapRect.top - wrap.clientTop;
    const wasOn = marker.dataset.on === '1';
    const dist = wasOn ? Math.abs(y - markerY.current) : 0;

    marker.style.setProperty('--dl-marker-dur', `${Math.round(Math.min(520, Math.max(190, 150 + dist * 0.45)))}ms`);
    if (!wasOn) marker.style.transition = 'none';
    marker.style.height = `${rowRect.height}px`;
    marker.style.translate = `0 ${y}px`;
    if (!wasOn) {
      void marker.offsetWidth;
      marker.style.transition = '';
    }
    markerY.current = y;
    marker.dataset.on = '1';
  };

  const sortBy = (key) => {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: key === 'order' || key === 'total' ? 'desc' : 'asc' };
    });
    setPage(1);
  };

  const togglePick = (id) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setPicked((prev) => (allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]));
  };

  /* Real CSV download — the footer/selection scope decides which rows go out. */
  const exportCsv = (rows, scope) => {
    if (!rows.length) {
      showToast(scope === 'selected' ? 'Select decisions to export' : 'Nothing to export');
      return;
    }
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['Date', 'Decision', 'Question', 'Made by', 'Participants', 'Category', 'Impact', 'Status', 'Affected teams', 'Resulting actions', 'Review date', 'Context'];
    const lines = rows.map((r) => [
      r.date || '',
      r.decision || '',
      r.issue_question || '',
      r.made_by || '',
      r.participants || '',
      CATEGORY_LABEL[r.category] || r.category || '',
      IMPACT_LABEL[r.impact] || r.impact || '',
      STATUS_LABEL[r.status] || r.status || '',
      r.affected_teams || '',
      r.resulting_actions || '',
      r.review_date || '',
      r.context || '',
    ].map(quote).join(','));
    const csv = [header.map(quote).join(','), ...lines].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `decision-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast(`${rows.length} ${rows.length === 1 ? 'decision' : 'decisions'} exported`);
  };

  const meterPct = list.length ? (((start + pageRows.length) / list.length) * 100).toFixed(1) : 0;

  return (
    <section className="dl-section" data-dl-marker="" {...(entering ? { 'data-dl-enter': '' } : {})}>
      <div className="dl-card" data-dl-bulk={picked.length ? 'on' : 'off'}>
        <div className="dl-shell" data-dl-toast={toastMsg ? 'on' : 'off'}>

          <div className="dl-head">
            <div className="dl-titles">
              <h2 className="dl-title">All decisions</h2>
              <p className="dl-meta">
                {records.length} {records.length === 1 ? 'decision' : 'decisions'} &middot; {PER_PAGE} per page
              </p>
            </div>
            <span className="dl-export">
              <button type="button" className="dl-btn dl-btn--beam" onClick={() => exportCsv(list, 'filtered')}>
                <span className="dl-beam-track" aria-hidden="true"><span className="dl-beam" /></span>
                Export CSV
              </button>
            </span>
          </div>

          <div className="dl-toolwrap">
            <div className="dl-tools">
              <div className="dl-chips" role="group" aria-label="Filter decisions by status">
                {FILTERS.map((filter, i) => (
                  <button
                    key={filter.key}
                    type="button"
                    className="dl-fcard"
                    data-dl-filter={filter.key}
                    aria-pressed={statusFilter === filter.key}
                    onClick={() => { setStatusFilter(filter.key); setPage(1); }}
                    style={{
                      '--dl-i': i,
                      '--dl-fc': filter.accent,
                      '--dl-fc-fill': filter.fill,
                      '--dl-fc-ink': filter.ink,
                      '--dl-fc-cap': filter.cap,
                      '--dl-fc-cap-ink': filter.capInk,
                    }}
                  >
                    <span className="dl-fcard-dot" aria-hidden="true" />
                    <span className="dl-fcard-name">{filter.label}</span>
                    <span className="dl-fcard-n">{counts[filter.key]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dl-bulk" aria-live="polite">
              <span className="dl-bulk-n">{picked.length} selected</span>
              <span className="dl-spacer" />
              <button type="button" className="dl-btn dl-btn--ghost" onClick={() => setPicked([])}>Clear</button>
              <button
                type="button"
                className="dl-btn dl-btn--primary dl-btn--beam"
                onClick={() => exportCsv(records.filter((r) => picked.includes(r.id)), 'selected')}
              >
                <span className="dl-beam-track" aria-hidden="true"><span className="dl-beam" /></span>
                Export selected
              </button>
            </div>
          </div>

          <div
            className="dl-tablewrap"
            ref={wrapRef}
            onPointerOver={handlePointerOver}
            onPointerLeave={hideMarker}
          >
            <div className="dl-marker" ref={markerRef} aria-hidden="true" />

            <div className="dl-zone">
              {isLoading && (
                <div className="dl-skel" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="dl-skel-row" />)}
                </div>
              )}

              <table className="dl-table" hidden={!showTable}>
                <thead className="dl-thead">
                  <tr>
                    <th className="dl-th dl-th--pick" scope="col">
                      <label className="dl-check">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="dl-check-input"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Select all decisions on this page"
                        />
                        <span className="dl-check-box" aria-hidden="true"><Check className="dl-check-icon" /></span>
                      </label>
                    </th>
                    {SORT_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`dl-th ${col.className}`}
                        scope="col"
                        aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                      >
                        <button type="button" className="dl-sort" onClick={() => sortBy(col.key)}>
                          {col.label} <SortMark />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="dl-tbody">
                  {pageRows.map((r, i) => {
                    const selected = picked.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className="dl-row"
                        data-dl-row=""
                        data-dl-sel={selected ? '1' : '0'}
                        data-id={r.id}
                        data-order={r._ts}
                        data-customer={(r.made_by || '').toLowerCase()}
                        data-email={r.category || ''}
                        data-total={r._impactRank}
                        data-status={r.status || 'active'}
                        style={{ '--dl-i': i }}
                        onClick={(e) => {
                          if (e.target.closest('.dl-check')) return;
                          setDetail(r);
                        }}
                      >
                        <td className="dl-cell dl-cell--pick">
                          <span className="dl-rowline" aria-hidden="true" />
                          <label className="dl-check">
                            <input
                              type="checkbox"
                              className="dl-check-input"
                              checked={selected}
                              onChange={() => togglePick(r.id)}
                              aria-label={`Select decision: ${r.decision || 'untitled'}`}
                            />
                            <span className="dl-check-box" aria-hidden="true"><Check className="dl-check-icon" /></span>
                          </label>
                        </td>
                        <td className="dl-cell dl-cell--order">
                          <span className="dl-date">{formatDate(r.date || r.created_date)}</span>
                        </td>
                        <td className="dl-cell dl-cell--dec">
                          <button type="button" className="dl-decision" title={r.decision}>{r.decision}</button>
                        </td>
                        <td className="dl-cell dl-cell--cust">
                          <span className="dl-avatar" aria-hidden="true">{initials(r.made_by)}</span>
                          <span className="dl-name">{r.made_by || 'Unattributed'}</span>
                        </td>
                        <td className="dl-cell dl-cell--email">
                          <span className="dl-cat">{CATEGORY_LABEL[r.category] || '—'}</span>
                        </td>
                        <td className="dl-cell dl-cell--total">
                          <span className={`dl-impact dl-impact--${r.impact || 'medium'}`}>
                            {IMPACT_LABEL[r.impact] || 'Medium'}
                          </span>
                        </td>
                        <td className="dl-cell dl-cell--status">
                          <span className={`dl-badge dl-badge--${r.status || 'active'}`}>
                            {STATUS_LABEL[r.status] || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!isLoading && list.length === 0 && (
                <div className="dl-empty">
                  <span className="dl-empty-ico"><Gavel /></span>
                  <span className="dl-empty-t">
                    {hasAny ? 'No decisions match this filter' : 'No decisions logged yet'}
                  </span>
                  <p className="dl-empty-p">
                    {hasAny
                      ? 'Try another status, or choose All to see every decision on record.'
                      : 'Decisions recorded during your meetings appear here, together with the commitments that followed them.'}
                  </p>
                  {!hasAny && <Link className="dl-empty-link" to="/execute">Record a decision in Execute</Link>}
                </div>
              )}
            </div>
          </div>

          <div className="dl-foot" hidden={!showTable}>
            <div className="dl-range">
              {list.length ? `Showing ${pageRows.length} of ${list.length}` : 'No decisions to show'}
            </div>
            <div className="dl-meter" aria-hidden="true">
              <span className="dl-meter-fill" style={{ width: `${meterPct}%` }} />
            </div>
            <div className="dl-pager">
              <button
                type="button"
                className="dl-page"
                data-dl-prev=""
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft />
              </button>
              {pageNumbers.map((n, idx) => (
                <React.Fragment key={n}>
                  {idx > 0 && n - pageNumbers[idx - 1] > 1 && <span className="dl-page-gap" aria-hidden="true">&hellip;</span>}
                  <button
                    type="button"
                    className="dl-page"
                    data-dl-page={n}
                    aria-current={n === currentPage ? 'page' : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                </React.Fragment>
              ))}
              <button
                type="button"
                className="dl-page"
                data-dl-next=""
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="dl-toast" role="status" aria-live="polite">
            <Check />
            <span>{toastMsg || 'Exported'}</span>
          </div>
        </div>
      </div>

      <DecisionDetailDialog decision={detail} onClose={() => setDetail(null)} />
    </section>
  );
}