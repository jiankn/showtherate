'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChartIcon, MoneyIcon, RocketIcon, PhoneIcon } from '../../../../components/Icons';
import styles from '../../admin.module.css';

const STAT_ICON_MAP = {
  'Active subscriptions': RocketIcon,
  'Monthly revenue': MoneyIcon,
  MRR: ChartIcon,
  'SLA risk': PhoneIcon,
};

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'USD',
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/overview');
        if (!res.ok) {
          throw new Error('Failed to load overview');
        }
        const payload = await res.json();
        setData(payload);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        setError('Failed to load overview');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const revenueBars = useMemo(() => {
    if (!data?.revenueSeries?.length) {
      return Array.from({ length: 12 }, () => 20);
    }
    const values = data.revenueSeries.map((item) => item.amount || 0);
    const maxValue = Math.max(...values, 1);
    const slice = values.slice(-12);
    return slice.map((value) => Math.max(8, Math.round((value / maxValue) * 100)));
  }, [data?.revenueSeries]);

  const stats = data?.stats || [];

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Executive snapshot</h2>
          <p className={styles.sectionNote}>
            {loading ? 'Loading...' : `Updated ${formatTime(data?.updatedAt)} PT`}
          </p>
        </div>
        <div className={styles.chipRow}>
          <span className={`${styles.chip} ${styles.chipActive}`}>This month</span>
          <span className={styles.chip}>Last 30 days</span>
          <span className={styles.chip}>Quarter</span>
        </div>
      </div>

      {error && <div className={styles.emptyState}>{error}</div>}

      <div className={styles.cardGrid}>
        {stats.map((stat, index) => {
          const Icon = STAT_ICON_MAP[stat.label] || ChartIcon;
          const value =
            stat.currency && typeof stat.value === 'number'
              ? formatCurrency(stat.value, stat.currency)
              : stat.value;
          const deltaLabel = stat.delta ? `${stat.delta} vs last month` : '—';
          return (
            <div
              key={stat.label}
              className={`${styles.card} ${styles.reveal}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className={styles.statRow}>
                <div>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <div className={styles.statValue}>{value}</div>
                </div>
                <Icon className={styles.navLinkIcon} />
              </div>
              <span className={`${styles.statDelta} ${stat.trend === 'down' ? styles.deltaDown : styles.deltaUp}`}>
                {deltaLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.panelGrid}>
        <div className={`${styles.card} ${styles.reveal}`} style={{ animationDelay: '0.35s' }}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Revenue pulse</h3>
              <p className={styles.sectionNote}>Daily revenue trend</p>
            </div>
            <button className={styles.buttonGhost} type="button">Export CSV</button>
          </div>
          {!data?.revenueAvailable && (
            <p className={styles.listMeta}>Stripe not configured. Revenue data unavailable.</p>
          )}
          <div className={styles.miniChart}>
            {revenueBars.map((bar, index) => (
              <div
                key={`${bar}-${index}`}
                className={styles.miniBar}
                style={{ height: `${bar}%` }}
              />
            ))}
          </div>
        </div>
        <div className={`${styles.card} ${styles.cardMuted} ${styles.reveal}`} style={{ animationDelay: '0.45s' }}>
          <h3 className={styles.sectionTitle}>Subscription health</h3>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Active subscriptions</p>
                <p className={styles.listMeta}>Current active + trialing accounts</p>
              </div>
              <span className={`${styles.pill} ${styles.pillOk}`}>{stats[0]?.value ?? 0}</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>SLA risk</p>
                <p className={styles.listMeta}>Tickets nearing SLA</p>
              </div>
              <span className={`${styles.pill} ${styles.pillWarn}`}>{stats[3]?.value ?? 0}</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Revenue coverage</p>
                <p className={styles.listMeta}>Stripe paid revenue this month</p>
              </div>
              <span className={`${styles.pill} ${styles.pillOk}`}>{stats[1]?.value ? 'Live' : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.panelGrid}>
        <div className={`${styles.card} ${styles.reveal}`} style={{ animationDelay: '0.55s' }}>
          <h3 className={styles.sectionTitle}>Renewals to watch</h3>
          <div className={styles.list}>
            {(data?.renewals || []).length === 0 ? (
              <div className={styles.emptyState}>No upcoming renewals</div>
            ) : (
              data.renewals.map((item) => (
                <div key={item.title} className={styles.listItem}>
                  <div>
                    <p className={styles.listTitle}>{item.title}</p>
                    <p className={styles.listMeta}>{item.meta}</p>
                  </div>
                  <span className={`${styles.pill} ${item.status === 'Risk' ? styles.pillRisk : item.status === 'Warn' ? styles.pillWarn : styles.pillOk}`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className={`${styles.card} ${styles.reveal}`} style={{ animationDelay: '0.65s' }}>
          <h3 className={styles.sectionTitle}>Ticket queue</h3>
          <div className={styles.list}>
            {(data?.ticketQueue || []).length === 0 ? (
              <div className={styles.emptyState}>No open tickets</div>
            ) : (
              data.ticketQueue.map((item) => (
                <div key={item.meta} className={styles.listItem}>
                  <div>
                    <p className={styles.listTitle}>{item.title}</p>
                    <p className={styles.listMeta}>{item.meta}</p>
                  </div>
                  <span className={`${styles.pill} ${item.status === 'Risk' ? styles.pillRisk : item.status === 'Warn' ? styles.pillWarn : styles.pillOk}`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

