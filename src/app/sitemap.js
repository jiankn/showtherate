
import { getAllPostSlugs } from '@/lib/supabase/blog';
import pagesRegistry from '@/lib/seo/pages-registry.json';

export default async function sitemap() {
    const blogSlugs = await getAllPostSlugs();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://showtherate.com';

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/calculator`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/compare`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/alternatives`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

    // Calculator pages from registry
    const calculatorEntries = Object.entries(pagesRegistry.calculators || {}).map(([slug, page]) => ({
        url: `${baseUrl}/calculator/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page.priority === 'P0' ? 0.9 : 0.8,
    }));

    // Compare pages from registry
    const compareEntries = Object.entries(pagesRegistry.compares || {}).map(([slug, page]) => ({
        url: `${baseUrl}/compare/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page.priority === 'P0' ? 0.9 : 0.8,
    }));

    // Alternatives pages from registry
    const alternativesEntries = Object.entries(pagesRegistry.alternatives || {}).map(([slug]) => ({
        url: `${baseUrl}/alternatives/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    // Blog entries from Supabase
    const blogEntries = blogSlugs.map((slug) => ({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    return [
        ...staticPages,
        ...calculatorEntries,
        ...compareEntries,
        ...alternativesEntries,
        ...blogEntries,
    ];
}

