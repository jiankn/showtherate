/**
 * Calculator Layout Component
 * Universal layout for all calculator pages with SEO elements
 */

import Link from 'next/link';
import Header from '../Header';
import Footer from '../Footer';
import FAQSection from '../seo/FAQSection';
import RelatedTools from '../seo/RelatedTools';
import BreadcrumbSchema from '../seo/BreadcrumbSchema';
import styles from './CalculatorLayout.module.css';

export default function CalculatorLayout({
    children,
    title,
    subtitle,
    breadcrumbs = [],
    faq = [],
    relatedTools = [],
    ctaText = 'Create Your Own Comparison',
    ctaHref = '/app/new',
}) {
    return (
        <>
            <BreadcrumbSchema items={breadcrumbs} />
            <Header variant="dark" />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                            <Link href="/">Home</Link>
                            {breadcrumbs.map((crumb, index) => (
                                <span key={index}>
                                    <span className={styles.separator}>/</span>
                                    {crumb.href ? (
                                        <Link href={crumb.href}>{crumb.label}</Link>
                                    ) : (
                                        <span className={styles.current}>{crumb.label}</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}

                    {/* Header */}
                    <header className={styles.header}>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </header>

                    {/* Calculator Content */}
                    <div className={styles.calculatorWrapper}>
                        {children}
                    </div>

                    {/* CTA Section */}
                    <section className={styles.ctaSection}>
                        <div className={styles.ctaContent}>
                            <h3 className={styles.ctaTitle}>Need a Professional Comparison?</h3>
                            <p className={styles.ctaText}>
                                Use ShowTheRate to create beautiful, shareable mortgage comparisons for your clients.
                            </p>
                            <Link href={ctaHref} className={styles.ctaButton}>
                                {ctaText}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </section>

                    {/* Related Tools */}
                    <RelatedTools tools={relatedTools} />

                    {/* FAQ Section */}
                    <FAQSection faqs={faq} />
                </div>
            </main>

            <Footer />
        </>
    );
}
