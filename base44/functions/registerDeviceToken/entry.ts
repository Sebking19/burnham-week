import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Called by the Capacitor wrapper (via the logged-in webview session) to
// register or refresh this device's FCM token.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = (body.token || '').trim();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const platform = body.platform === 'android' ? 'android' : 'ios';
    const now = new Date().toISOString();

    const existing = await base44.asServiceRole.entities.DeviceToken.filter({ token });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.DeviceToken.update(existing[0].id, {
        user_email: user.email,
        platform,
        last_registered_at: now,
      });
      return Response.json({ ok: true, updated: true });
    }

    await base44.asServiceRole.entities.DeviceToken.create({
      token,
      user_email: user.email,
      platform,
      last_registered_at: now,
    });
    return Response.json({ ok: true, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}