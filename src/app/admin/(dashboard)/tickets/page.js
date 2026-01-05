'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../../admin.module.css';

const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  processing: 'In progress',
  waiting_customer: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Closed', value: 'closed' },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tickets?limit=50');
      if (!res.ok) {
        throw new Error('Failed to load tickets');
      }
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    // 页面获焦时自动刷新数据（从详情页返回时）
    const handleFocus = () => loadTickets();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = ticket.status;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'open' && ['new', 'assigned', 'processing'].includes(status)) ||
        (filter === 'waiting' && status === 'waiting_customer') ||
        (filter === 'closed' && ['resolved', 'closed'].includes(status));

      if (!matchesFilter) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        ticket.ticket_no,
        ticket.title,
        ticket.requester_email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [tickets, filter, query]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Tickets</h2>
          <p className={styles.sectionNote}>SLA tracking for the next 8 working hours</p>
        </div>
        <button className={styles.buttonPrimary} type="button">New ticket</button>
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
              placeholder="Search tickets"
              aria-label="Search tickets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading tickets...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : filteredTickets.length === 0 ? (
          <div className={styles.emptyState}>No tickets found</div>
        ) : (
          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <div>Ticket</div>
              <div>Requester</div>
              <div>Status</div>
              <div>SLA</div>
              <div>Updated</div>
            </div>
            {filteredTickets.map((ticket) => {
              const isUnread = ticket.has_unread_customer_reply === true;

              return (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className={`${styles.tableRow} ${isUnread ? styles.tableRowUnread : ''}`}
                >
                  <div>
                    <div className={styles.tableCellTitle}>
                      {isUnread && <span className={styles.unreadDot} />}
                      {ticket.ticket_no}
                    </div>
                    <div className={styles.listMeta}>{ticket.title}</div>
                  </div>
                  <div>{ticket.requester_email}</div>
                  <div>
                    <span
                      className={`${styles.pill} ${['new', 'processing', 'waiting_customer'].includes(ticket.status)
                        ? styles.pillWarn
                        : ticket.status === 'closed'
                          ? styles.pillRisk
                          : styles.pillOk
                        }`}
                    >
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`${styles.pill} ${ticket.sla_status === 'overdue'
                        ? styles.pillRisk
                        : ticket.sla_status === 'warn'
                          ? styles.pillWarn
                          : styles.pillOk
                        }`}
                    >
                      {ticket.sla_status || 'normal'}
                    </span>
                  </div>
                  <div>
                    <div>{formatDate(ticket.updated_at)}</div>
                    <div className={styles.listMeta}>{PRIORITY_LABELS[ticket.priority] || ticket.priority}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
