import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const announcement = payload.data;
    const event = payload.event;

    if (!announcement || event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    // Fetch all registered users (paginated)
    const allUsers = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('', 100, skip);
      allUsers.push(...batch);
      if (batch.length < 100) break;
      skip += 100;
    }

    const authorEmail = announcement.created_by || '';
    const recipients = allUsers.filter(u => u.email && u.email !== authorEmail && u.role && u.role !== 'user');

    if (recipients.length === 0) {
      return Response.json({ sent: 0 });
    }

    const title = 'New Notice: ' + (announcement.title || 'Club update');
    const message = (announcement.content || '').slice(0, 140);

    await base44.asServiceRole.entities.Notification.bulkCreate(
      recipients.map(u => ({
        user_email: u.email,
        type: 'announcement',
        title,
        message,
        related_id: event.entity_id,
        related_type: 'announcement',
        read: false,
      }))
    );

    return Response.json({ sent: recipients.length });
  } catch (error) {
    console.error('notifyOnAnnouncement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});