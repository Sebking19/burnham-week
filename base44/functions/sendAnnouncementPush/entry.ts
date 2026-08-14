import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getFcmAuth, sendFcmMessage } from '../../shared/fcm.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // When a person triggers this directly (e.g. a test send), only admins may do it.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_e) {
      user = null;
    }
    if (user && user.role !== 'admin' && user.role !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let title = body.title;
    let message = body.message;

    if ((!title || !message) && body.announcement_id) {
      const a = await base44.asServiceRole.entities.Announcement.get(body.announcement_id);
      title = title || a?.title;
      message = message || a?.content;
    }

    if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });

    const short = (message || '').replace(/\s+/g, ' ').trim().slice(0, 180);

    const users = await base44.asServiceRole.entities.User.list();
    const recipients = users.filter((u) => u.notify_announcements !== false);

    let sent = 0;
    const failures = [];
    for (const u of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: u.id,
          title: title,
          content: short || 'Open the app to read the latest notice.',
          action_label: 'Read notice',
          action_url: '/Notices',
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
          await sendFcmMessage(
            auth,
            t.token,
            title,
            short || 'Open the app to read the latest notice.',
            { url: '/Notices' }
          );
          fcmSent++;
        } catch (e) {
          if (e.unregistered) {
            await base44.asServiceRole.entities.DeviceToken.delete(t.id);
          }
          fcmFailures.push({ token_id: t.id, error: e.message });
        }
      }
    }

    return Response.json({ sent, total: recipients.length, failures, fcmSent, fcmFailures });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}