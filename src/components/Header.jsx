'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const mobileMenuRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);
  const pathname = usePathname();

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Handle anchor link clicks - force scroll even if already on same page
  const handleAnchorClick = (e, hash) => {
    const targetId = hash.replace('#', '');
    const targetElement = document.getElementById(targetId);

    // If we're on the home page and the element exists, scroll to it
    if (pathname === '/' && targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth' });
      // Update URL hash without triggering navigation
      window.history.pushState(null, '', hash);
    }
    // If not on home page, let the Link handle navigation normally
  };

  const headerClass = `${styles.header} ${scrolled ? styles.headerScrolled : ''} ${variant === 'dark' ? styles.headerDark : ''}`;

  const calculatorLinks = [
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
            <Link href="/#features" onClick={(e) => handleAnchorClick(e, '#features')}>Features</Link>
            <Link href="/#howitworks" onClick={(e) => handleAnchorClick(e, '#howitworks')}>How It Works</Link>

            {/* Calculators Dropdown */}
            <div className={styles.dropdown} ref={toolsMenuRef}>
              <button
                className={styles.dropdownTrigger}
                onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                aria-expanded={toolsMenuOpen}
              >
                Calculators
                <svg className={`${styles.chevron} ${toolsMenuOpen ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {toolsMenuOpen && (
                <div className={styles.dropdownMenu}>
                  {calculatorLinks.map((item, index) => (
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
            ref={mobileMenuBtnRef}
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className={styles.mobileMenu}>
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link href="/#howitworks" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
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

