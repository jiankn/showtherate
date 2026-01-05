/**
 * Stripe Webhook Handler
 * Handles payment and subscription events
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

export async function POST(request) {
    // Lazy load dependencies at runtime
    const { stripe, STRIPE_PRODUCTS } = await import('@/lib/stripe');
    const { supabaseAdmin } = await import('@/lib/supabase/server');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object, supabaseAdmin, STRIPE_PRODUCTS);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object, supabaseAdmin, STRIPE_PRODUCTS);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object, supabaseAdmin);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object, stripe, supabaseAdmin, STRIPE_PRODUCTS);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutComplete(session, supabaseAdmin, STRIPE_PRODUCTS) {
    const userId = session.metadata?.user_id;
    const productKey = session.metadata?.product;

    if (!userId || !productKey) {
        console.error('Missing metadata in checkout session');
        return;
    }

    const product = STRIPE_PRODUCTS[productKey];
    if (!product) {
        console.error('Unknown product:', productKey);
        return;
    }

    // One-time payment (Starter Pass)
    if (session.mode === 'payment') {
        const { entitlement } = product;
        const now = new Date();
        const endsAt = new Date(now.getTime() + entitlement.durationDays * 24 * 60 * 60 * 1000);

        // Create entitlement
        await supabaseAdmin.from('entitlements').insert({
            user_id: userId,
            type: entitlement.type,
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
            share_quota: entitlement.shareQuota,
            share_used: 0,
            property_quota: entitlement.propertyQuota,
            property_used: 0,
            ai_quota: entitlement.aiQuota,
            ai_used: 0,
            stripe_payment_intent_id: session.payment_intent,
        });

        console.log(`Created Starter Pass for user ${userId}`);
    }
}

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription, supabaseAdmin, STRIPE_PRODUCTS) {
    const userId = subscription.metadata?.user_id;
    const customerId = subscription.customer;

    // Try to get user ID from metadata or customer
    let resolvedUserId = userId;
    if (!resolvedUserId) {
        const { data } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();
        resolvedUserId = data?.user_id;
    }

    if (!resolvedUserId) {
        console.error('Could not resolve user ID for subscription');
        return;
    }

    // Update subscription record
    await supabaseAdmin.from('subscriptions').upsert({
        user_id: resolvedUserId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0]?.price?.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
    });

    // Create/update entitlement for active subscriptions
    if (['active', 'trialing'].includes(subscription.status)) {
        const priceId = subscription.items.data[0]?.price?.id;
        const product = Object.values(STRIPE_PRODUCTS).find(p => p.priceId === priceId);

        if (product?.entitlement) {
            const { entitlement } = product;

            // Upsert subscription entitlement
            const { data: existing } = await supabaseAdmin
                .from('entitlements')
                .select('id')
                .eq('user_id', resolvedUserId)
                .eq('type', 'subscription')
                .single();

            if (existing) {
                // Update existing
                await supabaseAdmin
                    .from('entitlements')
                    .update({
                        ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                        share_quota: entitlement.shareQuota,
                        property_quota: entitlement.propertyQuota,
                        ai_quota: entitlement.aiQuota,
                    })
                    .eq('id', existing.id);
            } else {
                // Create new
                await supabaseAdmin.from('entitlements').insert({
                    user_id: resolvedUserId,
                    type: 'subscription',
                    starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
                    ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                    share_quota: entitlement.shareQuota,
                    share_used: 0,
                    property_quota: entitlement.propertyQuota,
                    property_used: 0,
                    ai_quota: entitlement.aiQuota,
                    ai_used: 0,
                });
            }
        }
    }

    console.log(`Updated subscription for user ${resolvedUserId}: ${subscription.status}`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription, supabaseAdmin) {
    const customerId = subscription.customer;

    // Get user from customer ID
    const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (data?.user_id) {
        // Update subscription status
        await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', data.user_id);

        // Mark subscription entitlement as ended
        await supabaseAdmin
            .from('entitlements')
            .update({ ends_at: new Date().toISOString() })
            .eq('user_id', data.user_id)
            .eq('type', 'subscription');

        console.log(`Cancelled subscription for user ${data.user_id}`);
    }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice, stripe, supabaseAdmin, STRIPE_PRODUCTS) {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await handleSubscriptionUpdate(subscription, supabaseAdmin, STRIPE_PRODUCTS);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
    console.log('Invoice payment failed:', invoice.id);
}
