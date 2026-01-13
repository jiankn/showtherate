/**
 * Article Schema Component
 * Generates JSON-LD structured data for blog articles
 */

export default function ArticleSchema({
    title,
    description,
    url,
    datePublished,
    dateModified,
    author = 'ShowTheRate Team',
    image,
}) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://showtherate.com';

    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'description': description,
        'url': url,
        'datePublished': datePublished,
        'dateModified': dateModified || datePublished,
        'author': {
            '@type': 'Organization',
            'name': author,
            'url': baseUrl,
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'ShowTheRate',
            'url': baseUrl,
            'logo': {
                '@type': 'ImageObject',
                'url': `${baseUrl}/logo.png`,
            },
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': url,
        },
    };

    // Add image if available
    if (image) {
        schemaData.image = image.startsWith('http') ? image : `${baseUrl}${image}`;
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
    );
}
