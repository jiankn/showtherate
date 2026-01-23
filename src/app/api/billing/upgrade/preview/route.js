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

        // Calculate amounts from invoice lines
        // Yearly plan line
        const yearlyLine = invoice.lines.data.find(line =>
            line.price?.id === STRIPE_PRODUCTS.YEARLY.priceId && line.amount > 0
        );

        // Proration credit lines (negative amounts)
        const creditLines = invoice.lines.data.filter(line => line.proration && line.amount < 0);
        const monthlyRemaining = creditLines.reduce((sum, line) => sum + Math.abs(line.amount), 0) / 100;

        // Get yearly price from line or fallback
        const yearlyPrice = yearlyLine ? yearlyLine.amount / 100 : 950;

        // Customer balance credit (from Starter Pass purchase, etc.)
        const startingBalance = invoice.starting_balance || 0;
        const endingBalance = invoice.ending_balance || 0;
        const balanceCredit = startingBalance < 0 ? Math.abs(startingBalance) / 100 : 0;

        // Calculate amount due: yearly price - proration credit - balance credit
        // But don't let it go negative
        const calculatedDue = Math.max(0, yearlyPrice - monthlyRemaining - balanceCredit);

        // Use Stripe's amount_due as the source of truth, but log for debugging
        const amountDue = invoice.amount_due / 100;

        console.log('[Upgrade Preview] Invoice details:', {
            yearlyPrice,
            monthlyRemaining,
            startingBalance: startingBalance / 100,
            endingBalance: endingBalance / 100,
            balanceCredit,
            stripeAmountDue: amountDue,
            calculatedDue,
            invoiceTotal: invoice.total / 100,
        });

        return NextResponse.json({
            success: true,
            preview: {
                yearlyPrice,
                monthlyCredit: monthlyRemaining,
                balanceCredit, // Add balance credit info
                amountDue: calculatedDue, // Use calculated amount instead of Stripe's
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
