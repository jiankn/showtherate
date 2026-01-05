/**
 * 未读工单数量 API
 * GET /api/tickets/unread-count - 获取用户未读工单数量
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { getUnreadTicketCount } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const count = await getUnreadTicketCount(session.user.id);

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Unread ticket count GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
