/**
 * Clients Import API
 * POST /api/clients/import - Import clients from Excel/CSV
 */

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

// Allowed tags for validation
const ALLOWED_TAGS = ['VIP', 'First-Time Buyer', 'Refinance', 'Investment', 'Commercial', 'Pre-Approved'];

/**
 * POST - Import clients from uploaded file
 */
export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const mode = formData.get('mode') || 'skip'; // 'skip' | 'update' (duplicate handling)
        const autoLink = formData.get('autoLink') === 'true'; // Auto-link to comparisons by email

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Read file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return NextResponse.json({ error: 'Empty file' }, { status: 400 });
        }

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'No data in file' }, { status: 400 });
        }

        // Get existing clients for duplicate check
        const { data: existingClients } = await supabaseAdmin
            .from('clients')
            .select('id, email')
            .eq('user_id', session.user.id);

        const existingEmails = new Map(
            (existingClients || [])
                .filter(c => c.email)
                .map(c => [c.email.toLowerCase(), c.id])
        );

        // Process rows
        const results = {
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: [],
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel row number (1-indexed + header)

            // Map columns (flexible naming)
            const name = row['Name'] || row['name'] || row['NAME'] || '';
            const email = (row['Email'] || row['email'] || row['EMAIL'] || '').trim().toLowerCase();
            const phone = row['Phone'] || row['phone'] || row['PHONE'] || '';
            const status = (row['Status'] || row['status'] || row['STATUS'] || 'active').toLowerCase();
            const notes = row['Notes'] || row['notes'] || row['NOTES'] || '';
            const source = row['Source'] || row['source'] || row['SOURCE'] || 'Import';
            const tagsRaw = row['Tags'] || row['tags'] || row['TAGS'] || '';

            // Parse tags
            let tags = [];
            if (tagsRaw) {
                tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
            }

            // Validate required field
            if (!name) {
                results.errors.push(`Row ${rowNum}: Name is required`);
                results.skipped++;
                continue;
            }

            // Validate status
            const validStatuses = ['active', 'inactive', 'closed'];
            const normalizedStatus = validStatuses.includes(status) ? status : 'active';

            // Check for duplicate
            if (email && existingEmails.has(email)) {
                if (mode === 'update') {
                    // Update existing client
                    const existingId = existingEmails.get(email);
                    const { error: updateError } = await supabaseAdmin
                        .from('clients')
                        .update({
                            name,
                            phone,
                            status: normalizedStatus,
                            notes,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', existingId);

                    if (updateError) {
                        results.errors.push(`Row ${rowNum}: Failed to update - ${updateError.message}`);
                        results.skipped++;
                    } else {
                        results.updated++;
                    }
                } else {
                    // Skip duplicate
                    results.skipped++;
                }
                continue;
            }

            // Insert new client (without source/tags for DB compatibility)
            const { data: newClient, error: insertError } = await supabaseAdmin
                .from('clients')
                .insert({
                    user_id: session.user.id,
                    name,
                    email: email || null,
                    phone: phone || null,
                    status: normalizedStatus,
                    notes: notes || null,
                })
                .select('id, email')
                .single();

            if (insertError) {
                results.errors.push(`Row ${rowNum}: Failed to import - ${insertError.message}`);
                results.skipped++;
            } else {
                results.imported++;

                // Track new email for future duplicate checks
                if (email) {
                    existingEmails.set(email, newClient.id);
                }

                // Auto-link comparisons by email
                if (autoLink && email) {
                    // Find comparisons with shares to this email (if share has client email)
                    // For now, we'll link unassigned comparisons - this could be enhanced
                }
            }
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Imported ${results.imported}, updated ${results.updated}, skipped ${results.skipped}`,
        });
    } catch (error) {
        console.error('Clients import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
