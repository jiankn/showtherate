/**
 * 单个工单 API
 * GET /api/tickets/[id] - 获取工单详情
 * PATCH /api/tickets/[id] - 更新工单状态
 */

import { NextResponse } from 'next/server';

// Force dynamic
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { getTicketDetail, markTicketAsRead } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const ticket = await getTicketDetail(id, session.user.id);

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // 用户查看工单时自动标记为已读
        if (ticket.has_unread_reply && ticket.requester_id === session.user.id) {
            await markTicketAsRead(id, session.user.id);
            ticket.has_unread_reply = false;
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Ticket GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { updateTicketStatus, getTicketDetail } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, resolution } = body;

        // 检查权限（只有工单创建者或客服可以更新）
        const ticket = await getTicketDetail(id);
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // 用户只能关闭自己的工单
        if (ticket.requester_id === session.user.id) {
            if (status && !['closed'].includes(status)) {
                return NextResponse.json(
                    { error: 'Users can only close their own tickets' },
                    { status: 403 }
                );
            }
        }

        const updated = await updateTicketStatus(id, status, resolution);

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Ticket PATCH error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
