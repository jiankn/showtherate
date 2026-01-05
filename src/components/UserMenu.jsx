'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import styles from './UserMenu.module.css';

/**
 * Reusable User Menu Component
 * Displays user avatar with dropdown menu
 * @param {Object} props
 * @param {Object} props.session - NextAuth session object
 * @param {string} props.variant - 'header' (dark bg) or 'topbar' (light bg)
 */
export default function UserMenu({ session, variant = 'header' }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const user = session?.user;
    const userName = user?.name || user?.email?.split('@')[0] || 'User';
    const userEmail = user?.email || '';
    const userImage = user?.image || null;
    const userInitial = userName.charAt(0).toUpperCase();

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const variantClass = variant === 'topbar' ? styles.topbarVariant : styles.headerVariant;

    return (
        <div className={`${styles.userMenu} ${variantClass}`} ref={menuRef}>
            <button
                className={styles.avatarBtn}
                onClick={() => setShowMenu(!showMenu)}
                aria-label="User menu"
            >
                {userImage ? (
                    <Image
                        src={userImage}
                        alt={userName}
                        width={36}
                        height={36}
                        className={styles.avatarImage}
                    />
                ) : (
                    <div className={styles.avatarInitial}>{userInitial}</div>
                )}
                <span className={styles.chevron}>{showMenu ? '▲' : '▼'}</span>
            </button>

            {showMenu && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        {userImage ? (
                            <Image
                                src={userImage}
                                alt={userName}
                                width={40}
                                height={40}
                                className={styles.dropdownAvatar}
                            />
                        ) : (
                            <div className={styles.dropdownAvatarInitial}>{userInitial}</div>
                        )}
                        <div className={styles.dropdownInfo}>
                            <span className={styles.dropdownName}>{userName}</span>
                            <span className={styles.dropdownEmail}>{userEmail}</span>
                        </div>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link
                        href="/app"
                        className={styles.dropdownItem}
                        onClick={() => setShowMenu(false)}
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        href="/app/settings"
                        className={styles.dropdownItem}
                        onClick={() => setShowMenu(false)}
                    >
                        ⚙️ Settings
                    </Link>
                    <Link
                        href="/app/upgrade"
                        className={styles.dropdownItem}
                        onClick={() => setShowMenu(false)}
                    >
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
    );
}
