/**
 * 工单消息 API
 * POST /api/tickets/[id]/messages - 添加回复
 */

import { NextResponse } from 'next/server';

// Force dynamic
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { addTicketReply, getTicketDetail } = await import('@/lib/tickets');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { body: messageBody, attachments } = body;

        if (!messageBody?.trim()) {
            return NextResponse.json(
                { error: 'Message body is required' },
                { status: 400 }
            );
        }

        // 检查工单权限
        const ticket = await getTicketDetail(id, session.user.id);
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // 判断是客户还是客服
        const authorType = ticket.requester_id === session.user.id ? 'customer' : 'staff';

        const message = await addTicketReply({
            ticketId: id,
            authorId: session.user.id,
            authorEmail: session.user.email,
            authorName: session.user.name,
            authorType,
            body: messageBody,
            source: 'web',
            attachments: attachments || [],
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Ticket messages POST error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
