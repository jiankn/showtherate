/**
 * Alternatives List Page
 * Lists all competitor alternative pages
 */

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pagesRegistry from '@/lib/seo/pages-registry.json';
import styles from './page.module.css';

export const metadata = {
    title: 'Mortgage Software Alternatives | ShowTheRate',
    description: 'Looking for alternatives to Mortgage Coach, MBS Highway, or other mortgage software? Discover why loan officers choose ShowTheRate.',
    alternates: {
        canonical: 'https://showtherate.com/alternatives',
    },
};

export default function AlternativesListPage() {
    const alternatives = Object.entries(pagesRegistry.alternatives || {}).map(
        ([slug, data]) => ({ slug, ...data })
    );

    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.h1}>Mortgage Software Alternatives</h1>
                    <p className={styles.subtitle}>
                        Looking for a better way to create mortgage comparisons?
                        See how ShowTheRate compares to the competition.
                    </p>

                    <div className={styles.cardsGrid}>
                        {alternatives.map((alt) => (
                            <Link
                                key={alt.slug}
                                href={`/alternatives/${alt.slug}`}
                                className={styles.card}
                            >
                                <h2 className={styles.cardTitle}>{alt.title}</h2>
                                <p className={styles.cardDescription}>
                                    {alt.metaDescription}
                                </p>
                                <span className={styles.cardLink}>
                                    Compare ShowTheRate vs {alt.competitor} →
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* CTA */}
                    <section className={styles.ctaSection}>
                        <h2>Try ShowTheRate Free</h2>
                        <p>14-day free trial. No credit card required.</p>
                        <Link href="/register" className={styles.ctaBtn}>
                            Start Free Trial
                        </Link>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
}
