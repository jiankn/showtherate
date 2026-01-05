/**
 * 管理后台未读工单数量 API
 * GET /api/admin/tickets/unread-count - 获取管理后台未读工单数量
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { getAdminUnreadTicketCount } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 检查是否为管理员
        if (session.user.email !== 'jiankn@gmail.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const count = await getAdminUnreadTicketCount();

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Admin unread ticket count GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
