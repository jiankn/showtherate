'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculator';
import {
    PhoneIcon,
    EmailIcon,
    XIcon,
    InstagramIcon,
    TikTokIcon,
    FacebookIcon,
    LogoIcon
} from '@/components/Icons';
import ScenarioCard from '@/components/share/ScenarioCard';
import PaymentComparisonBar from '@/components/share/PaymentComparisonBar';
import LongTermComparison from '@/components/share/LongTermComparison';
import styles from './PreviewModal.module.css';

/**
 * PreviewModal - Full-screen preview of how comparison will look when shared
 * Reuses share page components for consistent experience
 */
export default function PreviewModal({
    isOpen,
    onClose,
    title,
    scenarios,
    aiScript,
    loProfile,
    propertyAddress,
    homePrice,
}) {
    const [copyToast, setCopyToast] = useState(null);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Helper functions for URL generation
    const phoneDigits = typeof loProfile?.phone === 'string'
        ? loProfile.phone.replace(/[^\d+]/g, '')
        : '';
    const telHref = phoneDigits ? `tel:${phoneDigits}` : null;
    const smsHref = phoneDigits ? `sms:${phoneDigits}` : null;
    const emailHref = typeof loProfile?.email === 'string' && loProfile.email.trim()
        ? `mailto:${loProfile.email.trim()}`
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

    const xUrl = normalizeSocialUrl(loProfile?.xHandle, 'x');
    const instagramUrl = normalizeSocialUrl(loProfile?.instagram, 'instagram');
    const tiktokUrl = normalizeSocialUrl(loProfile?.tiktok, 'tiktok');
    const facebookUrl = normalizeSocialUrl(loProfile?.facebook, 'facebook');

    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyToast(`${label} copied!`);
            setTimeout(() => setCopyToast(null), 2000);
        } catch {
            setCopyToast('Copy failed');
            setTimeout(() => setCopyToast(null), 2000);
        }
    };

    if (!isOpen) return null;


    // Format scenarios for display
    const displayScenarios = scenarios.map((s, idx) => ({
        id: s.id || `preview-${idx}`,
        name: s.name || `Option ${String.fromCharCode(65 + idx)}`,
        inputs: s.inputs || {},
        outputs: s.outputs || null,
    }));

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header with LO Branding */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.loBranding}>
                            <div className={styles.loAvatar}>
                                {loProfile?.avatarUrl ? (
                                    <img src={loProfile.avatarUrl} alt={loProfile?.name || 'LO'} className={styles.loAvatarImg} />
                                ) : '👤'}
                            </div>
                            <div className={styles.loInfo}>
                                <div className={styles.loName}>{loProfile?.name || 'Your Loan Officer'}</div>
                                <div className={styles.loMeta}>
                                    <span className={styles.loNmls}>NMLS# {loProfile?.nmls || '------'}</span>
                                    <span className={styles.shareViews}>👁 0 views</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.poweredBy}>
                            <span>Powered by</span>
                            <Link href="/" className={styles.brandLink}>ShowTheRate</Link>
                        </div>
                    </div>
                </header>

                {/* Preview Content */}
                <div className={styles.content}>
                    {/* Title */}
                    <section className={styles.titleSection}>
                        <h1 className={styles.title}>{title || 'Your Mortgage Options'}</h1>
                        <p className={styles.subtitle}>
                            Compare your options and find the best fit for your situation
                        </p>

                        {/* Property Address */}
                        {propertyAddress && (
                            <div className={styles.propertyAddress}>
                                <span className={styles.propertyIcon}>📍</span>
                                <span className={styles.propertyText}>{propertyAddress}</span>
                                {homePrice && (
                                    <span className={styles.propertyMeta}>
                                        <span>•</span>
                                        <span>{formatCurrency(homePrice)}</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Timestamp - shows current time as preview */}
                        <div className={styles.timestamp}>
                            <span className={styles.timestampIcon}>📅</span>
                            <span className={styles.timestampText}>
                                Updated {new Date().toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </span>
                        </div>
                    </section>

                    {/* Scenario Cards */}
                    <section className={styles.cardsSection}>
                        <div className={styles.cardsGrid}>
                            {displayScenarios.map((scenario, index) => (
                                <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
                            ))}
                        </div>
                    </section>

                    {/* Payment Comparison */}
                    <section className={styles.chartsSection}>
                        <PaymentComparisonBar scenarios={displayScenarios} />
                    </section>

                    {/* Long-term Comparison */}
                    <section className={styles.chartsSection}>
                        <LongTermComparison scenarios={displayScenarios} />
                    </section>

                    {/* AI Recommendation */}
                    {aiScript && (
                        <section className={styles.recommendSection}>
                            <div className={styles.recommendCard}>
                                <div className={styles.recommendHeader}>
                                    <span>✨</span>
                                    <h3>My Recommendation</h3>
                                </div>
                                <div className={styles.recommendContent}>
                                    <p>{aiScript}</p>
                                </div>
                                <div className={styles.recommendSignature}>
                                    <span>—</span>
                                    <span>{loProfile?.name || 'Your Name'}</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* CTA Section */}
                    <section className={styles.ctaSection}>
                        <div className={styles.ctaContent}>
                            <h2>Ready to Move Forward?</h2>

                            {/* LO Business Card */}
                            <div className={styles.loCard}>
                                {/* LO Avatar & Info */}
                                <div className={styles.loCardHeader}>
                                    <div className={styles.loCardAvatar}>
                                        {loProfile?.avatarUrl ? (
                                            <img src={loProfile.avatarUrl} alt={loProfile?.name || 'LO'} />
                                        ) : (
                                            <span>{(loProfile?.name || 'LO').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className={styles.loCardInfo}>
                                        <h3 className={styles.loCardName}>{loProfile?.name || 'Your Loan Officer'}</h3>
                                        {loProfile?.nmls && (
                                            <span className={styles.loCardNmls}>NMLS# {loProfile.nmls}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                {(loProfile?.phone || loProfile?.email) && (
                                    <div className={styles.loCardContact}>
                                        {loProfile?.phone && (
                                            <button
                                                className={styles.loCardContactItem}
                                                onClick={() => copyToClipboard(loProfile.phone, 'Phone number')}
                                            >
                                                <PhoneIcon className={styles.loCardIcon} />
                                                <span>{loProfile.phone}</span>
                                                <span className={styles.copyHint}>📋</span>
                                            </button>
                                        )}
                                        {loProfile?.email && (
                                            <button
                                                className={styles.loCardContactItem}
                                                onClick={() => copyToClipboard(loProfile.email, 'Email')}
                                            >
                                                <EmailIcon className={styles.loCardIcon} />
                                                <span>{loProfile.email}</span>
                                                <span className={styles.copyHint}>📋</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {(telHref || smsHref || emailHref) && (
                                    <div className={styles.loCardActions}>
                                        {telHref && (
                                            <a className={styles.loCardBtn} href={telHref}>
                                                <PhoneIcon />
                                                <span>Call</span>
                                            </a>
                                        )}
                                        {smsHref && (
                                            <a className={styles.loCardBtn} href={smsHref}>
                                                <span>💬</span>
                                                <span>Text</span>
                                            </a>
                                        )}
                                        {emailHref && (
                                            <a className={styles.loCardBtn} href={emailHref}>
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
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialX}`} href={xUrl} target="_blank" rel="noopener noreferrer">
                                                <XIcon />
                                            </a>
                                        )}
                                        {instagramUrl && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialInstagram}`} href={instagramUrl} target="_blank" rel="noopener noreferrer">
                                                <InstagramIcon />
                                            </a>
                                        )}
                                        {tiktokUrl && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialTiktok}`} href={tiktokUrl} target="_blank" rel="noopener noreferrer">
                                                <TikTokIcon />
                                            </a>
                                        )}
                                        {facebookUrl && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialFacebook}`} href={facebookUrl} target="_blank" rel="noopener noreferrer">
                                                <FacebookIcon />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

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

                {/* Copy Toast */}
                {copyToast && (
                    <div className={styles.copyToast}>
                        ✓ {copyToast}
                    </div>
                )}
            </div>
        </div>
    );
}
