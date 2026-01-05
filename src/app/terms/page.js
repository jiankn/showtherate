import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import styles from '../legal.module.css';

export const metadata = {
    title: 'Terms of Service | ShowTheRate',
    description: 'Terms of Service for ShowTheRate.com - Usage guidelines for Loan Officers.',
    keywords: 'mortgage calculator terms, software license agreement, loan officer tool terms'
};

export default function TermsPage() {
    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Terms of Service</h1>
                        <p className={styles.lastUpdated}>
                            Last updated: December 30, 2025
                        </p>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
                            <p className={styles.text}>By accessing or using ShowTheRate (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>2. Use License</h2>
                            <p className={styles.text}>ShowTheRate grants you a limited, non-exclusive, non-transferable license to use the Service for your professional mortgage business, subject to these Terms.</p>
                            <ul className={styles.list}>
                                <li>You may use the generated reports and links for client presentations.</li>
                                <li>You may not resell, redistribute, or reverse engineer the Service.</li>
                                <li>You are responsible for the accuracy of the data you input (rates, fees, etc.).</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>3. Disclaimer of Warranties</h2>
                            <p className={styles.text}>The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. ShowTheRate makes no warranties, expressed or implied, regarding the accuracy of calculations or compliance with specific lending regulations.</p>
                            <p className={styles.text}><strong>Important:</strong> Calculations are estimates only. This tool does not constitute a loan offer or a commitment to lend. You are responsible for verifying all figures with your official loan origination system (LOS).</p>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>4. Subscription and Billing</h2>
                            <p className={styles.text}>Some features require a paid subscription. By subscribing, you agree to pay the fees indicated at the time of purchase.</p>
                            <ul className={styles.list}>
                                <li>Subscriptions auto-renew unless canceled at least 24 hours before the end of the current period.</li>
                                <li>Refunds are handled on a case-by-case basis within 7 days of the initial charge.</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>5. Limitation of Liability</h2>
                            <p className={styles.text}>In no event shall ShowTheRate be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.</p>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>6. Contact Us</h2>
                            <div className={styles.contactBox}>
                                <span className={styles.contactLabel}>Questions about Terms:</span>
                                <a href="mailto:support@showtherate.com" className={styles.contactLink}>support@showtherate.com</a>
                            </div>
                        </section>

                        <Link href="/" className={styles.backLink}>← Back to Home</Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
