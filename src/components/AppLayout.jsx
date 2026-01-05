'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className={styles.layout}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />
            <div className={`${styles.mainArea} ${sidebarCollapsed ? styles.expanded : ''}`}>
                <TopBar onMobileMenuClick={() => setMobileOpen(true)} />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
