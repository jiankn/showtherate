/**
 * Shared subscription utilities for webhook and sync API
 */

import { STRIPE_PRODUCTS } from '@/lib/stripe';

/**
 * Sync a Stripe subscription object to the database
 * @param {Object} subscription - Stripe subscription object
 * @param {Object} supabaseAdmin - Supabase admin client
 * @returns {Object} result - { success: true } or { error }
 */
export async function syncSubscriptionToDb(subscription, supabaseAdmin) {
    try {
        const userId = subscription.metadata?.user_id;
        const customerId = subscription.customer;

        // Try to get user ID from metadata, or fallback to looking up by customer ID
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
            console.error('[Sync] Could not resolve user ID for subscription', subscription.id);
            return { error: 'Could not resolve user ID' };
        }

        // Upsert subscription record
        // specified conflict target to stripe_customer_id which has a unique constraint
        const { error: subError } = await supabaseAdmin.from('subscriptions').upsert({
            user_id: resolvedUserId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan: subscription.items.data[0]?.price?.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'stripe_customer_id' });

        if (subError) {
            console.error('[Sync] Failed to upsert subscription:', subError);
            return { error: subError.message };
        }

        // Handle Entitlements
        // We only grant entitlements if the status is active or trialing
        if (['active', 'trialing'].includes(subscription.status)) {
            const priceId = subscription.items.data[0]?.price?.id;
            const product = Object.values(STRIPE_PRODUCTS).find(p => p.priceId === priceId);

            // Default entitlement fallback
            const entitlement = product?.entitlement || {
                type: 'subscription',
                shareQuota: -1,
                propertyQuota: 150,
                aiQuota: 300,
            };

            if (!product) {
                console.warn('[Sync] Price ID not found in STRIPE_PRODUCTS, using default entitlement:', priceId);
            }

            // Check if entitlement exists
            const { data: existing } = await supabaseAdmin
                .from('entitlements')
                .select('id')
                .eq('user_id', resolvedUserId)
                .eq('type', 'subscription')
                .single();

            if (existing) {
                // Update - also reset usage for new billing period and update bonus expiry
                const newPeriodEnd = new Date(subscription.current_period_end * 1000);
                const bonusExpiresAt = new Date(newPeriodEnd);
                bonusExpiresAt.setMonth(bonusExpiresAt.getMonth() + 3);

                const { error: updateError } = await supabaseAdmin
                    .from('entitlements')
                    .update({
                        ends_at: newPeriodEnd.toISOString(),
                        share_quota: entitlement.shareQuota,
                        property_quota: entitlement.propertyQuota,
                        ai_quota: entitlement.aiQuota,
                        // Reset usage for new billing period
                        property_used: 0,
                        ai_used: 0,
                        // Update bonus expiry (3 months after subscription ends)
                        bonus_expires_at: bonusExpiresAt.toISOString(),
                    })
                    .eq('id', existing.id);

                if (updateError) console.error('[Sync] Failed to update entitlement:', updateError);
            } else {
                // Create
                const { error: insertError } = await supabaseAdmin.from('entitlements').insert({
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

                if (insertError) console.error('[Sync] Failed to insert entitlement:', insertError);
            }
        } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
            // If subscription is not valid, we might want to expire the entitlement immediately
            // Typically we let it run until ends_at, but if status is canceled (meaning effectively over), we might want to ensure ends_at is handled.
            // However, Stripe usually keeps status as active until period end even if canceled_at_period_end is true.
            // If status IS 'canceled', it means it's done.

            if (subscription.status === 'canceled') {
                await supabaseAdmin
                    .from('entitlements')
                    .update({ ends_at: new Date().toISOString() })
                    .eq('user_id', resolvedUserId)
                    .eq('type', 'subscription');
            }
        }

        return { success: true };
    } catch (error) {
        console.error('[Sync] Exception during subscription sync:', error);
        return { error: error.message };
    }
}
