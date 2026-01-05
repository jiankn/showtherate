import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';
import { getPlanLabel, getStripePriceMap, getMonthlyAmount, getStripeRevenueData } from '@/lib/adminStripe';

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ['active', 'trialing'];

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');

    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, status, plan, current_period_end')
      .in('status', ACTIVE_STATUSES);

    const planIds = subscriptions?.map((sub) => sub.plan).filter(Boolean) || [];
    const priceMap = await getStripePriceMap(planIds);

    let mrrTotal = 0;
    subscriptions?.forEach((sub) => {
      const price = priceMap[sub.plan];
      const monthly = getMonthlyAmount(price);
      if (monthly?.amount) {
        mrrTotal += monthly.amount;
      }
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const revenueData = await getStripeRevenueData({ start: monthStart, end: monthEnd });

    const { count: slaRisk } = await supabaseAdmin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('sla_status', ['warn', 'overdue'])
      .not('status', 'in', '("resolved","closed")');

    const { data: ticketQueue } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_no, title, sla_status, status, updated_at')
      .not('status', 'in', '("resolved","closed")')
      .order('updated_at', { ascending: false })
      .limit(5);

    const renewalEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const { data: renewalsRaw } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, status, plan, current_period_end')
      .gte('current_period_end', now.toISOString())
      .lte('current_period_end', renewalEnd.toISOString())
      .order('current_period_end', { ascending: true })
      .limit(5);

    const renewalUserIds = renewalsRaw?.map((item) => item.user_id).filter(Boolean) || [];
    const { data: renewalUsers } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', renewalUserIds);

    const userById = new Map((renewalUsers || []).map((user) => [user.id, user]));

    const renewals = (renewalsRaw || []).map((item) => {
      const user = userById.get(item.user_id);
      const label = user?.name || user?.email || 'Unknown';
      const date = item.current_period_end ? new Date(item.current_period_end) : null;
      const planLabel = getPlanLabel(item.plan);
      return {
        title: label,
        meta: `${planLabel} - renews ${date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}`,
        status: item.status === 'past_due' ? 'Risk' : 'On track',
      };
    });

    const stats = [
      {
        label: 'Active subscriptions',
        value: subscriptions?.length || 0,
        delta: '',
        trend: 'up',
      },
      {
        label: 'Monthly revenue',
        value: revenueData.paidTotal,
        delta: '',
        trend: 'up',
        currency: revenueData.currency,
      },
      {
        label: 'MRR',
        value: mrrTotal,
        delta: '',
        trend: 'up',
        currency: revenueData.currency,
      },
      {
        label: 'SLA risk',
        value: slaRisk || 0,
        delta: '',
        trend: 'down',
      },
    ];

    return NextResponse.json({
      stats,
      revenueSeries: revenueData.dailyTotals,
      ticketQueue: (ticketQueue || []).map((ticket) => ({
        title: ticket.title,
        meta: ticket.ticket_no,
        status: ticket.sla_status === 'overdue' ? 'Risk' : ticket.sla_status === 'warn' ? 'Warn' : 'On track',
      })),
      renewals,
      updatedAt: now.toISOString(),
      revenueAvailable: revenueData.available,
    });
  } catch (error) {
    console.error('Admin overview GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

