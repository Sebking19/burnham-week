import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    // Signed-in callers must be admins; unauthenticated calls come from the workflow.
    if (user && user.role !== 'admin' && user.role !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const classes = Array.isArray(body.classes) ? body.classes.filter(Boolean) : [];
    if (!classes.length) return Response.json({ ok: true, sent: 0, reason: 'no new results' });

    const list = classes.slice(0, 3).join(', ');
    const extra = classes.length > 3 ? ` and ${classes.length - 3} more` : '';

    const users = await base44.asServiceRole.entities.User.list();
    const recipients = users.filter((u) => u.notify_results !== false);

    let sent = 0;
    const failures = [];
    for (const u of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: u.id,
          title: 'New race results are in',
          content: `Updated standings for ${list}${extra}.`,
          action_label: 'See my results',
          action_url: '/MyResults',
        });
        sent++;
      } catch (e) {
        failures.push({ user_id: u.id, error: e.message });
      }
    }

    return Response.json({ ok: true, sent, total: recipients.length, failures });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}