import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getAllTickets } = await import('@/lib/tickets');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const slaStatus = searchParams.get('slaStatus');
    const bindType = searchParams.get('bindType');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getAllTickets({ status, slaStatus, bindType, page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin tickets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
