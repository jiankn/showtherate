'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from './UserContext';
import {
    LogoIcon,
    ChartIcon,
    HouseIcon,
    RobotIcon,
    LinkIcon,
    RocketIcon,
    EmailIcon,
    StarIcon
} from './Icons';
import styles from './Sidebar.module.css';



const navItems = [
    { href: '/app', icon: ChartIcon, label: 'Dashboard', exact: true },
    { href: '/app/comparisons', icon: LinkIcon, label: 'Comparisons' },
    { href: '/app/clients', icon: HouseIcon, label: 'Clients' },
    { href: '/app/analytics', icon: RobotIcon, label: 'Analytics' },
    { href: '/app/tickets', icon: EmailIcon, label: 'Support' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
    const pathname = usePathname();
    const { entitlements, loading: loadingEntitlements, session, refreshUserData } = useUser();
    const [unreadCount, setUnreadCount] = useState(0);

    const isActive = (href, exact) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };


    // 获取未读工单数量
    const fetchUnreadCount = async () => {
        if (!session?.user) return;

        try {
            const res = await fetch('/api/tickets/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch unread ticket count:', error);
        }
    };

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

        // 监听localStorage变化（跨标签页通信）
        const handleStorageChange = (event) => {
            if (event.key === 'ticketStatusUpdate') {
                fetchUnreadCount();
                // 清理localStorage
                localStorage.removeItem('ticketStatusUpdate');
            }
            // 监听订阅状态更新
            if (event.key === 'entitlementsUpdate') {
                refreshUserData();
                localStorage.removeItem('entitlementsUpdate');
            }
        };

        // 监听自定义事件（同页面通信）
        const handleTicketUpdate = () => {
            fetchUnreadCount();
        };

        // 监听订阅状态更新事件
        const handleEntitlementsUpdate = () => {
            refreshUserData();
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('ticketStatusUpdated', handleTicketUpdate);
        window.addEventListener('entitlementsUpdated', handleEntitlementsUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ticketStatusUpdated', handleTicketUpdate);
            window.removeEventListener('entitlementsUpdated', handleEntitlementsUpdate);
        };
    }, [session?.user, refreshUserData]);

    // 获取套餐名称
    const getPlanName = () => {
        if (entitlements?.type === 'subscription') return 'Pro Plan';
        if (entitlements?.type === 'starter_pass_7d') return 'Starter Pass';
        return 'Free Plan';
    };

    // 判断是否显示升级按钮
    const showUpgradeButton = entitlements?.type !== 'subscription';

    // 判断是否为付费用户
    const isPaidUser = entitlements?.type === 'subscription' || entitlements?.type === 'starter_pass_7d';

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`${styles.backdrop} ${mobileOpen ? styles.visible : ''}`}
                onClick={onMobileClose}
            />

            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
                <button className={styles.mobileCloseBtn} onClick={onMobileClose}>
                    ×
                </button>

                {/* Logo */}
                <div className={styles.logoSection}>
                    <Link href="/app" className={styles.logo}>
                        <LogoIcon className={styles.logoIcon} />
                        <span className={styles.logoText}>{!collapsed || mobileOpen ? 'ShowTheRate' : ''}</span>
                    </Link>
                    <button className={styles.toggleBtn} onClick={onToggle}>
                        {collapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href, item.exact) ? styles.active : ''}`}
                            title={collapsed ? item.label : undefined}
                            onClick={onMobileClose} // Close on nav
                        >
                            <item.icon className={styles.navIcon} />
                            <span>{(!collapsed || mobileOpen) ? item.label : ''}</span>
                            {item.href === '/app/tickets' && unreadCount > 0 && (
                                <span className={styles.notificationBadge}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}

                    {/* Upgrade Navigation Item - 仅对非 Pro 用户显示 */}
                    {showUpgradeButton && (
                        <Link
                            href="/app/upgrade"
                            className={`${styles.navItem} ${styles.upgradeNavItem} ${isActive('/app/upgrade') ? styles.active : ''}`}
                            title={collapsed ? 'Upgrade to Pro' : undefined}
                            onClick={onMobileClose}
                        >
                            <RocketIcon className={styles.navIcon} />
                            <span>{(!collapsed || mobileOpen) ? 'Upgrade' : ''}</span>
                            {(!collapsed || mobileOpen) && (
                                <span className={styles.upgradeLabel}>PRO</span>
                            )}
                        </Link>
                    )}
                </nav>

                {/* Spacer */}
                <div className={styles.spacer} />

                {/* Settings */}
                <div className={styles.bottomSection}>
                    <Link
                        href="/app/settings"
                        className={`${styles.navItem} ${isActive('/app/settings') ? styles.active : ''}`}
                        title={collapsed ? 'Settings' : undefined}
                        onClick={onMobileClose}
                    >
                        <span className={styles.settingsIcon}>⚙️</span>
                        <span>{(!collapsed || mobileOpen) ? 'Settings' : ''}</span>
                    </Link>

                    {/* Plan Badge */}
                    {(!collapsed || mobileOpen) && showUpgradeButton && (
                        <Link
                            href="/app/upgrade"
                            className={`${styles.planBadge} ${isPaidUser ? styles.planBadgePro : ''}`}
                        >
                            {isPaidUser ? (
                                <StarIcon className={styles.planIcon} />
                            ) : (
                                <RocketIcon className={styles.planIcon} />
                            )}
                            <div className={styles.planInfo}>
                                <span className={styles.planName}>
                                    {getPlanName()}
                                    {/* Starter Pass: 显示剩余天数 */}
                                    {entitlements?.type === 'starter_pass_7d' && entitlements?.expiresAt && (
                                        <span className={styles.daysLeft}>
                                            {(() => {
                                                const daysLeft = Math.ceil((new Date(entitlements.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                                                if (daysLeft <= 0) return ' · Expired';
                                                if (daysLeft === 1) return ' · 1d left';
                                                return ` · ${daysLeft}d left`;
                                            })()}
                                        </span>
                                    )}
                                </span>
                                <span className={styles.planCta}>Upgrade →</span>
                            </div>
                        </Link>
                    )}

                    {/* User */}
                    <div className={styles.userSection}>
                        <div className={styles.userAvatar}>{userInitial}</div>
                        {(!collapsed || mobileOpen) && (
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{userName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
