/**
 * Clients Export API
 * GET /api/clients/export - Export clients to Excel/CSV format
 */

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

/**
 * GET - Export clients to Excel or CSV
 * Query params:
 *   format: 'xlsx' | 'csv' (default: xlsx)
 *   includeStats: 'true' | 'false' (include comparison stats)
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
        const format = searchParams.get('format') || 'xlsx';
        const includeStats = searchParams.get('includeStats') === 'true';

        // Fetch clients with optional comparison stats
        let query = supabaseAdmin
            .from('clients')
            .select(`
                id,
                name,
                email,
                phone,
                status,
                notes,
                source,
                tags,
                created_at,
                updated_at
            `)
            .eq('user_id', session.user.id)
            .order('name');

        const { data: clients, error } = await query;

        if (error) {
            console.error('Failed to fetch clients for export:', error);
            return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
        }

        // If includeStats, get comparison counts
        let comparisonCounts = {};
        if (includeStats) {
            const { data: comparisons } = await supabaseAdmin
                .from('comparisons')
                .select('client_id')
                .eq('user_id', session.user.id)
                .not('client_id', 'is', null);

            if (comparisons) {
                comparisons.forEach(c => {
                    comparisonCounts[c.client_id] = (comparisonCounts[c.client_id] || 0) + 1;
                });
            }
        }

        // Format data for export
        const exportData = clients.map(client => {
            const row = {
                'Name': client.name || '',
                'Email': client.email || '',
                'Phone': client.phone || '',
                'Status': client.status || 'active',
                'Notes': client.notes || '',
                'Source': client.source || '',
                'Tags': Array.isArray(client.tags) ? client.tags.join(', ') : '',
                'Created At': client.created_at ? new Date(client.created_at).toLocaleDateString() : '',
            };

            if (includeStats) {
                row['Comparisons'] = comparisonCounts[client.id] || 0;
            }

            return row;
        });

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clients');

        let buffer;
        let contentType;
        let filename;

        if (format === 'csv') {
            buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
            contentType = 'text/csv';
            filename = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Clients export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
