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
    const [copyToast, setCopyToast] = useState(null);

    // Copy to clipboard helper
    const copyToClipboard = useCallback(async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyToast(`${label} copied!`);
            setTimeout(() => setCopyToast(null), 2000);
        } catch {
            setCopyToast('Copy failed');
            setTimeout(() => setCopyToast(null), 2000);
        }
    }, []);

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
                    const loName = lo?.name || null;

                    const normalizedScenarios = Array.isArray(snapshot?.scenarios)
                        ? snapshot.scenarios.map((s, index) => ({
                            id: s?.id || `${index}`,
                            name: s?.name || `Option ${String.fromCharCode(65 + index)}`,
                            inputs: s?.inputs || {},
                            outputs: s?.outputs || null,
                        }))
                        : [];

                    if (!cancelled) {
                        // Extract property address from first scenario
                        const firstScenario = normalizedScenarios[0];
                        const propertyAddress = firstScenario?.inputs?.propertyAddress || null;
                        const homePrice = firstScenario?.inputs?.homePrice || null;

                        setData({
                            id: json.shareId,
                            title: snapshot?.title,
                            aiScript: snapshot?.aiScript || null,
                            scenarios: normalizedScenarios,
                            createdAt: snapshot?.createdAt,
                            viewCount: json.viewCount || 0,
                            loName: loName || undefined,
                            loNmls: lo?.nmls || undefined,
                            loEmail: lo?.email || undefined,
                            loPhone: lo?.phone || undefined,
                            loX: lo?.xHandle || undefined,
                            loFacebook: lo?.facebook || undefined,
                            loTikTok: lo?.tiktok || undefined,
                            loInstagram: lo?.instagram || undefined,
                            loAvatarUrl: lo?.avatarUrl || undefined,
                            propertyAddress: propertyAddress,
                            homePrice: homePrice,
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
                        <div className={styles.loAvatar}>
                            {data.loAvatarUrl ? (
                                <img src={data.loAvatarUrl} alt={data.loName || 'LO'} className={styles.loAvatarImg} />
                            ) : '👤'}
                        </div>
                        <div className={styles.loInfo}>
                            <div className={styles.loName}>{data.loName || 'Your Loan Officer'}</div>
                            <div className={styles.loMeta}>
                                <span className={styles.loNmls}>NMLS# {data.loNmls || '------'}</span>
                                <span className={styles.shareViews}>👁 {data.viewCount || 0} views</span>
                            </div>
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

                {/* Property Address */}
                {data.propertyAddress && (
                    <div className={styles.propertyAddress}>
                        <span className={styles.propertyIcon}>📍</span>
                        <span className={styles.propertyText}>{data.propertyAddress}</span>
                        {data.homePrice && (
                            <span className={styles.propertyMeta}>
                                <span>•</span>
                                <span>{formatCurrency(data.homePrice)}</span>
                            </span>
                        )}
                    </div>
                )}
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

            {/* LO Recommendation - Card Highlight Design */}
            {data.aiScript && (
                <section className={styles.recommendSection}>
                    <div className={styles.recommendCard}>
                        {/* Decorative Elements */}
                        <div className={styles.recommendGlow}></div>

                        {/* Header */}
                        <div className={styles.recommendHeader}>
                            <span className={styles.recommendIcon}>✨</span>
                            <h3>My Recommendation</h3>
                        </div>

                        {/* Content Quote */}
                        <div className={styles.recommendQuote}>
                            <div className={styles.quoteAvatar}>
                                {data.loAvatarUrl ? (
                                    <img src={data.loAvatarUrl} alt={data.loName || 'LO'} />
                                ) : (
                                    <span>{(data.loName || 'LO').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className={styles.quoteContent}>
                                <p>{data.aiScript}</p>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className={styles.recommendSignature}>
                            <span>—</span>
                            <span className={styles.signatureName}>{data.loName || 'Your Loan Officer'}</span>
                            {data.loNmls && <span className={styles.signatureNmls}>NMLS# {data.loNmls}</span>}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            {isDemoUser ? (
                <UpgradeCTA />
            ) : (
                <section className={styles.ctaSection}>
                    <div className={styles.ctaContent}>
                        <h2>Ready to Move Forward?</h2>

                        {/* LO Business Card */}
                        <div className={styles.loCard}>
                            {/* LO Avatar & Info */}
                            <div className={styles.loCardHeader}>
                                <div className={styles.loCardAvatar}>
                                    {data.loAvatarUrl ? (
                                        <img src={data.loAvatarUrl} alt={data.loName || 'LO'} />
                                    ) : (
                                        <span>{(data.loName || 'LO').charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className={styles.loCardInfo}>
                                    <h3 className={styles.loCardName}>{data.loName || 'Your Loan Officer'}</h3>
                                    {data.loNmls && (
                                        <span className={styles.loCardNmls}>NMLS# {data.loNmls}</span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Details */}
                            {(data.loPhone || data.loEmail) && (
                                <div className={styles.loCardContact}>
                                    {data.loPhone && (
                                        <button
                                            className={styles.loCardContactItem}
                                            onClick={() => copyToClipboard(data.loPhone, 'Phone number')}
                                        >
                                            <PhoneIcon className={styles.loCardIcon} />
                                            <span>{data.loPhone}</span>
                                            <span className={styles.copyHint}>📋</span>
                                        </button>
                                    )}
                                    {data.loEmail && (
                                        <button
                                            className={styles.loCardContactItem}
                                            onClick={() => copyToClipboard(data.loEmail, 'Email')}
                                        >
                                            <EmailIcon className={styles.loCardIcon} />
                                            <span>{data.loEmail}</span>
                                            <span className={styles.copyHint}>📋</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {(telHref || smsHref || emailHref) && (
                                <div className={styles.loCardActions}>
                                    {telHref && (
                                        <a className={styles.loCardBtn} href={telHref} onClick={() => trackEvent('cta_click', 'call')}>
                                            <PhoneIcon />
                                            <span>Call</span>
                                        </a>
                                    )}
                                    {smsHref && (
                                        <a className={styles.loCardBtn} href={smsHref} onClick={() => trackEvent('cta_click', 'text')}>
                                            <span>💬</span>
                                            <span>Text</span>
                                        </a>
                                    )}
                                    {emailHref && (
                                        <a className={styles.loCardBtn} href={emailHref} onClick={() => trackEvent('cta_click', 'email')}>
                                            <EmailIcon />
                                            <span>Email</span>
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Social Media */}
                            {(xUrl || instagramUrl || tiktokUrl || facebookUrl) && (
                                <div className={styles.loCardSocial}>
                                    {xUrl && (
                                        <a className={`${styles.loCardSocialBtn} ${styles.socialX}`} href={xUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('cta_click', 'x')}>
                                            <XIcon />
                                        </a>
                                    )}
                                    {instagramUrl && (
                                        <a className={`${styles.loCardSocialBtn} ${styles.socialInstagram}`} href={instagramUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('cta_click', 'instagram')}>
                                            <InstagramIcon />
                                        </a>
                                    )}
                                    {tiktokUrl && (
                                        <a className={`${styles.loCardSocialBtn} ${styles.socialTiktok}`} href={tiktokUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('cta_click', 'tiktok')}>
                                            <TikTokIcon />
                                        </a>
                                    )}
                                    {facebookUrl && (
                                        <a className={`${styles.loCardSocialBtn} ${styles.socialFacebook}`} href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('cta_click', 'facebook')}>
                                            <FacebookIcon />
                                        </a>
                                    )}
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

            {/* Copy Toast */}
            {copyToast && (
                <div className={styles.copyToast}>
                    ✓ {copyToast}
                </div>
            )}
        </div>
    );
}
