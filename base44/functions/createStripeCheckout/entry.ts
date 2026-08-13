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

    const { event_id, quantity, amount, event_title } = await req.json();

    if (!event_id || !quantity || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: event_title || 'Event Payment',
              description: `Event ID: ${event_id}, Quantity: ${quantity}`,
            },
            unit_amount: Math.round(amount / quantity),
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/Schedule?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get('origin')}/Schedule?cancelled=true`,
      customer_email: user.email,
      metadata: {
        user_email: user.email,
        event_id: event_id,
        quantity: quantity.toString(),
      },
    });

    return Response.json({ session_id: session.id, client_secret: session.client_secret });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});