'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon, RocketIcon, LightningIcon, LinkIcon, RobotIcon, ChartIcon } from '@/components/Icons';
import { useToast } from '../../../components/GlobalToast';
import { useUser } from '../../../components/UserContext';
import styles from './page.module.css';

export default function UpgradePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { entitlements, subscriptionDetails, loading, refreshUserData } = useUser();
    const [upgrading, setUpgrading] = useState(false);


    // 使用UserContext提供的状态和计算属性
    const { isPro, isStarterPass, isFree, isMonthly, isYearly } = useUser();
    const isSubscription = isPro;

    // 确认弹窗状态
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradePreview, setUpgradePreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Sync subscription status with Stripe on mount
    useEffect(() => {
        const syncSubscription = async () => {
            try {
                const res = await fetch('/api/user/subscription', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.synced && data.status) {
                        refreshUserData();
                    }
                }
            } catch (error) {
                console.error('Failed to sync subscription:', error);
            }
        };

        syncSubscription();
    }, [refreshUserData]);

    // 获取升级预览（显示确认弹窗前）
    const handleShowUpgradeConfirm = async () => {
        if (loadingPreview) return;

        setLoadingPreview(true);
        try {
            const res = await fetch('/api/billing/upgrade/preview', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get upgrade preview');
            }

            setUpgradePreview(data.preview);
            setShowUpgradeModal(true);
        } catch (error) {
            console.error('Preview error:', error);
            toast.error(error.message || 'Failed to get upgrade preview');
        } finally {
            setLoadingPreview(false);
        }
    };

    // 确认升级到年付
    const handleConfirmUpgrade = async () => {
        if (upgrading) return;

        setUpgrading(true);
        try {
            toast.info('Processing upgrade...');

            const res = await fetch('/api/billing/upgrade', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to upgrade');
            }

            toast.success('Successfully upgraded to annual plan! 🎉');
            setShowUpgradeModal(false);

            // 刷新UserContext中的数据
            refreshUserData();

            // Dispatch event to update other components
            window.dispatchEvent(new CustomEvent('entitlementsUpdated'));

        } catch (error) {
            console.error('Upgrade error:', error);
            toast.error(error.message || 'Failed to upgrade subscription');
        } finally {
            setUpgrading(false);
        }
    };

    const handleCheckout = async (productKey) => {
        try {
            toast.info('Redirecting to checkout...');

            const response = await fetch(`/api/billing/checkout?product=${productKey}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to start checkout' }));
                throw new Error(error.error || 'Failed to start checkout');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Failed to start checkout. Please try again.');
        }
    };

    return (
        <div className={styles.page}>
            {/* Animated Background Decorations */}
            <div className={styles.bgOrbs}>
                <div className={`${styles.orb} ${styles.orb1}`}></div>
                <div className={`${styles.orb} ${styles.orb2}`}></div>
                <div className={`${styles.orb} ${styles.orb3}`}></div>
            </div>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroBadge}>
                    <RocketIcon className={styles.heroBadgeIcon} />
                    <span>{isSubscription ? 'Pro Member' : 'Unlock Pro Features'}</span>
                </div>
                <h1>{isSubscription ? 'Manage Your Subscription' : 'Choose Your Plan'}</h1>
                <p>{isSubscription
                    ? 'Thank you for being a Pro member! You have access to all premium features.'
                    : 'Upgrade to unlock professional branding, unlimited sharing, and AI superpowers.'
                }</p>
            </section>

            {/* Trust Section */}
            <section className={styles.trustSection}>
                <div className={styles.trustCard}>
                    <div className={styles.trustItems}>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🔐</span>
                            <span>256-bit SSL</span>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>💳</span>
                            <span>Secure Payments</span>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🚀</span>
                            <span>Instant Access</span>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>📧</span>
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Monthly → Yearly Upgrade Banner */}
            {isMonthly && (
                <section className={styles.upgradeBanner}>
                    <div className={styles.upgradeBannerContent}>
                        <div className={styles.upgradeBannerLeft}>
                            <span className={styles.upgradeBannerIcon}>🎉</span>
                            <div className={styles.upgradeBannerText}>
                                <h3>Switch to Annual & Save $238/year</h3>
                                <p>You're on Monthly ($99/mo). Annual is just $950/yr (~$79/mo). Your remaining balance will be prorated.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleShowUpgradeConfirm}
                            className={styles.upgradeBannerBtn}
                            disabled={upgrading || loadingPreview}
                        >
                            {loadingPreview ? 'Loading...' : upgrading ? 'Processing...' : 'Upgrade to Annual →'}
                        </button>
                    </div>
                </section>
            )}

            {/* Pricing Cards */}
            <section className={styles.pricingSection}>
                <div className={styles.pricingGrid}>
                    {/* Free Demo */}
                    <div className={`${styles.pricingCard} ${isFree ? styles.currentPlan : ''}`}>
                        <div className={styles.cardIconWrapper}>
                            <span className={styles.cardEmoji}>🆓</span>
                        </div>
                        <h3>Free Demo</h3>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$0</span>
                        </div>
                        <p className={styles.priceDesc}>Try before you buy</p>

                        <ul className={styles.features}>
                            <li><CheckIcon className={styles.checkIcon} /> Local calculations</li>
                            <li><CheckIcon className={styles.checkIcon} /> See how it works</li>
                            <li className={styles.disabled}><span className={styles.xIcon}>✗</span> Share links</li>
                            <li className={styles.disabled}><span className={styles.xIcon}>✗</span> AI features</li>
                            <li className={styles.disabled}><span className={styles.xIcon}>✗</span> Save comparisons</li>
                        </ul>

                        {isFree ? (
                            <button className={styles.btnCurrent} disabled>
                                Current Plan
                            </button>
                        ) : (
                            <Link href="/app" className={styles.btnGhost}>
                                Back to App
                            </Link>
                        )}
                    </div>

                    {/* Starter Pass */}
                    <div className={`${styles.pricingCard} ${isStarterPass ? styles.currentPlan : ''}`}>
                        <div className={styles.cardIconWrapper}>
                            <LightningIcon className={styles.cardIcon} />
                        </div>
                        <h3>Starter Pass</h3>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$9.9</span>
                            <span className={styles.period}>/ 7 days</span>
                        </div>
                        <p className={styles.priceDesc}>Try the full experience</p>

                        <ul className={styles.features}>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>10</strong> Share Links</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>10</strong> Property Lookups</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>30</strong> AI Generations</li>
                            <li><CheckIcon className={styles.checkIcon} /> Full comparison features</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>$9.9 credit</strong> on upgrade</li>
                        </ul>

                        {isStarterPass ? (
                            <button className={styles.btnCurrent} disabled>
                                Current Plan
                            </button>
                        ) : isSubscription ? (
                            <button className={styles.btnGhost} disabled>
                                Included in Pro
                            </button>
                        ) : (
                            <button
                                onClick={() => handleCheckout('STARTER_PASS')}
                                className={styles.btnSecondary}
                            >
                                Get Starter Pass
                            </button>
                        )}
                    </div>

                    {/* Pro Subscription - Featured */}
                    <div className={`${styles.pricingCard} ${styles.featured} ${isMonthly ? styles.currentPlan : ''}`}>
                        {!isYearly && (
                            <div className={styles.badge}>{isMonthly ? '⭐ Your Plan' : '✨ Most Popular'}</div>
                        )}
                        <div className={styles.cardIconWrapper}>
                            <RobotIcon className={styles.cardIcon} />
                        </div>
                        <h3>Pro Subscription</h3>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$99</span>
                            <span className={styles.period}>/ month</span>
                        </div>
                        <p className={styles.priceDesc}>For serious loan officers</p>

                        <ul className={styles.features}>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>Unlimited</strong> Share Links</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>150</strong> Property Lookups/mo</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>300</strong> AI Generations/mo</li>
                            <li><CheckIcon className={styles.checkIcon} /> Priority support</li>
                            <li><CheckIcon className={styles.checkIcon} /> PWA for mobile</li>
                            <li><CheckIcon className={styles.checkIcon} /> Analytics (coming soon)</li>
                        </ul>

                        {isPro ? (
                            <button className={styles.btnCurrent} disabled>
                                ✓ Current Plan
                            </button>
                        ) : (
                            <button
                                onClick={() => handleCheckout('MONTHLY')}
                                className={styles.btnPrimary}
                            >
                                Subscribe Now
                            </button>
                        )}
                    </div>

                    {/* Annual Pro */}
                    <div className={`${styles.pricingCard} ${styles.bestValue} ${isYearly ? styles.currentPlan : ''}`}>
                        {isYearly ? (
                            <div className={styles.badge}>🏆 Best Choice</div>
                        ) : (
                            <div className={styles.saveBadge}>Save $238</div>
                        )}
                        <div className={styles.cardIconWrapper}>
                            <ChartIcon className={styles.cardIcon} />
                        </div>
                        <h3>Annual Pro</h3>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$950</span>
                            <span className={styles.period}>/ year</span>
                        </div>
                        <p className={styles.priceDesc}>Best value for long term</p>

                        <ul className={styles.features}>
                            <li><CheckIcon className={styles.checkIcon} /> Everything in Pro</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>Unlimited</strong> Share Links</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>200</strong> Property Lookups/mo</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>350</strong> AI Generations/mo</li>
                            <li><CheckIcon className={styles.checkIcon} /> Priority support</li>
                        </ul>

                        {isYearly ? (
                            <button className={styles.btnCurrent} disabled>
                                ✓ Current Plan
                            </button>
                        ) : isMonthly ? (
                            <button
                                onClick={handleShowUpgradeConfirm}
                                className={styles.btnSuccess}
                                disabled={upgrading || loadingPreview}
                            >
                                {loadingPreview ? 'Loading...' : 'Switch to Annual - Save $238'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleCheckout('YEARLY')}
                                className={styles.btnSecondary}
                            >
                                Subscribe Yearly
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Boost Pack Section - Only for subscribers */}
            {isSubscription && (
                <section className={styles.boostSection}>
                    <div className={styles.boostCard}>
                        <div className={styles.boostHeader}>
                            <span className={styles.boostIcon}>⚡</span>
                            <div>
                                <h3>Boost Pack</h3>
                                <p>Need more quota? Get instant additional credits!</p>
                            </div>
                        </div>
                        <div className={styles.boostContent}>
                            <div className={styles.boostPrice}>
                                <span className={styles.boostAmount}>$15</span>
                                <span className={styles.boostPeriod}>one-time</span>
                            </div>
                            <ul className={styles.boostFeatures}>
                                <li><CheckIcon className={styles.checkIcon} /> +<strong>100</strong> Property Lookups</li>
                                <li><CheckIcon className={styles.checkIcon} /> +<strong>150</strong> AI Generations</li>
                                <li><CheckIcon className={styles.checkIcon} /> Never resets during subscription</li>
                                <li><CheckIcon className={styles.checkIcon} /> Valid during active subscription</li>
                            </ul>
                            <button
                                onClick={() => handleCheckout('BOOST_PACK')}
                                className={styles.boostBtn}
                            >
                                Buy Boost Pack
                            </button>
                        </div>
                        {entitlements?.quotas?.property?.bonus > 0 && (
                            <div className={styles.boostStatus}>
                                <span>Current bonus balance: </span>
                                <strong>{entitlements.quotas.property.bonus}</strong> Property Lookups,
                                <strong> {entitlements.quotas.ai.bonus}</strong> AI Generations
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Upgrade Confirmation Modal */}
            {showUpgradeModal && upgradePreview && (
                <div className={styles.modalOverlay} onClick={() => setShowUpgradeModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>🎉 Confirm Upgrade to Annual</h3>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowUpgradeModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.priceBreakdown}>
                                <div className={styles.priceRow}>
                                    <span>Annual Plan</span>
                                    <span>${upgradePreview.yearlyPrice}</span>
                                </div>
                                {upgradePreview.monthlyCredit > 0 && (
                                    <div className={`${styles.priceRow} ${styles.credit}`}>
                                        <span>Credit from remaining monthly</span>
                                        <span>-${upgradePreview.monthlyCredit.toFixed(2)}</span>
                                    </div>
                                )}
                                {upgradePreview.balanceCredit > 0 && (
                                    <div className={`${styles.priceRow} ${styles.credit}`}>
                                        <span>Account credit applied</span>
                                        <span>-${upgradePreview.balanceCredit.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className={styles.priceDivider}></div>
                                <div className={`${styles.priceRow} ${styles.total}`}>
                                    <span>Due Today</span>
                                    <span className={styles.totalAmount}>${upgradePreview.amountDue.toFixed(2)}</span>
                                </div>
                            </div>
                            <p className={styles.modalNote}>
                                Your saved payment method will be charged. This change takes effect immediately.
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.modalCancel}
                                onClick={() => setShowUpgradeModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.modalConfirm}
                                onClick={handleConfirmUpgrade}
                                disabled={upgrading}
                            >
                                {upgrading ? 'Processing...' : 'Confirm Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

