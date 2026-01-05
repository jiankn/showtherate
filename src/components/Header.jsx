'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LogoIcon } from './Icons';
import UserMenu from './UserMenu';
import styles from './Header.module.css';

export default function Header({ variant = 'default' }) {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAuthenticated = status === 'authenticated' && session?.user;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClass = `${styles.header} ${scrolled ? styles.headerScrolled : ''} ${variant === 'dark' ? styles.headerDark : ''}`;

  return (
    <header className={headerClass}>
      <div className="container">
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <LogoIcon className={styles.logoIconSvg} />
            <span className={styles.logoText}>ShowTheRate</span>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/#features">Features</Link>
            <Link href="/blog">News & Insight</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#demo">Demo</Link>
          </div>

          <div className={styles.navActions}>
            {isAuthenticated ? (
              <UserMenu session={session} variant="header" />
            ) : (
              <>
                <a href="/app" className={`btn btn-ghost btn-sm ${styles.btnGhost}`}>Sign In</a>
                <a href="/app/new" className="btn btn-primary btn-sm">Get Started</a>
              </>
            )}
          </div>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>News & Insight</Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/#demo" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
          {isAuthenticated ? (
            <>
              <Link href="/app" className="btn btn-secondary btn-full" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/app/settings" className="btn btn-ghost btn-full" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
            </>
          ) : (
            <>
              <a href="/app" className="btn btn-secondary btn-full">Sign In</a>
              <a href="/app/new" className="btn btn-primary btn-full">Get Started</a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
