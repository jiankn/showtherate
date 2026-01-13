/**
 * Comparisons API
 * GET  /api/comparisons - List user's comparisons
 * POST /api/comparisons - Create new comparison
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

/**
 * GET - List user's comparisons
 */
export async function GET(request) {
    try {
        // Lazy load dependencies at runtime
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const clientFilter = searchParams.get('clientId'); // 'none' or client id

        // Get comparisons with scenario count and client info
        let query = supabaseAdmin
            .from('comparisons')
            .select(`
                id,
                title,
                created_at,
                updated_at,
                client_id,
                clients (id, name),
                scenarios (count),
                shares (share_id, is_active, expires_at)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        // Apply client filter
        if (clientFilter === 'none') {
            query = query.is('client_id', null);
        } else if (clientFilter && clientFilter !== 'all') {
            query = query.eq('client_id', clientFilter);
        }

        query = query.range(offset, offset + limit - 1);

        const { data: comparisons, error } = await query;

        if (error) {
            console.error('Failed to fetch comparisons:', error);
            return NextResponse.json({ error: 'Failed to fetch comparisons' }, { status: 500 });
        }

        // Get unique clients for filter options
        const { data: allClients } = await supabaseAdmin
            .from('clients')
            .select('id, name')
            .eq('user_id', session.user.id)
            .order('name');

        // Count comparisons without clients
        const { count: noClientCount } = await supabaseAdmin
            .from('comparisons')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .is('client_id', null);

        // Get total count of comparisons
        const { count: totalCount } = await supabaseAdmin
            .from('comparisons')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id);



        // Format response
        const formatted = comparisons.map(c => ({
            id: c.id,
            title: c.title,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            scenarioCount: c.scenarios?.[0]?.count || 0,
            shareLink: c.shares?.find(s => s.is_active)?.share_id || null,
            clientId: c.client_id,
            clientName: c.clients?.name || null,
        }));

        return NextResponse.json({
            comparisons: formatted,
            totalCount: totalCount || 0,
            clients: allClients || [],
            noClientCount: noClientCount || 0,
        });
    } catch (error) {
        console.error('Comparisons GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Create new comparison with scenarios
 */
export async function POST(request) {
    try {
        // Lazy load dependencies at runtime
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, scenarios, clientId, aiScript } = body;

        // Validate input
        if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
            return NextResponse.json(
                { error: 'At least one scenario is required' },
                { status: 400 }
            );
        }

        if (scenarios.length > 4) {
            return NextResponse.json(
                { error: 'Maximum 4 scenarios allowed' },
                { status: 400 }
            );
        }

        // Create comparison
        const { data: comparison, error: compError } = await supabaseAdmin
            .from('comparisons')
            .insert({
                user_id: session.user.id,
                title: title || 'Untitled Comparison',
                client_id: clientId || null,
                ai_script: aiScript || null,
            })
            .select('id')
            .single();

        if (compError) {
            console.error('Failed to create comparison:', compError);
            return NextResponse.json({ error: 'Failed to create comparison' }, { status: 500 });
        }

        // Create scenarios
        const scenarioInserts = scenarios.map((s, index) => ({
            comparison_id: comparison.id,
            name: s.name || `Scenario ${index + 1}`,
            inputs_json: s.inputs || {},
            outputs_json: s.outputs || {},
            sort_order: index,
        }));

        const { error: scenarioError } = await supabaseAdmin
            .from('scenarios')
            .insert(scenarioInserts);

        if (scenarioError) {
            console.error('Failed to create scenarios:', scenarioError);
            // Rollback comparison
            await supabaseAdmin.from('comparisons').delete().eq('id', comparison.id);
            return NextResponse.json({ error: 'Failed to create scenarios' }, { status: 500 });
        }

        return NextResponse.json({
            id: comparison.id,
            title: title || 'Untitled Comparison',
            scenarioCount: scenarios.length,
        }, { status: 201 });
    } catch (error) {
        console.error('Comparisons POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Batch delete comparisons
 * Body: { ids: string[] }
 */
export async function DELETE(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
        }



        // Delete comparisons owned by user
        const { data, error } = await supabaseAdmin
            .from('comparisons')
            .delete()
            .in('id', ids)
            .eq('user_id', session.user.id)
            .select();

        if (error) {
            console.error('Failed to batch delete comparisons:', error);
            return NextResponse.json({ error: 'Failed to delete comparisons' }, { status: 500 });
        }



        return NextResponse.json({ success: true, count: data?.length || 0 });
    } catch (error) {
        console.error('Comparisons DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
