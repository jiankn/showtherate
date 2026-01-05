'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/GlobalToast';
import { ArrowLeftIcon } from '@/components/Icons';
import styles from './page.module.css';

const BIND_TYPES = [
    { value: 'general', label: 'General Question', description: 'Account, features, etc.' },
    { value: 'comparison', label: 'Comparison Issue', description: 'Related to a specific report' },
    { value: 'subscription', label: 'Billing Issue', description: 'Payments, plans, renewals' },
    { value: 'client', label: 'Client Issue', description: 'Related to a specific client' },
];

const PRIORITIES = [
    { value: 'low', label: 'Low', description: 'Non-urgent' },
    { value: 'normal', label: 'Normal', description: 'General issue' },
    { value: 'high', label: 'High', description: 'Affecting work' },
    { value: 'urgent', label: 'Urgent', description: 'Critical issue' },
];

export default function NewTicketPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        bindType: 'general',
        bindId: '',
        priority: 'normal',
    });

    const [bindOptions, setBindOptions] = useState([]);

    useEffect(() => {
        if (form.bindType === 'comparison') {
            loadComparisons();
        } else if (form.bindType === 'client') {
            loadClients();
        } else {
            setBindOptions([]);
        }
    }, [form.bindType]);

    const loadComparisons = async () => {
        try {
            const res = await fetch('/api/comparisons?limit=50');
            if (res.ok) {
                const data = await res.json();
                setBindOptions(data.comparisons?.map(c => ({
                    value: c.id,
                    label: c.title || `Comparison ${c.id.slice(0, 8)}`,
                })) || []);
            }
        } catch (err) {
            console.error('Failed to load comparisons:', err);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetch('/api/clients?limit=50');
            if (res.ok) {
                const data = await res.json();
                setBindOptions(data.clients?.map(c => ({
                    value: c.id,
                    label: c.name || c.email,
                })) || []);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        if (!form.description.trim()) {
            toast.error('Please describe your issue');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    bindType: form.bindType,
                    bindId: form.bindId || null,
                    priority: form.priority,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create');
            }

            const ticket = await res.json();
            toast.success(`Ticket ${ticket.ticket_no} created`);
            router.push(`/app/tickets/${ticket.id}`);
        } catch (err) {
            console.error('Failed to create ticket:', err);
            toast.error(err.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/app/tickets" className={styles.backBtn}>
                    <ArrowLeftIcon style={{ width: 18, height: 18 }} />
                    Back to Tickets
                </Link>
                <h1>New Ticket</h1>
                <p>Describe your issue and we&apos;ll get back to you soon</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Issue Type */}
                <div className={styles.field}>
                    <label>Issue Type *</label>
                    <div className={styles.typeGrid}>
                        {BIND_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                className={`${styles.typeCard} ${form.bindType === type.value ? styles.active : ''}`}
                                onClick={() => setForm({ ...form, bindType: type.value, bindId: '' })}
                            >
                                <span className={styles.typeLabel}>{type.label}</span>
                                <span className={styles.typeDesc}>{type.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Related Entity */}
                {bindOptions.length > 0 && (
                    <div className={styles.field}>
                        <label>Related {form.bindType === 'comparison' ? 'Comparison' : 'Client'} (Optional)</label>
                        <select
                            value={form.bindId}
                            onChange={(e) => setForm({ ...form, bindId: e.target.value })}
                            className={styles.select}
                        >
                            <option value="">Select...</option>
                            {bindOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Title */}
                <div className={styles.field}>
                    <label>Title *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Brief summary of your issue"
                        className={styles.input}
                        maxLength={200}
                    />
                </div>

                {/* Description */}
                <div className={styles.field}>
                    <label>Description *</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Please describe your issue in detail..."
                        className={styles.textarea}
                        rows={6}
                    />
                </div>

                {/* Priority */}
                <div className={styles.field}>
                    <label>Priority</label>
                    <div className={styles.priorityGrid}>
                        {PRIORITIES.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                className={`${styles.priorityBtn} ${form.priority === p.value ? styles.active : ''}`}
                                data-priority={p.value}
                                onClick={() => setForm({ ...form, priority: p.value })}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className={styles.actions}>
                    <Link href="/app/tickets" className="btn btn-ghost">
                        Cancel
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
}
