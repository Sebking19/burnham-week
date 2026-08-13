import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@18.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tickets, totalPrice } = await req.json();

    if (!tickets || tickets.length === 0 || !totalPrice) {
      return Response.json({ error: 'Invalid ticket data' }, { status: 400 });
    }

    const lineItems = tickets.map(ticket => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `Otter Week Ticket - ${ticket.type}`,
          description: `For: ${ticket.full_name}`,
        },
        unit_amount: Math.round(ticket.price * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/Schedule?otter_week=1&session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get('origin')}/Schedule?otter_week=1&cancelled=true`,
      customer_email: user.email,
      metadata: {
        user_email: user.email,
        ticket_count: tickets.length.toString(),
      },
    });

    return Response.json({ session_id: session.id, client_secret: session.client_secret });
  } catch (error) {
    console.error('Otter Week checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});