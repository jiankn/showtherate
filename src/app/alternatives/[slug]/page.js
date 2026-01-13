/**
 * Alternatives Dynamic Route Page
 * Renders competitor alternative pages based on slug configuration
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pagesRegistry from '@/lib/seo/pages-registry.json';
import styles from './page.module.css';

// Generate static params for all alternative pages
export async function generateStaticParams() {
    const slugs = Object.keys(pagesRegistry.alternatives || {});
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const page = pagesRegistry.alternatives?.[slug];

    if (!page) {
        return { title: 'Alternative Not Found' };
    }

    return {
        title: page.metaTitle,
        description: page.metaDescription,
        keywords: `${page.competitor} alternative, mortgage software, loan officer tools`,
        openGraph: {
            title: page.metaTitle,
            description: page.metaDescription,
            type: 'website',
            url: `https://showtherate.com/alternatives/${slug}`,
        },
        alternates: {
            canonical: `https://showtherate.com/alternatives/${slug}`,
        },
    };
}

// Build related tools from slugs
function buildRelatedTools(relatedSlugs) {
    if (!relatedSlugs || relatedSlugs.length === 0) return [];

    return relatedSlugs.map(slug => {
        if (pagesRegistry.calculators[slug]) {
            const page = pagesRegistry.calculators[slug];
            return {
                title: page.title,
                href: `/calculator/${slug}`,
            };
        }
        if (pagesRegistry.compares[slug]) {
            const page = pagesRegistry.compares[slug];
            return {
                title: page.title,
                href: `/compare/${slug}`,
            };
        }
        return null;
    }).filter(Boolean);
}

export default async function AlternativePage({ params }) {
    const { slug } = await params;
    const page = pagesRegistry.alternatives?.[slug];

    if (!page) {
        notFound();
    }

    const relatedTools = buildRelatedTools(page.relatedSlugs);

    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Hero Section */}
                    <section className={styles.hero}>
                        <div className={styles.badge}>ALTERNATIVE</div>
                        <h1 className={styles.h1}>{page.h1}</h1>
                        <p className={styles.subtitle}>{page.subtitle}</p>
                    </section>

                    {/* Comparison Table */}
                    <section className={styles.comparisonSection}>
                        <h2 className={styles.sectionTitle}>
                            ShowTheRate vs {page.competitor}
                        </h2>
                        <div className={styles.comparisonTable}>
                            <div className={styles.tableHeader}>
                                <span>Feature</span>
                                <span className={styles.usColumn}>ShowTheRate</span>
                                <span>{page.competitor}</span>
                            </div>
                            {page.comparisonPoints.map((point, idx) => (
                                <div key={idx} className={styles.tableRow}>
                                    <span className={styles.featureName}>{point.feature}</span>
                                    <span className={`${styles.usValue} ${styles.highlighted}`}>
                                        {point.us}
                                    </span>
                                    <span className={styles.themValue}>{point.them}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Why Switch Section */}
                    <section className={styles.whySwitch}>
                        <h2 className={styles.sectionTitle}>Why LOs Choose ShowTheRate</h2>
                        <div className={styles.benefitsGrid}>
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>⚡</div>
                                <h3>60-Second Comparisons</h3>
                                <p>Create professional mortgage comparisons in under a minute, not 10+ minutes.</p>
                            </div>
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>📱</div>
                                <h3>Mobile-First Design</h3>
                                <p>Your clients view comparisons on mobile. Our tool is built for that.</p>
                            </div>
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>💰</div>
                                <h3>Better Price</h3>
                                <p>All the features you need at $79/month. No enterprise pricing games.</p>
                            </div>
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>🎯</div>
                                <h3>Focused on What Matters</h3>
                                <p>Client presentations, not complex market data you'll never use.</p>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className={styles.ctaSection}>
                        <h2>Ready to Switch?</h2>
                        <p>Try ShowTheRate free for 14 days. No credit card required.</p>
                        <div className={styles.ctaButtons}>
                            <Link href="/register" className={styles.primaryBtn}>
                                Start Free Trial
                            </Link>
                            <Link href="/#demo" className={styles.secondaryBtn}>
                                See Demo
                            </Link>
                        </div>
                    </section>

                    {/* Related Tools */}
                    {relatedTools.length > 0 && (
                        <section className={styles.relatedSection}>
                            <h2 className={styles.sectionTitle}>Try Our Free Tools</h2>
                            <div className={styles.relatedGrid}>
                                {relatedTools.map((tool, idx) => (
                                    <Link key={idx} href={tool.href} className={styles.relatedCard}>
                                        {tool.title} →
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
