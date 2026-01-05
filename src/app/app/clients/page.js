'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, SearchIcon, TrashIcon } from '../../../components/Icons';
import { useToast } from '../../../components/GlobalToast';
import styles from './page.module.css';

const STATUS_LABELS = {
    active: 'Active',
    inactive: 'Cold',
    closed: 'Closed',
};

export default function ClientsPage() {
    const router = useRouter();
    const { toast, confirm } = useToast();
    const [clients, setClients] = useState([]);
    const [unknownCount, setUnknownCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list'); // 'card' or 'list'

    // Batch selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    // Add client modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
    const [isCreating, setIsCreating] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete confirmation state
    const [deletingId, setDeletingId] = useState(null);
    const [isDeletingUnknown, setIsDeletingUnknown] = useState(false);

    // Import/Export state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importMode, setImportMode] = useState('skip');
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        setLoading(true);
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            if (res.ok) {
                setClients(data.clients || []);
                setUnknownCount(data.unknownClientComparisons || 0);
            }
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleAddClient = async (e) => {
        e.preventDefault();
        if (!newClient.name.trim() && !newClient.email.trim()) {
            toast.warning('Please enter at least a name or email');
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient),
            });

            if (res.ok) {
                setShowAddModal(false);
                setNewClient({ name: '', email: '', phone: '' });
                fetchClients();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to create client');
            }
        } catch (err) {
            toast.error('Failed to create client');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = (client, e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingClient({
            id: client.id,
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            status: client.status || 'active',
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingClient) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/clients/${editingClient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingClient),
            });

            if (res.ok) {
                setShowEditModal(false);
                setEditingClient(null);
                fetchClients();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update client');
            }
        } catch (err) {
            toast.error('Failed to update client');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteClick = async (clientId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!await confirm('Are you sure you want to delete this client? All associated comparisons will also be deleted.', { type: 'danger', confirmText: 'Delete', title: 'Delete Client' })) {
            return;
        }

        setDeletingId(clientId);
        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchClients();
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(clientId);
                    return next;
                });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete client');
            }
        } catch (err) {
            toast.error('Failed to delete client');
        } finally {
            setDeletingId(null);
        }
    };

    // Batch selection handlers
    const toggleSelect = (clientId, e) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(clientId)) {
                next.delete(clientId);
            } else {
                next.add(clientId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredClients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredClients.map(c => c.id)));
        }
    };

    const handleOpenClient = (event, clientId) => {
        if (
            event.target.closest('button') ||
            event.target.closest('a') ||
            event.target.closest('input')
        ) {
            return;
        }
        router.push(`/app/clients/${clientId}`);
    };

    // Delete Unlinked Comparisons handler
    const handleDeleteUnknown = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!await confirm(`Are you sure you want to delete all ${unknownCount} comparisons without client info?`, { type: 'danger', confirmText: 'Delete All', title: 'Delete Unlinked Comparisons' })) {
            return;
        }

        setIsDeletingUnknown(true);
        try {
            const res = await fetch('/api/clients/unknown', {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchClients();
                toast.success('Unknown client comparisons deleted');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete');
            }
        } catch (err) {
            toast.error('Failed to delete');
        } finally {
            setIsDeletingUnknown(false);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!await confirm(`Are you sure you want to delete ${selectedIds.size} clients? All associated comparisons will also be deleted.`, { type: 'danger', confirmText: 'Delete All', title: 'Batch Delete' })) {
            return;
        }

        setIsBatchDeleting(true);
        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/clients/${id}`, { method: 'DELETE' })
            );
            await Promise.all(deletePromises);
            setSelectedIds(new Set());
            fetchClients();
            toast.success('Clients deleted successfully');
        } catch (err) {
            toast.error('Failed to delete some clients');
        } finally {
            setIsBatchDeleting(false);
        }
    };

    // Export handlers
    const handleExport = async (format = 'xlsx') => {
        setIsExporting(true);
        try {
            const res = await fetch(`/api/clients/export?format=${format}&includeStats=true`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `clients_export_${new Date().toISOString().split('T')[0]}.${format}`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('Export started');
            } else {
                toast.error('Failed to export clients');
            }
        } catch (err) {
            toast.error('Failed to export clients');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await fetch('/api/clients/template');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'clients_import_template.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            toast.error('Failed to download template');
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        setIsImporting(true);
        setImportResult(null);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('mode', importMode);

            const res = await fetch('/api/clients/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setImportResult(data.results);
                fetchClients();
                toast.success(`Imported ${data.results.imported} clients`);
            } else {
                setImportResult({ errors: [data.error || 'Import failed'] });
                toast.error('Import failed');
            }
        } catch (err) {
            setImportResult({ errors: ['Import failed'] });
        } finally {
            setIsImporting(false);
        }
    };

    // Sort clients
    const sortedClients = [...clients].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case 'oldest':
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'name-asc':
                return (a.name || '').localeCompare(b.name || '');
            case 'name-desc':
                return (b.name || '').localeCompare(a.name || '');
            case 'comparisons':
                return (b.comparisons || 0) - (a.comparisons || 0);
            default:
                return 0;
        }
    });

    // Filter clients
    const filteredClients = sortedClients.filter(client =>
        (client.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>Clients</h1>
                </div>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading clients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Add Client Modal */}
            {showAddModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Add New Client</h2>
                            <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddClient} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="John Smith"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={newClient.phone}
                                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={isCreating}>
                                    {isCreating ? 'Creating...' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Client Modal */}
            {showEditModal && editingClient && (
                <div className={styles.modalBackdrop} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Client</h2>
                            <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="John Smith"
                                    value={editingClient.name}
                                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={editingClient.email}
                                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={editingClient.phone}
                                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select
                                    value={editingClient.status}
                                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={isUpdating}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className={styles.modalBackdrop} onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Import Clients</h2>
                            <button className={styles.closeBtn} onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}>×</button>
                        </div>
                        <div className={styles.importContent}>
                            <p className={styles.importDesc}>Upload an Excel or CSV file to import clients. Download the template to see the required format.</p>

                            <button className={styles.templateBtn} onClick={handleDownloadTemplate}>
                                📥 Download Template
                            </button>

                            <div className={styles.fileUpload}>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    id="import-file"
                                />
                                <label htmlFor="import-file" className={styles.fileLabel}>
                                    {importFile ? `📄 ${importFile.name}` : '📁 Choose file...'}
                                </label>
                            </div>

                            <div className={styles.importOptions}>
                                <label>Duplicate handling:</label>
                                <select value={importMode} onChange={(e) => setImportMode(e.target.value)}>
                                    <option value="skip">Skip existing (by email)</option>
                                    <option value="update">Update existing</option>
                                </select>
                            </div>

                            {importResult && (
                                <div className={styles.importResult}>
                                    {importResult.imported !== undefined && (
                                        <p>✅ Imported: {importResult.imported} | ♻️ Updated: {importResult.updated} | ⏭️ Skipped: {importResult.skipped}</p>
                                    )}
                                    {importResult.errors?.length > 0 && (
                                        <div className={styles.importErrors}>
                                            {importResult.errors.slice(0, 5).map((err, i) => (
                                                <p key={i}>⚠️ {err}</p>
                                            ))}
                                            {importResult.errors.length > 5 && <p>...and {importResult.errors.length - 5} more errors</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}>
                                    {importResult ? 'Close' : 'Cancel'}
                                </button>
                                {!importResult && (
                                    <button
                                        className={styles.submitBtn}
                                        onClick={handleImport}
                                        disabled={!importFile || isImporting}
                                    >
                                        {isImporting ? 'Importing...' : 'Import'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Clients</h1>
                    <p>Track borrowers, follow-ups, and active comparisons</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.headerDropdown}>
                        <button className={styles.exportBtn} disabled={isExporting}>
                            {isExporting ? '...' : '📤'} Export
                        </button>
                        <div className={styles.dropdownMenu}>
                            <button onClick={() => handleExport('xlsx')}>Export as Excel (.xlsx)</button>
                            <button onClick={() => handleExport('csv')}>Export as CSV</button>
                        </div>
                    </div>
                    <button className={styles.importBtn} onClick={() => setShowImportModal(true)}>
                        📥 Import
                    </button>
                    <button className={styles.createBtn} onClick={() => setShowAddModal(true)}>
                        <PlusIcon />
                        <span>Add Client</span>
                    </button>
                </div>
            </div>

            {/* Filters & View Toggle */}
            <div className={styles.filtersBar}>
                <div className={styles.searchWrapper}>
                    <SearchIcon className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search clients by name or email..."
                        className={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="comparisons">Most Comparisons</option>
                </select>
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'card' ? styles.viewActive : ''}`}
                        onClick={() => setViewMode('card')}
                        title="Card View"
                    >
                        ▦
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        ☰
                    </button>
                </div>
            </div>

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
                        <div className={styles.batchDivider} />
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

            {/* Content */}
            {viewMode === 'card' ? (
                /* Card View */
                <div className={styles.grid}>
                    {/* Unlinked Comparisons Card */}
                    {unknownCount > 0 && (
                        <div
                            className={`${styles.clientCard} ${selectedIds.has('unknown') ? styles.selected : ''}`}
                            onClick={(e) => {
                                if (
                                    e.target.closest('button') ||
                                    e.target.closest('input')
                                ) {
                                    return;
                                }
                                router.push('/app/clients/unknown');
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <input
                                type="checkbox"
                                className={styles.selectCheckbox}
                                checked={selectedIds.has('unknown')}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => toggleSelect('unknown', e)}
                            />
                            <div className={styles.cardLink}>
                                <div className={styles.clientHeader}>
                                    <div className={`${styles.avatar} ${styles.unknownAvatar}`}>
                                        ?
                                    </div>
                                    <div className={styles.clientInfo}>
                                        <h3>Unlinked Comparisons</h3>
                                        <span className={styles.clientStatus}>● Unlinked</span>
                                    </div>
                                </div>
                                <div className={styles.contactInfo}>
                                    <div className={styles.contactRow}>
                                        Comparisons missing borrower info
                                    </div>
                                </div>
                                <div className={styles.cardFooter}>
                                    <span>{unknownCount} comparisons</span>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={handleDeleteUnknown}
                                    disabled={isDeletingUnknown}
                                    title="Delete all unknown client comparisons"
                                >
                                    {isDeletingUnknown ? '...' : <TrashIcon />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Client Cards */}
                    {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                            <div
                                key={client.id}
                                className={`${styles.clientCard} ${selectedIds.has(client.id) ? styles.selected : ''}`}
                                onClick={(e) => handleOpenClient(e, client.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenClient(e, client.id);
                                    }
                                }}
                                role="link"
                                tabIndex={0}
                                style={{ cursor: 'pointer' }}
                            >
                                <input
                                    type="checkbox"
                                    className={styles.selectCheckbox}
                                    checked={selectedIds.has(client.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => toggleSelect(client.id, e)}
                                />
                                <div className={styles.cardLink}>
                                    <div className={styles.clientHeader}>
                                        <div className={styles.avatar}>
                                            {(client.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.clientInfo}>
                                            <h3>{client.name || 'Unnamed Client'}</h3>
                                            <span className={styles.clientStatus}>● {STATUS_LABELS[client.status] || 'Active'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.contactInfo}>
                                        {client.email && (
                                            <div className={styles.contactRow}>📧 {client.email}</div>
                                        )}
                                        {client.phone && (
                                            <div className={styles.contactRow}>📞 {client.phone}</div>
                                        )}
                                        {!client.email && !client.phone && (
                                            <div className={styles.contactRow}>No contact info</div>
                                        )}
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <span>{client.comparisons} comparisons</span>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <Link
                                        href={`/app/new?clientId=${client.id}`}
                                        className={styles.createCompBtn}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Create Comparison"
                                    >
                                        ➕
                                    </Link>
                                    <button className={styles.editBtn} onClick={(e) => handleEditClick(client, e)}>✏️</button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => handleDeleteClick(client.id, e)}
                                        disabled={deletingId === client.id}
                                    >
                                        {deletingId === client.id ? '...' : <TrashIcon />}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        unknownCount === 0 && (
                            <div className={styles.emptyState}>
                                <h2>No clients yet</h2>
                                <p>Borrowers appear once you attach client info to a comparison.</p>
                            </div>
                        )
                    )}
                </div>
            ) : (
                /* List View */
                <div className={styles.listView}>
                    {/* List Header */}
                    <div className={styles.listHeader}>
                        <div className={styles.listCheckCol}>
                            <input
                                type="checkbox"
                                checked={selectedIds.size === filteredClients.length && filteredClients.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </div>
                        <div className={styles.listNameCol}>Name</div>
                        <div className={styles.listContactCol}>Contact</div>
                        <div className={styles.listStatusCol}>Status</div>
                        <div className={styles.listCompCol}>Comparisons</div>
                        <div className={styles.listActionsCol}>Actions</div>
                    </div>

                    {/* Unlinked Comparisons Row */}
                    {unknownCount > 0 && (
                        <div
                            className={`${styles.listRow} ${selectedIds.has('unknown') ? styles.selected : ''}`}
                            onClick={(e) => {
                                if (
                                    e.target.closest('button') ||
                                    e.target.closest('input')
                                ) {
                                    return;
                                }
                                router.push('/app/clients/unknown');
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.listCheckCol}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has('unknown')}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => toggleSelect('unknown', e)}
                                />
                            </div>
                            <div className={styles.listNameCol}>
                                <div className={`${styles.avatarSmall} ${styles.unknownAvatar}`}>?</div>
                                <span>Unlinked Comparisons</span>
                            </div>
                            <div className={styles.listContactCol}>—</div>
                            <div className={styles.listStatusCol}>
                                <span className={styles.statusPill}>Unlinked</span>
                            </div>
                            <div className={styles.listCompCol}>{unknownCount}</div>
                            <div className={styles.listActionsCol}>
                                <button
                                    className={styles.actionBtnSmall}
                                    onClick={handleDeleteUnknown}
                                    disabled={isDeletingUnknown}
                                >
                                    {isDeletingUnknown ? '...' : '🗑️'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Client Rows */}
                    {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                            <div
                                key={client.id}
                                className={`${styles.listRow} ${selectedIds.has(client.id) ? styles.selected : ''}`}
                                onClick={(e) => handleOpenClient(e, client.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenClient(e, client.id);
                                    }
                                }}
                                role="link"
                                tabIndex={0}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.listCheckCol}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(client.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => toggleSelect(client.id, e)}
                                    />
                                </div>
                                <div className={styles.listNameCol}>
                                    <div className={styles.avatarSmall}>
                                        {(client.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span>{client.name || 'Unnamed Client'}</span>
                                </div>
                                <div className={styles.listContactCol}>
                                    {client.email && <span>📧 {client.email}</span>}
                                    {client.phone && <span>📞 {client.phone}</span>}
                                    {!client.email && !client.phone && <span>—</span>}
                                </div>
                                <div className={styles.listStatusCol}>
                                    <span className={`${styles.statusPill} ${styles[`status_${client.status || 'active'}`]}`}>
                                        {STATUS_LABELS[client.status] || 'Active'}
                                    </span>
                                </div>
                                <div className={styles.listCompCol}>{client.comparisons}</div>
                                <div className={styles.listActionsCol}>
                                    <button className={styles.actionBtnSmall} onClick={(e) => handleEditClick(client, e)}>✏️</button>
                                    <button
                                        className={styles.actionBtnSmall}
                                        onClick={(e) => handleDeleteClick(client.id, e)}
                                        disabled={deletingId === client.id}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        unknownCount === 0 && (
                            <div className={styles.emptyState}>
                                <h2>No clients yet</h2>
                                <p>Borrowers appear once you attach client info to a comparison.</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
