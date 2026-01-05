'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../../admin.module.css';

const STATUS_LABELS = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past due',
  unpaid: 'Past due',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
};

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Trial', value: 'trialing' },
  { label: 'Past due', value: 'past_due' },
];

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'USD',
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/subscriptions?limit=100');
        if (!res.ok) {
          throw new Error('Failed to load subscriptions');
        }
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
        setError('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      const status = sub.status;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && status === 'active') ||
        (filter === 'trialing' && status === 'trialing') ||
        (filter === 'past_due' && (status === 'past_due' || status === 'unpaid'));

      if (!matchesFilter) return false;

      if (!normalized) return true;
      const haystack = [sub.name, sub.email, sub.plan, sub.planId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [subscriptions, filter, query]);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Subscriptions</h2>
          <p className={styles.sectionNote}>Track active plans, renewals, and risk</p>
        </div>
        <button className={styles.buttonPrimary} type="button">Export list</button>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div className={styles.chipRow}>
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`${styles.chip} ${filter === item.value ? styles.chipActive : ''}`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.searchBox}>
            <span>Filter</span>
            <input
              className={styles.searchInput}
              placeholder="Search customers"
              aria-label="Search customers"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading subscriptions...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>No subscriptions found</div>
        ) : (
          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <div>Customer</div>
              <div>Plan</div>
              <div>Status</div>
              <div>MRR</div>
              <div>Renewal</div>
            </div>
            {filtered.map((row) => (
              <div key={row.id} className={styles.tableRow}>
                <div className={styles.tableCellTitle}>{row.name}</div>
                <div>{row.plan}</div>
                <div>
                  <span
                    className={`${styles.pill} ${
                      row.status === 'past_due' || row.status === 'unpaid'
                        ? styles.pillRisk
                        : row.status === 'trialing'
                        ? styles.pillWarn
                        : styles.pillOk
                    }`}
                  >
                    {STATUS_LABELS[row.status] || row.status}
                  </span>
                </div>
                <div>{row.mrr ? formatCurrency(row.mrr.amount, row.mrr.currency) : '-'}</div>
                <div>
                  <div>{formatDate(row.renewal)}</div>
                  <div className={styles.listMeta}>{row.risk}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

