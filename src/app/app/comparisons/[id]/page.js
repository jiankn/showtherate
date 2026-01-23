'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ScenarioCard from '@/components/share/ScenarioCard';
import PaymentComparisonBar from '@/components/share/PaymentComparisonBar';
import LongTermComparison from '@/components/share/LongTermComparison';
import { CopyIcon, ArrowLeftIcon } from '@/components/Icons';
import { useToast } from '@/components/GlobalToast';
import styles from './page.module.css';

export default function ComparisonDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copying, setCopying] = useState(false);
    const [entitlements, setEntitlements] = useState(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [comparisonRes, entitlementsRes] = await Promise.all([
                    fetch(`/api/comparisons/${params.id}`),
                    fetch('/api/user/entitlements'),
                ]);

                const comparisonJson = await comparisonRes.json();

                if (comparisonRes.ok) {
                    setData(comparisonJson);
                } else {
                    const errorMsg = comparisonJson.error || `Failed to load comparison (${comparisonRes.status})`;
                    console.error('Comparison API error:', errorMsg);
                    setError(errorMsg);
                }

                const entitlementsJson = await entitlementsRes.json();
                if (entitlementsRes.ok) {
                    setEntitlements(entitlementsJson);
                } else {
                    console.warn('Failed to load entitlements:', entitlementsJson);
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load comparison');
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const handleCopyShareLink = async () => {
        if (!data) {
            console.warn('No data available for sharing');
            toast.error('No comparison data available');
            return;
        }

        if (!data.id) {
            console.error('Comparison data missing ID:', data);
            toast.error('Invalid comparison data');
            return;
        }


        // Check entitlements first
        if (!entitlements?.hasActiveEntitlement || !entitlements?.quotas?.share) {
            setShowUpgradePrompt(true);
            return;
        }

        const shareQuota = entitlements.quotas.share;
        if (shareQuota.remaining === 0 && shareQuota.quota !== -1) {
            setShowUpgradePrompt(true);
            return;
        }

        setCopying(true);

        try {
            const res = await fetch('/api/shares', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comparisonId: data.id }),
            });
            const shareData = await res.json();

            if (res.ok && shareData.shareId) {
                const shareUrl = `${window.location.origin}/s/${shareData.shareId}`;
                await navigator.clipboard.writeText(shareUrl);
                const successMessage = shareData.isExisting
                    ? 'Existing share link copied to clipboard!'
                    : 'New share link created and copied to clipboard!';
                toast.success(successMessage);
            } else {
                const errorMsg = shareData.error || 'Failed to generate share link';
                toast.error(errorMsg);
            }
        } catch (err) {
            console.error('Failed to copy share link:', err);
            toast.error('Failed to copy share link');
        } finally {
            setCopying(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading comparison...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={styles.page}>
                <div className={styles.errorState}>
                    <h2>😕 {error || 'Comparison not found'}</h2>
                    <Link href="/app/comparisons" className={styles.backBtn}>
                        ← Back to Comparisons
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(data.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className={styles.page}>
            {/* Upgrade Prompt Modal */}
            {showUpgradePrompt && (
                <div className={styles.upgradeModal}>
                    <div className={styles.upgradeContent}>
                        <button className={styles.upgradeClose} onClick={() => setShowUpgradePrompt(false)}>×</button>
                        <div className={styles.upgradeIcon}>💎</div>
                        <h2>Upgrade Required</h2>
                        <p>Share links are a premium feature. Upgrade your plan to share comparisons with clients.</p>
                        <div className={styles.upgradeActions}>
                            <button className={styles.upgradeCancelBtn} onClick={() => setShowUpgradePrompt(false)}>
                                Maybe Later
                            </button>
                            <Link href="/app/upgrade" className={styles.upgradeBtn}>
                                View Plans →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/app/comparisons" className={styles.backBtn}>
                        <ArrowLeftIcon />
                        <span>Back</span>
                    </Link>
                    <div className={styles.titleSection}>
                        <h1>{data.title}</h1>
                        <div className={styles.meta}>
                            <span>Created {formattedDate}</span>
                            <span>•</span>
                            <span>{data.scenarios.length} Scenarios</span>
                            {data.activeShare && (
                                <>
                                    <span>•</span>
                                    <span className={styles.shareStatus}>🔗 Shared</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Link
                        href={`/app/new?clone=${data.id}`}
                        className={styles.editBtn}
                    >
                        ✏️
                        <span>Duplicate & Edit</span>
                    </Link>
                    <button
                        className={styles.shareBtn}
                        onClick={handleCopyShareLink}
                        disabled={copying}
                    >
                        <CopyIcon />
                        <span>{copying ? 'Copying...' : 'Copy Share Link'}</span>
                    </button>
                </div>
            </div>

            {/* Scenario Cards */}
            <section className={styles.cardsSection}>
                <h2>Scenarios</h2>
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

            {/* Share History */}
            {data.shares && data.shares.length > 0 && (
                <section className={styles.sharesSection}>
                    <h2>Share History</h2>
                    <div className={styles.sharesList}>
                        {data.shares.map((share, idx) => (
                            <div key={idx} className={styles.shareItem}>
                                <span className={styles.shareId}>
                                    /s/{share.shareId}
                                </span>
                                <span className={styles.shareViews}>
                                    👁 {share.viewCount} views
                                </span>
                                <span className={`${styles.shareActive} ${share.isActive ? styles.active : styles.expired}`}>
                                    {share.isActive ? 'Active' : 'Expired'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
