'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useToast } from '../../components/GlobalToast';
import { useUser } from '../../components/UserContext';
import styles from './page.module.css';

export default function PricingPage() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const { isPro, isStarterPass, loading: userLoading } = useUser();
    const router = useRouter();
    const [loadingProduct, setLoadingProduct] = useState(null);
    const [billingTab, setBillingTab] = useState('individual');

    // 如果用户已经有活跃订阅，重定向到dashboard
    useEffect(() => {
        if (!userLoading && (isPro || isStarterPass)) {
            const planName = isPro ? 'Pro' : 'Starter Pass';
            toast.info(`You already have a ${planName} plan!`);
            router.push('/app');
        }
    }, [isPro, isStarterPass, userLoading, router, toast]);

    // 如果正在加载用户状态，显示加载中
    if (userLoading) {
        return (
            <div className={styles.page}>
                <Header variant="dark" />
                <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>Loading...</div>
                </div>
                <Footer />
            </div>
        );
    }

    const handleCheckout = async (productKey) => {
        // 如果用户未登录，跳转到登录页并携带 product 参数
        if (status !== 'authenticated') {
            window.location.href = `/login?product=${productKey}&mode=signup`;
            return;
        }

        // 已登录，直接调用 Stripe Checkout
        setLoadingProduct(productKey);
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
            setLoadingProduct(null);
        }
    };

    const handleSignUp = () => {
        window.location.href = '/login?mode=signup';
    };

    const handleContactSales = () => {
        window.location.href = 'mailto:enterprise@showtherate.com?subject=Enterprise%20Plan%20Inquiry';
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <Header variant="dark" />

            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <h1>Simple, Transparent Pricing</h1>
                    <p>No hidden fees. No surprises. Start low-risk and upgrade when you&apos;re ready.</p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className={styles.pricingSection}>
                <div className="container">
                    {/* Billing Toggle */}
                    <div className={styles.billingToggleWrapper}>
                        <div className={styles.billingToggle}>
                            <button
                                className={`${styles.billingToggleBtn} ${billingTab === 'individual' ? styles.billingToggleActive : ''}`}
                                onClick={() => setBillingTab('individual')}
                            >
                                Individual
                            </button>
                            <button
                                className={`${styles.billingToggleBtn} ${billingTab === 'team' ? styles.billingToggleActive : ''}`}
                                onClick={() => setBillingTab('team')}
                            >
                                Team & Annual
                            </button>
                        </div>
                        <span className={styles.savingsTip}>
                            💰 Save 20% with annual
                        </span>
                    </div>

                    {billingTab === 'individual' ? (
                        <div className={styles.pricingGrid}>
                            {/* Free Demo */}
                            <div className={`card ${styles.pricingCard}`}>
                                <h3>Free Demo</h3>
                                <div className={styles.price}>
                                    <span className="number-display">$0</span>
                                </div>
                                <p className={styles.priceDesc}>Try before you buy</p>

                                <ul className={styles.features}>
                                    <li>✓ Local calculations</li>
                                    <li>✓ See how it works</li>
                                    <li className={styles.disabled}>✗ Share links</li>
                                    <li className={styles.disabled}>✗ AI features</li>
                                    <li className={styles.disabled}>✗ Save comparisons</li>
                                </ul>

                                <button
                                    onClick={handleSignUp}
                                    className="btn btn-secondary btn-full"
                                >
                                    Try Demo
                                </button>
                            </div>

                            {/* Starter Pass */}
                            <div className={`card ${styles.pricingCard} ${isStarterPass ? styles.currentPlan : ''}`}>
                                <div className={styles.badge}>
                                    {isStarterPass ? '✅ Current Plan' : '🚀 Try Risk-Free'}
                                </div>
                                <h3>Starter Pass</h3>
                                <div className={styles.price}>
                                    <span className="number-display">$9.9</span>
                                    <span className={styles.period}>/ 7 days</span>
                                </div>
                                <p className={styles.priceDesc}>
                                    {isStarterPass ? 'Your active trial' : 'Perfect for trying the full experience'}
                                </p>

                                <ul className={styles.features}>
                                    <li>✓ <strong>10</strong> Share Links</li>
                                    <li>✓ <strong>10</strong> Property Tax Lookups</li>
                                    <li>✓ <strong>30</strong> AI Generations</li>
                                    <li>✓ Full comparison features</li>
                                    <li>✓ <strong>$9.9 credit</strong> on upgrade</li>
                                </ul>

                                {isStarterPass ? (
                                    <Link href="/app/settings" className="btn btn-secondary btn-full">
                                        Manage Trial
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => handleCheckout('STARTER_PASS')}
                                        disabled={loadingProduct === 'STARTER_PASS'}
                                        className="btn btn-secondary btn-full"
                                    >
                                        {loadingProduct === 'STARTER_PASS' ? 'Processing...' : 'Get Starter Pass'}
                                    </button>
                                )}
                            </div>

                            {/* Pro Subscription */}
                            <div className={`card ${styles.pricingCard} ${styles.featured} ${isPro ? styles.currentPlan : ''}`}>
                                <div className={styles.badge}>
                                    {isPro ? '✅ Current Plan' : '✨ Most Popular'}
                                </div>
                                <h3>Pro Monthly</h3>
                                <div className={styles.price}>
                                    <span className="number-display">$99</span>
                                    <span className={styles.period}>/ month</span>
                                </div>
                                <p className={styles.priceDesc}>
                                    {isPro ? 'Your active subscription' : 'For serious loan officers'}
                                </p>

                                <ul className={styles.features}>
                                    <li>✓ <strong>Unlimited</strong> Share Links</li>
                                    <li>✓ <strong>150</strong> Property Lookups/mo</li>
                                    <li>✓ <strong>300</strong> AI Generations/mo</li>
                                    <li>✓ Priority support</li>
                                    <li>✓ PWA for mobile</li>
                                </ul>

                                {isPro ? (
                                    <Link href="/app/settings" className="btn btn-secondary btn-full">
                                        Manage Subscription
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => handleCheckout('MONTHLY')}
                                        disabled={loadingProduct === 'MONTHLY'}
                                        className="btn btn-primary btn-full"
                                    >
                                        {loadingProduct === 'MONTHLY' ? 'Processing...' : 'Subscribe'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={`${styles.pricingGrid} ${styles.pricingGridCentered}`}>
                            {/* Annual Pro */}
                            <div className={`card ${styles.pricingCard} ${styles.featured}`}>
                                <div className={styles.badge}>💰 Best Value</div>
                                <h3>Annual Pro</h3>
                                <div className={styles.price}>
                                    <span className="number-display">$950</span>
                                    <span className={styles.period}>/ year</span>
                                </div>
                                <p className={styles.priceDesc}>Save $238 vs monthly</p>

                                <ul className={styles.features}>
                                    <li>✓ <strong>Save $238/year</strong></li>
                                    <li>✓ <strong>Unlimited</strong> Share Links</li>
                                    <li>✓ <strong>200</strong> Property Lookups/mo</li>
                                    <li>✓ <strong>350</strong> AI Generations/mo</li>
                                    <li>✓ Priority support</li>
                                </ul>

                                <button
                                    onClick={() => handleCheckout('YEARLY')}
                                    disabled={loadingProduct === 'YEARLY'}
                                    className="btn btn-primary btn-full"
                                >
                                    {loadingProduct === 'YEARLY' ? 'Processing...' : 'Subscribe Yearly'}
                                </button>
                            </div>

                            {/* Enterprise */}
                            <div className={`card ${styles.pricingCard} ${styles.enterprise}`}>
                                <div className={styles.badge}>🏢 Teams</div>
                                <h3>Enterprise</h3>
                                <div className={styles.price}>
                                    <span className="number-display">Custom</span>
                                </div>
                                <p className={styles.priceDesc}>For teams & brokerages</p>

                                <ul className={styles.features}>
                                    <li>✓ <strong>Unlimited</strong> users</li>
                                    <li>✓ Team management dashboard</li>
                                    <li>✓ White-label branding</li>
                                    <li>✓ Custom integrations (CRM, LOS)</li>
                                    <li>✓ Dedicated account manager</li>
                                    <li>✓ Priority support & SLA</li>
                                </ul>

                                <button
                                    onClick={handleContactSales}
                                    className={`btn btn-full ${styles.btnEnterprise}`}
                                >
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* FAQ */}
            <section className={styles.faq}>
                <div className="container">
                    <h2>Frequently Asked Questions</h2>

                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h4>Can I try before I buy?</h4>
                            <p>Yes! The free demo lets you test the calculator locally. For the full experience including share links and AI, get a $9.9 Starter Pass.</p>
                        </div>

                        <div className={styles.faqItem}>
                            <h4>What happens after my Starter Pass expires?</h4>
                            <p>Your saved comparisons remain accessible. Share links stay active for 14 days after creation. You can upgrade to a subscription anytime.</p>
                        </div>

                        <div className={styles.faqItem}>
                            <h4>Do you offer refunds?</h4>
                            <p>We don&apos;t offer refunds, but the $9.9 Starter Pass lets you try everything risk-free before subscribing.</p>
                        </div>

                        <div className={styles.faqItem}>
                            <h4>What counts as a &ldquo;property lookup&rdquo;?</h4>
                            <p>Each unique address lookup that requires an API call. Repeated lookups of the same address use cached data and don&apos;t count against your quota.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta}>
                <div className="container">
                    <h2>Ready to Close More Deals?</h2>
                    <p>Join hundreds of Loan Officers using ShowTheRate</p>
                    <Link href="/app/new" className="btn btn-primary btn-lg">
                        Get Started for $9.9
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}
