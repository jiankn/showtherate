import Link from 'next/link';
import { LogoIcon } from './Icons';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          {/* PC端紧凑布局 */}
          <div className={styles.footerMain}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.logo}>
                <LogoIcon className={styles.logoIconSvg} />
                <span className={styles.logoText}>ShowTheRate</span>
              </Link>
              <span className={styles.footerTagline}>
                The 60-second mortgage comparison tool for Loan Officers
              </span>
            </div>

            <div className={styles.footerNav}>
              <div className={styles.navGroup}>
                <span className={styles.navTitle}>Product</span>
                <Link href="/#features">Features</Link>
                <Link href="/#pricing">Pricing</Link>
                <Link href="/pricing">Pricing & FAQ</Link>
                <Link href="/#demo">Demo</Link>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.navTitle}>Free Tools</span>
                <Link href="/calculator/2-1-buydown-calculator">2-1 Buydown</Link>
                <Link href="/calculator/discount-points-break-even">Points Break-Even</Link>
                <Link href="/calculator/cash-to-close-calculator">Cash to Close</Link>
                <Link href="/calculator/payment-shock-calculator">Payment Shock</Link>
                <Link href="/calculator" className={styles.allTools}>All Calculators →</Link>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.navTitle}>Resources</span>
                <Link href="/blog">News & Insight</Link>
                <Link href="/blog/explain-2-1-buydown-script">LO Scripts</Link>
                <Link href="/#faq">FAQ</Link>
                <a href="mailto:support@showtherate.com">Contact</a>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.navTitle}>Compare Tools</span>
                <Link href="/compare/2-1-vs-3-2-1-buydown">2-1 vs 3-2-1 Buydown</Link>
                <Link href="/compare/apr-vs-interest-rate">APR vs Interest Rate</Link>
                <Link href="/compare/fha-vs-conventional">FHA vs Conventional</Link>
                <Link href="/compare/temporary-buydown-vs-points">Buydown vs Points</Link>
                <Link href="/compare" className={styles.allTools}>All Comparisons →</Link>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.navTitle}>Switch to Us</span>
                <Link href="/alternatives/mortgage-coach-alternative">vs Mortgage Coach</Link>
                <Link href="/alternatives/mbs-highway-alternative">vs MBS Highway</Link>
                <Link href="/alternatives" className={styles.allTools}>All Alternatives →</Link>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.navTitle}>Legal</span>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
          </div>

          {/* 移动端紧凑布局 */}
          <div className={styles.footerMobile}>
            <div className={styles.mobileNav}>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#demo">Demo</Link>
              <Link href="/calculator/2-1-buydown-calculator">2-1 Buydown</Link>
              <Link href="/calculator/discount-points-break-even">Points</Link>
              <Link href="/calculator" className={styles.allTools}>All Tools →</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>© 2026 ShowTheRate. All rights reserved.</p>
          </div>
          <div className={styles.disclaimer}>
            <p className={styles.footerDisclaimer}>
              Estimates only. Not a loan offer. Actual rates may vary. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

