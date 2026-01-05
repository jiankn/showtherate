/**
 * Closing Script Templates API
 * GET /api/scripts/templates
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { CLOSING_SCRIPT_TEMPLATES } = await import('@/lib/scriptTemplates');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ templates: CLOSING_SCRIPT_TEMPLATES });
    } catch (error) {
        console.error('Scripts templates GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
