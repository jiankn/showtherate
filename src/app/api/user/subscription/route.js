/**
 * Get user's subscription details
 */
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { STRIPE_PRODUCTS, stripe } from '@/lib/stripe';
import { syncSubscriptionToDb } from '@/lib/subscriptionUtils';

export async function GET() {
    try {
        const session = await requireAuth();

        // Get latest subscription details from database (active or trialing)
        const { data: subscription, error } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_customer_id, stripe_subscription_id, status, plan, updated_at')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !subscription) {
            return new Response(JSON.stringify({
                hasSubscription: false,
                message: 'No active subscription found'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Determine billing cycle
        let billingCycle = 'unknown';
        if (subscription.plan === STRIPE_PRODUCTS.MONTHLY.priceId) {
            billingCycle = 'monthly';
        } else if (subscription.plan === STRIPE_PRODUCTS.YEARLY.priceId) {
            billingCycle = 'yearly';
        }

        const hasSubscription = ['active', 'trialing'].includes(subscription.status);

        return new Response(JSON.stringify({
            hasSubscription,
            subscriptionId: subscription.stripe_subscription_id,
            plan: subscription.plan,
            billingCycle,
            status: subscription.status
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching subscription details:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch subscription details' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Force sync subscription from Stripe
 */
export async function POST() {
    try {
        const session = await requireAuth();
        const userId = session.user.id;

        // Get subscription ID from DB (even if inactive, to find the Stripe ID)
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (!subscription?.stripe_subscription_id) {
            return new Response(JSON.stringify({ synced: false, reason: 'No subscription record found' }), { status: 200 });
        }

        // Fetch latest from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);

        // Update DB
        const result = await syncSubscriptionToDb(stripeSub, supabaseAdmin);

        if (result.error) {
            throw new Error(result.error);
        }

        return new Response(JSON.stringify({ synced: true, status: stripeSub.status }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error syncing subscription:', error);
        return new Response(JSON.stringify({ error: 'Failed to sync subscription' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
