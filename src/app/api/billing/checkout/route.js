/**
 * Stripe Checkout API
 * POST /api/billing/checkout?product=starter_pass|monthly|yearly
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        // Lazy load dependencies at runtime
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { stripe, STRIPE_PRODUCTS, getOrCreateCustomer } = await import('@/lib/stripe');

        // Check authentication
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get product from query params
        const { searchParams } = new URL(request.url);
        const productKey = searchParams.get('product')?.toUpperCase();

        if (!productKey || !STRIPE_PRODUCTS[productKey]) {
            return NextResponse.json(
                { error: 'Invalid product. Use: starter_pass, monthly, or yearly' },
                { status: 400 }
            );
        }

        const product = STRIPE_PRODUCTS[productKey];

        if (!product.priceId) {
            return NextResponse.json(
                { error: 'Product not configured. Please set up Stripe price IDs.' },
                { status: 500 }
            );
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(
            session.user.id,
            session.user.email,
            session.user.name
        );

        // Create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: product.mode,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: product.priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXTAUTH_URL}/app?checkout=success&product=${productKey.toLowerCase()}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing?checkout=cancelled`,
            metadata: {
                user_id: session.user.id,
                product: productKey,
            },
            // For subscriptions, allow customer to manage billing later
            ...(product.mode === 'subscription' && {
                subscription_data: {
                    metadata: {
                        user_id: session.user.id,
                    },
                },
            }),
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
