import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId } = await req.json();
    if (!organizationId) return Response.json({ error: 'Missing organizationId' }, { status: 400 });

    const [actions, assessments, sessions, users, existingNotifications] = await Promise.all([
      base44.asServiceRole.entities.Action.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.Assessment.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.Session.filter({ organization_id: organizationId }),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Notification.filter({ organization_id: organizationId }),
    ]);

    const orgUsers = users.filter(u => u.organization_id === organizationId || u.data?.organization_id === organizationId);
    const leadPastor = orgUsers.find(u => (u.role || u.data?.role) === 'lead_pastor') || orgUsers[0];
    const leadEmail = leadPastor?.email || user.email;

    const toCreate = [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const exists = (type, relatedId) => existingNotifications.some(n => n.type === type && n.related_id === relatedId);

    // 1. Overdue actions → notify owner
    actions.forEach(action => {
      if (action.status !== 'completed' && action.due_date && new Date(action.due_date) < now) {
        if (!exists('overdue_action', action.id) && action.owner_email) {
          toCreate.push({
            user_email: action.owner_email,
            type: 'overdue_action',
            title: `Overdue: ${action.title}`,
            message: `This action was due ${action.due_date}. Please update its status.`,
            related_id: action.id,
            organization_id: organizationId,
            link: '/actions',
          });
        }
      }
    });

    // 2. Health decline → notify lead pastor
    if (assessments.length >= 2) {
      const sorted = [...assessments].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const latest = sorted[0];
      const prev = sorted[1];
      if (latest.overall_health != null && prev.overall_health != null && latest.overall_health < prev.overall_health - 1) {
        if (!exists('health_decline', latest.id)) {
          toCreate.push({
            user_email: leadEmail,
            type: 'health_decline',
            title: 'Health Score Declined',
            message: `Team health dropped from ${prev.overall_health.toFixed(1)} to ${latest.overall_health.toFixed(1)}.`,
            related_id: latest.id,
            organization_id: organizationId,
            link: '/assessments',
          });
        }
      }
    }

    // 3. Session reminders (within 7 days) → notify attendees
    sessions.forEach(session => {
      if (session.date) {
        const sessionDate = new Date(session.date);
        if (sessionDate >= now && sessionDate <= sevenDaysFromNow) {
          if (!exists('session_reminder', session.id) && session.attendees?.length > 0) {
            session.attendees.forEach(email => {
              toCreate.push({
                user_email: email,
                type: 'session_reminder',
                title: `Upcoming: ${session.title}`,
                message: `Session scheduled for ${session.date}.`,
                related_id: session.id,
                organization_id: organizationId,
                link: '/sessions',
              });
            });
          }
        }
      }
    });

    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(toCreate);
    }

    return Response.json({ created: toCreate.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}