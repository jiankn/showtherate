'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, EyeIcon, CopyIcon, TrashIcon, SearchIcon } from '../../../components/Icons';
import ClientInfoModal from '../../../components/ClientInfoModal';
import { useToast } from '../../../components/GlobalToast';
import styles from './page.module.css';

const STATUS_LABELS = {
    Active: 'Shared',
    Draft: 'Draft',
};

export default function ComparisonsPage() {
    const { toast, confirm } = useToast();
    const router = useRouter();
    const [comparisons, setComparisons] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [copyingId, setCopyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [entitlements, setEntitlements] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    // Client info modal state
    const [showClientModal, setShowClientModal] = useState(false);
    const [pendingShareId, setPendingShareId] = useState(null);

    // Upgrade prompt state
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    // Assign client modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningCompId, setAssigningCompId] = useState(null);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Fetch comparisons and entitlements from API
    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [comparisonsRes, entitlementsRes] = await Promise.all([
                fetch('/api/comparisons'),
                fetch('/api/user/entitlements'),
            ]);

            const comparisonsData = await comparisonsRes.json();
            if (comparisonsRes.ok && comparisonsData.comparisons) {
                setComparisons(comparisonsData.comparisons.map(c => ({
                    id: c.id,
                    title: c.title,
                    createdAt: new Date(c.createdAt).toLocaleDateString(),
                    scenarios: c.scenarioCount,
                    shareLink: c.shareLink,
                    status: c.shareLink ? 'Active' : 'Draft',
                    clientId: c.clientId,
                    clientName: c.clientName,
                })));
                setClients(comparisonsData.clients || []);
            }

            const entitlementsData = await entitlementsRes.json();
            if (entitlementsRes.ok) {
                setEntitlements(entitlementsData);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Filter comparisons
    const filteredComparisons = comparisons.filter(item => {
        const matchesStatus = filter === 'All' || item.status === filter;
        const searchLower = search.toLowerCase();
        const matchesSearch =
            item.title.toLowerCase().includes(searchLower) ||
            (item.clientName && item.clientName.toLowerCase().includes(searchLower));
        return matchesStatus && matchesSearch;
    });

    // Toggle selection
    const handleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Select all
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredComparisons.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleOpenDetails = (event, comparisonId) => {
        if (
            event.target.closest('button') ||
            event.target.closest('a') ||
            event.target.closest('input')
        ) {
            return;
        }
        router.push(`/app/comparisons/${comparisonId}`);
    };

    // Batch Delete
    const handleBatchDelete = async () => {
        const count = selectedIds.size;
        if (count === 0) return;

        if (!await confirm(`Are you sure you want to delete ${count} comparison${count > 1 ? 's' : ''}? This action cannot be undone.`, {
            type: 'danger',
            confirmText: `Delete ${count} Items`,
            title: 'Batch Delete'
        })) {
            return;
        }

        setIsBatchDeleting(true);
        try {
            const res = await fetch('/api/comparisons', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });

            const data = await res.json();

            if (res.ok) {
                setComparisons(prev => prev.filter(c => !selectedIds.has(c.id)));
                setSelectedIds(new Set());
                toast.success(`${count} comparisons deleted`);
            } else {
                toast.error(data.error || 'Failed to delete comparisons');
            }
        } catch (err) {
            console.error('Failed to batch delete:', err);
            toast.error('Failed to batch delete');
        } finally {
            setIsBatchDeleting(false);
        }
    };

    // Start share flow - check entitlements first
    const handleStartShare = (comparisonId) => {
        if (!entitlements?.hasActiveEntitlement || !entitlements?.quotas?.share) {
            setShowUpgradePrompt(true);
            return;
        }

        const shareQuota = entitlements.quotas.share;
        if (shareQuota.remaining === 0 && shareQuota.quota !== -1) {
            setShowUpgradePrompt(true);
            return;
        }

        const comparison = comparisons.find(c => c.id === comparisonId);
        if (comparison?.shareLink) {
            doCopyShare(comparisonId);
        } else {
            setPendingShareId(comparisonId);
            setShowClientModal(true);
        }
    };

    // Proceed with share after modal
    const handleClientSubmit = async (clientInfo) => {
        if (!pendingShareId) return;

        if (clientInfo.email || clientInfo.name) {
            try {
                await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: clientInfo.name,
                        email: clientInfo.email,
                        phone: clientInfo.phone,
                        comparisonId: pendingShareId,
                    }),
                });
            } catch (err) {
                console.error('Failed to create client:', err);
            }
        }

        setShowClientModal(false);
        await doCopyShare(pendingShareId);
        setPendingShareId(null);
    };

    // Skip client info
    const handleSkipClient = async () => {
        setShowClientModal(false);
        if (pendingShareId) {
            await doCopyShare(pendingShareId);
        }
        setPendingShareId(null);
    };

    // Actually copy share link
    const doCopyShare = async (comparisonId) => {
        setCopyingId(comparisonId);
        try {
            const res = await fetch('/api/shares', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comparisonId }),
            });
            const data = await res.json();

            if (res.ok && data.shareId) {
                const shareUrl = `${window.location.origin}/s/${data.shareId}`;

                // Try clipboard API with fallback
                try {
                    await navigator.clipboard.writeText(shareUrl);
                } catch {
                    // Fallback: create a temporary textarea
                    const textarea = document.createElement('textarea');
                    textarea.value = shareUrl;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }

                setComparisons(prev => prev.map(c =>
                    c.id === comparisonId
                        ? { ...c, shareLink: data.shareId, status: 'Active' }
                        : c
                ));

                toast.success('Share link copied to clipboard!');
            } else {
                toast.error(data.error || 'Failed to generate share link');
            }
        } catch (err) {
            console.error('Failed to copy share link:', err);
            toast.error('Failed to copy share link');
        } finally {
            setCopyingId(null);
        }
    };

    // Delete comparison
    const handleDelete = async (comparisonId) => {
        if (!await confirm('Are you sure you want to delete this comparison? This action cannot be undone.', { type: 'danger', confirmText: 'Delete', title: 'Delete Comparison' })) {
            return;
        }

        setDeletingId(comparisonId);
        try {
            const res = await fetch(`/api/comparisons/${comparisonId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setComparisons(prev => prev.filter(c => c.id !== comparisonId));
                toast.success('Comparison deleted');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete comparison');
            }
        } catch (err) {
            console.error('Failed to delete comparison:', err);
            toast.error('Failed to delete comparison');
        } finally {
            setDeletingId(null);
        }
    };

    // Open assign client modal
    const handleOpenAssign = (comparisonId, currentClientId) => {
        setAssigningCompId(comparisonId);
        setSelectedClientId(currentClientId || '');
        setShowAssignModal(true);
    };

    // Assign client to comparison
    const handleAssignClient = async () => {
        if (!assigningCompId) return;

        setIsAssigning(true);
        try {
            const res = await fetch(`/api/comparisons/${assigningCompId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: selectedClientId || null }),
            });

            if (res.ok) {
                // Update local state
                const clientName = clients.find(c => c.id === selectedClientId)?.name || null;
                setComparisons(prev => prev.map(c =>
                    c.id === assigningCompId
                        ? { ...c, clientId: selectedClientId || null, clientName }
                        : c
                ));
                setShowAssignModal(false);
                toast.success('Client assigned successfully');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to assign client');
            }
        } catch (err) {
            toast.error('Failed to assign client');
        } finally {
            setIsAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>Comparisons</h1>
                </div>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading comparisons...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Client Info Modal */}
            <ClientInfoModal
                isOpen={showClientModal}
                onClose={() => { setShowClientModal(false); setPendingShareId(null); }}
                onSubmit={handleClientSubmit}
                onSkip={handleSkipClient}
            />

            {/* Assign Client Modal */}
            {showAssignModal && (
                <div className={styles.assignModal}>
                    <div className={styles.assignContent}>
                        <button className={styles.assignClose} onClick={() => setShowAssignModal(false)}>×</button>
                        <h2>Assign Client</h2>
                        <p>Assign a client to this comparison</p>
                        <select
                            className={styles.assignSelect}
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                        >
                            <option value="">No Client</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className={styles.assignActions}>
                            <button className={styles.assignCancelBtn} onClick={() => setShowAssignModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.assignSaveBtn}
                                onClick={handleAssignClient}
                                disabled={isAssigning}
                            >
                                {isAssigning ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Comparisons</h1>
                    <p>Share-ready options for your clients</p>
                </div>
                <Link href="/app/new" className={styles.createBtn}>
                    <PlusIcon />
                    <span>New Comparison</span>
                </Link>
            </div>

            {/* Filters */}
            <div className={styles.filtersBar}>
                <div className={styles.searchWrapper}>
                    <SearchIcon className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search comparisons or clients..."
                        className={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.statusTabs}>
                    {[
                        { value: 'All', label: 'All' },
                        { value: 'Active', label: 'Shared' },
                        { value: 'Draft', label: 'Drafts' },
                    ].map((status) => (
                        <button
                            key={status.value}
                            className={`${styles.statusTab} ${filter === status.value ? styles.active : ''}`}
                            onClick={() => setFilter(status.value)}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {filteredComparisons.length > 0 ? (
                <div className={styles.list}>
                    {/* Select All Header */}
                    <div className={styles.selectAllHeader}>
                        <div className={styles.checkboxWrapper}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={filteredComparisons.length > 0 && selectedIds.size === filteredComparisons.length}
                                onChange={handleSelectAll}
                                id="selectAll"
                            />
                        </div>
                        <label htmlFor="selectAll" className={styles.selectAllLabel}>
                            Select All {filteredComparisons.length > 0 ? `(${filteredComparisons.length})` : ''}
                        </label>
                    </div>

                    {filteredComparisons.map((item) => (
                        <div
                            key={item.id}
                            className={styles.itemCard}
                            onClick={(e) => handleOpenDetails(e, item.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpenDetails(e, item.id);
                                }
                            }}
                            role="link"
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.itemInfo}>
                                <div className={styles.checkboxWrapper} onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => handleSelect(item.id)}
                                    />
                                </div>
                                <div className={styles.itemIcon}>
                                    📊
                                </div>
                                <div className={styles.itemDetails}>
                                    <h3>{item.title}</h3>
                                    <div className={styles.itemMeta}>
                                        {item.clientName ? (
                                            <Link
                                                href={`/app/clients/${item.clientId}`}
                                                className={styles.clientTag}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                👤 {item.clientName}
                                            </Link>
                                        ) : (
                                            <button
                                                className={styles.noClientTag}
                                                onClick={() => handleOpenAssign(item.id, item.clientId)}
                                            >
                                                Assign client
                                            </button>
                                        )}
                                        <span className={styles.metaDot}>•</span>
                                        <span className={styles.date}>📅 {item.createdAt}</span>
                                        <span className={styles.metaDot}>•</span>
                                        <span>📝 {item.scenarios} Scenarios</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.itemActions}>
                                <span className={`${styles.statusBadge} ${styles[`status${item.status}`]}`}>
                                    {STATUS_LABELS[item.status] || item.status}
                                </span>
                                {item.clientName && (
                                    <button
                                        className={styles.actionBtn}
                                        title="Change Client"
                                        onClick={() => handleOpenAssign(item.id, item.clientId)}
                                    >
                                        👤
                                    </button>
                                )}
                                <Link href={`/app/comparisons/${item.id}`} className={styles.actionBtn} title="View Details">
                                    <EyeIcon />
                                </Link>
                                <button
                                    className={styles.actionBtn}
                                    title="Copy Share Link"
                                    onClick={() => handleStartShare(item.id)}
                                    disabled={copyingId === item.id}
                                >
                                    {copyingId === item.id ? '...' : <CopyIcon />}
                                </button>
                                <button
                                    className={styles.actionBtn}
                                    title="Delete"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={deletingId === item.id}
                                >
                                    {deletingId === item.id ? '...' : <TrashIcon />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🔍</div>
                    <h2>No comparisons yet</h2>
                    <p>Create a client-ready comparison to share or refine your search.</p>
                    <Link href="/app/new" className={styles.createBtn} style={{ display: 'inline-flex' }}>
                        Create Comparison
                    </Link>
                </div>
            )}

            {/* Upgrade Prompt Modal */}
            {showUpgradePrompt && (
                <div className={styles.upgradeModal}>
                    <div className={styles.upgradeContent}>
                        <button className={styles.upgradeClose} onClick={() => setShowUpgradePrompt(false)}>×</button>
                        <div className={styles.upgradeIcon}>💎</div>
                        <h2>Upgrade Required</h2>
                        <p>Share links are part of the Pro toolkit. Upgrade to send comparisons to clients.</p>
                        <div className={styles.upgradeActions}>
                            <button className={styles.upgradeCancelBtn} onClick={() => setShowUpgradePrompt(false)}>
                                Maybe Later
                            </button>
                            <Link href="/app/upgrade" className={styles.upgradeBtn}>
                                View Plans →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Actions Bar */}
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
                        <div className={styles.statDivider} style={{ height: 24, margin: '0 8px', borderLeft: '1px solid var(--color-border)' }} />
                        <button
                            className={styles.batchDeleteBtn}
                            onClick={handleBatchDelete}
                            disabled={isBatchDeleting}
                        >
                            <TrashIcon />
                            <span>{isBatchDeleting ? 'Deleting...' : 'Delete'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
