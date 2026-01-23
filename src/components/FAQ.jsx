'use client';

import { useState } from 'react';
import styles from './FAQ.module.css';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How does the automatic property data work?",
      answer: "We integrate with RentCast, a leading property data provider covering 150+ million US properties. Just enter any US address, and we instantly fetch property tax, HOA fees, estimated home value, square footage, year built, and more. No manual research needed — it's all automatic. You can always manually adjust any values if needed."
    },
    {
      question: "What are AI Closing Scripts?",
      answer: "Our AI analyzes your mortgage comparison and generates ready-to-send messages that explain the options in plain English. Choose from Professional, Friendly, or Urgency tones. Each script references your actual numbers and includes a compliant disclaimer. Just copy, paste into SMS or WhatsApp, and send to your client."
    },
    {
      question: "Is the property data accurate?",
      answer: "We use RentCast's database which covers 150+ million US properties. Data is updated regularly from county records and public sources. While highly accurate, these are estimates — you can always manually override any values with exact figures if you have them."
    },
    {
      question: "Is ShowTheRate suitable for all types of loans?",
      answer: "Yes! ShowTheRate supports Conventional, FHA, VA, USDA, and Jumbo loans. You can customize interest rates, terms, down payments, and closing costs to fit any scenario."
    },
    {
      question: "Can I use this on my phone during Open Houses?",
      answer: "Absolutely. We follow a 'Mobile-First' design philosophy. The interface is optimized for one-handed operation on smartphones, making it perfect for quick comparisons while walking through a property with clients."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, we offer a Free Demo mode that lets you test the core calculation features. To unlock sharing features, auto-fill property data, and AI scripts, you can start with our $9.9 Starter Pass for 7 days."
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
