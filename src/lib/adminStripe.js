const PLAN_CATALOG = [
  {
    priceId: process.env.STRIPE_STARTER_PASS_PRICE_ID,
    label: 'Starter Pass (7 Days)',
  },
  {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
    label: 'Monthly Subscription',
  },
  {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID,
    label: 'Annual Subscription',
  },
];

export function getPlanLabel(priceId) {
  if (!priceId) return 'Unknown';
  const match = PLAN_CATALOG.find((plan) => plan.priceId === priceId);
  return match?.label || priceId;
}

async function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  const { stripe } = await import('@/lib/stripe');
  return stripe;
}

export async function getStripePriceMap(priceIds = []) {
  const stripe = await getStripeClient();
  if (!stripe || priceIds.length === 0) {
    return {};
  }

  const uniqueIds = Array.from(new Set(priceIds.filter(Boolean)));
  const results = await Promise.all(
    uniqueIds.map(async (priceId) => {
      try {
        const price = await stripe.prices.retrieve(priceId);
        return [priceId, price];
      } catch (error) {
        console.warn('Failed to load Stripe price:', priceId, error?.message || error);
        return [priceId, null];
      }
    })
  );

  return Object.fromEntries(results);
}

export function getMonthlyAmount(price) {
  if (!price || typeof price.unit_amount !== 'number') {
    return null;
  }

  const currency = price.currency || 'usd';
  const interval = price.recurring?.interval;
  const intervalCount = price.recurring?.interval_count || 1;

  let amount = price.unit_amount;
  if (interval === 'year') {
    amount = amount / 12;
  } else if (interval === 'month') {
    amount = amount / intervalCount;
  } else if (interval === 'week') {
    amount = (amount * 52) / 12 / intervalCount;
  } else if (interval === 'day') {
    amount = (amount * 365) / 12 / intervalCount;
  }

  return {
    amount: Math.round(amount),
    currency,
  };
}

export async function getStripeRevenueData({ start, end, limit = 100 }) {
  const stripe = await getStripeClient();
  if (!stripe) {
    return {
      available: false,
      error: 'Stripe not configured',
      paidTotal: 0,
      refundedTotal: 0,
      netTotal: 0,
      openTotal: 0,
      currency: 'usd',
      dailyTotals: [],
      invoices: [],
    };
  }

  const startTs = Math.floor(start.getTime() / 1000);
  const endTs = Math.floor(end.getTime() / 1000);

  const [invoiceList, refunds] = await Promise.all([
    stripe.invoices.list({
      limit,
      created: { gte: startTs, lt: endTs },
    }),
    stripe.refunds.list({
      limit,
      created: { gte: startTs, lt: endTs },
    }),
  ]);

  let paidTotal = 0;
  let openTotal = 0;
  let currency = 'usd';
  const dailyMap = {};

  invoiceList.data.forEach((invoice) => {
    const invoiceCurrency = invoice.currency || 'usd';
    currency = invoiceCurrency;
    if (invoice.status === 'paid') {
      paidTotal += invoice.amount_paid || 0;
      const paidAt = invoice.status_transitions?.paid_at || invoice.created;
      if (paidAt) {
        const dateKey = new Date(paidAt * 1000).toISOString().slice(0, 10);
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + (invoice.amount_paid || 0);
      }
    } else if (invoice.status === 'open' || invoice.status === 'past_due') {
      openTotal += invoice.amount_due || 0;
    }
  });

  const refundedTotal = refunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
  const netTotal = paidTotal - refundedTotal;

  const dailyTotals = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const invoices = invoiceList.data.map((invoice) => ({
    id: invoice.number || invoice.id,
    customer: invoice.customer_name || invoice.customer_email || 'Unknown customer',
    amount: invoice.amount_paid || invoice.amount_due || 0,
    currency: invoice.currency || 'usd',
    status: invoice.status,
    created: invoice.created,
  }));

  return {
    available: true,
    paidTotal,
    refundedTotal,
    netTotal,
    openTotal,
    currency,
    dailyTotals,
    invoices,
  };
}

