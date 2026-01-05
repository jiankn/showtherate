import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { addTicketReply, getTicketDetail } = await import('@/lib/tickets');
    const { id } = await params;
    const body = await request.json();
    const { body: messageBody, attachments } = body;

    if (!messageBody?.trim()) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const ticket = await getTicketDetail(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const message = await addTicketReply({
      ticketId: id,
      authorId: adminUser.id,
      authorEmail: adminUser.email,
      authorName: adminUser.user_metadata?.name || adminUser.email,
      authorType: 'staff',
      body: messageBody,
      source: 'web',
      attachments: attachments || [],
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Admin ticket message POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
