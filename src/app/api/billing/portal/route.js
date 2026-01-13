/**
 * Stripe Customer Portal API
 * POST /api/billing/portal
 * 
 * Redirects authenticated users to the Stripe Customer Portal
 * where they can manage payment methods, view invoices, and cancel subscriptions
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Lazy load dependencies
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { stripe } = await import('@/lib/stripe');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's Stripe customer ID
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', session.user.id)
            .single();

        if (!subscription?.stripe_customer_id) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }

        // Create Stripe Customer Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${process.env.NEXTAUTH_URL}/app/settings?tab=billing`,
        });

        return NextResponse.json({ url: portalSession.url });

    } catch (error) {
        console.error('Billing portal error:', error);
        return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
    }
}
