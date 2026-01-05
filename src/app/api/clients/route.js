/**
 * Clients API
 * GET  /api/clients - List user's clients
 * POST /api/clients - Create new client
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET - List user's clients with comparison count
 */
export async function GET(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();
        const limit = parseInt(searchParams.get('limit')) || null;

        // Build query
        let query = supabaseAdmin
            .from('clients')
            .select(`
                id,
                name,
                email,
                phone,
                status,
                source,
                tags,
                created_at,
                updated_at,
                comparisons (count)
            `)
            .eq('user_id', session.user.id);

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Add limit if provided
        if (limit) {
            query = query.limit(limit);
        }

        // Order by most recent
        query = query.order('created_at', { ascending: false });

        const { data: clients, error } = await query;

        if (error) {
            console.error('Failed to fetch clients:', error);
            return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
        }

        // Get count of comparisons without client (unknown clients)
        const { count: unknownCount } = await supabaseAdmin
            .from('comparisons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .is('client_id', null);

        // Format response
        const formatted = clients.map(c => ({
            id: c.id,
            name: c.name || 'Unknown',
            email: c.email,
            phone: c.phone,
            status: c.status,
            source: c.source,
            tags: c.tags || [],
            comparisons: c.comparisons?.[0]?.count || 0,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
        }));

        return NextResponse.json({
            clients: formatted,
            unknownClientComparisons: unknownCount || 0,
        });
    } catch (error) {
        console.error('Clients GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Create new client
 */
export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, source, tags, comparisonId } = body;

        // If email provided, check for existing client
        if (email) {
            const { data: existing } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('email', email)
                .maybeSingle();

            if (existing) {
                // Update comparison with existing client
                if (comparisonId) {
                    await supabaseAdmin
                        .from('comparisons')
                        .update({ client_id: existing.id })
                        .eq('id', comparisonId)
                        .eq('user_id', session.user.id);
                }

                return NextResponse.json({
                    id: existing.id,
                    isExisting: true,
                });
            }
        }

        // Create new client
        const { data: client, error } = await supabaseAdmin
            .from('clients')
            .insert({
                user_id: session.user.id,
                name: name || null,
                email: email || null,
                phone: phone || null,
                status: 'active',
                source: source || null,
                tags: tags || [],
            })
            .select('id, name, email, phone, status, source, tags')
            .single();

        if (error) {
            console.error('Failed to create client:', error);
            return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
        }

        // Update comparison with client_id if provided
        if (comparisonId) {
            await supabaseAdmin
                .from('comparisons')
                .update({ client_id: client.id })
                .eq('id', comparisonId)
                .eq('user_id', session.user.id);
        }

        return NextResponse.json({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            status: client.status,
            isExisting: false,
        }, { status: 201 });
    } catch (error) {
        console.error('Clients POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
