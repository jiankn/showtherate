'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import { EmailIcon, PhoneIcon, FacebookIcon, InstagramIcon, TikTokIcon, XIcon, LogoIcon } from '../../../components/Icons';
import styles from './page.module.css';

// Import newly extracted components
import ScenarioCard from '@/components/share/ScenarioCard';
import PaymentComparisonBar from '@/components/share/PaymentComparisonBar';
import LongTermComparison from '@/components/share/LongTermComparison';
import UpgradeCTA from '@/components/share/UpgradeCTA';

// Detect device type
const getDeviceType = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
};

// ===== MAIN SHARE PAGE =====
export default function SharePage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasTrackedView, setHasTrackedView] = useState(false);

    // Track event helper
    const trackEvent = useCallback(async (eventType, ctaType = null) => {
        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shareId: params.shareId,
                    eventType,
                    ctaType,
                    device: getDeviceType(),
                    referrer: typeof document !== 'undefined' ? document.referrer : null,
                }),
            });
        } catch (err) {
            console.error('Failed to track event:', err);
        }
    }, [params.shareId]);

    // Track page view after data loads
    useEffect(() => {
        if (data && !hasTrackedView) {
            trackEvent('share_page_view');
            setHasTrackedView(true);
        }
    }, [data, hasTrackedView, trackEvent]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/shares/${params.shareId}`, { method: 'GET' });
                const json = await res.json().catch(() => ({}));
                if (res.ok && json?.snapshot) {
                    const snapshot = json.snapshot;
                    const lo = snapshot?.lo && typeof snapshot.lo === 'object' ? snapshot.lo : {};
                    const loName = [lo?.name, lo?.lastName].filter(Boolean).join(' ') || null;

                    const normalizedScenarios = Array.isArray(snapshot?.scenarios)
                        ? snapshot.scenarios.map((s, index) => ({
                            id: s?.id || `${index}`,
                            name: s?.name || `Option ${String.fromCharCode(65 + index)}`,
                            inputs: s?.inputs || {},
                            outputs: s?.outputs || null,
                        }))
                        : [];

                    if (!cancelled) {
                        setData({
                            id: json.shareId,
                            title: snapshot?.title,
                            scenarios: normalizedScenarios,
                            createdAt: snapshot?.createdAt,
                            loName: loName || undefined,
                            loNmls: lo?.nmls || undefined,
                            loEmail: lo?.email || undefined,
                            loPhone: lo?.phone || undefined,
                            loPhone: lo?.phone || undefined,
                            loX: lo?.xHandle || undefined,
                            loFacebook: lo?.facebook || undefined,
                            loTikTok: lo?.tiktok || undefined,
                            loInstagram: lo?.instagram || undefined,
                        });
                        setLoading(false);
                    }
                    return;
                }
            } catch { }

            const stored = localStorage.getItem(`comparison_${params.shareId}`);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (!cancelled) setData(parsed);
                } catch {
                    if (!cancelled) setError('Failed to load comparison data');
                } finally {
                    if (!cancelled) setLoading(false);
                }
                return;
            }

            if (!cancelled) {
                setError('Comparison not found or has expired');
                setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [params.shareId]);

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading comparison...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorPage}>
                <div className={styles.errorContent}>
                    <h1>😕 {error}</h1>
                    <p>This link may have expired or been removed.</p>
                    <Link href="/" className="btn btn-primary">
                        Go to ShowTheRate
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const outputs = Array.isArray(data?.scenarios)
        ? data.scenarios.map((s) => s?.outputs).filter(Boolean)
        : [];

    const optionA = outputs[0];
    const optionB = outputs[1];
    const canRecommend = !!optionA && !!optionB;

    const monthlyA = optionA?.monthly?.total;
    const monthlyB = optionB?.monthly?.total;
    const cashA = optionA?.closing?.cashToClose;
    const cashB = optionB?.closing?.cashToClose;

    const monthlyDiff = typeof monthlyA === 'number' && typeof monthlyB === 'number'
        ? Math.abs(monthlyA - monthlyB)
        : null;
    const cashDiff = typeof cashA === 'number' && typeof cashB === 'number'
        ? Math.abs(cashA - cashB)
        : null;

    const lowerMonthlyLabel = typeof monthlyA === 'number' && typeof monthlyB === 'number'
        ? (monthlyA <= monthlyB ? 'Option A' : 'Option B')
        : null;
    const lowerCashLabel = typeof cashA === 'number' && typeof cashB === 'number'
        ? (cashA <= cashB ? 'Option A' : 'Option B')
        : null;

    const phoneDigits = typeof data?.loPhone === 'string'
        ? data.loPhone.replace(/[^\d+]/g, '')
        : '';
    const telHref = phoneDigits ? `tel:${phoneDigits}` : null;
    const smsHref = phoneDigits ? `sms:${phoneDigits}` : null;
    const emailHref = typeof data?.loEmail === 'string' && data.loEmail.trim()
        ? `mailto:${data.loEmail.trim()}`
        : null;

    const normalizeSocialUrl = (value, kind) => {
        if (typeof value !== 'string') return null;
        const raw = value.trim();
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;

        const cleaned = raw.replace(/^@/, '');
        if (!cleaned) return null;

        if (kind === 'x') return `https://x.com/${encodeURIComponent(cleaned)}`;
        if (kind === 'instagram') return `https://www.instagram.com/${encodeURIComponent(cleaned)}`;
        if (kind === 'tiktok') return `https://www.tiktok.com/@${encodeURIComponent(cleaned)}`;
        if (kind === 'facebook') return `https://www.facebook.com/${encodeURIComponent(cleaned)}`;
        return null;
    };

    const xUrl = normalizeSocialUrl(data?.loX, 'x');
    const instagramUrl = normalizeSocialUrl(data?.loInstagram, 'instagram');
    const tiktokUrl = normalizeSocialUrl(data?.loTikTok, 'tiktok');
    const facebookUrl = normalizeSocialUrl(data?.loFacebook, 'facebook');

    const isDemoUser = data.loName === 'Demo User';

    return (
        <div className={styles.page}>
            {/* Header with LO Branding */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.loBranding}>
                        <div className={styles.loAvatar}>👤</div>
                        <div className={styles.loInfo}>
                            <div className={styles.loName}>{data.loName || 'Your Loan Officer'}</div>
                            <div className={styles.loNmls}>NMLS# {data.loNmls || '------'}</div>
                        </div>
                    </div>

                    <div className={styles.poweredBy}>
                        <span>Powered by</span>
                        <Link href="/" className={styles.brandLink}>ShowTheRate</Link>
                    </div>
                </div>
            </header>

            {/* Title */}
            <section className={styles.titleSection}>
                <h1 className={styles.title}>{data.title || 'Your Mortgage Options'}</h1>
                <p className={styles.subtitle}>
                    Compare your options and find the best fit for your situation
                </p>
            </section>

            {/* Scenario Cards */}
            <section className={styles.cardsSection}>
                <div className={styles.cardsGrid}>
                    {data.scenarios.map((scenario, index) => (
                        <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
                    ))}
                </div>
            </section>

            {/* Payment Comparison */}
            <section className={styles.chartsSection}>
                <PaymentComparisonBar scenarios={data.scenarios} />
            </section>

            {/* Long-term Comparison */}
            <section className={styles.chartsSection}>
                <LongTermComparison scenarios={data.scenarios} />
            </section>

            {/* LO Notes */}
            <section className={styles.aiSection}>
                <div className={styles.aiCard}>
                    <div className={styles.aiHeader}>
                        <h3>Recommendation from {data.loName || 'your loan officer'}</h3>
                    </div>
                    <div className={styles.aiContent}>
                        {canRecommend ? (
                            <>
                                <p>
                                    If your priority is the lowest monthly payment, I’d lean toward <strong>{lowerMonthlyLabel}</strong>
                                    {monthlyDiff !== null ? ` (about ${formatCurrency(monthlyDiff)}/month difference).` : '.'}
                                </p>
                                <p>
                                    If keeping upfront cash lower matters more, <strong>{lowerCashLabel}</strong>
                                    {cashDiff !== null ? ` is about ${formatCurrency(cashDiff)} different at closing.` : ' may be the better fit.'}
                                </p>
                                <p className={styles.aiDisclaimer}>
                                    If you expect to keep this home for at least 3–5 years, the monthly payment usually has the biggest impact.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    I’ll help you pick the best fit based on what matters most to you (payment vs. cash to close).
                                </p>
                                <p className={styles.aiDisclaimer}>
                                    Ask me what you’re optimizing for and I’ll walk you through the tradeoffs.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {isDemoUser ? (
                <UpgradeCTA />
            ) : (
                <section className={styles.ctaSection}>
                    <div className={styles.ctaContent}>
                        <h2>Ready to Move Forward?</h2>
                        <p>Pick the easiest way to reach <strong>{data.loName || 'your loan officer'}</strong></p>

                        <div className={styles.contactGrid}>
                            {/* Primary Contact Methods */}
                            <div className={styles.primaryContacts}>
                                {telHref && (
                                    <a className={`${styles.contactBtn} ${styles.btnPhone}`} href={telHref} onClick={() => trackEvent('cta_click', 'call')}>
                                        <PhoneIcon className={styles.contactIcon} />
                                        <span>Call</span>
                                    </a>
                                )}
                                {smsHref && (
                                    <a className={`${styles.contactBtn} ${styles.btnSms}`} href={smsHref} onClick={() => trackEvent('cta_click', 'text')}>
                                        <PhoneIcon className={styles.contactIcon} />
                                        <span>Text</span>
                                    </a>
                                )}
                                {emailHref && (
                                    <a className={`${styles.contactBtn} ${styles.btnEmail}`} href={emailHref} onClick={() => trackEvent('cta_click', 'email')}>
                                        <EmailIcon className={styles.contactIcon} />
                                        <span>Email</span>
                                    </a>
                                )}
                            </div>

                            {/* Social Media Row */}
                            {(xUrl || instagramUrl || tiktokUrl || facebookUrl) && (
                                <div className={styles.socialContacts}>
                                    <div className={styles.socialLabel}>Connect on Social</div>
                                    <div className={styles.socialRow}>
                                        {xUrl && (
                                            <a className={`${styles.socialBtn} ${styles.btnX}`} href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" onClick={() => trackEvent('cta_click', 'x')}>
                                                <XIcon className={styles.socialIcon} />
                                            </a>
                                        )}
                                        {instagramUrl && (
                                            <a className={`${styles.socialBtn} ${styles.btnInstagram}`} href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" onClick={() => trackEvent('cta_click', 'instagram')}>
                                                <InstagramIcon className={styles.socialIcon} />
                                            </a>
                                        )}
                                        {tiktokUrl && (
                                            <a className={`${styles.socialBtn} ${styles.btnTikTok}`} href={tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" onClick={() => trackEvent('cta_click', 'tiktok')}>
                                                <TikTokIcon className={styles.socialIcon} />
                                            </a>
                                        )}
                                        {facebookUrl && (
                                            <a className={`${styles.socialBtn} ${styles.btnFacebook}`} href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" onClick={() => trackEvent('cta_click', 'facebook')}>
                                                <FacebookIcon className={styles.socialIcon} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Disclaimer */}
            <footer className={styles.footer}>
                <div className={styles.disclaimer}>
                    <strong>Important Disclaimer:</strong> Estimates only. This is not a loan offer
                    or commitment to lend. Actual rates, payments, and costs may vary based on your
                    credit profile and property details. Not financial advice. Please consult a
                    licensed professional for personalized guidance.
                </div>

                <div className={styles.footerBrand}>
                    <span>Created with</span>
                    <Link href="/" className={styles.brandLink}>
                        <LogoIcon className={styles.brandIconSvg} /> ShowTheRate
                    </Link>
                </div>
            </footer>
        </div>
    );
}
