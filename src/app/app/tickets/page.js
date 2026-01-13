'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/GlobalToast';
import { PlusIcon, ChartIcon, TrashIcon, CheckIcon, PlayIcon } from '@/components/Icons';
import styles from './page.module.css';

const STATUS_LABELS = {
    new: { label: 'New', color: '#3B82F6' },
    assigned: { label: 'Assigned', color: '#10B981' },
    processing: { label: 'In Progress', color: '#F59E0B' },
    waiting_customer: { label: 'Waiting on you', color: '#8B5CF6' },
    resolved: { label: 'Resolved', color: '#10B981' },
    closed: { label: 'Closed', color: '#6B7280' },
};

const PRIORITY_LABELS = {
    low: { label: 'Low', color: '#6B7280' },
    normal: { label: 'Normal', color: '#3B82F6' },
    high: { label: 'High', color: '#F59E0B' },
    urgent: { label: 'Urgent', color: '#EF4444' },
};

export default function TicketsPage() {
    const { toast, confirm } = useToast();
    const router = useRouter();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // 批量选择状态
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadTickets();
    }, [filter]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setSelectedIds(new Set()); // 重置选择
            const params = new URLSearchParams();
            if (filter !== 'all') {
                params.set('status', filter);
            }
            const res = await fetch(`/api/tickets?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (err) {
            console.error('Failed to load tickets:', err);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(tickets.map(t => t.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id, checked) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        setSelectedIds(next);
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;

        const confirmed = await confirm(
            `Are you sure you want to delete ${selectedIds.size} tickets? This action cannot be undone.`,
            {
                type: 'danger',
                confirmText: 'Delete',
                title: 'Delete Tickets'
            }
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            const idsObj = Array.from(selectedIds);
            const res = await fetch(`/api/tickets?ids=${idsObj.join(',')}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete tickets');
            }

            const data = await res.json();
            toast.success(`Deleted ${data.count} tickets`);
            loadTickets(); // Reload list
        } catch (err) {
            console.error('Failed to delete tickets:', err);
            toast.error('Failed to delete tickets');
        } finally {
            setDeleting(false);
        }
    };

    const handleCloseTicket = async (ticketId, ticketTitle) => {
        const confirmed = await confirm(
            `Are you sure you want to close "${ticketTitle}"? This indicates the issue has been resolved.`,
            {
                type: 'info',
                confirmText: 'Close Ticket',
                title: 'Close Ticket'
            }
        );

        if (!confirmed) return;

        try {
            const res = await fetch('/api/tickets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, action: 'close' }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to close ticket');
            }

            toast.success('Ticket closed successfully');
            loadTickets(); // Reload list

            // 通知侧边栏刷新未读数量
            // 使用localStorage来实现跨组件通信
            localStorage.setItem('ticketStatusUpdate', Date.now().toString());
            // 同时尝试postMessage作为后备
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'TICKET_STATUS_UPDATED' }, '*');
            }
        } catch (err) {
            console.error('Failed to close ticket:', err);
            toast.error(err.message || 'Failed to close ticket');
        }
    };

    const handleActivateTicket = async (ticketId, ticketTitle) => {
        const confirmed = await confirm(
            `Are you sure you want to reactivate "${ticketTitle}"? This will allow you to continue the conversation with support.`,
            {
                type: 'info',
                confirmText: 'Reactivate Ticket',
                title: 'Reactivate Ticket'
            }
        );

        if (!confirmed) return;

        try {
            const res = await fetch('/api/tickets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, action: 'activate' }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to reactivate ticket');
            }

            toast.success('Ticket reactivated successfully');
            loadTickets(); // Reload list

            // 通知侧边栏刷新未读数量
            // 使用localStorage来实现跨组件通信
            localStorage.setItem('ticketStatusUpdate', Date.now().toString());
            // 同时尝试postMessage作为后备
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'TICKET_STATUS_UPDATED' }, '*');
            }
        } catch (err) {
            console.error('Failed to reactivate ticket:', err);
            toast.error(err.message || 'Failed to reactivate ticket');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSLABadge = (ticket) => {
        if (ticket.first_response_at) {
            return null;
        }
        const status = ticket.sla_status;
        if (status === 'overdue') {
            return <span className={styles.slaBadge} data-status="overdue">Overdue</span>;
        }
        if (status === 'warn') {
            return <span className={styles.slaBadge} data-status="warn">Due Soon</span>;
        }
        return null;
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Support</h1>
                    <p>Get help with comparisons, sharing, and account issues</p>
                </div>
                <Link href="/app/tickets/new" className="btn btn-primary">
                    <PlusIcon style={{ width: 18, height: 18 }} />
                    New Request
                </Link>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                {['all', 'new', 'processing', 'waiting_customer', 'resolved', 'closed'].map((f) => (
                    <button
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : STATUS_LABELS[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Ticket List */}
            {loading ? (
                <div className={styles.loading}>Loading...</div>
            ) : tickets.length === 0 ? (
                <div className={styles.empty}>
                    <ChartIcon className={styles.emptyIcon} />
                    <h3>No support requests yet</h3>
                    <p>You haven&apos;t submitted any support requests</p>
                    <Link href="/app/tickets/new" className="btn btn-primary">
                        New Request
                    </Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {/* List Header with Select All */}
                    <div className={styles.listHeader}>
                        <div className={styles.checkCol}>
                            <input
                                type="checkbox"
                                checked={selectedIds.size === tickets.length && tickets.length > 0}
                                onChange={handleSelectAll}
                                className={styles.checkbox}
                            />
                        </div>
                        <div className={styles.infoCol}>Request details</div>
                    </div>

                    {tickets.map((ticket) => {
                        // 判断是否未读：使用 has_unread_reply 字段
                        const isUnread = ticket.has_unread_reply === true;

                        return (
                            <div
                                key={ticket.id}
                                className={`${styles.listRow} ${selectedIds.has(ticket.id) ? styles.selected : ''} ${isUnread ? styles.unread : ''}`}
                            >
                                <div className={styles.checkboxWrapper}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(ticket.id)}
                                        onChange={(e) => handleSelectOne(ticket.id, e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                </div>
                                <div className={styles.ticketContainer}>
                                    <Link
                                        href={`/app/tickets/${ticket.id}`}
                                        className={styles.ticketCard}
                                    >
                                        <div className={styles.ticketHeader}>
                                            {isUnread && <span className={styles.unreadDot} />}
                                            <span className={styles.ticketNo}>{ticket.ticket_no}</span>
                                            <span
                                                className={styles.statusBadge}
                                                style={{ backgroundColor: STATUS_LABELS[ticket.status]?.color }}
                                            >
                                                {STATUS_LABELS[ticket.status]?.label || ticket.status}
                                            </span>
                                            {getSLABadge(ticket)}
                                        </div>
                                        <h3 className={`${styles.ticketTitle} ${isUnread ? styles.unreadTitle : ''}`}>{ticket.title}</h3>
                                        <div className={styles.ticketMeta}>
                                            <span className={styles.priority} data-priority={ticket.priority}>
                                                {PRIORITY_LABELS[ticket.priority]?.label || ticket.priority}
                                            </span>
                                            <span className={styles.bindType}>
                                                {ticket.bind_type === 'general' ? 'General' : ticket.bind_type}
                                            </span>
                                            <span className={styles.date}>{formatDate(ticket.created_at)}</span>
                                        </div>
                                    </Link>
                                    <div className={styles.ticketActions}>
                                        {['new', 'assigned', 'processing', 'waiting_customer'].includes(ticket.status) && (
                                            <button
                                                className={`${styles.ticketActionBtn} ${styles.danger}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleCloseTicket(ticket.id, ticket.title);
                                                }}
                                                title="Close ticket"
                                                type="button"
                                            >
                                                Close
                                            </button>
                                        )}
                                        {['resolved', 'closed'].includes(ticket.status) && (
                                            <button
                                                className={`${styles.ticketActionBtn} ${styles.success}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleActivateTicket(ticket.id, ticket.title);
                                                }}
                                                title="Reactivate ticket"
                                                type="button"
                                            >
                                                Reopen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Batch Actions Bar (Floating Bottom) */}
            {selectedIds.size > 0 && (
                <div className={styles.batchBar}>
                    <div className={styles.batchInfo}>
                        <span className={styles.batchCount}>{selectedIds.size}</span>
                        <span>Selected</span>
                    </div>
                    <div className={styles.batchActions}>
                        <button
                            className={styles.batchCancelBtn}
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Cancel
                        </button>
                        <div className={styles.batchDivider} />
                        <button
                            onClick={handleBatchDelete}
                            className={styles.batchDeleteBtn}
                            disabled={deleting}
                        >
                            <TrashIcon style={{ width: 16, height: 16 }} />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
