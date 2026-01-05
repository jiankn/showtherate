'use client';

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon, RocketIcon, LightningIcon, LinkIcon, RobotIcon, ChartIcon } from '@/components/Icons';
import { useToast } from '../../../components/GlobalToast';
import styles from './page.module.css';

export default function UpgradePage() {
    const router = useRouter();
    const { toast } = useToast();

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
                    <span>Unlock Pro Features</span>
                </div>
                <h1>Choose Your Plan</h1>
                <p>Upgrade to unlock professional branding, unlimited sharing, and AI superpowers.</p>
            </section>

            {/* Pricing Cards */}
            <section className={styles.pricingSection}>
                <div className={styles.pricingGrid}>
                    {/* Free Demo */}
                    <div className={styles.pricingCard}>
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

                        <button className={styles.btnCurrent} disabled>
                            Current Plan
                        </button>
                    </div>

                    {/* Starter Pass */}
                    <div className={styles.pricingCard}>
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
                            <li><CheckIcon className={styles.checkIcon} /> <strong>5</strong> Share Links</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>10</strong> Property Lookups</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>30</strong> AI Generations</li>
                            <li><CheckIcon className={styles.checkIcon} /> Full comparison features</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>$9.9 credit</strong> on upgrade</li>
                        </ul>

                        <button
                            onClick={() => handleCheckout('STARTER_PASS')}
                            className={styles.btnSecondary}
                        >
                            Get Starter Pass
                        </button>
                    </div>

                    {/* Pro Subscription - Featured */}
                    <div className={`${styles.pricingCard} ${styles.featured}`}>
                        <div className={styles.badge}>✨ Most Popular</div>
                        <div className={styles.cardIconWrapper}>
                            <RobotIcon className={styles.cardIcon} />
                        </div>
                        <h3>Pro Subscription</h3>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$59</span>
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

                        <button
                            onClick={() => handleCheckout('MONTHLY')}
                            className={styles.btnPrimary}
                        >
                            Subscribe Now
                        </button>
                    </div>

                    {/* Annual Pro */}
                    <div className={`${styles.pricingCard} ${styles.bestValue}`}>
                        <div className={styles.saveBadge}>Save $120</div>
                        <div className={styles.cardIconWrapper}>
                            <ChartIcon className={styles.cardIcon} />
                        </div>
                        <h3>Annual Pro</h3>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>$588</span>
                            <span className={styles.period}>/ year</span>
                        </div>
                        <p className={styles.priceDesc}>Best value for long term</p>

                        <ul className={styles.features}>
                            <li><CheckIcon className={styles.checkIcon} /> Everything in Pro</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>Unlimited</strong> Share Links</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>150</strong> Property Lookups/mo</li>
                            <li><CheckIcon className={styles.checkIcon} /> <strong>300</strong> AI Generations/mo</li>
                            <li><CheckIcon className={styles.checkIcon} /> Priority support</li>
                        </ul>

                        <button
                            onClick={() => handleCheckout('YEARLY')}
                            className={styles.btnSecondary}
                        >
                            Subscribe Yearly
                        </button>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className={styles.trustSection}>
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
            </section>
        </div>
    );
}
