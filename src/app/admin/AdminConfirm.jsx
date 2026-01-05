'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import styles from './AdminConfirm.module.css';

// Context
const AdminConfirmContext = createContext(null);

export function useAdminConfirm() {
    const context = useContext(AdminConfirmContext);
    if (!context) {
        throw new Error('useAdminConfirm must be used within AdminConfirmProvider');
    }
    return context;
}

// Provider
export function AdminConfirmProvider({ children }) {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // info, warning, danger
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
    });

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                message,
                title: options.title || 'Confirm Action',
                type: options.type || 'info',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: () => {
                    setState((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setState((prev) => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            state.onCancel?.();
        }
    };

    return (
        <AdminConfirmContext.Provider value={{ confirm }}>
            {children}
            {state.isOpen && (
                <div className={styles.backdrop} onClick={handleBackdropClick}>
                    <div className={`${styles.dialog} ${styles[state.type]}`}>
                        <div className={styles.icon}>
                            {state.type === 'danger' && '⚠️'}
                            {state.type === 'warning' && '⚡'}
                            {state.type === 'info' && 'ℹ️'}
                        </div>
                        <h3 className={styles.title}>{state.title}</h3>
                        <p className={styles.message}>{state.message}</p>
                        <div className={styles.actions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={state.onCancel}
                                type="button"
                            >
                                {state.cancelText}
                            </button>
                            <button
                                className={`${styles.confirmBtn} ${styles[`confirmBtn${state.type.charAt(0).toUpperCase() + state.type.slice(1)}`]}`}
                                onClick={state.onConfirm}
                                type="button"
                            >
                                {state.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminConfirmContext.Provider>
    );
}
