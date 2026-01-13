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
    const { syncSubscriptionToDb } = await import('@/lib/subscriptionUtils');

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
                await handleSubscriptionUpdate(event.data.object, supabaseAdmin, syncSubscriptionToDb);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object, supabaseAdmin);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object, stripe, supabaseAdmin, syncSubscriptionToDb);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                // Unknown event type - ignore
                break;
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

    // One-time payment (Starter Pass or Boost Pack)
    if (session.mode === 'payment') {
        // Handle Boost Pack (quota addon)
        if (product.bonus) {
            console.log(`[Webhook] Processing Boost Pack for user ${userId}`);

            // Get current subscription end date
            const { data: subscription, error: subError } = await supabaseAdmin
                .from('subscriptions')
                .select('current_period_end')
                .eq('user_id', userId)
                .single();

            if (subError) {
                console.error('[Webhook] Failed to get subscription:', subError);
                return;
            }

            if (!subscription?.current_period_end) {
                console.error('[Webhook] No active subscription found for user:', userId);
                return;
            }

            // Bonus expires 3 months after subscription ends
            const bonusExpiresAt = new Date(subscription.current_period_end);
            bonusExpiresAt.setMonth(bonusExpiresAt.getMonth() + 3);

            // Try RPC first, fallback to direct update if RPC doesn't exist
            const { error: rpcError } = await supabaseAdmin.rpc('add_bonus_quota', {
                p_user_id: userId,
                p_property: product.bonus.propertyQuota,
                p_ai: product.bonus.aiQuota,
                p_expires_at: bonusExpiresAt.toISOString()
            });

            if (rpcError) {
                console.warn('[Webhook] RPC failed, using direct update:', rpcError.message);

                // Fallback: Direct update to entitlements
                const { data: entitlement } = await supabaseAdmin
                    .from('entitlements')
                    .select('id, bonus_property_quota, bonus_ai_quota')
                    .eq('user_id', userId)
                    .eq('type', 'subscription')
                    .single();

                if (entitlement) {
                    const { error: updateError } = await supabaseAdmin
                        .from('entitlements')
                        .update({
                            bonus_property_quota: (entitlement.bonus_property_quota || 0) + product.bonus.propertyQuota,
                            bonus_ai_quota: (entitlement.bonus_ai_quota || 0) + product.bonus.aiQuota,
                            bonus_expires_at: bonusExpiresAt.toISOString()
                        })
                        .eq('id', entitlement.id);

                    if (updateError) {
                        console.error('[Webhook] Failed to update entitlement:', updateError);
                        return;
                    }
                } else {
                    console.error('[Webhook] No subscription entitlement found for user:', userId);
                    return;
                }
            }

            // Record purchase history
            const { error: insertError } = await supabaseAdmin.from('quota_purchases').insert({
                user_id: userId,
                property_amount: product.bonus.propertyQuota,
                ai_amount: product.bonus.aiQuota,
                stripe_payment_intent_id: session.payment_intent
            });

            if (insertError) {
                console.warn('[Webhook] Failed to record purchase history:', insertError.message);
                // Don't return - quota was already added
            }

            console.log(`[Webhook] Boost Pack purchased for user ${userId}: +${product.bonus.propertyQuota} property, +${product.bonus.aiQuota} AI`);
            return;
        }

        // Handle Starter Pass
        const { entitlement } = product;
        if (!entitlement) return;

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

    }
}

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription, supabaseAdmin, syncSubscriptionToDb) {
    await syncSubscriptionToDb(subscription, supabaseAdmin);
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

    }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice, stripe, supabaseAdmin, syncSubscriptionToDb) {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await syncSubscriptionToDb(subscription, supabaseAdmin);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
}
