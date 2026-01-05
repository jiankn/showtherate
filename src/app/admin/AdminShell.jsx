'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChartIcon, MoneyIcon, RocketIcon, PhoneIcon, FilterIcon } from '../../components/Icons';
import styles from './admin.module.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ADMIN_EMAIL } from '@/lib/adminAuth';
import { signOut } from 'next-auth/react';

const navItems = [
  { label: 'Overview', href: '/admin/overview', icon: ChartIcon },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: RocketIcon },
  { label: 'Revenue', href: '/admin/revenue', icon: MoneyIcon },
  { label: 'Tickets', href: '/admin/tickets', icon: PhoneIcon },
  { label: 'Settings', href: '/admin/settings', icon: FilterIcon },
];

const TYPE_LABELS = {
  ticket: '🎫 Ticket',
  user: '👤 User',
  subscription: '💳 Subscription',
  payment: '💰 Payment',
};

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const current = navItems.find((item) => item.href === pathname);
  const pageTitle = current ? current.label : 'Overview';

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // 获取未读工单数量
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/admin/tickets/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch admin unread ticket count:', error);
    }
  };

  // 执行搜索
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // 防抖搜索
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // 键盘导航
  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          router.push(searchResults[selectedIndex].href);
          setShowResults(false);
          setSearchQuery('');
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // 每30秒刷新一次未读数量
    const interval = setInterval(fetchUnreadCount, 30000);

    // 监听工单状态更新消息
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'TICKET_STATUS_UPDATED') {
        fetchUnreadCount();
      }
    };

    // 页面获焦时自动刷新（从工单详情返回时）
    const handleFocus = () => fetchUnreadCount();

    window.addEventListener('message', handleMessage);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className={styles.adminShell}>
      {mobileOpen && <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />}
      <aside className={`${styles.sideNav} ${mobileOpen ? styles.sideNavOpen : ''}`}>
        <div>
          <div className={styles.brand}>
            <div className={styles.brandBadge}>STR</div>
            ShowTheRate Admin
          </div>
        </div>
        <div>
          <div className={styles.navGroupLabel}>Workspace</div>
          <div className={styles.navList}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className={styles.navLinkIcon} />
                  {item.label}
                  {item.href === '/admin/tickets' && unreadCount > 0 && (
                    <span className={styles.notificationBadge}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <div className={styles.navFooter}>
          <strong>Admin only</strong>
          <div>Access limited to jiankn@gmail.com</div>
        </div>
      </aside>
      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <div>
            <p className={styles.topMeta}>Admin console</p>
            <h1 className={styles.topTitle}>{pageTitle}</h1>
          </div>
          <div className={styles.topActions}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              type="button"
            >
              <span className={styles.menuIcon} />
            </button>
            <div className={styles.searchContainer} ref={searchRef}>
              <div className={styles.searchBox}>
                <span>🔍</span>
                <input
                  className={styles.searchInput}
                  placeholder="Search tickets, users..."
                  aria-label="Search admin"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowResults(true)}
                  onKeyDown={handleKeyDown}
                />
                {searchLoading && <span className={styles.searchSpinner}>⏳</span>}
              </div>
              {showResults && (searchResults.length > 0 || searchQuery.length >= 2) && (
                <div className={styles.searchDropdown}>
                  {searchResults.length === 0 ? (
                    <div className={styles.searchEmpty}>
                      {searchLoading ? 'Searching...' : 'No results found'}
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.href}
                        className={`${styles.searchItem} ${index === selectedIndex ? styles.searchItemActive : ''}`}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                      >
                        <span className={styles.searchItemType}>{TYPE_LABELS[result.type]}</span>
                        <div className={styles.searchItemContent}>
                          <div className={styles.searchItemTitle}>{result.title}</div>
                          <div className={styles.searchItemSubtitle}>{result.subtitle}</div>
                        </div>
                        {result.status && (
                          <span className={styles.searchItemStatus}>{result.status}</span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
            <span className={styles.adminTag}>{ADMIN_EMAIL}</span>
            <button
              className={styles.buttonGhost}
              type="button"
              onClick={() => signOut({ callbackUrl: '/admin' })}
            >
              Sign out
            </button>
          </div>
        </header>
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}

