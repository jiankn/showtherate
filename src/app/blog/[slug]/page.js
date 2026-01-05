
import { getPostBySlug, getAllPostSlugs } from '@/lib/supabase/blog';
import MarkdownView from '@/components/blog/MarkdownView';
import Header from '@/components/Header';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

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
        },
    };
}

export default async function BlogPostPage({ params }) {
    const { slug } = await params; // Next.js 15+ needs await params
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const date = new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>
            <Header variant="dark" />
            <article className={styles.container}>
                {post.cover_image && (
                    <div className={styles.coverImageContainer}>
                        <img src={post.cover_image} alt={post.title} className={styles.coverImage} />
                    </div>
                )}
                <header className={styles.header}>
                    <div className={styles.meta}>
                        <span className={styles.date}>{date}</span>
                        {post.tags && post.tags.map(tag => (
                            <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                    </div>
                    <h1 className={styles.title}>{post.title}</h1>
                </header>
                <div className={styles.content}>
                    <MarkdownView content={post.content} />
                </div>
            </article>
        </>
    );
}
