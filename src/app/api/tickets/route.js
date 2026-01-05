/**
 * 工单 API
 * GET /api/tickets - 获取用户工单列表
 * POST /api/tickets - 创建新工单
 * PATCH /api/tickets - 用户关闭或激活工单
 * DELETE /api/tickets - 批量删除工单
 * GET /api/tickets/unread-count - 获取未读工单数量
 */

import { NextResponse } from 'next/server';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { getUserTickets } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await getUserTickets(session.user.id, { status, page, limit });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Tickets GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { updateTicketStatus } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ticketId, action, status } = body;

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
        }

        let newStatus;
        if (action) {
            // 兼容旧的action参数方式
            if (!['close', 'activate'].includes(action)) {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }
            if (action === 'close') {
                newStatus = 'closed';
            } else if (action === 'activate') {
                newStatus = 'processing';
            }
        } else if (status) {
            // 直接状态更新方式
            const validStatuses = ['assigned', 'closed', 'processing'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            newStatus = status;
        } else {
            return NextResponse.json({ error: 'Either action or status is required' }, { status: 400 });
        }

        const updatedTicket = await updateTicketStatus(ticketId, newStatus, null, session.user.id);
        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error('Tickets PATCH error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { createTicket } = await import('@/lib/tickets');
        const { sendAdminTicketNotification } = await import('@/lib/email/mailer');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, bindType, bindId, priority } = body;

        // 验证必填字段
        if (!title || !bindType) {
            return NextResponse.json(
                { error: 'Title and bind type are required' },
                { status: 400 }
            );
        }

        // 验证绑定类型
        const validBindTypes = ['comparison', 'client', 'subscription', 'general'];
        if (!validBindTypes.includes(bindType)) {
            return NextResponse.json(
                { error: 'Invalid bind type' },
                { status: 400 }
            );
        }

        const ticket = await createTicket({
            title,
            description,
            bindType,
            bindId: bindId || null,
            requesterId: session.user.id,
            requesterEmail: session.user.email,
            requesterName: session.user.name,
            priority: priority || 'normal',
        });

        try {
            await sendAdminTicketNotification(ticket, {
                email: session.user.email,
            });
        } catch (notifyError) {
            console.error('Failed to send ticket notification:', notifyError);
        }

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Tickets POST error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { batchDeleteTickets } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const ids = searchParams.get('ids');

        if (!ids) {
            return NextResponse.json({ error: 'No ticket IDs provided' }, { status: 400 });
        }

        const ticketIds = ids.split(',').filter(Boolean);
        const { count } = await batchDeleteTickets(ticketIds, session.user.id);

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error('Tickets DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
