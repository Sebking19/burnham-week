import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const [reminders, allEvents] = await Promise.all([
      base44.asServiceRole.entities.EventReminder.filter({ reminder_sent: false }),
      base44.asServiceRole.entities.Event.list()
    ]);

    const eventMap = Object.fromEntries(allEvents.map(e => [e.id, e]));

    const tasks = reminders
      .map(reminder => ({ reminder, event: eventMap[reminder.event_id] }))
      .filter(({ event }) => !!event)
      .map(({ reminder, event }) =>
        Promise.all([
          base44.asServiceRole.functions.invoke('createNotification', {
            user_email: reminder.user_email,
            type: 'event_mention',
            title: `Reminder: ${event.title}`,
            message: `Your event "${event.title}" is happening in 1 hour${event.time ? ` at ${event.time}` : ''}${event.location ? ` in ${event.location}` : ''}.`,
            related_id: event.id,
            related_type: 'event',
            read: false
          }),
          base44.asServiceRole.entities.EventReminder.update(reminder.id, { reminder_sent: true })
        ])
      );

    await Promise.all(tasks);

    return Response.json({ success: true, remindersSent: tasks.length });
  } catch (error) {
    console.error('sendEventReminders error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});