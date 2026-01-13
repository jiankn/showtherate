/**
 * Analytics API
 * GET /api/analytics - Get analytics data for user's shares
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET - Get analytics data
 * Query params: range (7d|30d|all), comparisonId?, clientId?
 */
export async function GET(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';
        const comparisonId = searchParams.get('comparisonId');

        // Calculate date range
        let startDate;
        const now = new Date();
        if (range === '7d') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (range === '30d') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(0); // All time
        }

        // Build query
        let query = supabaseAdmin
            .from('share_events')
            .select('*')
            .eq('user_id', session.user.id)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (comparisonId) {
            query = query.eq('comparison_id', comparisonId);
        }

        const { data: events, error } = await query.limit(500);

        if (error) {
            console.error('Failed to fetch events:', error);
            return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
        }

        // Get total shares count
        const { count: totalShares } = await supabaseAdmin
            .from('shares')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .in('comparison_id',
                (await supabaseAdmin
                    .from('comparisons')
                    .select('id')
                    .eq('user_id', session.user.id)
                ).data?.map(c => c.id) || []
            );

        // Calculate KPIs
        const totalViews = events.filter(e => e.event_type === 'share_page_view').length;
        const totalClicks = events.filter(e => e.event_type === 'cta_click').length;
        const clickRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

        // Device distribution
        const deviceCounts = {};
        events.forEach(e => {
            const device = e.device || 'unknown';
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });

        const deviceDistribution = Object.entries(deviceCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
        }));

        // Daily views for chart
        const dailyViews = {};
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 7;

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = date.toLocaleDateString('en-US', { weekday: 'short' });
            dailyViews[key] = 0;
        }

        events
            .filter(e => e.event_type === 'share_page_view')
            .forEach(e => {
                const date = new Date(e.created_at);
                const key = date.toLocaleDateString('en-US', { weekday: 'short' });
                if (dailyViews[key] !== undefined) {
                    dailyViews[key]++;
                }
            });

        const viewData = Object.entries(dailyViews).map(([name, views]) => ({ name, views }));

        // Fetch enriched details for events
        const comparisonIds = [...new Set(events.map(e => e.comparison_id))];

        // 1. Get Comparisons
        const { data: comparisons } = await supabaseAdmin
            .from('comparisons')
            .select('id, title, client_id')
            .in('id', comparisonIds);

        // 2. Get Clients
        const clientIds = [...new Set((comparisons || []).map(c => c.client_id).filter(Boolean))];
        const { data: clients } = await supabaseAdmin
            .from('clients')
            .select('id, first_name, last_name')
            .in('id', clientIds);

        const clientMap = (clients || []).reduce((acc, curr) => {
            const name = [curr.first_name, curr.last_name].filter(Boolean).join(' ');
            acc[curr.id] = name || 'Unknown Client';
            return acc;
        }, {});

        const comparisonMap = (comparisons || []).reduce((acc, curr) => {
            acc[curr.id] = {
                ...curr,
                clientName: curr.client_id ? clientMap[curr.client_id] : null
            };
            return acc;
        }, {});

        // Recent activity (allow more for grouping, e.g. 50)
        const recentActivity = events.slice(0, 50).map(e => ({
            id: e.id,
            eventType: e.event_type,
            ctaType: e.cta_type,
            device: e.device,
            comparisonId: e.comparison_id,
            comparisonTitle: comparisonMap[e.comparison_id]?.title || 'Unknown Comparison',
            clientName: comparisonMap[e.comparison_id]?.clientName,
            time: e.created_at,
        }));

        return NextResponse.json({
            kpi: {
                totalViews,
                totalClicks,
                clickRate,
                activeLinks: totalShares || 0,
            },
            viewData,
            deviceDistribution,
            recentActivity,
        });
    } catch (error) {
        console.error('Analytics GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
