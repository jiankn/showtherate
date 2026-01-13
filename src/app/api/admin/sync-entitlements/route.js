/**
 * Admin API: Sync Subscriptions to Entitlements
 * POST /api/admin/sync-entitlements
 * 
 * Syncs active subscriptions that are missing entitlements records
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        // Lazy load dependencies
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { STRIPE_PRODUCTS } = await import('@/lib/stripe');

        const session = await auth();

        // Check if user is admin (you can customize this check)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get optional userId from request body
        const body = await request.json().catch(() => ({}));
        const targetUserId = body.userId;

        // Find active subscriptions without entitlements
        let query = supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('status', 'active');

        if (targetUserId) {
            query = query.eq('user_id', targetUserId);
        }

        const { data: subscriptions, error: subError } = await query;

        if (subError) {
            console.error('Error fetching subscriptions:', subError);
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        if (!subscriptions?.length) {
            return NextResponse.json({ message: 'No active subscriptions found', synced: 0 });
        }

        const results = [];

        for (const sub of subscriptions) {
            // Check if entitlement already exists
            const { data: existing } = await supabaseAdmin
                .from('entitlements')
                .select('id')
                .eq('user_id', sub.user_id)
                .eq('type', 'subscription')
                .gte('ends_at', new Date().toISOString())
                .single();

            if (existing) {
                results.push({
                    userId: sub.user_id,
                    status: 'skipped',
                    reason: 'Entitlement already exists'
                });
                continue;
            }

            // Find product configuration
            const product = Object.values(STRIPE_PRODUCTS).find(p => p.priceId === sub.plan);
            const entitlement = product?.entitlement || {
                shareQuota: -1,
                propertyQuota: 150,
                aiQuota: 300,
            };

            // Create entitlement
            const { error: insertError } = await supabaseAdmin
                .from('entitlements')
                .insert({
                    user_id: sub.user_id,
                    type: 'subscription',
                    starts_at: sub.current_period_start,
                    ends_at: sub.current_period_end,
                    share_quota: entitlement.shareQuota,
                    share_used: 0,
                    property_quota: entitlement.propertyQuota,
                    property_used: 0,
                    ai_quota: entitlement.aiQuota,
                    ai_used: 0,
                });

            if (insertError) {
                console.error('Error creating entitlement:', insertError);
                results.push({
                    userId: sub.user_id,
                    status: 'error',
                    error: insertError.message
                });
            } else {
                results.push({
                    userId: sub.user_id,
                    status: 'created',
                    endsAt: sub.current_period_end
                });
            }
        }

        const synced = results.filter(r => r.status === 'created').length;

        return NextResponse.json({
            message: `Synced ${synced} entitlements`,
            synced,
            results
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
