/**
 * Events API
 * POST /api/events - Record share page events
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST - Record an event (no auth required, validates share_id)
 */
export async function POST(request) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const body = await request.json();
        const { shareId, eventType, ctaType, device, referrer } = body;

        if (!shareId || !eventType) {
            return NextResponse.json({ error: 'shareId and eventType required' }, { status: 400 });
        }

        // Validate event type
        const validEventTypes = ['share_page_view', 'cta_click'];
        if (!validEventTypes.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        // Validate share exists and get comparison/user info
        const { data: share, error: shareError } = await supabaseAdmin
            .from('shares')
            .select('id, comparison_id, view_count, comparisons(user_id)')
            .eq('share_id', shareId)
            .single();

        if (shareError || !share) {
            return NextResponse.json({ error: 'Share not found' }, { status: 404 });
        }

        // Insert event
        const { error: insertError } = await supabaseAdmin
            .from('share_events')
            .insert({
                share_id: share.id,
                comparison_id: share.comparison_id,
                user_id: share.comparisons?.user_id || null,
                event_type: eventType,
                cta_type: ctaType || null,
                device: device || null,
                referrer: referrer || null,
            });

        if (insertError) {
            console.error('Failed to insert event:', insertError);
            return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
        }

        // Increment view count for page_view events
        if (eventType === 'share_page_view') {
            const currentCount = typeof share.view_count === 'number' ? share.view_count : 0;
            await supabaseAdmin
                .from('shares')
                .update({ view_count: currentCount + 1 })
                .eq('id', share.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Events POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
