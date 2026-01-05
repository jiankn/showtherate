'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, EyeIcon, CopyIcon, TrashIcon, EmailIcon, PhoneIcon } from '@/components/Icons';
import { useToast } from '@/components/GlobalToast';
import styles from './page.module.css';

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast, confirm } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', status: '', notes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function fetchClient() {
            setLoading(true);
            try {
                const res = await fetch(`/api/clients/${params.id}`);
                const json = await res.json();

                if (res.ok) {
                    setData(json);
                    setEditForm({
                        name: json.name || '',
                        email: json.email || '',
                        phone: json.phone || '',
                        status: json.status || 'active',
                        notes: json.notes || '',
                    });
                } else {
                    setError(json.error || 'Failed to load client');
                }
            } catch (err) {
                setError('Failed to load client');
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            fetchClient();
        }
    }, [params.id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/clients/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                const updated = await res.json();
                setData({ ...data, ...updated });
                setIsEditing(false);
                toast.success('Client updated successfully');
            } else {
                const errData = await res.json();
                toast.error(errData.error || 'Failed to save changes');
            }
        } catch (err) {
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!await confirm('Are you sure you want to delete this client? Their comparisons will be preserved but unlinked.', { type: 'danger', confirmText: 'Delete Client', title: 'Delete Client' })) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/clients/${params.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Client deleted');
                router.push('/app/clients');
            } else {
                const errData = await res.json();
                toast.error(errData.error || 'Failed to delete client');
            }
        } catch (err) {
            toast.error('Failed to delete client');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading client...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={styles.page}>
                <div className={styles.errorState}>
                    <h2>😕 {error || 'Client not found'}</h2>
                    <Link href="/app/clients" className={styles.backBtn}>
                        ← Back to Clients
                    </Link>
                </div>
            </div>
        );
    }

    const isUnknown = params.id === 'unknown';

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/app/clients" className={styles.backBtn}>
                        <ArrowLeftIcon />
                        <span>Back</span>
                    </Link>
                    <div className={styles.titleSection}>
                        <div className={styles.clientHeader}>
                            <div className={`${styles.avatar} ${isUnknown ? styles.unknownAvatar : ''}`}>
                                {isUnknown ? '?' : (data.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1>{data.name || 'Unknown Client'}</h1>
                                {!isUnknown && (
                                    <span className={styles.statusBadge}>● {data.status}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {!isUnknown && (
                    <div className={styles.headerActions}>
                        {isEditing ? (
                            <>
                                <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                                    ✏️ Edit
                                </button>
                                <button
                                    className={styles.deleteClientBtn}
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Contact Info / Edit Form */}
            {!isUnknown && (
                <div className={styles.contactCard}>
                    <h2>{isEditing ? 'Edit Client' : 'Contact Information'}</h2>

                    {isEditing ? (
                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="Client name"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Notes</label>
                                <textarea
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    placeholder="Add any notes about this client..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.contactGrid}>
                                {data.email && (
                                    <div className={styles.contactItem}>
                                        <EmailIcon />
                                        <div>
                                            <span className={styles.contactLabel}>Email</span>
                                            <a href={`mailto:${data.email}`} className={styles.contactValue}>
                                                {data.email}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {data.phone && (
                                    <div className={styles.contactItem}>
                                        <PhoneIcon />
                                        <div>
                                            <span className={styles.contactLabel}>Phone</span>
                                            <a href={`tel:${data.phone}`} className={styles.contactValue}>
                                                {data.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {data.notes && (
                                <div className={styles.notesSection}>
                                    <span className={styles.notesLabel}>Notes</span>
                                    <p className={styles.notesText}>{data.notes}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Comparisons */}
            <div className={styles.comparisonsSection}>
                <h2>Comparisons ({data.comparisons?.length || 0})</h2>

                {data.comparisons && data.comparisons.length > 0 ? (
                    <div className={styles.comparisonsList}>
                        {data.comparisons.map((comp) => (
                            <div key={comp.id} className={styles.comparisonItem}>
                                <div className={styles.comparisonInfo}>
                                    <div className={styles.comparisonIcon}>📊</div>
                                    <div>
                                        <h3>{comp.title}</h3>
                                        <div className={styles.comparisonMeta}>
                                            <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{comp.scenarioCount} scenarios</span>
                                            {comp.isShared && (
                                                <>
                                                    <span>•</span>
                                                    <span className={styles.sharedBadge}>🔗 Shared</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={`/app/comparisons/${comp.id}`}
                                    className={styles.viewBtn}
                                >
                                    <EyeIcon />
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyComparisons}>
                        <p>No comparisons for this client yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
