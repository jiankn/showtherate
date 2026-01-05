'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from './TopBar.module.css';

export default function TopBar({ onMobileMenuClick }) {
    const { data: session } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuRef = useRef(null);

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';
    const userEmail = session?.user?.email || '';
    const userImage = session?.user?.image || null;
    const userInitial = userName.charAt(0).toUpperCase();

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
                                🏠 Home
                            </Link>
                            <Link href="/app/settings" className={styles.dropdownItem}>
                                ⚙️ Settings
                            </Link>
                            <Link href="/app/upgrade" className={styles.dropdownItem}>
                                💎 Upgrade Plan
                            </Link>
                            <div className={styles.dropdownDivider} />
                            <button
                                className={styles.dropdownItem}
                                onClick={() => signOut({ callbackUrl: '/' })}
                            >
                                🚪 Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
