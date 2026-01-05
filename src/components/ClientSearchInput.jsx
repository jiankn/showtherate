'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchIcon, PlusIcon, CloseIcon, UserIcon } from './Icons';
import styles from './ClientSearchInput.module.css';

export default function ClientSearchInput({
    value,
    onChange,
    placeholder = "Search or add client...",
    disabled = false
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Detect mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Search clients
    const searchClients = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.clients || []);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim()) {
            debounceRef.current = setTimeout(() => {
                searchClients(query);
            }, 300);
        } else {
            setResults([]);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, searchClients]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Create new client
    const handleCreateClient = async () => {
        if (!query.trim() || isCreating) return;

        setIsCreating(true);
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: query.trim() }),
            });

            if (res.ok) {
                const data = await res.json();
                // API returns client data directly (id, name, email, etc.)
                onChange(data);
                setQuery('');
                setIsOpen(false);
                setShowMobileSheet(false);
            }
        } catch (err) {
            console.error('Create client failed:', err);
        } finally {
            setIsCreating(false);
        }
    };

    // Select existing client
    const handleSelectClient = (client) => {
        onChange(client);
        setQuery('');
        setIsOpen(false);
        setShowMobileSheet(false);
    };

    // Clear selection
    const handleClear = () => {
        onChange(null);
        setQuery('');
    };

    // Handle input focus
    const handleFocus = () => {
        if (isMobile && !value) {
            setShowMobileSheet(true);
        } else {
            setIsOpen(true);
        }
    };

    // If client is selected, show card
    if (value) {
        return (
            <div className={styles.selectedClient}>
                <div className={styles.clientAvatar}>
                    {(value.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className={styles.clientInfo}>
                    <span className={styles.clientName}>{value.name}</span>
                    {value.email && <span className={styles.clientEmail}>{value.email}</span>}
                </div>
                {!disabled && (
                    <button className={styles.clearBtn} onClick={handleClear} type="button">
                        <CloseIcon />
                    </button>
                )}
            </div>
        );
    }

    // Desktop dropdown
    const renderDropdown = () => (
        <div className={styles.dropdown}>
            {isLoading ? (
                <div className={styles.loadingItem}>Searching...</div>
            ) : results.length > 0 ? (
                <>
                    {results.map((client) => (
                        <button
                            key={client.id}
                            className={styles.resultItem}
                            onClick={() => handleSelectClient(client)}
                            type="button"
                        >
                            <div className={styles.resultAvatar}>
                                {(client.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.resultInfo}>
                                <span className={styles.resultName}>{client.name}</span>
                                {client.email && <span className={styles.resultEmail}>{client.email}</span>}
                            </div>
                        </button>
                    ))}
                </>
            ) : query.trim() ? (
                <div className={styles.noResults}>No clients found</div>
            ) : null}

            {query.trim() && (
                <button
                    className={styles.createItem}
                    onClick={handleCreateClient}
                    disabled={isCreating}
                    type="button"
                >
                    <PlusIcon className={styles.createIcon} />
                    <span>{isCreating ? 'Creating...' : `Create "${query.trim()}" as new client`}</span>
                </button>
            )}
        </div>
    );

    // Mobile bottom sheet
    const renderMobileSheet = () => (
        <div className={styles.mobileOverlay} onClick={() => setShowMobileSheet(false)}>
            <div className={styles.mobileSheet} onClick={(e) => e.stopPropagation()}>
                <div className={styles.sheetHeader}>
                    <h3>Select Client</h3>
                    <button
                        className={styles.sheetClose}
                        onClick={() => setShowMobileSheet(false)}
                        type="button"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className={styles.sheetSearch}>
                    <SearchIcon className={styles.sheetSearchIcon} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        autoFocus
                    />
                </div>

                <div className={styles.sheetResults}>
                    {isLoading ? (
                        <div className={styles.loadingItem}>Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((client) => (
                            <button
                                key={client.id}
                                className={styles.resultItem}
                                onClick={() => handleSelectClient(client)}
                                type="button"
                            >
                                <div className={styles.resultAvatar}>
                                    {(client.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.resultInfo}>
                                    <span className={styles.resultName}>{client.name}</span>
                                    {client.email && <span className={styles.resultEmail}>{client.email}</span>}
                                </div>
                            </button>
                        ))
                    ) : query.trim() ? (
                        <div className={styles.noResults}>No clients found</div>
                    ) : (
                        <div className={styles.noResults}>Type to search clients</div>
                    )}
                </div>

                {query.trim() && (
                    <div className={styles.sheetFooter}>
                        <button
                            className={styles.createBtn}
                            onClick={handleCreateClient}
                            disabled={isCreating}
                            type="button"
                        >
                            <PlusIcon />
                            <span>{isCreating ? 'Creating...' : `Create "${query.trim()}"`}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.inputWrapper}>
                <SearchIcon className={styles.searchIcon} />
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                />
            </div>

            {isOpen && !isMobile && (query.trim() || results.length > 0) && renderDropdown()}
            {showMobileSheet && renderMobileSheet()}
        </div>
    );
}
