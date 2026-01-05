import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';
import { getPlanLabel, getStripePriceMap, getMonthlyAmount } from '@/lib/adminStripe';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;
    let query = supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, status, plan, current_period_end, cancel_at_period_end', { count: 'exact' })
      .order('current_period_end', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: subscriptions, count } = await query;

    const userIds = subscriptions?.map((sub) => sub.user_id).filter(Boolean) || [];
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    const userById = new Map((users || []).map((user) => [user.id, user]));

    const priceIds = subscriptions?.map((sub) => sub.plan).filter(Boolean) || [];
    const priceMap = await getStripePriceMap(priceIds);

    const now = new Date();
    const result = (subscriptions || []).map((sub) => {
      const user = userById.get(sub.user_id);
      const planLabel = getPlanLabel(sub.plan);
      const price = priceMap[sub.plan];
      const monthly = getMonthlyAmount(price);
      const renewalDate = sub.current_period_end ? new Date(sub.current_period_end) : null;
      let risk = 'On track';
      if (sub.status === 'past_due' || sub.status === 'unpaid') {
        risk = 'Risk';
      } else if (renewalDate && renewalDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        risk = 'Warn';
      }

      return {
        id: sub.id,
        name: user?.name || user?.email || 'Unknown',
        email: user?.email || '',
        status: sub.status,
        plan: planLabel,
        planId: sub.plan,
        mrr: monthly,
        renewal: renewalDate ? renewalDate.toISOString() : null,
        risk,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    });

    return NextResponse.json({
      subscriptions: result,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

