import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://showtherate.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/calculator/',
                    '/compare/',
                    '/alternatives/',
                    '/blog/',
                ],
                disallow: [
                    '/s/',           // Share links (noindex)
                    '/app/',         // Authenticated app
                    '/api/',         // API routes
                    '/auth/',        // Auth routes
                    '/_next/',       // Next.js internals
                    '/admin/',       // Admin routes if any
                ],
            },
            {
                userAgent: 'GPTBot',
                disallow: ['/'],     // Block OpenAI crawler if desired
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
