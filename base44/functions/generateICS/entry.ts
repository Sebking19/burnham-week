import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { eventId } = await req.json();

    if (!eventId) {
      return Response.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const event = await base44.asServiceRole.entities.Event.filter({ id: eventId });
    if (!event || event.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const evt = event[0];
    
    // Parse date and time
    const [year, month, day] = evt.date.split('-');
    const dateObj = new Date(`${year}-${month}-${day}T00:00:00Z`);
    
    // Format date as YYYYMMDD
    const icsDate = dateObj.toISOString().split('T')[0].replace(/-/g, '');
    
    // Parse time if available
    let startDateTime = icsDate;
    let endDateTime = icsDate;
    
    if (evt.time) {
      const timeMatch = evt.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2];
        const period = timeMatch[3]?.toUpperCase();
        
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const hourStr = String(hour).padStart(2, '0');
        startDateTime = `${icsDate}T${hourStr}${minute}00Z`;
        endDateTime = `${icsDate}T${String(hour + 1).padStart(2, '0')}${minute}00Z`;
      }
    }
    
    // Create ICS content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Otters App//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${evt.id}@ottersapp
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${evt.title}
DESCRIPTION:${evt.info || evt.type}${evt.location ? `\nLocation: ${evt.location}` : ''}
LOCATION:${evt.location || ''}
CATEGORIES:${evt.type}
END:VEVENT
END:VCALENDAR`;

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${evt.title.replace(/\s+/g, '_')}.ics"`,
      },
    });
  } catch (error) {
    console.error('ICS generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});