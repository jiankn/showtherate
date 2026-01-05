'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LogoIcon } from '../../components/Icons';
import { useToast } from '../../components/GlobalToast';
import styles from './page.module.css';

export default function PricingPage() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [loadingProduct, setLoadingProduct] = useState(null);

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
    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className="container">
                    <nav className={styles.nav}>
                        <Link href="/" className={styles.logo}>
                            <LogoIcon className={styles.logoIconSvg} />
                            <span>ShowTheRate</span>
                        </Link>
                        <div className={styles.navActions}>
                            <Link href="/app" className="btn btn-ghost btn-sm">Sign In</Link>
                            <Link href="/app/new" className="btn btn-primary btn-sm">Get Started</Link>
                        </div>
                    </nav>
                </div>
            </header>

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
                                <li className={styles.disabled}>✗ Property tax lookup</li>
                            </ul>

                            <button
                                onClick={handleSignUp}
                                className="btn btn-secondary btn-full"
                            >
                                Try Demo
                            </button>
                        </div>

                        {/* Starter Pass */}
                        <div className={`card ${styles.pricingCard}`}>
                            <h3>Starter Pass</h3>
                            <div className={styles.price}>
                                <span className="number-display">$9.9</span>
                                <span className={styles.period}>/ 7 days</span>
                            </div>
                            <p className={styles.priceDesc}>Perfect for trying the full experience</p>

                            <ul className={styles.features}>
                                <li>✓ <strong>5</strong> Share Links</li>
                                <li>✓ <strong>10</strong> Property Tax Lookups</li>
                                <li>✓ <strong>30</strong> AI Generations</li>
                                <li>✓ Full comparison features</li>
                                <li>✓ Save unlimited comparisons</li>
                                <li>✓ <strong>$9.9 credit</strong> on upgrade</li>
                            </ul>

                            <button
                                onClick={() => handleCheckout('STARTER_PASS')}
                                disabled={loadingProduct === 'STARTER_PASS'}
                                className="btn btn-secondary btn-full"
                            >
                                {loadingProduct === 'STARTER_PASS' ? 'Processing...' : 'Get Starter Pass'}
                            </button>
                        </div>

                        {/* Pro Subscription */}
                        <div className={`card ${styles.pricingCard} ${styles.featured}`}>
                            <div className={styles.badge}>✨ Most Popular</div>
                            <h3>Pro Subscription</h3>
                            <div className={styles.price}>
                                <span className="number-display">$59</span>
                                <span className={styles.period}>/ month</span>
                            </div>
                            <p className={styles.priceDesc}>For serious loan officers</p>

                            <ul className={styles.features}>
                                <li>✓ <strong>Unlimited</strong> Share Links</li>
                                <li>✓ <strong>150</strong> Property Lookups/mo</li>
                                <li>✓ <strong>300</strong> AI Generations/mo</li>
                                <li>✓ Priority support</li>
                                <li>✓ PWA for mobile</li>
                                <li>✓ Analytics (coming soon)</li>
                            </ul>

                            <button
                                onClick={() => handleCheckout('MONTHLY')}
                                disabled={loadingProduct === 'MONTHLY'}
                                className="btn btn-primary btn-full"
                            >
                                {loadingProduct === 'MONTHLY' ? 'Processing...' : 'Subscribe'}
                            </button>
                        </div>

                        {/* Annual Subscription */}
                        <div className={`card ${styles.pricingCard} ${styles.pricingCardBestValue}`}>
                            <h3>Annual Pro</h3>
                            <div className={styles.price}>
                                <span className="number-display">$588</span>
                                <span className={styles.period}>/ year</span>
                            </div>
                            <p className={styles.priceDesc}>Best value for long term</p>

                            <ul className={styles.features}>
                                <li>✓ <strong>Save $120/year</strong></li>
                                <li>✓ <strong>Unlimited</strong> Share Links</li>
                                <li>✓ <strong>150</strong> Property Lookups/mo</li>
                                <li>✓ <strong>300</strong> AI Generations/mo</li>
                                <li>✓ Priority support</li>
                                <li>✓ PWA for mobile</li>
                            </ul>

                            <button
                                onClick={() => handleCheckout('YEARLY')}
                                disabled={loadingProduct === 'YEARLY'}
                                className="btn btn-secondary btn-full"
                            >
                                {loadingProduct === 'YEARLY' ? 'Processing...' : 'Subscribe Yearly'}
                            </button>
                        </div>
                    </div>
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
            <footer className={styles.footer}>
                <div className="container">
                    <div className={styles.footerContent}>
                        <p>© 2025 ShowTheRate. All rights reserved.</p>
                        <div className={styles.footerLinks}>
                            <Link href="/privacy">Privacy Policy</Link>
                            <Link href="/terms">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
