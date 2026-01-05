import Link from 'next/link';
import { LogoIcon } from './Icons';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>
              <LogoIcon className={styles.logoIconSvg} />
              <span className={styles.logoText}>ShowTheRate</span>
            </Link>
            <p className={styles.footerTagline}>
              The 60-second mortgage comparison tool for Loan Officers
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#demo">Demo</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Support</h4>
              <a href="mailto:support@showtherate.com">Contact</a>
              <Link href="/#faq">FAQ</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2025 ShowTheRate. All rights reserved.</p>
          <p className={styles.footerDisclaimer}>
            Estimates only. This is not a loan offer or commitment to lend.
            Actual rates, payments, and costs may vary. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
