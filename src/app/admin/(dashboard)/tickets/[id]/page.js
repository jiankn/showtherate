'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FemaleAgentIcon } from '@/components/Icons';
import { useAdminConfirm } from '../../../AdminConfirm';
import styles from '../../../admin.module.css';

const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  processing: 'In progress',
  waiting_customer: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function AdminTicketDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : params?.id?.[0];
  const { confirm } = useAdminConfirm();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isClosed = useMemo(() => {
    return ticket?.status === 'closed' || ticket?.status === 'resolved';
  }, [ticket?.status]);

  useEffect(() => {
    if (!id) return;
    const loadTicket = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/admin/tickets/${id}`);
        if (!res.ok) {
          throw new Error('Ticket not found');
        }
        const data = await res.json();

        // API 层已自动标记工单为已读
        setTicket(data);
      } catch (err) {
        console.error('Failed to load ticket:', err);
        setError('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText }),
      });

      if (!res.ok) {
        throw new Error('Failed to send reply');
      }

      setReplyText('');
      const updated = await fetch(`/api/admin/tickets/${id}`);
      const data = await updated.json();
      setTicket(data);
    } catch (err) {
      console.error('Failed to send reply:', err);
      setError('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    const confirmed = await confirm('Are you sure you want to close this ticket?', {
      title: 'Close Ticket',
      type: 'warning',
      confirmText: 'Close',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', resolution: resolution || null }),
      });

      if (!res.ok) {
        throw new Error('Failed to close ticket');
      }

      const data = await res.json();
      setTicket((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to close ticket:', err);
      setError('Failed to close ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async () => {
    const confirmed = await confirm('Reopen this ticket? This will allow the customer to continue the conversation.', {
      title: 'Reopen Ticket',
      type: 'info',
      confirmText: 'Reopen',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' }),
      });

      if (!res.ok) {
        throw new Error('Failed to reopen ticket');
      }

      const data = await res.json();
      setTicket((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to reopen ticket:', err);
      setError('Failed to reopen ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.emptyState}>Loading ticket...</div>;
  }

  if (error) {
    return <div className={styles.emptyState}>{error}</div>;
  }

  if (!ticket) {
    return (
      <div className={styles.emptyState}>
        Ticket not found. <Link href="/admin/tickets">Back to tickets</Link>
      </div>
    );
  }

  return (
    <div className={styles.ticketDetail}>
      <div className={styles.ticketHeader}>
        <div>
          <Link href="/admin/tickets" className={styles.backLink}>Back to tickets</Link>
          <h2 className={styles.sectionTitle}>{ticket.title}</h2>
          <div className={styles.ticketMeta}>
            <span className={styles.ticketId}>{ticket.ticket_no}</span>
            <span className={styles.pill}>{STATUS_LABELS[ticket.status] || ticket.status}</span>
            <span className={styles.listMeta}>Created {formatDate(ticket.created_at)}</span>
          </div>
        </div>
        {!isClosed ? (
          <button className={styles.buttonPrimary} type="button" onClick={handleClose} disabled={submitting}>
            Close ticket
          </button>
        ) : (
          <button className={styles.buttonPrimary} type="button" onClick={handleReopen} disabled={submitting}>
            Reopen ticket
          </button>
        )}
      </div>

      <div className={styles.ticketGrid}>
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Conversation</h3>
          <div className={styles.messageList}>
            {ticket.messages?.map((message) => {
              const isStaff = message.author_type === 'staff';
              const displayName = isStaff ? 'Jane' : (message.author_name || 'User');
              const userInitial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={message.id}
                  className={`${styles.messageItem} ${isStaff ? styles.messageStaff : styles.messageCustomer}`}
                >
                  <div className={styles.messageHeader}>
                    <div className={styles.avatarWrapper}>
                      {isStaff ? (
                        <FemaleAgentIcon className={styles.staffAvatar} />
                      ) : (
                        <div className={styles.userAvatar}>{userInitial}</div>
                      )}
                    </div>
                    <span>{displayName}</span>
                    <span className={styles.listMeta}>{formatDate(message.created_at)}</span>
                  </div>
                  <div className={styles.messageBody}>{message.body}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardMuted}`}>
          <h3 className={styles.sectionTitle}>Ticket details</h3>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Requester</p>
                <p className={styles.listMeta}>{ticket.requester_email}</p>
              </div>
              <span className={styles.pill}>{ticket.priority}</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>SLA status</p>
                <p className={styles.listMeta}>{ticket.sla_status || 'normal'}</p>
              </div>
              <span className={styles.pill}>{ticket.status}</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Bind</p>
                <p className={styles.listMeta}>{ticket.bind_type}</p>
              </div>
              <span className={styles.listMeta}>{ticket.bind_id || '-'}</span>
            </div>
          </div>

          {isClosed ? (
            <div className={styles.list}>
              <div className={styles.listItem}>
                <div>
                  <p className={styles.listTitle}>Resolution</p>
                  <p className={styles.listMeta}>{ticket.resolution || 'No resolution notes provided'}</p>
                </div>
                <span className={styles.pill}>{STATUS_LABELS[ticket.status]}</span>
              </div>
              <div className={styles.actionRow}>
                <button
                  className={styles.buttonPrimary}
                  type="button"
                  onClick={handleReopen}
                  disabled={submitting}
                >
                  {submitting ? 'Reopening...' : 'Reopen ticket'}
                </button>
              </div>
            </div>
          ) : (
            <form className={styles.replyForm} onSubmit={handleReply}>
              <label>
                Reply
                <textarea
                  className={styles.textarea}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Write a reply to the customer..."
                  rows={4}
                />
              </label>
              <label>
                Resolution (optional)
                <textarea
                  className={styles.textarea}
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  placeholder="Add resolution notes for closing..."
                  rows={3}
                />
              </label>
              <div className={styles.actionRow}>
                <button
                  className={styles.buttonPrimary}
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                >
                  {submitting ? 'Sending...' : 'Send reply'}
                </button>
                <button
                  className={styles.buttonGhost}
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Close ticket
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
