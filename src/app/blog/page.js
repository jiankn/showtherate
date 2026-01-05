
import { getAllPosts } from '@/lib/supabase/blog';
import BlogCard from '@/components/blog/BlogCard';
import Header from '@/components/Header';
import styles from './page.module.css';

export const revalidate = 3600; // Update every hour

export const metadata = {
    title: 'News & Insight - ShowTheRate',
    description: 'Latest updates on mortgage rates, housing market trends, and financial tips from ShowTheRate.',
};

export default async function BlogPage() {
    const posts = await getAllPosts();

    return (
        <>
            <Header variant="dark" />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Latest News & Insights</h1>
                    <p className={styles.subtitle}>Stay updated with the latest trends in the mortgage industry.</p>
                </div>

                {posts && posts.length > 0 ? (
                    <div className={styles.grid}>
                        {posts.map(post => (
                            <BlogCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <p>No posts available at the moment. Please check back later.</p>
                    </div>
                )}
            </div>
        </>
    );
}
