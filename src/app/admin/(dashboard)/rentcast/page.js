import styles from '../../admin.module.css';
import { getRentCastQuotaStatus } from '@/lib/rentcast';

// 强制动态渲染，因为数据可能会变（虽然是配额，但作为后台最好保持较新）
// 或者使用 revalidate = 0
export const dynamic = 'force-dynamic';

const KEY_EMAILS = [
    'jiankn@gmail.com',       // Key #0
    'afago8@outlook.com',     // Key #1
    'diaochawj@outlook.com',  // Key #2
    'DewyBrook@outlook.com'   // Key #3
];

export default async function RentCastPage() {
    const data = await getRentCastQuotaStatus();

    return (
        <>
            <div className={styles.sectionHeader}>
                <div>
                    <h2 className={styles.sectionTitle}>RentCast API Quota</h2>
                    <p className={styles.sectionNote}>
                        Billing Period: {data.period} (Resets on day {data.resetDay})
                    </p>
                </div>
                <div className={styles.chipRow}>
                    <span className={`${styles.chip} ${styles.chipActive}`}>Live Data</span>
                </div>
            </div>

            <div className={styles.cardGrid}>
                {/* Total Usage Card */}
                <div className={styles.card}>
                    <div className={styles.statRow}>
                        <div>
                            <p className={styles.statLabel}>Total Usage</p>
                            <div className={styles.statValue}>
                                {data.totalUsed} <span style={{ fontSize: '0.6em', color: '#888' }}>/ {data.totalLimit}</span>
                            </div>
                        </div>
                    </div>
                    <p className={styles.sectionNote}>Across {data.totalKeys} Active Keys</p>
                </div>

                {/* Remaining Card */}
                <div className={styles.card}>
                    <div className={styles.statRow}>
                        <div>
                            <p className={styles.statLabel}>Remaining</p>
                            <div className={styles.statValue}>{data.remaining}</div>
                        </div>
                    </div>
                    <p className={styles.sectionNote}>
                        {Math.round((data.remaining / data.totalLimit) * 100)}% available
                    </p>
                </div>

                {/* Next Reset Card */}
                <div className={styles.card}>
                    <div className={styles.statRow}>
                        <div>
                            <p className={styles.statLabel}>Next Reset</p>
                            <div className={styles.statValue} style={{ fontSize: '1.5rem' }}>{data.nextResetDate}</div>
                        </div>
                    </div>
                    <p className={styles.sectionNote}>Scheduled Reset</p>
                </div>
            </div>

            <div className={`${styles.card} ${styles.reveal}`} style={{ marginTop: '20px', animationDelay: '0.1s' }}>
                <h3 className={styles.sectionTitle}>Key Usage Details</h3>
                <div className={styles.list}>
                    {data.keys.map(key => {
                        const usagePercent = Math.min(100, (key.used / data.limitPerKey) * 100);
                        const isHigh = usagePercent >= 100;
                        const isWarn = usagePercent >= 80;
                        const barColor = isHigh ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';

                        return (
                            <div key={key.index} className={styles.listItem}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p className={styles.listTitle}>
                                            {KEY_EMAILS[key.index] || `API Key #${key.index}`}
                                        </p>
                                        <span style={{ fontSize: '0.8em', color: '#666', marginRight: '10px' }}>Key #{key.index}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
                                        <div style={{ flex: 1, maxWidth: '300px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${usagePercent}%`,
                                                height: '100%',
                                                backgroundColor: barColor,
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                        <span className={styles.listMeta} style={{ minWidth: '80px' }}>
                                            {key.used} / {data.limitPerKey}
                                        </span>
                                    </div>
                                </div>
                                <span className={`${styles.pill} ${isHigh ? styles.pillRisk : isWarn ? styles.pillWarn : styles.pillOk}`}>
                                    {isHigh ? 'Exhausted' : 'Active'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
