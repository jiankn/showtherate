import Link from 'next/link';
import styles from './page.module.css';

export default function ShareBlockedPage() {
    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.title}>Share links are disabled in Demo mode</h1>
                <p className={styles.copy}>
                    Use the local preview inside the app, or upgrade to unlock share pages.
                </p>
                <div className={styles.actions}>
                    <Link href="/app" className="btn btn-secondary">
                        Back to App
                    </Link>
                    <Link href="/app/upgrade" className="btn btn-primary">
                        Upgrade
                    </Link>
                </div>
            </div>
        </div>
    );
}
