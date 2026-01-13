/**
 * Calculator Dynamic Route Page
 * Renders calculator pages based on slug configuration
 */

import { notFound } from 'next/navigation';
import CalculatorLayout from '@/components/calculators/CalculatorLayout';
import BuydownCalculator from '@/components/calculators/BuydownCalculator';
import PointsCalculator from '@/components/calculators/PointsCalculator';
import RateLockCalculator from '@/components/calculators/RateLockCalculator';
import WorkflowCalculator from '@/components/calculators/WorkflowCalculator';
import pagesRegistry from '@/lib/seo/pages-registry.json';

// Generate static params for all calculator pages
export async function generateStaticParams() {
    const slugs = Object.keys(pagesRegistry.calculators);
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const page = pagesRegistry.calculators[slug];

    if (!page) {
        return { title: 'Calculator Not Found' };
    }

    return {
        title: page.metaTitle,
        description: page.metaDescription,
        keywords: `${page.title}, mortgage calculator, ${page.cluster}`,
        openGraph: {
            title: page.metaTitle,
            description: page.metaDescription,
            type: 'website',
            url: `https://showtherate.com/calculator/${slug}`,
        },
        alternates: {
            canonical: `https://showtherate.com/calculator/${slug}`,
        },
    };
}

// Get component based on config
function getCalculatorComponent(componentName, config) {
    switch (componentName) {
        case 'BuydownCalculator':
            return <BuydownCalculator config={config} />;
        case 'PointsCalculator':
            return <PointsCalculator config={config} />;
        case 'RateLockCalculator':
            return <RateLockCalculator config={config} />;
        case 'WorkflowCalculator':
            return <WorkflowCalculator config={config} />;
        default:
            return <BuydownCalculator config={config} />;
    }
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
                title: page.title,
                description: page.metaDescription.slice(0, 80) + '...',
                href: `/compare/${slug}`,
                type: 'compare',
            };
        }
        return null;
    }).filter(Boolean);
}

export default async function CalculatorPage({ params }) {
    const { slug } = await params;
    const page = pagesRegistry.calculators[slug];

    if (!page) {
        notFound();
    }

    const breadcrumbs = [
        { label: 'Tools', href: '/calculator' },
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
        >
            {getCalculatorComponent(page.component, page.config)}
        </CalculatorLayout>
    );
}
