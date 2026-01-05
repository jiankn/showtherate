/**
 * Single Client API
 * GET /api/clients/[id] - Get client details with comparisons
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET - Get client details with associated comparisons
 */
export async function GET(request, { params }) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Handle "unknown" special case
        if (id === 'unknown') {
            const { data: comparisons, error } = await supabaseAdmin
                .from('comparisons')
                .select(`
                    id,
                    title,
                    created_at,
                    updated_at,
                    scenarios (count),
                    shares (share_id, is_active)
                `)
                .eq('user_id', session.user.id)
                .is('client_id', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch unknown client comparisons:', error);
                return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
            }

            return NextResponse.json({
                id: 'unknown',
                name: 'Unknown Clients',
                email: null,
                phone: null,
                status: 'Unknown',
                comparisons: comparisons.map(c => ({
                    id: c.id,
                    title: c.title,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at,
                    scenarioCount: c.scenarios?.[0]?.count || 0,
                    isShared: c.shares?.some(s => s.is_active) || false,
                })),
            });
        }

        // Get client
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Get comparisons for this client
        const { data: comparisons, error: compError } = await supabaseAdmin
            .from('comparisons')
            .select(`
                id,
                title,
                created_at,
                updated_at,
                scenarios (count),
                shares (share_id, is_active)
            `)
            .eq('client_id', id)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (compError) {
            console.error('Failed to fetch client comparisons:', compError);
        }

        return NextResponse.json({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            status: client.status,
            notes: client.notes,
            createdAt: client.created_at,
            updatedAt: client.updated_at,
            comparisons: (comparisons || []).map(c => ({
                id: c.id,
                title: c.title,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
                scenarioCount: c.scenarios?.[0]?.count || 0,
                isShared: c.shares?.some(s => s.is_active) || false,
            })),
        });
    } catch (error) {
        console.error('Client GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT - Update client details
 */
export async function PUT(request, { params }) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (id === 'unknown') {
            return NextResponse.json({ error: 'Cannot edit unknown clients' }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, phone, status, notes } = body;

        // Validate ownership
        const { data: existing, error: checkError } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (checkError || !existing) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Build update object
        const updates = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (status !== undefined) updates.status = status;
        if (notes !== undefined) updates.notes = notes;

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Client update error:', updateError);
            return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
        }

        return NextResponse.json({
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            status: updated.status,
            notes: updated.notes,
            updatedAt: updated.updated_at,
        });
    } catch (error) {
        console.error('Client PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Delete client and associated comparisons
 */
export async function DELETE(request, { params }) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Handle "unknown" special case - delete all comparisons without client
        if (id === 'unknown') {
            // Get all comparison IDs without client
            const { data: comparisons, error: fetchError } = await supabaseAdmin
                .from('comparisons')
                .select('id')
                .eq('user_id', session.user.id)
                .is('client_id', null);

            if (fetchError) {
                console.error('Failed to fetch unknown comparisons:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch comparisons' }, { status: 500 });
            }

            const comparisonIds = comparisons.map(c => c.id);

            if (comparisonIds.length > 0) {
                // Delete related shares
                await supabaseAdmin
                    .from('shares')
                    .delete()
                    .in('comparison_id', comparisonIds);

                // Delete related scenarios
                await supabaseAdmin
                    .from('scenarios')
                    .delete()
                    .in('comparison_id', comparisonIds);

                // Delete the comparisons
                const { error: deleteError } = await supabaseAdmin
                    .from('comparisons')
                    .delete()
                    .eq('user_id', session.user.id)
                    .is('client_id', null);

                if (deleteError) {
                    console.error('Failed to delete unknown comparisons:', deleteError);
                    return NextResponse.json({ error: 'Failed to delete comparisons' }, { status: 500 });
                }
            }

            return NextResponse.json({ success: true, deletedCount: comparisonIds.length });
        }

        // Validate ownership
        const { data: existing, error: checkError } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (checkError || !existing) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Get all comparison IDs for this client
        const { data: comparisons, error: fetchError } = await supabaseAdmin
            .from('comparisons')
            .select('id')
            .eq('client_id', id);

        if (fetchError) {
            console.error('Failed to fetch client comparisons:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch comparisons' }, { status: 500 });
        }

        const comparisonIds = comparisons.map(c => c.id);

        if (comparisonIds.length > 0) {
            // Delete related shares
            await supabaseAdmin
                .from('shares')
                .delete()
                .in('comparison_id', comparisonIds);

            // Delete related scenarios
            await supabaseAdmin
                .from('scenarios')
                .delete()
                .in('comparison_id', comparisonIds);

            // Delete the comparisons
            await supabaseAdmin
                .from('comparisons')
                .delete()
                .eq('client_id', id);
        }

        // Delete client
        const { error: deleteError } = await supabaseAdmin
            .from('clients')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Client delete error:', deleteError);
            return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
        }

        return NextResponse.json({ success: true, deletedComparisons: comparisonIds.length });
    } catch (error) {
        console.error('Client DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
