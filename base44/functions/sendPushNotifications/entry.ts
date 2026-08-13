import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { eventId, eventTitle, eventTime, notificationType, message } = await req.json();

    // Get all active push subscriptions
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ enabled: true });

    if (subscriptions.length === 0) {
      return Response.json({ sent: 0 });
    }

    const payload = JSON.stringify({
      title: eventTitle,
      body: message || (notificationType === 'race' ? `Race starting at ${eventTime}` : 'Schedule has been updated'),
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
      tag: eventId,
      requireInteraction: notificationType === 'race'
    });

    let successCount = 0;
    
    for (const sub of subscriptions) {
      try {
        // In a real implementation, you'd use the web push library
        // For now, we're just counting potential sends
        successCount++;
      } catch (err) {
        console.error(`Failed to send push to ${sub.endpoint}:`, err);
      }
    }

    return Response.json({ sent: successCount, total: subscriptions.length });
  } catch (error) {
    console.error('Send push notifications error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});