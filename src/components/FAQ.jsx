'use client';

import { useState } from 'react';
import styles from './FAQ.module.css';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is ShowTheRate suitable for all types of loans?",
      answer: "Yes! ShowTheRate supports Conventional, FHA, VA, USDA, and Jumbo loans. You can customize interest rates, terms, down payments, and closing costs to fit any scenario."
    },
    {
      question: "Can I use this on my phone during Open Houses?",
      answer: "Absolutely. We follow a 'Mobile-First' design philosophy. The interface is optimized for one-handed operation on smartphones, making it perfect for quick comparisons while walking through a property with clients."
    },
    {
      question: "How accurate are the property tax estimates?",
      answer: "We pull property tax data from reliable local public records based on the property address. However, these are estimates. You can always manually override the tax amount if you have the exact figures."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, we offer a Free Demo mode that lets you test the core calculation features. To unlock sharing features and AI scripts, you can start with our $9.9 Starter Pass for 7 days."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section id="faq" className={styles.faqSection}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about ShowTheRate
          </p>
        </div>

        <div className={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`${styles.faqItem} ${openIndex === index ? styles.faqItemOpen : ''}`}
            >
              <button 
                className={styles.faqQuestion} 
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                {faq.question}
                <span className={`${styles.faqIcon} ${openIndex === index ? styles.faqIconOpen : ''}`}>
                  +
                </span>
              </button>
              {openIndex === index && (
                <div className={styles.faqAnswer}>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </section>
  );
}
