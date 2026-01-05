import styles from '../../admin.module.css';

export default function AdminSettingsPage() {
  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Settings</h2>
          <p className={styles.sectionNote}>Operational rules, SLAs, and email routing</p>
        </div>
        <button className={styles.buttonPrimary} type="button">Save changes</button>
      </div>

      <div className={styles.panelGrid}>
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Work hours</h3>
          <p className={styles.sectionNote}>America/Los_Angeles, Monday to Friday</p>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Daily schedule</p>
                <p className={styles.listMeta}>09:00 AM - 06:00 PM</p>
              </div>
              <span className={`${styles.pill} ${styles.pillOk}`}>Active</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Holiday calendar</p>
                <p className={styles.listMeta}>US federal holidays</p>
              </div>
              <span className={`${styles.pill} ${styles.pillWarn}`}>Review annually</span>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardMuted}`}>
          <h3 className={styles.sectionTitle}>Email routing</h3>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Inbound IMAP</p>
                <p className={styles.listMeta}>support@showtherate.com</p>
              </div>
              <span className={`${styles.pill} ${styles.pillOk}`}>Connected</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Outbound SMTP</p>
                <p className={styles.listMeta}>Transactional provider</p>
              </div>
              <span className={`${styles.pill} ${styles.pillWarn}`}>Verify</span>
            </div>
            <div className={styles.listItem}>
              <div>
                <p className={styles.listTitle}>Magic link allowlist</p>
                <p className={styles.listMeta}>jiankn@gmail.com</p>
              </div>
              <span className={`${styles.pill} ${styles.pillOk}`}>Locked</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>SLA thresholds</h3>
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <p className={styles.statLabel}>First response</p>
            <div className={styles.statValue}>8 hours</div>
            <span className={`${styles.statDelta} ${styles.deltaUp}`}>Working hours only</span>
          </div>
          <div className={styles.card}>
            <p className={styles.statLabel}>Reminder 1</p>
            <div className={styles.statValue}>2 hours left</div>
            <span className={`${styles.statDelta} ${styles.deltaUp}`}>Email notification</span>
          </div>
          <div className={styles.card}>
            <p className={styles.statLabel}>Reminder 2</p>
            <div className={styles.statValue}>30 minutes left</div>
            <span className={`${styles.statDelta} ${styles.deltaUp}`}>Escalate to admin</span>
          </div>
          <div className={styles.card}>
            <p className={styles.statLabel}>Overdue</p>
            <div className={styles.statValue}>Instant alert</div>
            <span className={`${styles.statDelta} ${styles.deltaDown}`}>Flag in queue</span>
          </div>
        </div>
      </div>
    </>
  );
}
