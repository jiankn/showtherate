/**
 * Calculator Tools Landing Page
 * Lists all available calculators
 */

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pagesRegistry from '@/lib/seo/pages-registry.json';
import styles from './page.module.css';

export const metadata = {
    title: 'Mortgage Calculators & Tools | ShowTheRate',
    description: 'Free mortgage calculators for loan officers and homebuyers. Calculate buydowns, discount points, rate locks, closing costs, and more.',
    keywords: 'mortgage calculator, buydown calculator, points calculator, rate lock calculator',
};

// Group calculators by cluster
function groupByCluster(calculators) {
    const groups = {};
    Object.entries(calculators).forEach(([slug, config]) => {
        const cluster = config.cluster || 'other';
        if (!groups[cluster]) {
            groups[cluster] = [];
        }
        groups[cluster].push({ slug, ...config });
    });
    return groups;
}

const clusterNames = {
    buydown: 'Temporary Buydown',
    points: 'Discount Points',
    ratelock: 'Rate Lock',
    workflow: 'LO Workflow Tools',
};

const clusterDescriptions = {
    buydown: 'Calculate temporary rate reductions and seller concession buydowns',
    points: 'Analyze discount points costs and break-even periods',
    ratelock: 'Evaluate rate lock fees, extensions, and float vs lock decisions',
    workflow: 'Essential tools for closing costs and cash to close estimates',
};

export default function CalculatorListPage() {
    const groups = groupByCluster(pagesRegistry.calculators);

    return (
        <>
            <Header variant="dark" />

            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Mortgage Calculators & Tools</h1>
                        <p className={styles.subtitle}>
                            Free calculators to help loan officers explain complex mortgage concepts to clients.
                        </p>
                    </header>

                    {Object.entries(groups).map(([cluster, tools]) => (
                        <section key={cluster} className={styles.cluster}>
                            <div className={styles.clusterHeader}>
                                <h2 className={styles.clusterTitle}>{clusterNames[cluster] || cluster}</h2>
                                <p className={styles.clusterDescription}>
                                    {clusterDescriptions[cluster]}
                                </p>
                            </div>

                            <div className={styles.toolsGrid}>
                                {tools.map((tool) => (
                                    <Link
                                        key={tool.slug}
                                        href={`/calculator/${tool.slug}`}
                                        className={styles.toolCard}
                                    >
                                        <div className={styles.toolIcon}>🧮</div>
                                        <div className={styles.toolContent}>
                                            <h3 className={styles.toolTitle}>{tool.title}</h3>
                                            <p className={styles.toolDescription}>
                                                {tool.subtitle}
                                            </p>
                                            <span className={styles.toolPriority}>
                                                {tool.priority === 'P0' ? '⭐ Top Tool' : ''}
                                            </span>
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
                        </section>
                    ))}
                </div>
            </main>

            <Footer />
        </>
    );
}
