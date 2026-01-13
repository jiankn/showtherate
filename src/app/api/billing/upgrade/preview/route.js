/**
 * Preview Upgrade API
 * POST /api/billing/upgrade/preview
 * 
 * Returns the prorated amount for upgrading from monthly to yearly
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
            .select('stripe_subscription_id, plan, current_period_end')
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

        // Create an invoice preview to see the proration
        // Note: In newer Stripe API versions, use createPreview instead of retrieveUpcoming
        const previewParams = {
            customer: stripeSubscription.customer,
            subscription: subscription.stripe_subscription_id,
            subscription_details: {
                items: [{
                    id: stripeSubscription.items.data[0].id,
                    price: STRIPE_PRODUCTS.YEARLY.priceId,
                }],
                proration_behavior: 'create_prorations',
            },
        };

        let invoice;
        try {
            // Try newer API method first
            invoice = await stripe.invoices.createPreview(previewParams);
        } catch (e) {
            // Fallback to older method if createPreview doesn't exist
            invoice = await stripe.invoices.retrieve('upcoming', {
                customer: stripeSubscription.customer,
                subscription: subscription.stripe_subscription_id,
                subscription_items: [{
                    id: stripeSubscription.items.data[0].id,
                    price: STRIPE_PRODUCTS.YEARLY.priceId,
                }],
                subscription_proration_behavior: 'create_prorations',
            });
        }

        // Calculate amounts
        const amountDue = invoice.amount_due / 100; // Convert from cents to dollars
        const creditApplied = (invoice.total - invoice.amount_due) / 100;
        const yearlyPrice = 950; // $950/year
        const monthlyRemaining = invoice.lines.data
            .filter(line => line.proration && line.amount < 0)
            .reduce((sum, line) => sum + Math.abs(line.amount), 0) / 100;

        return NextResponse.json({
            success: true,
            preview: {
                yearlyPrice,
                monthlyCredit: monthlyRemaining,
                amountDue,
                currency: invoice.currency.toUpperCase(),
                currentPeriodEnd: subscription.current_period_end,
                nextBillingDate: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            }
        });

    } catch (error) {
        console.error('Upgrade preview error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to preview upgrade'
        }, { status: 500 });
    }
}
