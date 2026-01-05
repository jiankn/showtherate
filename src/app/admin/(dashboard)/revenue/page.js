'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../../admin.module.css';

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'USD',
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminRevenuePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/revenue');
        if (!res.ok) {
          throw new Error('Failed to load revenue');
        }
        const payload = await res.json();
        setData(payload);
      } catch (err) {
        console.error('Failed to load revenue:', err);
        setError('Failed to load revenue');
      } finally {
        setLoading(false);
      }
    };

    loadRevenue();
  }, []);

  const bars = useMemo(() => {
    const totals = data?.dailyTotals || [];
    if (totals.length === 0) {
      return Array.from({ length: 12 }, () => 20);
    }
    const values = totals.map((item) => item.amount || 0);
    const maxValue = Math.max(...values, 1);
    const slice = values.slice(-12);
    return slice.map((value) => Math.max(8, Math.round((value / maxValue) * 100)));
  }, [data?.dailyTotals]);

  const summary = data?.summary;

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Revenue</h2>
          <p className={styles.sectionNote}>Monthly totals and billing activity</p>
        </div>
        <button className={styles.buttonPrimary} type="button">Download report</button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading revenue...</div>
      ) : error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : !data?.available ? (
        <div className={styles.emptyState}>Stripe not configured. Revenue data unavailable.</div>
      ) : (
        <>
          <div className={styles.cardGrid}>
            {[
              { label: 'Paid this month', value: summary?.paidTotal, delta: '' },
              { label: 'Refunded', value: summary?.refundedTotal, delta: '' },
              { label: 'Net revenue', value: summary?.netTotal, delta: '' },
              { label: 'Collections due', value: summary?.openTotal, delta: '' },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`${styles.card} ${styles.reveal}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={styles.statLabel}>{item.label}</div>
                <div className={styles.statValue}>{formatCurrency(item.value, summary?.currency)}</div>
                <span className={`${styles.statDelta} ${item.label === 'Refunded' ? styles.deltaDown : styles.deltaUp}`}>
                  {item.delta || '—'}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.panelGrid}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Monthly revenue trend</h3>
                  <p className={styles.sectionNote}>Daily aggregation for the current month</p>
                </div>
                <button className={styles.buttonGhost} type="button">View breakdown</button>
              </div>
              <div className={styles.miniChart}>
                {bars.map((bar, index) => (
                  <div key={`${bar}-${index}`} className={styles.miniBar} style={{ height: `${bar}%` }} />
                ))}
              </div>
            </div>
            <div className={`${styles.card} ${styles.cardMuted}`}>
              <h3 className={styles.sectionTitle}>Revenue by plan (MRR)</h3>
              <div className={styles.list}>
                {(data?.byPlan || []).length === 0 ? (
                  <div className={styles.emptyState}>No active subscriptions</div>
                ) : (
                  data.byPlan.map((item) => (
                    <div key={item.plan} className={styles.listItem}>
                      <div>
                        <p className={styles.listTitle}>{item.plan}</p>
                        <p className={styles.listMeta}>{item.count} accounts</p>
                      </div>
                      <strong>{formatCurrency(item.amount, item.currency)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Recent invoices</h3>
            <div className={styles.table}>
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div>Invoice</div>
                <div>Customer</div>
                <div>Status</div>
                <div>Amount</div>
                <div>Date</div>
              </div>
              {(data?.invoices || []).map((invoice) => (
                <div key={invoice.id} className={styles.tableRow}>
                  <div className={styles.tableCellTitle}>{invoice.id}</div>
                  <div>{invoice.customer}</div>
                  <div>
                    <span
                      className={`${styles.pill} ${
                        invoice.status === 'paid'
                          ? styles.pillOk
                          : invoice.status === 'open' || invoice.status === 'past_due'
                          ? styles.pillWarn
                          : styles.pillOk
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <div>{formatCurrency(invoice.amount, invoice.currency)}</div>
                  <div>{formatDate(invoice.created)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

