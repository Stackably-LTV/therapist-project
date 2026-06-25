import { NextResponse } from 'next/server';
import { getStripe } from '@/components/d43e063edf4e';
import { handleStripeWebhookEvent } from '@/components/4c49db63824d';
/**
 * Verify an event against every configured webhook secret. We run two Stripe
 * endpoints at this URL — one for platform-account events and one for
 * connected-account (Connect) events — and each has its own signing secret.
 * Try each until one validates.
 */
function constructVerifiedEvent(rawBody, signature) {
    const secrets = [
        process.env.STRIPE_WEBHOOK_SECRET,
        process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    ].filter((s) => Boolean(s));
    if (secrets.length === 0) {
        throw new Error('No Stripe webhook secret is configured');
    }
    let lastError;
    for (const secret of secrets) {
        try {
            return getStripe().webhooks.constructEvent(rawBody, signature, secret);
        }
        catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}
export async function POST(request) {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }
    let event;
    try {
        event = constructVerifiedEvent(rawBody, signature);
    }
    catch (error) {
        console.error('[api/payments/webhook] signature error', error);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }
    const result = await handleStripeWebhookEvent(event);
    return NextResponse.json(result.body, { status: result.status });
}
