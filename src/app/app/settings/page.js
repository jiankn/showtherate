'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '../../../components/Toast';
import styles from './page.module.css';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { data: session } = useSession();
    const toast = useToast();

    const nmlsPattern = '^\\d{1,10}$';
    const usPhonePattern = '^(\\+1\\s?)?(\\(?\\d{3}\\)?[\\s.-]?)\\d{3}[\\s.-]?\\d{4}(\\s?(x|ext\\.?){1}\\s?\\d{1,6})?$';

    const normalizeNmls = (value) => (typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 10) : '');

    const formatUsPhoneLive = (value) => {
        const raw = typeof value === 'string' ? value : '';
        if (!raw) return '';

        const extMatch = raw.match(/\b(?:x|ext\.?)\s*(\d{0,6})\b/i);
        const extDigits = extMatch?.[1] ? extMatch[1].slice(0, 6) : '';

        const digits = raw.replace(/\D/g, '');
        const hasCountry = digits.startsWith('1') && digits.length > 10;
        const capped = digits.startsWith('1') ? digits.slice(0, 11) : digits.slice(0, 10);
        const national = hasCountry ? capped.slice(1) : capped;

        const len = national.length;
        const prefix = hasCountry ? '+1 ' : '';

        if (len === 0) return hasCountry ? '+1 ' : '';

        const area = national.slice(0, Math.min(3, len));
        if (len <= 3) {
            return len === 3 ? `${prefix}(${area}) ` : `${prefix}(${area}`;
        }

        const next = national.slice(3, Math.min(6, len));
        if (len <= 6) {
            return `${prefix}(${area}) ${next}`;
        }

        const line = national.slice(6, Math.min(10, len));
        const baseFormatted = `${prefix}(${area}) ${next}-${line}`;
        if (len === 10 && extDigits) return `${baseFormatted} x${extDigits}`;
        return baseFormatted;
    };

    const isValidNmls = (value) => {
        const v = normalizeNmls(value);
        return !!v && new RegExp(nmlsPattern).test(v);
    };

    const isValidUsPhone = (value) => {
        const v = typeof value === 'string' ? value.trim() : '';
        if (!v) return true;
        return new RegExp(usPhonePattern, 'i').test(v);
    };

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        nmls: '',
        phone: '',
        xHandle: '',
        facebook: '',
        tiktok: '',
        instagram: '',
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [entitlements, setEntitlements] = useState(null);
    const [isLoadingEntitlements, setIsLoadingEntitlements] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            setIsLoadingProfile(true);
            try {
                const res = await fetch('/api/user/profile', { method: 'GET' });
                const data = await res.json().catch(() => ({}));

                const sessionEmail = session?.user?.email || '';
                const sessionName = session?.user?.name || '';
                const [fallbackFirstName, ...rest] = sessionName.trim().split(/\s+/).filter(Boolean);
                const fallbackLastName = rest.length ? rest.join(' ') : '';

                const next = {
                    firstName: data?.profile?.firstName || fallbackFirstName || '',
                    lastName: data?.profile?.lastName || fallbackLastName || '',
                    email: data?.profile?.email || sessionEmail || '',
                    nmls: data?.profile?.nmls || '',
                    phone: data?.profile?.phone || '',
                    xHandle: data?.profile?.xHandle || '',
                    facebook: data?.profile?.facebook || '',
                    tiktok: data?.profile?.tiktok || '',
                    instagram: data?.profile?.instagram || '',
                };

                if (!cancelled) setProfile(next);
            } catch {
                if (!cancelled) toast.error('Failed to load profile');
            } finally {
                if (!cancelled) setIsLoadingProfile(false);
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [session?.user?.email, session?.user?.name, toast]);

    useEffect(() => {
        let cancelled = false;

        async function loadEntitlements() {
            setIsLoadingEntitlements(true);
            try {
                const res = await fetch('/api/user/entitlements', { method: 'GET' });
                const data = await res.json().catch(() => null);
                if (!cancelled) setEntitlements(res.ok ? data : null);
            } catch {
                if (!cancelled) setEntitlements(null);
            } finally {
                if (!cancelled) setIsLoadingEntitlements(false);
            }
        }

        loadEntitlements();

        return () => {
            cancelled = true;
        };
    }, []);

    const initials = useMemo(() => {
        const a = (profile.firstName || session?.user?.name || session?.user?.email || 'U').trim();
        const b = (profile.lastName || '').trim();
        const first = a ? a[0].toUpperCase() : 'U';
        const second = b ? b[0].toUpperCase() : '';
        return `${first}${second}`;
    }, [profile.firstName, profile.lastName, session?.user?.email, session?.user?.name]);

    const handleSave = async () => {
        const nextProfile = {
            ...profile,
            nmls: normalizeNmls(profile.nmls),
            phone: typeof profile.phone === 'string' ? profile.phone.trim() : '',
            xHandle: typeof profile.xHandle === 'string' ? profile.xHandle.trim().replace(/^@/, '') : '',
        };

        if (nextProfile.nmls && !isValidNmls(nextProfile.nmls)) {
            toast.error('NMLS number must be 1–10 digits');
            return;
        }

        if (!isValidUsPhone(nextProfile.phone)) {
            toast.error('Phone must be a valid US number (e.g. (415) 555-1234)');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: nextProfile }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(typeof data?.error === 'string' ? data.error : 'Failed to save changes');
                return;
            }
            if (data?.profile) setProfile((p) => ({ ...p, ...data.profile }));
            toast.success('Saved');
        } catch {
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Settings</h1>
            </div>

            <div className={styles.settingsLayout}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile & Account
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'billing' ? styles.active : ''}`}
                        onClick={() => setActiveTab('billing')}
                    >
                        Billing & Plans
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'preferences' ? styles.active : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        Preferences
                    </button>
                </aside>

                {/* Content */}
                <main className={styles.content}>
                    {activeTab === 'profile' && (
                        <div className={styles.section}>
                            <h2>Personal Information</h2>
                            <p className={styles.sectionDesc}>Update your photo and personal details here.</p>

                            <div className={styles.avatarSection}>
                                <div className={styles.avatar}>{initials}</div>
                                <button className={styles.btnSecondary}>Change Photo</button>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.firstName}
                                        onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.lastName}
                                        onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        value={profile.email}
                                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                                        autoComplete="email"
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label>NMLS Number</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.nmls}
                                        onChange={(e) => setProfile((p) => ({ ...p, nmls: normalizeNmls(e.target.value) }))}
                                        inputMode="numeric"
                                        pattern={nmlsPattern}
                                        maxLength={10}
                                        placeholder="Your NMLS ID"
                                        title="1–10 digits"
                                        disabled={isLoadingProfile}
                                    />
                                </div>

                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        className={styles.input}
                                        value={profile.phone}
                                        onChange={(e) => setProfile((p) => ({ ...p, phone: formatUsPhoneLive(e.target.value) }))}
                                        inputMode="tel"
                                        autoComplete="tel"
                                        pattern={usPhonePattern}
                                        maxLength={40}
                                        placeholder="(555) 123-4567"
                                        title="US phone number, e.g. (415) 555-1234 or +1 415 555 1234"
                                        disabled={isLoadingProfile}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>X</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.xHandle}
                                        onChange={(e) => setProfile((p) => ({ ...p, xHandle: e.target.value }))}
                                        placeholder="@handle"
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Instagram</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.instagram}
                                        onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))}
                                        placeholder="@username or link"
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Facebook</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.facebook}
                                        onChange={(e) => setProfile((p) => ({ ...p, facebook: e.target.value }))}
                                        placeholder="Profile link"
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>TikTok</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.tiktok}
                                        onChange={(e) => setProfile((p) => ({ ...p, tiktok: e.target.value }))}
                                        placeholder="@username or link"
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                            </div>

                            <div className={styles.saveSection}>
                                <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving || isLoadingProfile}>
                                    {isSaving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className={styles.section}>
                            <h2>Current Subscription</h2>
                            <p className={styles.sectionDesc}>Manage your plan and billing details.</p>

                            <div className={styles.planCard}>
                                <div>
                                    <span className={styles.planName}>
                                        {entitlements?.type === 'subscription'
                                            ? 'Pro'
                                            : entitlements?.type === 'starter_pass_7d'
                                                ? 'Starter Pass'
                                                : 'Free Plan'}
                                    </span>
                                    <span className={styles.planPrice}>
                                        {entitlements?.type === 'subscription'
                                            ? '$59/month'
                                            : entitlements?.type === 'starter_pass_7d'
                                                ? '$9.9 (7 days)'
                                                : '$0/month'}
                                    </span>
                                </div>
                                <Link href="/app/upgrade" className={styles.upgradeBtn}>Upgrade to Pro</Link>
                            </div>

                            {!isLoadingEntitlements && entitlements?.quotas && (
                                <>
                                    {[
                                        { key: 'comparisons', label: 'Monthly Comparisons' },
                                        { key: 'share', label: 'Monthly Share Links' },
                                        { key: 'property', label: 'Monthly Property Lookups' },
                                        { key: 'ai', label: 'Monthly AI Generations' },
                                    ].map(({ key, label }) => {
                                        const q = entitlements?.quotas?.[key];
                                        if (!q) return null;

                                        const quotaText = q.quota === -1 ? '∞' : q.quota;
                                        const usedText = q.quota === -1 ? '—' : q.used;
                                        const percent =
                                            q.quota === -1 ? 100 : q.quota > 0 ? Math.min(100, (q.used / q.quota) * 100) : 0;

                                        return (
                                            <div key={key} className={styles.formGroup}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <label>{label}</label>
                                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                        {usedText} / {quotaText} used
                                                    </span>
                                                </div>
                                                <div className={styles.usageBar}>
                                                    <div className={styles.usageFill} style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className={styles.section}>
                            <h2>App Preferences</h2>
                            <p className={styles.sectionDesc}>Customize your experience.</p>

                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" defaultChecked />
                                <div className={styles.checkboxLabel}>
                                    <span className={styles.labelTitle}>Email Notifications</span>
                                    <span className={styles.labelDesc}>Receive weekly digest and updates</span>
                                </div>
                            </div>

                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" defaultChecked />
                                <div className={styles.checkboxLabel}>
                                    <span className={styles.labelTitle}>Dark Mode</span>
                                    <span className={styles.labelDesc}>Use dark theme by default (System synced)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
