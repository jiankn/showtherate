import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';
import { getPlanLabel, getStripePriceMap, getMonthlyAmount, getStripeRevenueData } from '@/lib/adminStripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const revenueData = await getStripeRevenueData({ start: monthStart, end: monthEnd });

    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan, status')
      .in('status', ['active', 'trialing']);

    const priceIds = subscriptions?.map((sub) => sub.plan).filter(Boolean) || [];
    const priceMap = await getStripePriceMap(priceIds);

    const byPlan = {};
    (subscriptions || []).forEach((sub) => {
      const planLabel = getPlanLabel(sub.plan);
      const price = priceMap[sub.plan];
      const monthly = getMonthlyAmount(price);
      if (!monthly?.amount) return;
      if (!byPlan[planLabel]) {
        byPlan[planLabel] = {
          plan: planLabel,
          amount: 0,
          currency: monthly.currency,
          count: 0,
        };
      }
      byPlan[planLabel].amount += monthly.amount;
      byPlan[planLabel].count += 1;
    });

    return NextResponse.json({
      available: revenueData.available,
      error: revenueData.error || null,
      summary: {
        paidTotal: revenueData.paidTotal,
        refundedTotal: revenueData.refundedTotal,
        netTotal: revenueData.netTotal,
        openTotal: revenueData.openTotal,
        currency: revenueData.currency,
      },
      dailyTotals: revenueData.dailyTotals,
      invoices: revenueData.invoices.slice(0, 10),
      byPlan: Object.values(byPlan),
    });
  } catch (error) {
    console.error('Admin revenue GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

