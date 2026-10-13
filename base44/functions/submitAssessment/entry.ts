import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The standalone Quick Health Check has been archived. It was redundant with
    // the Leadership Health Scoreboard (baseline). Historical Assessment records
    // are preserved, but new standalone submissions are no longer accepted.
    // Use submitScoreboard for the baseline.
    return Response.json({
      error: 'The Quick Health Check has been archived. Please use the Leadership Health Scoreboard for health assessments.',
      archived: true,
    }, { status: 403 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}