
import { getAllPostSlugs } from '@/lib/supabase/blog';

export default async function sitemap() {
    const slugs = await getAllPostSlugs();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://showtherate.com';

    const blogEntries = slugs.map((slug) => ({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    return [
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
        ...blogEntries,
    ];
}
