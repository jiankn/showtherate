'use client';

import { useState } from 'react';
import styles from './ClientInfoModal.module.css';

/**
 * Client Info Modal - 分享前收集客户信息
 * @param {Object} props
 * @param {boolean} props.isOpen - 是否显示弹窗
 * @param {Function} props.onClose - 关闭弹窗
 * @param {Function} props.onSubmit - 提交信息 (clientInfo) => void
 * @param {Function} props.onSkip - 跳过
 */
export default function ClientInfoModal({ isOpen, onClose, onSubmit, onSkip }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({ name, email, phone });
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onSkip();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <div className={styles.header}>
                    <h2>📋 Who is this for?</h2>
                    <p>Add client info to organize your comparisons (optional)</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="client-name">Client Name</label>
                        <input
                            id="client-name"
                            type="text"
                            placeholder="John Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="client-email">Email</label>
                        <input
                            id="client-email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="client-phone">Phone</label>
                        <input
                            id="client-phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.skipBtn}
                            onClick={handleSkip}
                            disabled={loading}
                        >
                            Skip
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save & Share'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
