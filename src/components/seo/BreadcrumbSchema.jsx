/**
 * Breadcrumb Schema Component
 * Generates JSON-LD structured data for breadcrumb navigation
 */

export default function BreadcrumbSchema({ items = [] }) {
    if (!items || items.length === 0) return null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://showtherate.com';

    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': baseUrl,
            },
            ...items.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 2,
                'name': item.label,
                'item': item.href ? `${baseUrl}${item.href}` : undefined,
            })),
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
    );
}
