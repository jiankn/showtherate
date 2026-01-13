/**
 * Compare Tools Landing Page
 * Lists all available comparison tools
 */

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pagesRegistry from '@/lib/seo/pages-registry.json';
import styles from './page.module.css';

export const metadata = {
    title: 'Mortgage Comparison Tools | ShowTheRate',
    description: 'Free mortgage comparison tools. Compare buydowns vs points, lock vs float, and more to make informed decisions.',
    keywords: 'mortgage comparison, buydown vs points, lock vs float, points vs credits',
};

export default function CompareListPage() {
    const compares = Object.entries(pagesRegistry.compares);

    return (
        <>
            <Header variant="dark" />

            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Mortgage Comparison Tools</h1>
                        <p className={styles.subtitle}>
                            Side-by-side comparisons to help you and your clients make the right choice.
                        </p>
                    </header>

                    <div className={styles.toolsGrid}>
                        {compares.map(([slug, tool]) => (
                            <Link
                                key={slug}
                                href={`/compare/${slug}`}
                                className={styles.toolCard}
                            >
                                <div className={styles.toolIcon}>⚖️</div>
                                <div className={styles.toolContent}>
                                    <h3 className={styles.toolTitle}>{tool.title}</h3>
                                    <p className={styles.toolDescription}>
                                        {tool.subtitle}
                                    </p>
                                </div>
                                <svg
                                    className={styles.arrow}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
