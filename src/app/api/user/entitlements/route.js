/**
 * User Entitlements API
 * GET /api/user/entitlements - Get user's current quotas and status
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Lazy load dependencies at runtime
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { getUserQuotas } = await import('@/lib/entitlements');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const quotas = await getUserQuotas(session.user.id);

        return NextResponse.json(quotas);
    } catch (error) {
        console.error('Entitlements GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
