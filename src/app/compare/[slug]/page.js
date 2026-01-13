/**
 * Compare Dynamic Route Page
 * Renders comparison pages based on slug configuration
 */

import { notFound } from 'next/navigation';
import CalculatorLayout from '@/components/calculators/CalculatorLayout';
import CompareCalculator from '@/components/calculators/CompareCalculator';
import pagesRegistry from '@/lib/seo/pages-registry.json';

// Generate static params for all compare pages
export async function generateStaticParams() {
    const slugs = Object.keys(pagesRegistry.compares);
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const page = pagesRegistry.compares[slug];

    if (!page) {
        return { title: 'Comparison Not Found' };
    }

    return {
        title: page.metaTitle,
        description: page.metaDescription,
        keywords: `${page.title}, mortgage comparison, ${page.cluster}`,
        openGraph: {
            title: page.metaTitle,
            description: page.metaDescription,
            type: 'website',
            url: `https://showtherate.com/compare/${slug}`,
        },
        alternates: {
            canonical: `https://showtherate.com/compare/${slug}`,
        },
    };
}

// Build related tools from slugs
function buildRelatedTools(relatedSlugs) {
    if (!relatedSlugs || relatedSlugs.length === 0) return [];

    return relatedSlugs.map(slug => {
        // Check calculators first
        if (pagesRegistry.calculators[slug]) {
            const page = pagesRegistry.calculators[slug];
            return {
                title: page.title,
                description: page.metaDescription.slice(0, 80) + '...',
                href: `/calculator/${slug}`,
                type: 'calculator',
            };
        }
        // Check compares
        if (pagesRegistry.compares[slug]) {
            const page = pagesRegistry.compares[slug];
            return {
                title: page.metaDescription.slice(0, 80) + '...',
                href: `/compare/${slug}`,
                type: 'compare',
            };
        }
        return null;
    }).filter(Boolean);
}

export default async function ComparePage({ params }) {
    const { slug } = await params;
    const page = pagesRegistry.compares[slug];

    if (!page) {
        notFound();
    }

    const breadcrumbs = [
        { label: 'Compare', href: '/compare' },
        { label: page.title },
    ];

    const relatedTools = buildRelatedTools(page.relatedSlugs);

    return (
        <CalculatorLayout
            title={page.h1}
            subtitle={page.subtitle}
            breadcrumbs={breadcrumbs}
            faq={page.faq}
            relatedTools={relatedTools}
            ctaText="Create Your Own Comparison"
        >
            <CompareCalculator config={page.config} pageConfig={page} />
        </CalculatorLayout>
    );
}
