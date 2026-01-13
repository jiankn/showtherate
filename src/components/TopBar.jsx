'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useUser } from './UserContext';
import { HomeIcon, SettingsIcon, DiamondIcon, LogoutIcon } from './Icons';
import styles from './TopBar.module.css';

export default function TopBar({ onMobileMenuClick }) {
    const { entitlements, subscriptionDetails, loading: loadingEntitlements, session } = useUser();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuRef = useRef(null);

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';
    const userEmail = session?.user?.email || '';
    const userImage = session?.user?.image || null;
    const userInitial = userName.charAt(0).toUpperCase();


    // 根据订阅状态决定菜单项配置
    const getUpgradeMenuItem = () => {
        if (loadingEntitlements) {
            return { href: '/app/upgrade', text: 'Upgrade Plan' };
        }

        if (!entitlements || !entitlements.hasActiveEntitlement) {
            return { href: '/app/upgrade', text: 'Upgrade Plan' };
        }

        const { type } = entitlements;

        if (type === 'starter_pass_7d') {
            return { href: '/app/upgrade', text: 'Upgrade to Pro' };
        }

        if (type === 'subscription') {
            // 所有订阅用户统一跳转到 upgrade 页面
            // 月付用户可以升级年付，年付用户可以管理订阅
            const billingCycle = subscriptionDetails?.billingCycle;
            if (billingCycle === 'monthly') {
                return { href: '/app/upgrade', text: 'Switch to Annual' };
            }
            // 年付用户也跳转到 upgrade 页面，显示 Manage Subscription
            return { href: '/app/upgrade', text: 'Manage Subscription' };
        }

        return { href: '/app/upgrade', text: 'Upgrade Plan' };
    };

    const upgradeMenuItem = getUpgradeMenuItem();


    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className={styles.topBar}>
            {/* Mobile Menu Button */}
            <button className={styles.hamburgerBtn} onClick={onMobileMenuClick}>
                ☰
            </button>



            {/* Right Actions */}
            <div className={styles.actions}>
                {/* User Menu */}
                <div className={styles.userMenu} ref={menuRef}>
                    <button
                        className={styles.userBtn}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        {userImage ? (
                            <Image src={userImage} alt={userName} width={32} height={32} className={styles.userAvatarImg} />
                        ) : (
                            <div className={styles.userAvatar}>{userInitial}</div>
                        )}
                        <span className={styles.userName}>{userName}</span>
                        <span className={styles.chevron}>{showUserMenu ? '▲' : '▼'}</span>
                    </button>

                    {showUserMenu && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                {userImage ? (
                                    <Image src={userImage} alt={userName} width={40} height={40} className={styles.dropdownAvatarImg} />
                                ) : (
                                    <div className={styles.dropdownAvatar}>{userInitial}</div>
                                )}
                                <div className={styles.dropdownInfo}>
                                    <span className={styles.dropdownName}>{userName}</span>
                                    <span className={styles.dropdownEmail}>{userEmail}</span>
                                </div>
                            </div>
                            <div className={styles.dropdownDivider} />
                            <Link href="/" className={styles.dropdownItem}>
                                <HomeIcon className={styles.dropdownIcon} />
                                Home
                            </Link>
                            <Link href="/app/settings" className={styles.dropdownItem}>
                                <SettingsIcon className={styles.dropdownIcon} />
                                Settings
                            </Link>
                            <Link href={upgradeMenuItem.href} className={styles.dropdownItem}>
                                <DiamondIcon className={styles.dropdownIcon} />
                                {upgradeMenuItem.text}
                            </Link>
                            <div className={styles.dropdownDivider} />
                            <button
                                className={styles.dropdownItem}
                                onClick={() => signOut({ callbackUrl: '/' })}
                            >
                                <LogoutIcon className={styles.dropdownIcon} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
