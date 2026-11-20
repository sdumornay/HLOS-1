export const REPORT_TYPES = {
  baseline: {
    label: 'Organizational Impact Baseline Report',
    stage: 'Align',
    blurb: 'Where the organization started: health profile, agreed results and the measurement plan.',
  },
  midpoint: {
    label: 'Midpoint Organizational Progress Report',
    stage: 'Execute',
    blurb: 'What has moved so far, which behaviors are being practiced, and what needs attention.',
  },
  final: {
    label: 'Final Organizational Impact Report',
    stage: 'Sustain',
    blurb: 'Baseline compared with outcomes, behavioral evidence, and recommendations to sustain gains.',
  },
  sustainability_90day: {
    label: '90-Day Sustainability Report',
    stage: 'Sustain',
    blurb: 'Whether the results and new behaviors are holding after the engagement ended.',
  },
};

export const NARRATIVE_SECTIONS = [
  { key: 'executive_summary', heading: 'Executive summary' },
  { key: 'health_changes', heading: 'Changes in organizational health' },
  { key: 'learning_alignment', heading: 'Leadership learning and alignment' },
  { key: 'behavior_evidence', heading: 'Evidence of behavioral change' },
  { key: 'results_progress', heading: 'Progress toward organizational results' },
  { key: 'capacity_gaps', heading: 'Remaining capacity gaps' },
  { key: 'recommendations', heading: 'Recommendations for sustaining improvements' },
  { key: 'follow_up_90_day', heading: '90-day follow-up plan' },
  { key: 'evidence_gaps', heading: 'Evidence gaps and what is not yet measured' },
];

export const REPORT_STATUS = {
  draft: { label: 'Draft', tone: 'secondary' },
  in_review: { label: 'In review', tone: 'outline' },
  approved: { label: 'Approved', tone: 'default' },
};

export const AI_NOTICE =
  'Narrative sections are AI-assisted interpretations of the records below. They are drafts until a coach reviews them.';

/**
 * Builds the PDF section list from a report, its snapshot and the live records.
 * Deterministic data is listed as facts; narrative is labeled as interpretation.
 */
export function buildReportPdfSections({ report, org, agreement, indicators, behaviors }) {
  const sections = [];

  sections.push({
    heading: 'Engagement',
    items: [
      { label: 'Organization', value: org?.name || '—' },
      { label: 'Report type', value: REPORT_TYPES[report.type]?.label || report.type },
      { label: 'Period', value: `${report.period_start || '—'} to ${report.period_end || '—'}` },
      { label: 'Status', value: REPORT_STATUS[report.status]?.label || report.status },
      {
        label: 'Reviewed by',
        value: report.reviewed_by
          ? `${report.reviewed_by}${report.reviewed_date ? ` on ${report.reviewed_date}` : ''}`
          : 'Not yet reviewed by a coach',
      },
    ],
  });

  if (agreement) {
    sections.push({
      heading: 'Agreed success outcomes',
      items: (agreement.priority_results || []).map((r, i) => ({
        label: `Result ${i + 1}${r.owner ? ` — owner: ${r.owner}` : ''}`,
        value: `${r.result || '—'} | Baseline: ${r.baseline || 'Not yet measured'} | Target: ${r.target || '—'}${
          r.target_date ? ` by ${r.target_date}` : ''
        }`,
      })),
    });
    if (agreement.barriers) {
      sections.push({ heading: 'Known barriers', items: [{ value: agreement.barriers }] });
    }
  }

  sections.push({
    heading: 'Indicator measurements',
    table: {
      headers: ['Indicator', 'Baseline', 'Current', 'Target', 'Source'],
      rows: indicators.map((i) => [
        i.name,
        i.baseline_value ?? 'Not yet measured',
        i.actual_value ?? 'Not yet measured',
        i.target_value ?? '—',
        i.actual_source || i.baseline_source || '—',
      ]),
    },
  });

  if (behaviors.length) {
    sections.push({
      heading: 'Leadership behaviors',
      table: {
        headers: ['Behavior', 'Owner', 'Status', 'Reviewed'],
        rows: behaviors.map((b) => [b.description, b.owner_name || '—', b.status, b.date_reviewed || '—']),
      },
    });
  }

  NARRATIVE_SECTIONS.forEach((s) => {
    const text = report.narrative?.[s.key];
    if (text) sections.push({ heading: s.heading, items: [{ value: text }] });
  });

  sections.push({
    heading: 'Attribution',
    items: [
      {
        value:
          'Results describe change observed between the baseline and the latest measurement. They are not proof that coaching caused the change; other factors are noted where evidence exists.',
      },
    ],
  });

  return sections;
}