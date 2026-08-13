import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@18.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get the base44 client for service-level operations
    const base44 = createClientFromRequest(req);

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.customer_email || session.metadata?.user_email;
      const eventId = session.metadata?.event_id;
      const ticketCount = parseInt(session.metadata?.ticket_count || '0');

      if (eventId && userEmail) {
        // Event payment - mark RSVP as paid
        const rsvps = await base44.asServiceRole.entities.RSVP.filter({
          event_id: eventId,
          user_email: userEmail,
        });

        if (rsvps.length > 0) {
          for (const rsvp of rsvps) {
            await base44.asServiceRole.entities.RSVP.update(rsvp.id, { paid: true });
          }
        }
      } else if (session.metadata?.type === 'car_wash') {
        // Car wash payment - mark booking as paid
        const carWashBookings = await base44.asServiceRole.entities.CarWashBooking.filter({
          stripe_session_id: session.id,
        });
        if (carWashBookings.length > 0) {
          const updates = { paid: true };
          if (session.metadata?.car_size) updates.car_size = session.metadata.car_size;
          await base44.asServiceRole.entities.CarWashBooking.update(carWashBookings[0].id, updates);
        }
      } else if (ticketCount > 0) {
        // Otter Week tickets
        const existingTickets = await base44.asServiceRole.entities.OtterWeekTicket.filter({
          buyer_email: userEmail,
          stripe_session_id: session.id,
        });

        if (existingTickets.length === 0) {
          await base44.asServiceRole.entities.OtterWeekTicket.create({
            buyer_email: userEmail,
            quantity: ticketCount,
            paid: true,
            stripe_session_id: session.id,
          });
        } else {
          await base44.asServiceRole.entities.OtterWeekTicket.update(existingTickets[0].id, {
            paid: true,
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});