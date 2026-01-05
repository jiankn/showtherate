import React from 'react';
import Link from 'next/link';
import { RocketIcon, CheckIcon } from '@/components/Icons';
import styles from '@/app/s/[shareId]/page.module.css';

export default function UpgradeCTA() {
    return (
        <section className={styles.ctaSection}>
            <div className={styles.ctaContent}>
                <div className={styles.upgradeCard}>
                    <div className={styles.upgradeIconWrapper}>
                        <RocketIcon className={styles.upgradeIcon} />
                    </div>

                    <h2 className={styles.upgradeTitle}>Want this page to look like YOU?</h2>
                    <p className={styles.upgradeText}>
                        You are viewing a Demo comparison. Remove the &quot;Demo User&quot; branding and unlock your full professional profile.
                    </p>

                    <div className={styles.upgradeFeatures}>
                        <div className={styles.featureItem}>
                            <CheckIcon className={styles.checkIcon} />
                            <span>Add your Photo & Logo</span>
                        </div>
                        <div className={styles.featureItem}>
                            <CheckIcon className={styles.checkIcon} />
                            <span>Connect your Social Media</span>
                        </div>
                        <div className={styles.featureItem}>
                            <CheckIcon className={styles.checkIcon} />
                            <span>Capture Real Leads</span>
                        </div>
                    </div>

                    <div className={styles.upgradeActions}>
                        <Link href="/app/upgrade" className={styles.upgradeBtnPrimary}>
                            Create Your Profile
                        </Link>
                        <Link href="/app/upgrade" className={styles.upgradeBtnSecondary}>
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
