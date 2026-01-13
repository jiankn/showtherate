import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function readLoProfile(supabaseAdmin, userId) {
    const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('id, email, name, first_name, last_name, contact_email, nmls, phone, x_handle, facebook, tiktok, instagram')
        .eq('id', userId)
        .maybeSingle();

    const firstName = userRow?.first_name || null;
    const lastName = userRow?.last_name || null;
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || userRow?.name || null;

    return {
        name,
        lastName,
        email: userRow?.contact_email || userRow?.email || null,
        nmls: userRow?.nmls || null,
        phone: userRow?.phone || null,
        xHandle: userRow?.x_handle || null,
        facebook: userRow?.facebook || null,
        tiktok: userRow?.tiktok || null,
        instagram: userRow?.instagram || null,
    };
}

export async function GET(_request, { params }) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const resolvedParams = await params;
        const shareId = resolvedParams?.shareId;
        if (!shareId || typeof shareId !== 'string') {
            return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
        }

        const nowIso = new Date().toISOString();

        const { data: share, error: shareError } = await supabaseAdmin
            .from('shares')
            .select('comparison_id, snapshot_json, expires_at, is_active, view_count')
            .eq('share_id', shareId)
            .eq('is_active', true)
            .gte('expires_at', nowIso)
            .single();

        if (shareError || !share) {
            return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 });
        }

        const { data: comparison } = await supabaseAdmin
            .from('comparisons')
            .select('user_id')
            .eq('id', share.comparison_id)
            .single();

        const userId = comparison?.user_id || null;
        const lo = share?.snapshot_json?.lo || (userId ? await readLoProfile(supabaseAdmin, userId) : null);

        return NextResponse.json({
            shareId,
            expiresAt: share.expires_at,
            viewCount: share.view_count || 0,
            snapshot: {
                ...(share.snapshot_json || {}),
                lo: lo || undefined,
            },
        });
    } catch (error) {
        console.error('Share GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
