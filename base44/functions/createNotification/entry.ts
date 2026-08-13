import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'admiral', 'owner', 'chairman'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { user_email, type, title, message, related_id, related_type } = body;

    if (!user_email || !type || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      type,
      title,
      message,
      related_id: related_id || null,
      related_type: related_type || null,
      read: false,
    });

    return Response.json(notification);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});