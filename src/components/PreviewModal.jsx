'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/GlobalToast';
import ScenarioCard from '@/components/share/ScenarioCard';
import PaymentComparisonBar from '@/components/share/PaymentComparisonBar';
import LongTermComparison from '@/components/share/LongTermComparison';
import {
    PhoneIcon,
    EmailIcon,
    XIcon,
    InstagramIcon,
    TikTokIcon,
    FacebookIcon
} from '@/components/Icons';
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
    const { toast } = useToast();

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

    const copyToClipboard = async (text, label) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard`);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy to clipboard');
        }
    };

    if (!isOpen) return null;

    // Derived profile data
    const loName = loProfile ? [loProfile.firstName, loProfile.lastName].filter(Boolean).join(' ') : 'Your Name';
    const loPhone = loProfile?.phone;
    const loEmail = loProfile?.email;
    const loNmls = loProfile?.nmls;

    // Action URLs
    const telHref = loPhone ? `tel:${loPhone.replace(/[^\d+]/g, '')}` : null;
    const smsHref = loPhone ? `sms:${loPhone.replace(/[^\d+]/g, '')}` : null;
    const emailHref = loEmail ? `mailto:${loEmail}` : null;

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
                {/* Top Bar with Back Button */}
                <div className={styles.topBar}>
                    <button className={styles.backBtn} onClick={onClose}>
                        ← Back to Editor
                    </button>
                    <div className={styles.upgradeBanner}>
                        <span className={styles.bannerIcon}>👁</span>
                        <span className={styles.bannerText}>
                            Preview Mode • <Link href="/app/upgrade">Upgrade to share</Link>
                        </span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                {/* Preview Content */}
                <div className={styles.content}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.loBranding}>
                            <div className={styles.loAvatar}>
                                {loProfile?.avatarUrl ? (
                                    <img src={loProfile.avatarUrl} alt={loProfile.name || 'LO'} />
                                ) : '👤'}
                            </div>
                            <div className={styles.loInfo}>
                                <div className={styles.loName}>{loProfile?.name || 'Your Name'}</div>
                                <div className={styles.loNmls}>NMLS# {loProfile?.nmls || '------'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Title Section */}
                    <section className={styles.titleSection}>
                        <h1 className={styles.title}>{title || 'Your Mortgage Options'}</h1>
                        <p className={styles.subtitle}>
                            Compare your options and find the best fit for your situation
                        </p>
                        {propertyAddress && (
                            <div className={styles.propertyAddress}>
                                <span>📍</span>
                                <span>{propertyAddress}</span>
                                {homePrice && (
                                    <>
                                        <span>•</span>
                                        <span>${homePrice.toLocaleString()}</span>
                                    </>
                                )}
                            </div>
                        )}
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
                        <div className={styles.ctaCard}>
                            <h2 className={styles.ctaTitle}>Ready to Move Forward?</h2>

                            <div className={styles.loCard}>
                                <div className={styles.loCardHeader}>
                                    <div className={styles.loCardAvatar}>
                                        {loProfile?.avatarUrl ? (
                                            <img src={loProfile.avatarUrl} alt={loName} className={styles.loAvatarImg} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>{loName.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className={styles.loCardInfo}>
                                        <h3 className={styles.loCardName}>{loName}</h3>
                                        {loNmls && <span className={styles.loCardNmls}>NMLS# {loNmls}</span>}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                {(loPhone || loEmail) && (
                                    <div className={styles.loCardContact}>
                                        {loPhone && (
                                            <button
                                                className={styles.loCardContactItem}
                                                onClick={() => copyToClipboard(loPhone, 'Phone number')}
                                            >
                                                <PhoneIcon className={styles.loCardIcon} />
                                                <span>{loPhone}</span>
                                                <span className={styles.copyHint}>📋</span>
                                            </button>
                                        )}
                                        {loEmail && (
                                            <button
                                                className={styles.loCardContactItem}
                                                onClick={() => copyToClipboard(loEmail, 'Email')}
                                            >
                                                <EmailIcon className={styles.loCardIcon} />
                                                <span>{loEmail}</span>
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
                                {(loProfile?.xHandle || loProfile?.instagram || loProfile?.tiktok || loProfile?.facebook) && (
                                    <div className={styles.loCardSocial}>
                                        {loProfile.xHandle && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialX}`} href={`https://twitter.com/${loProfile.xHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                                <XIcon />
                                            </a>
                                        )}
                                        {loProfile.instagram && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialInstagram}`} href={loProfile.instagram} target="_blank" rel="noopener noreferrer">
                                                <InstagramIcon />
                                            </a>
                                        )}
                                        {loProfile.tiktok && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialTiktok}`} href={loProfile.tiktok} target="_blank" rel="noopener noreferrer">
                                                <TikTokIcon />
                                            </a>
                                        )}
                                        {loProfile.facebook && (
                                            <a className={`${styles.loCardSocialBtn} ${styles.socialFacebook}`} href={loProfile.facebook} target="_blank" rel="noopener noreferrer">
                                                <FacebookIcon />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className={styles.footer}>
                        <div className={styles.disclaimer}>
                            <strong>Important Disclaimer:</strong> Estimates only. This is not a loan offer
                            or commitment to lend. Actual rates, payments, and costs may vary based on your
                            credit profile and property details.
                        </div>
                    </footer>

                    {/* Bottom Close Button */}
                    <div className={styles.bottomActions}>
                        <button className={styles.closePreviewBtn} onClick={onClose}>
                            ✓ Close Preview & Continue Editing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
