'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../../../components/GlobalToast';
import { useUser } from '../../../components/UserContext';
import AvatarUpload from '../../../components/AvatarUpload';
import styles from './page.module.css';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { toast } = useToast();
    const { profile: userProfile, entitlements, loading: loadingUserData, refreshUserData, session } = useUser();

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

    // 使用UserContext中的profile数据
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
        avatarUrl: null,
    });

    const isLoadingProfile = loadingUserData;
    const isLoadingEntitlements = loadingUserData;
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);

    // Preferences state
    const [emailNotifications, setEmailNotifications] = useState(true);

    // 当UserContext中的profile数据更新时，同步到本地状态
    useEffect(() => {
        if (userProfile) {
            setProfile({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: userProfile.email || session?.user?.email || '',
                nmls: userProfile.nmls || '',
                phone: userProfile.phone || '',
                xHandle: userProfile.xHandle || '',
                facebook: userProfile.facebook || '',
                tiktok: userProfile.tiktok || '',
                instagram: userProfile.instagram || '',
                avatarUrl: userProfile.avatarUrl || null,
            });
        } else if (session?.user) {
            // 从session中获取默认值
            const sessionEmail = session.user.email || '';
            const sessionName = session.user.name || '';
            const [fallbackFirstName, ...rest] = sessionName.trim().split(/\s+/).filter(Boolean);
            const fallbackLastName = rest.length ? rest.join(' ') : '';

            setProfile({
                firstName: fallbackFirstName || '',
                lastName: fallbackLastName || '',
                email: sessionEmail,
                nmls: '',
                phone: '',
                xHandle: '',
                facebook: '',
                tiktok: '',
                instagram: '',
                avatarUrl: null,
            });
        }
    }, [userProfile, session?.user]);

    // Sync preferences from userProfile
    useEffect(() => {
        if (userProfile?.preferences) {
            setEmailNotifications(userProfile.preferences.emailNotifications ?? true);
        }
    }, [userProfile?.preferences]);

    const initials = useMemo(() => {
        const a = (profile.firstName || session?.user?.name || session?.user?.email || 'U').trim();
        const b = (profile.lastName || '').trim();
        const first = a ? a[0].toUpperCase() : 'U';
        const second = b ? b[0].toUpperCase() : '';
        return `${first}${second}`;
    }, [profile.firstName, profile.lastName, session?.user?.email, session?.user?.name]);

    // Whether the user currently has an active entitlement (subscription or pass)
    const hasActiveEntitlement = !!(entitlements?.hasActiveEntitlement || entitlements?.type === 'subscription');

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
            // 刷新UserContext中的数据
            refreshUserData();
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

                            <div className={styles.profileHint}>
                                <span className={styles.hintIcon}>💡</span>
                                <span>The information below will be displayed on quote pages you share with clients, making it easy for them to contact you.</span>
                            </div>

                            <AvatarUpload
                                avatarUrl={profile.avatarUrl}
                                initials={initials}
                                disabled={isLoadingProfile}
                                onUploadSuccess={(url) => {
                                    setProfile((p) => ({ ...p, avatarUrl: url }));
                                    refreshUserData();
                                    toast.success('Avatar updated!');
                                }}
                                onDeleteSuccess={() => {
                                    setProfile((p) => ({ ...p, avatarUrl: null }));
                                    refreshUserData();
                                    toast.success('Avatar removed');
                                }}
                            />

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.firstName || ''}
                                        onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={profile.lastName || ''}
                                        onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        value={profile.email || ''}
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
                                        value={profile.nmls || ''}
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
                                        value={profile.phone || ''}
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
                                        value={profile.xHandle || ''}
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
                                        value={profile.instagram || ''}
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
                                        value={profile.facebook || ''}
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
                                        value={profile.tiktok || ''}
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

                            {/* debug banner removed */}

                            <div className={styles.planCard}>
                                <div>
                                    <span className={styles.planName}>
                                        {entitlements?.type === 'subscription'
                                            ? (entitlements?.quotas?.property?.quota >= 200 ? 'Pro Annual' : 'Pro Monthly')
                                            : entitlements?.type === 'starter_pass_7d'
                                                ? 'Starter Pass'
                                                : 'Free Plan'}
                                    </span>
                                    <span className={styles.planPrice}>
                                        {entitlements?.type === 'subscription'
                                            ? (entitlements?.quotas?.property?.quota >= 200 ? '$950/year' : '$99/month')
                                            : entitlements?.type === 'starter_pass_7d'
                                                ? '$9.9 (7 days)'
                                                : '$0/month'}
                                    </span>
                                </div>
                                {hasActiveEntitlement ? (
                                    <span className={styles.currentPlanBadge}>Current Plan</span>
                                ) : (
                                    <Link href="/app/upgrade" className={styles.upgradeBtn}>Upgrade to Pro</Link>
                                )}
                            </div>

                            {/* Subscription / Pass Expiry Info */}
                            {hasActiveEntitlement && entitlements?.expiresAt && (
                                <div className={styles.expiryInfo}>
                                    {entitlements?.type === 'subscription' ? (
                                        <>
                                            <span className={styles.expiryIcon}>📅</span>
                                            <span>Next billing date: <strong>{new Date(entitlements.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                                        </>
                                    ) : (
                                        <>
                                            <span className={styles.expiryIcon}>⏰</span>
                                            <span>
                                                Expires: <strong>{new Date(entitlements.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                                {(() => {
                                                    const daysLeft = Math.ceil((new Date(entitlements.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                                                    if (daysLeft <= 0) return ' (Expired)';
                                                    if (daysLeft === 1) return ' (1 day left)';
                                                    return ` (${daysLeft} days left)`;
                                                })()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Billing Actions */}
                            {hasActiveEntitlement && entitlements?.type === 'subscription' && (
                                <div className={styles.billingActions}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                toast.info('Opening billing portal...');
                                                const res = await fetch('/api/billing/portal', { method: 'POST' });
                                                if (res.ok) {
                                                    const { url } = await res.json();
                                                    window.location.href = url;
                                                } else {
                                                    toast.error('Failed to open billing portal');
                                                }
                                            } catch {
                                                toast.error('Failed to open billing portal');
                                            }
                                        }}
                                        className={styles.billingPortalBtn}
                                        disabled={isLoadingEntitlements}
                                    >
                                        💳 Open Billing Portal
                                    </button>
                                </div>
                            )}

                            {!isLoadingEntitlements && entitlements?.quotas && (
                                <>
                                    {/* Unlimited quotas */}
                                    {[
                                        { key: 'comparisons', label: 'Monthly Comparisons' },
                                        { key: 'share', label: 'Monthly Share Links' },
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

                                    {/* Property Lookups - Base quota */}
                                    {entitlements?.quotas?.property && (
                                        <div className={styles.formGroup}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <label>Monthly Property Lookups</label>
                                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                    {entitlements.quotas.property.used} / {entitlements.quotas.property.quota} used
                                                </span>
                                            </div>
                                            <div className={styles.usageBar}>
                                                <div
                                                    className={styles.usageFill}
                                                    style={{
                                                        width: `${Math.min(100, (entitlements.quotas.property.used / entitlements.quotas.property.quota) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Generations - Base quota */}
                                    {entitlements?.quotas?.ai && (
                                        <div className={styles.formGroup}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <label>Monthly AI Generations</label>
                                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                    {entitlements.quotas.ai.used} / {entitlements.quotas.ai.quota} used
                                                </span>
                                            </div>
                                            <div className={styles.usageBar}>
                                                <div
                                                    className={styles.usageFill}
                                                    style={{
                                                        width: `${Math.min(100, (entitlements.quotas.ai.used / entitlements.quotas.ai.quota) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Boost Pack Card - Separate highlighted section */}
                            {(entitlements?.quotas?.property?.bonus > 0 || entitlements?.quotas?.ai?.bonus > 0) && (
                                <div style={{
                                    marginTop: '24px',
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                    border: '2px solid rgba(251, 191, 36, 0.4)',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.15)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        <span style={{ fontSize: '1.5rem' }}>⚡</span>
                                        <div>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                color: '#92400e'
                                            }}>
                                                Boost Pack
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                color: '#a16207'
                                            }}>
                                                Never resets • Valid for subscription period
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '16px',
                                        marginBottom: '12px'
                                    }}>
                                        {entitlements?.quotas?.property?.bonus > 0 && (
                                            <div style={{
                                                padding: '12px 16px',
                                                background: 'rgba(255, 255, 255, 0.7)',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 800,
                                                    color: '#92400e',
                                                    lineHeight: 1
                                                }}>
                                                    {entitlements.quotas.property.bonus}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#a16207',
                                                    marginTop: '4px'
                                                }}>
                                                    Property Lookups
                                                </div>
                                            </div>
                                        )}
                                        {entitlements?.quotas?.ai?.bonus > 0 && (
                                            <div style={{
                                                padding: '12px 16px',
                                                background: 'rgba(255, 255, 255, 0.7)',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 800,
                                                    color: '#92400e',
                                                    lineHeight: 1
                                                }}>
                                                    {entitlements.quotas.ai.bonus}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#a16207',
                                                    marginTop: '4px'
                                                }}>
                                                    AI Generations
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#78350f',
                                        textAlign: 'center'
                                    }}>
                                        ✓ Valid during active subscription
                                    </div>

                                    <Link
                                        href="/app/upgrade"
                                        style={{
                                            display: 'block',
                                            marginTop: '16px',
                                            padding: '10px 20px',
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            textAlign: 'center',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
                                        }}
                                    >
                                        Buy More Boost Pack
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className={styles.section}>
                            <h2>App Preferences</h2>
                            <p className={styles.sectionDesc}>Customize your experience.</p>

                            {/* Email Notifications */}
                            <div className={styles.preferenceItem}>
                                <div className={styles.preferenceInfo}>
                                    <div className={styles.preferenceIcon}>📧</div>
                                    <div className={styles.preferenceText}>
                                        <span className={styles.preferenceTitle}>Email Notifications</span>
                                        <span className={styles.preferenceDesc}>Receive weekly digest and product updates</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={emailNotifications}
                                    className={`${styles.toggleSwitch} ${emailNotifications ? styles.toggleActive : ''}`}
                                    disabled={isSavingPreferences || isLoadingProfile}
                                    onClick={async () => {
                                        const newValue = !emailNotifications;
                                        setEmailNotifications(newValue);
                                        setIsSavingPreferences(true);
                                        try {
                                            const res = await fetch('/api/user/profile', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    profile: {
                                                        preferences: {
                                                            emailNotifications: newValue,
                                                            theme: theme
                                                        }
                                                    }
                                                }),
                                            });
                                            if (res.ok) {
                                                toast.success(newValue ? 'Notifications enabled' : 'Notifications disabled');
                                                refreshUserData();
                                            } else {
                                                setEmailNotifications(!newValue);
                                                toast.error('Failed to update preference');
                                            }
                                        } catch {
                                            setEmailNotifications(!newValue);
                                            toast.error('Failed to update preference');
                                        } finally {
                                            setIsSavingPreferences(false);
                                        }
                                    }}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
