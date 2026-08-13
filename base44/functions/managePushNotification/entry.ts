import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, DELETE' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, subscription, eventId, eventTitle, eventTime, type } = await req.json();

    if (action === 'subscribe') {
      // Save push subscription
      const existing = await base44.entities.PushSubscription.filter({
        user_email: user.email,
        endpoint: subscription.endpoint
      });

      if (existing.length === 0) {
        await base44.entities.PushSubscription.create({
          user_email: user.email,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          enabled: true
        });
      }

      return Response.json({ success: true });
    } else if (action === 'unsubscribe') {
      const subs = await base44.entities.PushSubscription.filter({
        user_email: user.email,
        endpoint: subscription.endpoint
      });

      if (subs.length > 0) {
        await base44.entities.PushSubscription.delete(subs[0].id);
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});