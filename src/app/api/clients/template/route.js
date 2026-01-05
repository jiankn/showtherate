/**
 * Template Download API
 * GET /api/clients/template - Download import template
 */

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

/**
 * GET - Download import template
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'xlsx';

        // Create template with sample data
        const templateData = [
            {
                'Name': 'John Smith (Required)',
                'Email': 'john@example.com',
                'Phone': '(555) 123-4567',
                'Status': 'active',
                'Notes': 'First-time homebuyer',
                'Source': 'Referral',
                'Tags': 'First-Time Buyer, VIP',
            },
            {
                'Name': 'Jane Doe',
                'Email': 'jane@example.com',
                'Phone': '',
                'Status': 'active',
                'Notes': '',
                'Source': 'Website',
                'Tags': 'Refinance',
            },
        ];

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, // Name
            { wch: 25 }, // Email
            { wch: 15 }, // Phone
            { wch: 10 }, // Status
            { wch: 30 }, // Notes
            { wch: 15 }, // Source
            { wch: 30 }, // Tags
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Import Template');

        // Add instructions sheet
        const instructionsData = [
            { 'Instructions': 'How to use this template:' },
            { 'Instructions': '' },
            { 'Instructions': '1. Name is REQUIRED - this is the only mandatory field' },
            { 'Instructions': '2. Email is recommended for duplicate detection' },
            { 'Instructions': '3. Status options: active, inactive, closed' },
            { 'Instructions': '4. Tags: comma-separated values (e.g., "VIP, First-Time Buyer")' },
            { 'Instructions': '' },
            { 'Instructions': 'Suggested Tags:' },
            { 'Instructions': '  - VIP' },
            { 'Instructions': '  - First-Time Buyer' },
            { 'Instructions': '  - Refinance' },
            { 'Instructions': '  - Investment' },
            { 'Instructions': '  - Commercial' },
            { 'Instructions': '  - Pre-Approved' },
            { 'Instructions': '' },
            { 'Instructions': 'Delete the sample rows before importing your data.' },
        ];

        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
        wsInstructions['!cols'] = [{ wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

        let buffer;
        let contentType;
        let filename;

        if (format === 'csv') {
            buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
            contentType = 'text/csv';
            filename = 'clients_import_template.csv';
        } else {
            buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename = 'clients_import_template.xlsx';
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Template download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
