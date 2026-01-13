
import { getAllPosts } from '@/lib/supabase/blog';
import Link from 'next/link';
import Header from '@/components/Header';
import styles from './page.module.css';

export const revalidate = 3600; // Update every hour

export const metadata = {
    title: 'News & Insight - ShowTheRate',
    description: 'Expert mortgage guides, calculator tutorials, and industry insights for Loan Officers. Learn buydowns, points, rate locks, and more.',
};

export default async function BlogPage() {
    let posts = [];
    let hasError = false;

    try {
        posts = await getAllPosts();
    } catch (error) {
        console.error('Failed to load blog posts:', error);
        hasError = true;
    }

    const featuredPost = posts && posts.length > 0 ? posts[0] : null;
    const otherPosts = posts && posts.length > 1 ? posts.slice(1) : [];

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <Header variant="dark" />
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.badge}>📰 Expert Guides</span>
                    <h1 className={styles.title}>News & Insights</h1>
                    <p className={styles.subtitle}>
                        Scripts, tutorials, and strategies to help loan officers close more deals
                    </p>
                </div>

                {hasError ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>⚠️</div>
                        <h3>Blog Temporarily Unavailable</h3>
                        <p>We're having trouble loading our blog posts. Please try again later.</p>
                    </div>
                ) : posts && posts.length > 0 ? (
                    <>
                        {/* Featured Article */}
                        {featuredPost && (
                            <Link href={`/blog/${featuredPost.slug}`} className={styles.featured}>
                                <div className={styles.featuredImage}>
                                    {featuredPost.cover_image && (
                                        <img src={featuredPost.cover_image} alt={featuredPost.title} />
                                    )}
                                    <div className={styles.featuredOverlay} />
                                </div>
                                <div className={styles.featuredContent}>
                                    <div className={styles.featuredMeta}>
                                        <span className={styles.featuredDate}>{formatDate(featuredPost.published_at)}</span>
                                        {featuredPost.tags && featuredPost.tags[0] && (
                                            <span className={styles.featuredTag}>{featuredPost.tags[0]}</span>
                                        )}
                                        <span className={styles.featuredBadge}>Featured</span>
                                    </div>
                                    <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                                    <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
                                    <span className={styles.readMore}>Read Article →</span>
                                </div>
                            </Link>
                        )}

                        {/* Articles Grid */}
                        {otherPosts.length > 0 && (
                            <div className={styles.gridSection}>
                                <h3 className={styles.sectionTitle}>More Articles</h3>
                                <div className={styles.grid}>
                                    {otherPosts.map(post => (
                                        <Link key={post.id} href={`/blog/${post.slug}`} className={styles.card}>
                                            <div className={styles.cardImage}>
                                                {post.cover_image ? (
                                                    <img src={post.cover_image} alt={post.title} />
                                                ) : (
                                                    <div className={styles.cardImagePlaceholder}>📄</div>
                                                )}
                                            </div>
                                            <div className={styles.cardContent}>
                                                <div className={styles.cardMeta}>
                                                    <span className={styles.cardDate}>{formatDate(post.published_at)}</span>
                                                    {post.tags && post.tags[0] && (
                                                        <span className={styles.cardTag}>{post.tags[0]}</span>
                                                    )}
                                                </div>
                                                <h4 className={styles.cardTitle}>{post.title}</h4>
                                                <p className={styles.cardExcerpt}>{post.excerpt}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📝</div>
                        <h3>Coming Soon</h3>
                        <p>We're working on exciting content about mortgage rates and housing market trends. Check back soon!</p>
                    </div>
                )}

                {/* CTA Section */}
                <div className={styles.ctaSection}>
                    <h3>Ready to Try Our Tools?</h3>
                    <p>Put these insights into action with our free mortgage calculators</p>
                    <div className={styles.ctaButtons}>
                        <Link href="/calculator" className="btn btn-primary">View Calculators</Link>
                        <Link href="/compare" className="btn btn-ghost">Compare Tools</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
