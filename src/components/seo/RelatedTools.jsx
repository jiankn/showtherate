/**
 * Related Tools Component
 * Shows related calculators/tools for internal linking
 */

import Link from 'next/link';
import styles from './RelatedTools.module.css';

export default function RelatedTools({ tools = [], title = 'Related Tools' }) {
    if (!tools || tools.length === 0) return null;

    return (
        <section className={styles.relatedSection}>
            <h3 className={styles.title}>{title}</h3>

            <div className={styles.toolsGrid}>
                {tools.map((tool, index) => (
                    <Link
                        key={index}
                        href={tool.href}
                        className={styles.toolCard}
                    >
                        <div className={styles.toolIcon}>
                            {tool.type === 'calculator' ? '🧮' : tool.type === 'compare' ? '⚖️' : '📊'}
                        </div>
                        <div className={styles.toolContent}>
                            <h4 className={styles.toolTitle}>{tool.title}</h4>
                            <p className={styles.toolDescription}>{tool.description}</p>
                        </div>
                        <svg
                            className={styles.arrow}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                ))}
            </div>
        </section>
    );
}
