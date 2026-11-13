import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const DOCS_API = 'https://docs.googleapis.com/v1/documents';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const CATEGORY_LABELS: Record<string, string> = {
  financial: 'Financial',
  staffing: 'Staffing',
  ministry: 'Ministry',
  strategy: 'Strategy',
  operations: 'Operations',
  communications: 'Communications',
  other: 'Other',
};

function buildBlocks(orgName: string, decisions: any[]) {
  const blocks: { text: string; style: string }[] = [];
  const synced = new Date().toISOString().slice(0, 10);

  blocks.push({ text: `Decision Log — ${orgName}\n`, style: 'TITLE' });
  blocks.push({
    text: `${decisions.length} decision${decisions.length === 1 ? '' : 's'} · last updated ${synced}\n`,
    style: 'SUBTITLE',
  });

  if (decisions.length === 0) {
    blocks.push({ text: '\nNo decisions have been logged yet.\n', style: 'NORMAL_TEXT' });
    return blocks;
  }

  for (const d of decisions) {
    const meta = [
      d.date || '',
      CATEGORY_LABELS[d.category] || d.category || '',
      d.impact ? `${d.impact} impact` : '',
      d.status || '',
    ].filter(Boolean).join(' · ');
    blocks.push({ text: `${meta}\n`, style: 'HEADING_2' });
    blocks.push({ text: `${d.decision || ''}\n`, style: 'NORMAL_TEXT' });

    const details: string[] = [];
    if (d.issue_question) details.push(`Issue / question: ${d.issue_question}`);
    if (d.made_by) {
      details.push(`Decided by: ${d.made_by}${d.participants ? ` · with ${d.participants}` : ''}`);
    }
    if (d.context) details.push(`Rationale: ${d.context}`);
    if (d.affected_teams) details.push(`Affects: ${d.affected_teams}`);
    if (d.resulting_actions) details.push(`Commitments: ${d.resulting_actions}`);
    if (d.review_date) details.push(`Review by: ${d.review_date}`);
    if (d.notes) details.push(`Notes: ${d.notes}`);

    for (const line of details) {
      blocks.push({ text: `${line}\n`, style: 'NORMAL_TEXT' });
    }
    blocks.push({ text: '\n', style: 'NORMAL_TEXT' });
  }

  return blocks;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const orgId = body?.organization_id || user.organization_id;
    if (!orgId) return Response.json({ error: 'organization_id is required' }, { status: 400 });

    const isStaff = ['super_admin', 'admin', 'coach'].includes(user.role);
    if (!isStaff && user.organization_id !== orgId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await base44.asServiceRole.entities.Organization
      .get(orgId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 });

    const page = await base44.asServiceRole.entities.DecisionLog
      .filter({ organization_id: orgId }, { sort: '-date', limit: 200 });
    const decisions = page?.items || [];

    const blocks = buildBlocks(org.name || 'Organization', decisions);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    if (!accessToken) return Response.json({ error: 'Google Drive is not connected' }, { status: 400 });

    const authHeaders = { Authorization: `Bearer ${accessToken}` };
    let docId: string = org.decision_log_doc_id || '';

    if (!docId) {
      const created = await fetch(DOCS_API, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Decision Log — ${org.name}` }),
        signal: AbortSignal.timeout(20000),
      });
      if (!created.ok) {
        return Response.json({ error: `Google Docs: ${await created.text()}` }, { status: 502 });
      }
      const createdDoc = await created.json();
      docId = createdDoc.documentId;

      // Link sharing so the team can open the record without being added individually.
      await fetch(`${DRIVE_API}/${docId}/permissions`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        signal: AbortSignal.timeout(20000),
      });
    }

    const docRes = await fetch(`${DOCS_API}/${docId}`, {
      headers: authHeaders,
      signal: AbortSignal.timeout(20000),
    });
    if (!docRes.ok) {
      const detail = await docRes.text();
      if (docRes.status === 404) {
        return Response.json({ error: `Google Doc no longer exists: ${detail}` }, { status: 502 });
      }
      return Response.json({ error: `Google Docs: ${detail}` }, { status: 502 });
    }
    const doc = await docRes.json();
    const content = doc?.body?.content || [];
    const endIndex = content.length ? content[content.length - 1].endIndex : 2;

    const text = blocks.map((b) => b.text).join('');
    const requests: any[] = [];
    if (endIndex > 2) {
      requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } });
    }
    requests.push({ insertText: { location: { index: 1 }, text } });

    let cursor = 1;
    for (const block of blocks) {
      const start = cursor;
      const end = cursor + block.text.length;
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: end },
          paragraphStyle: { namedStyleType: block.style },
          fields: 'namedStyleType',
        },
      });
      cursor = end;
    }

    const updated = await fetch(`${DOCS_API}/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
      signal: AbortSignal.timeout(30000),
    });
    if (!updated.ok) {
      return Response.json({ error: `Google Docs: ${await updated.text()}` }, { status: 502 });
    }

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
    const syncedDate = new Date().toISOString();
    await base44.asServiceRole.entities.Organization.update(orgId, {
      decision_log_doc_id: docId,
      decision_log_doc_url: docUrl,
      decision_log_synced_date: syncedDate,
    });

    return Response.json({
      doc_id: docId,
      url: docUrl,
      synced_date: syncedDate,
      entry_count: decisions.length,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}