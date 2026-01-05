
import Link from 'next/link';
import styles from './BlogCard.module.css';

export default function BlogCard({ post }) {
    const { title, slug, excerpt, cover_image, published_at, tags } = post;

    // Format date
    const date = new Date(published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Link href={`/blog/${slug}`} className={styles.card}>
            {cover_image && (
                <div className={styles.imageContainer}>
                    <img src={cover_image} alt={title} className={styles.image} />
                </div>
            )}
            <div className={styles.content}>
                <div className={styles.meta}>
                    <span className={styles.date}>{date}</span>
                    {tags && tags.length > 0 && <span className={styles.tag}>{tags[0]}</span>}
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.excerpt}>{excerpt}</p>
            </div>
        </Link>
    );
}
