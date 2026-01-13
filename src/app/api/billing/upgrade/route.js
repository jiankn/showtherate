/**
 * Upgrade Subscription API
 * POST /api/billing/upgrade
 * 
 * Upgrades a monthly subscription to yearly by updating the Stripe subscription
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Lazy load dependencies
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { stripe, STRIPE_PRODUCTS } = await import('@/lib/stripe');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current subscription
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_subscription_id, plan')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();

        if (!subscription?.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }

        // Check if already on yearly
        if (subscription.plan === STRIPE_PRODUCTS.YEARLY.priceId) {
            return NextResponse.json({ error: 'Already on yearly plan' }, { status: 400 });
        }

        // Get the Stripe subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);

        // Update subscription to yearly plan
        const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [{
                id: stripeSubscription.items.data[0].id,
                price: STRIPE_PRODUCTS.YEARLY.priceId,
            }],
            proration_behavior: 'create_prorations', // Credit remaining time
            metadata: {
                user_id: session.user.id,
                upgraded_from: 'monthly',
            },
        });


        return NextResponse.json({
            success: true,
            message: 'Successfully upgraded to yearly plan',
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
            }
        });

    } catch (error) {
        console.error('Upgrade subscription error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to upgrade subscription'
        }, { status: 500 });
    }
}
