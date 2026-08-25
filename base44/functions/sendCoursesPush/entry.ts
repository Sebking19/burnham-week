import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getFcmAuth, sendFcmMessage } from '../../shared/fcm.ts';

const TITLE = 'Race courses updated';
const BODY = 'New course information has been published for Burnham Week.';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Signed-in callers must be admins; unauthenticated calls come from the workflow.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (user && user.role !== 'admin' && user.role !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const recipients = users.filter((u) => u.notify_announcements !== false);

    let sent = 0;
    const failures = [];
    for (const u of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: u.id,
          title: TITLE,
          content: BODY,
          action_label: 'View courses',
          action_url: '/Info',
        });
        sent++;
      } catch (e) {
        failures.push({ user_id: u.id, error: e.message });
      }
    }

    // Also send via FCM HTTP v1 to devices registered by the Capacitor wrapper
    let fcmSent = 0;
    const fcmFailures = [];
    const tokens = await base44.asServiceRole.entities.DeviceToken.list();
    if (tokens.length > 0) {
      const optedOut = new Set(
        users.filter((u) => u.notify_announcements === false).map((u) => u.email)
      );
      const auth = await getFcmAuth();
      for (const t of tokens) {
        if (t.user_email && optedOut.has(t.user_email)) continue;
        try {
          await sendFcmMessage(auth, t.token, TITLE, BODY, { url: '/Info' });
          fcmSent++;
        } catch (e) {
          if (e.unregistered) {
            await base44.asServiceRole.entities.DeviceToken.delete(t.id);
          }
          fcmFailures.push({ token_id: t.id, error: e.message });
        }
      }
    }

    return Response.json({ ok: true, sent, total: recipients.length, failures, fcmSent, fcmFailures });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}