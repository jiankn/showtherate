import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set([
  'new',
  'assigned',
  'processing',
  'waiting_customer',
  'resolved',
  'closed',
]);

export async function GET(request, { params }) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getTicketDetail, markTicketAsReadByAdmin } = await import('@/lib/tickets');
    const { id } = await params;
    const ticket = await getTicketDetail(id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // 管理员查看工单时自动标记为已读
    if (ticket.has_unread_customer_reply) {
      await markTicketAsReadByAdmin(id);
      ticket.has_unread_customer_reply = false;
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Admin ticket GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updateTicketStatus, getTicketDetail } = await import('@/lib/tickets');
    const { id } = await params;
    const body = await request.json();
    const { status, resolution } = body;

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const ticket = await getTicketDetail(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updated = await updateTicketStatus(id, status, resolution || null);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin ticket PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
