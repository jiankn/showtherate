'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LogoIcon } from './Icons';
import UserMenu from './UserMenu';
import styles from './Header.module.css';

export default function Header({ variant = 'default' }) {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef(null);

  const isAuthenticated = status === 'authenticated' && session?.user;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerClass = `${styles.header} ${scrolled ? styles.headerScrolled : ''} ${variant === 'dark' ? styles.headerDark : ''}`;

  const toolsLinks = [
    { label: '2-1 Buydown Calculator', href: '/calculator/2-1-buydown-calculator', hot: true },
    { label: 'Points Break-Even', href: '/calculator/discount-points-break-even', hot: true },
    { label: 'Cash to Close', href: '/calculator/cash-to-close-calculator' },
    { label: 'Payment Shock', href: '/calculator/payment-shock-calculator', isNew: true },
    { divider: true },
    { label: 'Buydown vs Points', href: '/compare/temporary-buydown-vs-points' },
    { label: '2-1 vs 3-2-1 Buydown', href: '/compare/2-1-vs-3-2-1-buydown', isNew: true },
    { label: 'APR vs Interest Rate', href: '/compare/apr-vs-interest-rate', isNew: true },
    { label: 'FHA vs Conventional', href: '/compare/fha-vs-conventional' },
    { label: 'Lock vs Float', href: '/compare/lock-vs-float' },
    { divider: true },
    { label: 'vs Mortgage Coach', href: '/alternatives/mortgage-coach-alternative' },
    { divider: true },
    { label: 'All Calculators →', href: '/calculator', isViewAll: true },
    { label: 'All Comparisons →', href: '/compare', isViewAll: true },
    { label: 'All Alternatives →', href: '/alternatives', isViewAll: true },
  ];

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

            {/* Tools Dropdown */}
            <div className={styles.dropdown} ref={toolsMenuRef}>
              <button
                className={styles.dropdownTrigger}
                onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                aria-expanded={toolsMenuOpen}
              >
                Tools
                <svg className={`${styles.chevron} ${toolsMenuOpen ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {toolsMenuOpen && (
                <div className={styles.dropdownMenu}>
                  {toolsLinks.map((item, index) => (
                    item.divider ? (
                      <div key={index} className={styles.dropdownDivider} />
                    ) : (
                      <Link
                        key={index}
                        href={item.href}
                        className={`${styles.dropdownItem} ${item.isViewAll ? styles.dropdownViewAll : ''}`}
                        onClick={() => setToolsMenuOpen(false)}
                      >
                        {item.label}
                        {item.hot && <span className={styles.hotBadge}>HOT</span>}
                        {item.isNew && <span className={styles.newBadge}>NEW</span>}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>

            <Link href="/blog">News & Insight</Link>
            <Link href="/#pricing">Pricing</Link>
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
          <Link href="/calculator" onClick={() => setMobileMenuOpen(false)}>Calculators</Link>
          <Link href="/compare" onClick={() => setMobileMenuOpen(false)}>Compare Tools</Link>
          <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>News & Insight</Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
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

