'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useToast } from '../../components/GlobalToast';
import styles from '../legal.module.css';

export const metadata = {
    title: 'Data Rights | ShowTheRate',
    description: 'Exercise your data rights under GDPR, CCPA, and other privacy laws. Access, correct, or delete your personal data.',
    keywords: 'GDPR rights, CCPA privacy rights, data deletion, privacy rights, personal data'
};

export default function DataRightsPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastRequest, setLastRequest] = useState(null);

    const handleDataRightsRequest = async (requestType) => {
        if (isSubmitting) return;

        // Simple email validation
        const email = prompt('Please enter your email address:');
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Optional reason for certain requests
        let reason = '';
        if (['rectify', 'restrict', 'object'].includes(requestType)) {
            reason = prompt('Please provide details about your request (optional):') || '';
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/data-rights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestType,
                    email,
                    reason,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(data.message);
                setLastRequest({
                    type: requestType,
                    requestId: data.requestId,
                    timestamp: new Date().toISOString(),
                });
            } else {
                toast.error(data.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Request error:', error);
            toast.error('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>Your Data Rights</h1>
                        <p className={styles.lastUpdated}>
                            Last updated: December 30, 2025
                        </p>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>GDPR Rights (EU Residents)</h2>
                            <p className={styles.text}>If you are located in the European Union, you have the following rights under the General Data Protection Regulation (GDPR):</p>

                            <div className={styles.rightsGrid}>
                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Access</h3>
                                    <p className={styles.rightDescription}>You can request a copy of all personal data we hold about you.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('access')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Access'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Rectification</h3>
                                    <p className={styles.rightDescription}>You can request correction of inaccurate or incomplete personal data.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('rectify')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Correction'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Erasure</h3>
                                    <p className={styles.rightDescription}>You can request deletion of your personal data in certain circumstances.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('erase')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Deletion'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Data Portability</h3>
                                    <p className={styles.rightDescription}>You can request your data in a structured, machine-readable format.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('portability')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Data'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Restriction</h3>
                                    <p className={styles.rightDescription}>You can request limitation of how we process your data.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('restrict')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Restriction'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Object</h3>
                                    <p className={styles.rightDescription}>You can object to our processing of your personal data.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('object')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Object to Processing'}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>CCPA Rights (California Residents)</h2>
                            <p className={styles.text}>If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):</p>

                            <div className={styles.rightsGrid}>
                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Know</h3>
                                    <p className={styles.rightDescription}>You can request information about the categories and specific pieces of personal information we collect.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('cc_know')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Information'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Delete</h3>
                                    <p className={styles.rightDescription}>You can request deletion of your personal information, subject to certain exceptions.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('cc_delete')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Request Deletion'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Opt-Out</h3>
                                    <p className={styles.rightDescription}>You can opt-out of the sale of your personal information.</p>
                                    <button
                                        className={styles.rightBtn}
                                        onClick={() => handleDataRightsRequest('cc_opt_out')}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Opt-Out of Sale'}
                                    </button>
                                </div>

                                <div className={styles.rightCard}>
                                    <h3 className={styles.rightTitle}>Right to Non-Discrimination</h3>
                                    <p className={styles.rightDescription}>You have the right not to be discriminated against for exercising your CCPA rights.</p>
                                    <div className={styles.rightNote}>Automatic protection - no action needed</div>
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>How to Exercise Your Rights</h2>
                            <p className={styles.text}>To exercise any of the above rights, please contact us using one of the following methods:</p>

                            <div className={styles.contactMethods}>
                                <div className={styles.contactMethod}>
                                    <h4>Email</h4>
                                    <p>Send your request to: <a href="mailto:privacy@showtherate.com" className={styles.contactLink}>privacy@showtherate.com</a></p>
                                    <p className={styles.contactNote}>Please include "Data Rights Request" in the subject line</p>
                                </div>

                                <div className={styles.contactMethod}>
                                    <h4>Mail</h4>
                                    <p>ShowTheRate Privacy Team<br />
                                    [Company Address]<br />
                                    [City, State, ZIP Code]</p>
                                </div>
                            </div>

                            <div className={styles.requestRequirements}>
                                <h4>What to Include in Your Request</h4>
                                <ul className={styles.requirementsList}>
                                    <li>Your full name and contact information</li>
                                    <li>The specific right you wish to exercise</li>
                                    <li>Any relevant account information (if applicable)</li>
                                    <li>A description of the personal information you want to access, correct, or delete</li>
                                    <li>Proof of identity (we may request additional verification)</li>
                                </ul>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Response Time</h2>
                            <ul className={styles.list}>
                                <li><strong>GDPR:</strong> We will respond to your request within 30 days</li>
                                <li><strong>CCPA:</strong> We will respond to your request within 45 days</li>
                                <li><strong>Extensions:</strong> In some cases, we may need an additional 30-45 days to respond</li>
                                <li><strong>Verification:</strong> We may need to verify your identity before processing your request</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Cookie Management</h2>
                            <p className={styles.text}>You can also manage your cookie preferences at any time:</p>
                            <button
                                className={styles.cookieSettingsBtn}
                                onClick={() => {
                                    // Trigger cookie settings modal
                                    window.dispatchEvent(new CustomEvent('openCookieSettings'));
                                }}
                            >
                                Manage Cookie Preferences
                            </button>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Additional Information</h2>
                            <p className={styles.text}>For more information about how we collect, use, and protect your personal information, please review our:</p>
                            <ul className={styles.linksList}>
                                <li><Link href="/privacy" className={styles.pageLink}>Privacy Policy</Link></li>
                                <li><Link href="/terms" className={styles.pageLink}>Terms of Service</Link></li>
                            </ul>
                        </section>

                        {lastRequest && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Request Submitted</h2>
                                <div className={styles.requestStatus}>
                                    <p className={styles.statusMessage}>
                                        Your request has been submitted successfully. Reference ID: <strong>{lastRequest.requestId}</strong>
                                    </p>
                                    <p className={styles.statusNote}>
                                        You will receive an email confirmation and follow-up within the estimated timeframe.
                                        Please keep this reference ID for your records.
                                    </p>
                                </div>
                            </section>
                        )}

                        <Link href="/" className={styles.backLink}>← Back to Home</Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
