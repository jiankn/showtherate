/**
 * Single Comparison API
 * GET    /api/comparisons/[id] - Get comparison details
 * DELETE /api/comparisons/[id] - Delete comparison
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET - Get comparison details with scenarios
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

        const { data: comparison, error } = await supabaseAdmin
            .from('comparisons')
            .select(`
                id,
                title,
                created_at,
                updated_at,
                user_id,
                scenarios (id, name, inputs_json, outputs_json, sort_order),
                shares (share_id, is_active, expires_at, view_count, created_at)
            `)
            .eq('id', id)
            .single();

        if (error || !comparison) {
            return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });
        }

        if (comparison.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Format response
        const formatted = {
            id: comparison.id,
            title: comparison.title,
            createdAt: comparison.created_at,
            updatedAt: comparison.updated_at,
            scenarios: comparison.scenarios
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(s => ({
                    id: s.id,
                    name: s.name,
                    inputs: s.inputs_json,
                    outputs: s.outputs_json,
                })),
            shares: comparison.shares.map(s => ({
                shareId: s.share_id,
                isActive: s.is_active,
                expiresAt: s.expires_at,
                viewCount: s.view_count,
                createdAt: s.created_at,
            })),
            activeShare: comparison.shares.find(s => s.is_active)?.share_id || null,
        };

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Comparison GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Delete comparison
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

        // Verify ownership
        const { data: comparison, error: fetchError } = await supabaseAdmin
            .from('comparisons')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (fetchError || !comparison) {
            return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });
        }

        if (comparison.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete (cascades to scenarios and shares)
        const { error: deleteError } = await supabaseAdmin
            .from('comparisons')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Failed to delete comparison:', deleteError);
            return NextResponse.json({ error: 'Failed to delete comparison' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Comparison DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT - Update comparison (client assignment, title)
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
        const body = await request.json();
        const { clientId, title } = body;

        // Verify ownership
        const { data: comparison, error: fetchError } = await supabaseAdmin
            .from('comparisons')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (fetchError || !comparison) {
            return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });
        }

        if (comparison.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // If clientId provided, verify client ownership
        if (clientId) {
            const { data: client, error: clientError } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('id', clientId)
                .eq('user_id', session.user.id)
                .single();

            if (clientError || !client) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }
        }

        // Build update object
        const updates = { updated_at: new Date().toISOString() };
        if (clientId !== undefined) {
            updates.client_id = clientId || null; // null to unassign
        }
        if (title !== undefined) {
            updates.title = title;
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('comparisons')
            .update(updates)
            .eq('id', id)
            .select('id, title, client_id')
            .single();

        if (updateError) {
            console.error('Comparison update error:', updateError);
            return NextResponse.json({ error: 'Failed to update comparison' }, { status: 500 });
        }

        return NextResponse.json({
            id: updated.id,
            title: updated.title,
            clientId: updated.client_id,
        });
    } catch (error) {
        console.error('Comparison PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
