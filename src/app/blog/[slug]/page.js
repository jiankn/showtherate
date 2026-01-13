
import { getPostBySlug, getAllPostSlugs, getAllPosts } from '@/lib/supabase/blog';
import MarkdownView from '@/components/blog/MarkdownView';
import Header from '@/components/Header';
import ArticleSchema from '@/components/seo/ArticleSchema';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://showtherate.com';

export const revalidate = 3600;

export async function generateStaticParams() {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({
        slug: slug,
    }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title} - ShowTheRate`,
        description: post.excerpt || post.title,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: post.cover_image ? [post.cover_image] : [],
            type: 'article',
            publishedTime: post.published_at,
            url: `${baseUrl}/blog/${slug}`,
        },
        alternates: {
            canonical: `${baseUrl}/blog/${slug}`,
        },
    };
}

export default async function BlogPostPage({ params }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // Get related posts (exclude current, take 3)
    let relatedPosts = [];
    try {
        const allPosts = await getAllPosts();
        relatedPosts = allPosts.filter(p => p.slug !== slug).slice(0, 3);
    } catch (e) {
        // Silently fail
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const articleUrl = `${baseUrl}/blog/${slug}`;

    return (
        <>
            <ArticleSchema
                title={post.title}
                description={post.excerpt}
                url={articleUrl}
                datePublished={post.published_at}
                dateModified={post.updated_at || post.published_at}
                image={post.cover_image}
            />
            <Header variant="dark" />
            <article className={styles.article}>
                {/* Hero Section */}
                <div className={styles.hero}>
                    {post.cover_image && (
                        <img src={post.cover_image} alt={post.title} className={styles.heroImage} />
                    )}
                    <div className={styles.heroOverlay} />
                    <div className={styles.heroContent}>
                        <div className={styles.heroMeta}>
                            {post.tags && post.tags.map(tag => (
                                <span key={tag} className={styles.heroTag}>{tag}</span>
                            ))}
                        </div>
                        <h1 className={styles.heroTitle}>{post.title}</h1>
                        <span className={styles.heroDate}>{formatDate(post.published_at)}</span>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.contentWrapper}>
                    <div className={styles.content}>
                        <MarkdownView content={post.content} />
                    </div>

                    {/* Article CTA */}
                    <div className={styles.articleCta}>
                        <p>💡 Ready to put this knowledge into action?</p>
                        <Link href="/calculator" className="btn btn-primary">Try Our Free Calculators</Link>
                    </div>
                </div>

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                    <div className={styles.relatedSection}>
                        <h3 className={styles.relatedTitle}>Related Articles</h3>
                        <div className={styles.relatedGrid}>
                            {relatedPosts.map(relatedPost => (
                                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className={styles.relatedCard}>
                                    <div className={styles.relatedImage}>
                                        {relatedPost.cover_image && (
                                            <img src={relatedPost.cover_image} alt={relatedPost.title} />
                                        )}
                                    </div>
                                    <div className={styles.relatedContent}>
                                        <span className={styles.relatedDate}>{formatDate(relatedPost.published_at)}</span>
                                        <h4 className={styles.relatedCardTitle}>{relatedPost.title}</h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </>
    );
}
