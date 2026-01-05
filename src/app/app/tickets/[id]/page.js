'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/GlobalToast';
import { ArrowLeftIcon, FemaleAgentIcon } from '@/components/Icons';
import styles from './page.module.css';

const STATUS_LABELS = {
    new: { label: 'New', color: '#3B82F6' },
    assigned: { label: 'Assigned', color: '#10B981' },
    processing: { label: 'In Progress', color: '#F59E0B' },
    waiting_customer: { label: 'Awaiting Reply', color: '#8B5CF6' },
    resolved: { label: 'Resolved', color: '#10B981' },
    closed: { label: 'Closed', color: '#6B7280' },
};

export default function TicketDetailPage({ params }) {
    const { id } = use(params);
    const { toast } = useToast();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadTicket();
    }, [id]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [ticket?.messages]);

    const loadTicket = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/tickets/${id}`);
            if (!res.ok) {
                throw new Error('Ticket not found');
            }
            const data = await res.json();

            // API 层已自动标记工单为已读
            // 通知侧边栏刷新未读数量
            window.dispatchEvent(new CustomEvent('ticketStatusUpdated'));
            localStorage.setItem('ticketStatusUpdate', Date.now().toString());

            setTicket(data);
        } catch (err) {
            console.error('Failed to load ticket:', err);
            toast.error('Failed to load ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            setSubmitting(true);
            const res = await fetch(`/api/tickets/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: replyText }),
            });

            if (!res.ok) {
                throw new Error('Failed to send reply');
            }

            setReplyText('');
            await loadTicket();
            toast.success('Reply sent');
        } catch (err) {
            console.error('Failed to send reply:', err);
            toast.error('Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!confirm('Are you sure you want to close this ticket?')) return;

        try {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'closed' }),
            });

            if (!res.ok) {
                throw new Error('Failed to close ticket');
            }

            await loadTicket();
            toast.success('Ticket closed');
        } catch (err) {
            console.error('Failed to close ticket:', err);
            toast.error('Failed to close ticket');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className={styles.page}>
                <div className={styles.notFound}>
                    <h2>Ticket Not Found</h2>
                    <Link href="/app/tickets">Back to Tickets</Link>
                </div>
            </div>
        );
    }

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/app/tickets" className={styles.backBtn}>
                    <ArrowLeftIcon style={{ width: 18, height: 18 }} />
                    Back to Tickets
                </Link>
                <div className={styles.headerMain}>
                    <div className={styles.headerInfo}>
                        <span className={styles.ticketNo}>{ticket.ticket_no}</span>
                        <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: STATUS_LABELS[ticket.status]?.color }}
                        >
                            {STATUS_LABELS[ticket.status]?.label || ticket.status}
                        </span>
                    </div>
                    <h1>{ticket.title}</h1>
                    <div className={styles.meta}>
                        <span>Created {formatDate(ticket.created_at)}</span>
                        {ticket.first_response_at && (
                            <span> • First response {formatDate(ticket.first_response_at)}</span>
                        )}
                    </div>
                </div>
                {!isClosed && (
                    <button onClick={handleCloseTicket} className={styles.closeBtn}>
                        Close Ticket
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className={styles.messages}>
                {ticket.messages?.map((msg) => {
                    const isStaff = msg.author_type === 'staff';
                    const displayName = isStaff ? 'Jane' : (msg.author_name || 'User');
                    const userInitial = displayName.charAt(0).toUpperCase();

                    return (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${isStaff ? styles.staff : styles.customer}`}
                        >
                            <div className={styles.messageHeader}>
                                <div className={styles.avatarWrapper}>
                                    {isStaff ? (
                                        <FemaleAgentIcon className={styles.staffAvatar} />
                                    ) : (
                                        <div className={styles.userAvatar}>{userInitial}</div>
                                    )}
                                </div>
                                <span className={styles.author}>
                                    {displayName}
                                </span>
                                <span className={styles.authorType}>
                                    {isStaff ? 'Support' : ''}
                                </span>
                                <span className={styles.time}>{formatDate(msg.created_at)}</span>
                                {msg.source === 'email' && (
                                    <span className={styles.source}>Email</span>
                                )}
                            </div>
                            <div className={styles.messageBody}>
                                {msg.body}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Form */}
            {!isClosed && (
                <form onSubmit={handleReply} className={styles.replyForm}>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className={styles.replyInput}
                        rows={3}
                    />
                    <div className={styles.replyActions}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={submitting || !replyText.trim()}
                            style={{ minWidth: '120px' }}
                        >
                            {submitting ? 'Sending...' : 'Reply'}
                        </button>
                    </div>
                </form>
            )}

            {isClosed && (
                <div className={styles.closedNotice}>
                    This ticket is closed. Please create a new ticket if you need further assistance.
                </div>
            )}
        </div>
    );
}
