/**
 * Stripe SDK Configuration
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: false,
});

// Stripe Product Configuration
export const STRIPE_PRODUCTS = {
    STARTER_PASS: {
        name: 'Starter Pass (7 Days)',
        priceId: process.env.STRIPE_STARTER_PASS_PRICE_ID,
        mode: 'payment', // One-time payment
        entitlement: {
            type: 'starter_pass_7d',
            durationDays: 7,
            shareQuota: 5,
            propertyQuota: 10,
            aiQuota: 30,
        },
    },
    MONTHLY: {
        name: 'Monthly Subscription',
        priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
        mode: 'subscription',
        entitlement: {
            type: 'subscription',
            shareQuota: -1, // Unlimited
            propertyQuota: 150,
            aiQuota: 300,
        },
    },
    YEARLY: {
        name: 'Annual Subscription',
        priceId: process.env.STRIPE_YEARLY_PRICE_ID,
        mode: 'subscription',
        entitlement: {
            type: 'subscription',
            shareQuota: -1, // Unlimited
            propertyQuota: 150,
            aiQuota: 300,
        },
    },
};

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(userId, email, name) {
    const { supabaseAdmin } = await import('@/lib/supabase/server');

    // Check if user has a subscription record with Stripe customer ID
    const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

    if (subscription?.stripe_customer_id) {
        return subscription.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
            user_id: userId,
        },
    });

    // Save to database
    await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
        status: 'inactive',
    });

    return customer.id;
}
