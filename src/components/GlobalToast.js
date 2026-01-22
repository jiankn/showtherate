'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import styles from './GlobalToast.module.css';

// Toast Context
const ToastContext = createContext(null);

// Toast SVG Icons
const ToastIcons = {
    info: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    success: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

// Toast Item Component
function ToastItem({ id, title, description, type, duration = 4000, onRemove }) {
    const safeDuration = parseInt(duration) || 4000;
    const isPermanent = safeDuration <= 0;

    const remainingRef = useRef(safeDuration);
    const startTimeRef = useRef(0);
    const timerRef = useRef(null);

    // Schedule removal with pause support
    useEffect(() => {
        if (isPermanent) return;

        timerRef.current = setTimeout(() => {
            onRemove(id);
        }, remainingRef.current);
        startTimeRef.current = Date.now();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPermanent, id, onRemove]);

    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
            return;
        }
        const elapsed = Date.now() - startTimeRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };

    const handleMouseLeave = () => {
        if (isPermanent) return;
        timerRef.current = setTimeout(() => {
            onRemove(id);
        }, remainingRef.current);
        startTimeRef.current = Date.now();
    };

    return (
        <div
            className={`${styles.toast} ${styles[type]}`}
            onClick={() => onRemove(id)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={`${styles.toastIconWrapper} ${styles[`icon_${type}`]}`}>
                {ToastIcons[type]}
            </div>
            <div className={styles.toastContent}>
                <span className={styles.toastTitle}>{title}</span>
                {description && <span className={styles.toastDescription}>{description}</span>}
            </div>
        </div>
    );
}

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null);

    // Show toast message
    const showToast = useCallback((title, type = 'info', options = {}) => {
        const id = Date.now();
        const duration = typeof options === 'number' ? options : options.duration || 4000;
        const description = typeof options === 'object' ? options.description : undefined;

        setToasts(prev => [...prev, { id, title, description, type, duration }]);
    }, []);

    // Shorthand methods - memoized to prevent unnecessary re-renders
    const toast = useMemo(() => ({
        success: (title, options) => showToast(title, 'success', options),
        error: (title, options) => showToast(title, 'error', options),
        warning: (title, options) => showToast(title, 'warning', options),
        info: (title, options) => showToast(title, 'info', options),
    }), [showToast]);

    // Show confirm dialog (returns Promise)
    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmModal({
                message,
                title: options.title || 'Confirm',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                type: options.type || 'warning', // 'warning' | 'danger' | 'info'
                onConfirm: () => {
                    setConfirmModal(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmModal(null);
                    resolve(false);
                },
            });
        });
    }, []);

    // Remove toast manually
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, confirm, showToast }}>
            {children}

            <div className={styles.toastContainer}>
                {toasts.map(t => (
                    <ToastItem
                        key={t.id}
                        {...t}
                        onRemove={removeToast}
                    />
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmModal && (
                <div className={styles.confirmBackdrop} onClick={confirmModal.onCancel}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={`${styles.confirmIcon} ${styles[confirmModal.type]}`}>
                            {confirmModal.type === 'danger' ? '🗑️' : confirmModal.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </div>
                        <h3 className={styles.confirmTitle}>{confirmModal.title}</h3>
                        <p className={styles.confirmMessage}>{confirmModal.message}</p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.confirmCancelBtn}
                                onClick={confirmModal.onCancel}
                            >
                                {confirmModal.cancelText}
                            </button>
                            <button
                                className={`${styles.confirmBtn} ${styles[confirmModal.type]}`}
                                onClick={confirmModal.onConfirm}
                            >
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
