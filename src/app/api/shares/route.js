/**
 * Shares API
 * POST /api/shares - Generate share link for a comparison
 */

import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

async function readLoProfile(supabaseAdmin, userId, sessionUser) {
    const [{ data: userRow }, { data: profileRow }] = await Promise.all([
        supabaseAdmin.from('users').select('id, email, name').eq('id', userId).maybeSingle(),
        supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const firstName = profileRow?.first_name || null;
    const lastName = profileRow?.last_name || null;
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || userRow?.name || sessionUser?.name || null;

    return {
        name,
        lastName,
        email: profileRow?.contact_email || userRow?.email || sessionUser?.email || null,
        nmls: profileRow?.nmls || null,
        phone: profileRow?.phone || null,
        xHandle: profileRow?.x_handle || null,
        facebook: profileRow?.facebook || null,
        tiktok: profileRow?.tiktok || null,
        instagram: profileRow?.instagram || null,
    };
}

/**
 * POST - Generate share link
 * Body: { comparisonId: string }
 */
export async function POST(request) {
    try {
        // Lazy load dependencies
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { checkQuota, consumeQuota, QUOTA_TYPES } = await import('@/lib/entitlements');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { comparisonId } = body;

        if (!comparisonId) {
            return NextResponse.json({ error: 'Comparison ID is required' }, { status: 400 });
        }

        // Verify comparison belongs to user
        const { data: comparison, error: compError } = await supabaseAdmin
            .from('comparisons')
            .select(`
                id,
                title,
                user_id,
                scenarios (id, name, inputs_json, outputs_json, sort_order)
            `)
            .eq('id', comparisonId)
            .single();

        if (compError || !comparison) {
            return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });
        }

        if (comparison.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if active share already exists
        const { data: existingShare } = await supabaseAdmin
            .from('shares')
            .select('share_id, expires_at')
            .eq('comparison_id', comparisonId)
            .eq('is_active', true)
            .gte('expires_at', new Date().toISOString())
            .single();

        if (existingShare) {
            // Return existing share link
            return NextResponse.json({
                shareId: existingShare.share_id,
                expiresAt: existingShare.expires_at,
                isExisting: true,
            });
        }

        // Check quota
        const quotaCheck = await checkQuota(session.user.id, QUOTA_TYPES.SHARE);
        if (!quotaCheck.hasQuota) {
            return NextResponse.json(
                { error: 'Share link quota exhausted', reason: quotaCheck.reason },
                { status: 402 }
            );
        }

        // Generate unique share ID
        const shareId = nanoid(10);

        // Calculate expiry (14 days for Starter Pass, 1 year for subscription)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days default

        const lo = await readLoProfile(supabaseAdmin, session.user.id, session.user);

        // Create snapshot of current comparison state
        const snapshot = {
            title: comparison.title,
            scenarios: comparison.scenarios.map(s => ({
                name: s.name,
                inputs: s.inputs_json,
                outputs: s.outputs_json,
            })),
            createdAt: now.toISOString(),
            lo,
        };

        // Consume quota (with idempotency key to prevent double counting)
        const idempotencyKey = `share_${comparisonId}_${now.getTime()}`;
        const consumeResult = await consumeQuota(
            session.user.id,
            QUOTA_TYPES.SHARE,
            shareId,
            idempotencyKey
        );

        if (!consumeResult.success && !consumeResult.alreadyConsumed) {
            return NextResponse.json(
                { error: 'Failed to consume quota', reason: consumeResult.error },
                { status: 500 }
            );
        }

        // Create share record
        const { error: shareError } = await supabaseAdmin
            .from('shares')
            .insert({
                comparison_id: comparisonId,
                share_id: shareId,
                is_active: true,
                expires_at: expiresAt.toISOString(),
                snapshot_json: snapshot,
            });

        if (shareError) {
            console.error('Failed to create share:', shareError);
            return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
        }

        return NextResponse.json({
            shareId,
            expiresAt: expiresAt.toISOString(),
            shareUrl: `${process.env.NEXTAUTH_URL}/s/${shareId}`,
            remaining: consumeResult.remaining,
        }, { status: 201 });
    } catch (error) {
        console.error('Shares POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
