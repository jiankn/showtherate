/**
 * FAQ Section Component with JSON-LD Schema
 * Renders FAQ accordion with SEO-friendly structured data
 */

'use client';

import { useState } from 'react';
import styles from './FAQSection.module.css';

export default function FAQSection({ faqs = [], title = 'Frequently Asked Questions' }) {
    const [openIndex, setOpenIndex] = useState(null);

    if (!faqs || faqs.length === 0) return null;

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Generate JSON-LD schema
    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
            },
        })),
    };

    return (
        <section className={styles.faqSection}>
            {/* JSON-LD Script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />

            <h2 className={styles.title}>{title}</h2>

            <div className={styles.faqList}>
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
                    >
                        <button
                            className={styles.question}
                            onClick={() => toggleFAQ(index)}
                            aria-expanded={openIndex === index}
                        >
                            <span>{faq.question}</span>
                            <svg
                                className={styles.chevron}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="6,9 12,15 18,9" />
                            </svg>
                        </button>

                        <div className={styles.answerWrapper}>
                            <div className={styles.answer}>
                                {faq.answer}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
