import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import styles from '../legal.module.css';

export const metadata = {
    title: 'Privacy Policy | ShowTheRate',
    description: 'Privacy policy for ShowTheRate.com - How we handle data for Loan Officers and Homebuyers.',
    keywords: 'mortgage privacy, loan officer data security, real estate tool privacy'
};

export default function PrivacyPage() {
    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Privacy Policy</h1>
                        <p className={styles.lastUpdated}>
                            Last updated: December 30, 2025
                        </p>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
                            <p className={styles.text}>We collect information you provide directly to us to facilitate mortgage comparisons, including:</p>
                            <ul className={styles.list}>
                                <li><strong>Account Information:</strong> Email address and name when you sign up for an account.</li>
                                <li><strong>Usage Data:</strong> Mortgage calculation inputs (home price, interest rates, down payment amounts).</li>
                                <li><strong>Payment Information:</strong> Processed securely by Stripe; we do not store full credit card numbers.</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
                            <p className={styles.text}>We use the information we collect to provide and improve our services for Loan Officers:</p>
                            <ul className={styles.list}>
                                <li>To generate and host mortgage comparison reports and share links.</li>
                                <li>To provide AI-generated closing scripts and scenarios.</li>
                                <li>To process transactions and send related receipts.</li>
                                <li>To send technical notices, updates, and support messages.</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>3. Information Sharing</h2>
                            <p className={styles.text}>We do not sell, trade, or otherwise transfer your personal information to outside parties. We only share data with:</p>
                            <ul className={styles.list}>
                                <li><strong>Service Providers:</strong> Trusted third parties who assist us in operating our platform (e.g., Stripe for payments, Vercel for hosting), so long as those parties agree to keep this information confidential.</li>
                                <li><strong>Legal Requirements:</strong> When we believe release is appropriate to comply with the law, enforce our site policies, or protect ours or others&apos; rights, property, or safety.</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>4. Data Security</h2>
                            <p className={styles.text}>We implement appropriate security measures to protect your personal information. Your data is encrypted in transit and at rest. Payment processing is handled by Stripe, which maintains PCI DSS compliance.</p>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>5. Your Rights</h2>
                            <p className={styles.text}>You may request access to, correction of, or deletion of your personal data at any time.</p>
                            <div className={styles.contactBox}>
                                <span className={styles.contactLabel}>Data Requests:</span>
                                <a href="mailto:privacy@showtherate.com" className={styles.contactLink}>privacy@showtherate.com</a>
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
