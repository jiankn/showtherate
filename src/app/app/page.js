'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '../../components/GlobalToast';
import { ChartIcon, LinkIcon, RobotIcon, RocketIcon, HouseIcon, CalendarIcon, UsersIcon, FileEditIcon } from '../../components/Icons';
import styles from './page.module.css';

export default function DashboardPage() {
    const { data: session } = useSession();
    const { toast, confirm } = useToast();
    const [comparisons, setComparisons] = useState([]);
    const [totalComparisons, setTotalComparisons] = useState(0);
    const [entitlements, setEntitlements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem('dashboard_visited');
        if (!hasVisited) {
            setIsFirstVisit(true);
            localStorage.setItem('dashboard_visited', 'true');
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [comparisonsRes, entitlementsRes] = await Promise.all([
                fetch('/api/comparisons'),
                fetch('/api/user/entitlements'),
            ]);

            if (comparisonsRes.ok) {
                const data = await comparisonsRes.json();
                setComparisons(data.comparisons || []);
                setTotalComparisons(data.totalCount || 0);
            }

            if (entitlementsRes.ok) {
                const data = await entitlementsRes.json();
                setEntitlements(data);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async (shareId) => {
        const url = `${window.location.origin}/s/${shareId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    const handleDelete = async (id) => {
        if (!await confirm('Delete this comparison?', { title: 'Delete Comparison', confirmText: 'Delete', type: 'danger' })) return;
        setComparisons(prev => prev.filter(c => c.id !== id));
        toast.success('Comparison deleted');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'there';
    const now = new Date();
    const weeklyComparisons = comparisons.filter((c) => (now - new Date(c.createdAt)) <= 7 * 24 * 60 * 60 * 1000).length;
    const sharedCount = comparisons.filter((c) => c.shareLink).length;
    const draftCount = comparisons.filter((c) => !c.shareLink).length;
    const clientLinkedCount = comparisons.filter((c) => c.clientId).length;
    const unlinkedCount = comparisons.filter((c) => !c.clientId).length;

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className={styles.dashboard}>
            {/* Welcome / Quick Actions */}
            {isFirstVisit && comparisons.length === 0 ? (
                <WelcomeCard userName={userName} />
            ) : (
                <QuickActionsBar userName={userName} comparisons={comparisons} toast={toast} />
            )}


            <KpiStrip
                weeklyComparisons={weeklyComparisons}
                sharedCount={sharedCount}
                clientLinkedCount={clientLinkedCount}
                draftCount={draftCount}
            />

            <ActionPanel draftCount={draftCount} unlinkedCount={unlinkedCount} />
            {/* Content */}
            {comparisons.length === 0 ? (
                <EmptyState />
            ) : (
                <ComparisonsList
                    comparisons={comparisons}
                    onCopyLink={handleCopyLink}
                    onDelete={handleDelete}
                    formatDate={formatDate}
                />
            )}

            {/* Stats Footer */}
            <StatsFooter comparisonCount={totalComparisons} entitlements={entitlements} />
        </div>
    );
}

// ===== WELCOME CARD =====
function WelcomeCard({ userName }) {
    return (
        <div className={styles.welcomeCard}>
            <div className={styles.welcomeContent}>
                <span className={styles.welcomeEmoji}>LO</span>
                <div>
                    <h1>Welcome, {userName}!</h1>
                    <p>Create your first client-ready comparison in under 60 seconds</p>
                </div>
            </div>
            <div className={styles.welcomeProgress}>
                <div className={styles.progressSteps}>
                    <span className={styles.stepDone}>1. Account created</span>
                    <span className={styles.stepActive}>2. Create comparison</span>
                    <span className={styles.stepPending}>3. Share with client</span>
                </div>
            </div>
            <div className={styles.welcomeActions}>
                <Link href="/app/new" className="btn btn-primary btn-lg">
                    <RocketIcon style={{ width: 20, height: 20 }} />
                    Start Creating
                </Link>
            </div>
        </div>
    );
}

// ===== QUICK ACTIONS BAR =====
function QuickActionsBar({ userName, comparisons, toast }) {
    const handleCopyLast = () => {
        const lastWithLink = comparisons.find(c => c.shareLink);
        if (lastWithLink) {
            navigator.clipboard.writeText(`${window.location.origin}/s/${lastWithLink.shareLink}`);
            toast.success('Last link copied!');
        } else {
            toast.info('No share link available');
        }
    };

    return (
        <div className={styles.quickBar}>
            <h1 className={styles.greeting}>Good to see you, {userName}</h1>
            <div className={styles.quickActions}>
                {comparisons.length > 0 && (
                    <button onClick={handleCopyLast} className={styles.quickBtnSecondary}>
                        Copy Last Link
                    </button>
                )}
            </div>
        </div>
    );
}


// ===== KPI STRIP =====
function KpiStrip({ weeklyComparisons, sharedCount, clientLinkedCount, draftCount }) {
    const kpiItems = [
        {
            label: 'Comparisons this week',
            value: weeklyComparisons,
            meta: 'Last 7 days',
            icon: CalendarIcon,
            variant: 'blue',
            trend: weeklyComparisons > 0 ? '+' + weeklyComparisons : null,
            trendLabel: 'this week'
        },
        {
            label: 'Shared links',
            value: sharedCount,
            meta: 'Active share links',
            icon: LinkIcon,
            variant: 'green',
            trend: sharedCount > 0 ? sharedCount + ' active' : null,
            trendLabel: 'ready to share'
        },
        {
            label: 'Client-linked',
            value: clientLinkedCount,
            meta: 'Comparisons with client info',
            icon: UsersIcon,
            variant: 'purple',
            trend: clientLinkedCount > 0 ? clientLinkedCount + ' linked' : null,
            trendLabel: 'clients attached'
        },
        {
            label: 'Drafts to finish',
            value: draftCount,
            meta: 'Not shared yet',
            icon: FileEditIcon,
            variant: 'orange',
            trend: draftCount > 0 ? draftCount + ' pending' : null,
            trendLabel: 'need attention'
        }
    ];

    return (
        <div className={styles.kpiGrid}>
            {kpiItems.map((item) => (
                <div key={item.label} className={`${styles.kpiCard} ${styles['kpiCard' + item.variant.charAt(0).toUpperCase() + item.variant.slice(1)]}`}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>{item.label}</span>
                        <div className={styles.kpiIcon}>
                            <item.icon />
                        </div>
                    </div>
                    <span className={styles.kpiValue}>{item.value.toLocaleString()}</span>
                    <div className={styles.kpiFooter}>
                        {item.trend ? (
                            <span className={styles.kpiTrend}>
                                <span className={styles.trendIndicator}>●</span>
                                {item.trendLabel}
                            </span>
                        ) : (
                            <span className={styles.kpiMeta}>{item.meta}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}


// ===== ACTION PANEL =====
function ActionPanel({ draftCount, unlinkedCount }) {
    const items = [];
    if (draftCount > 0) {
        items.push({
            title: 'Finish drafts',
            detail: `${draftCount} comparisons need a share link`,
            href: '/app/comparisons',
        });
    }
    if (unlinkedCount > 0) {
        items.push({
            title: 'Add client info',
            detail: `${unlinkedCount} comparisons missing client info`,
            href: '/app/comparisons',
        });
    }

    return (
        <div className={styles.actionPanel}>
            <div className={styles.actionHeader}>
                <div>
                    <h2>Today&apos;s actions</h2>
                    <p>Focus on share-ready comparisons</p>
                </div>
                <Link href="/app/new" className={styles.actionCta}>
                    New comparison
                </Link>
            </div>
            {items.length > 0 ? (
                <div className={styles.actionList}>
                    {items.map((item) => (
                        <div key={item.title} className={styles.actionItem}>
                            <div>
                                <span className={styles.actionTitle}>{item.title}</span>
                                <span className={styles.actionDetail}>{item.detail}</span>
                            </div>
                            <Link href={item.href} className={styles.actionLink}>
                                Review
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.actionEmpty}>
                    You&apos;re all set. Create a new comparison or share your latest link.
                </div>
            )}
        </div>
    );
}

// ===== COMPARISONS LIST =====
function ComparisonsList({ comparisons, onCopyLink, onDelete, formatDate }) {
    return (
        <div className={styles.listSection}>
            <h2 className={styles.sectionTitle}>Recent Comparisons</h2>
            <div className={styles.list}>
                {comparisons.map((c) => (
                    <div key={c.id} className={styles.listItem}>
                        <div className={styles.listIcon}>
                            {c.scenarioCount >= 3 ? '💼' : '🏠'}
                        </div>
                        <div className={styles.listInfo}>
                            <h3>{c.title}</h3>
                            <p>{c.scenarioCount || 0} scenarios • {formatDate(c.createdAt)}</p>
                        </div>
                        <div className={styles.listActions}>
                            {c.shareLink ? (
                                <>
                                    <Link href={`/s/${c.shareLink}`} target="_blank" className="btn btn-ghost btn-sm">
                                        View
                                    </Link>
                                    <button onClick={() => onCopyLink(c.shareLink)} className="btn btn-primary btn-sm">
                                        Copy
                                    </button>
                                </>
                            ) : (
                                <span className={styles.noLink}>No link</span>
                            )}
                            <button onClick={() => onDelete(c.id)} className={styles.deleteBtn}>×</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ===== EMPTY STATE =====
function EmptyState() {
    return (
        <div className={styles.emptyState}>
            <ChartIcon className={styles.emptyIcon} />
            <h2>No comparisons yet</h2>
            <p>Create your first mortgage comparison report</p>
            <Link href="/app/new" className="btn btn-primary">Create Comparison</Link>
        </div>
    );
}

// ===== STATS FOOTER =====
function StatsFooter({ comparisonCount, entitlements }) {
    const getQuota = (q) => !q ? '—' : q.quota === -1 ? '∞' : `${q.remaining}/${q.quota}`;

    return (
        <div className={styles.statsFooter}>
            <div className={styles.stat}>
                <ChartIcon className={styles.statIcon} />
                <span className={styles.statValue}>{comparisonCount}</span>
                <span className={styles.statLabel}>Comparisons</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
                <LinkIcon className={styles.statIcon} />
                <span className={styles.statValue}>{getQuota(entitlements?.quotas?.share)}</span>
                <span className={styles.statLabel}>Share Links</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
                <HouseIcon className={styles.statIcon} />
                <span className={styles.statValue}>{getQuota(entitlements?.quotas?.property)}</span>
                <span className={styles.statLabel}>Property Lookups</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
                <RobotIcon className={styles.statIcon} />
                <span className={styles.statValue}>{getQuota(entitlements?.quotas?.ai)}</span>
                <span className={styles.statLabel}>AI Scripts</span>
            </div>
        </div>
    );
}

// ===== LOADING SKELETON =====
function LoadingSkeleton() {
    return (
        <div className={styles.skeleton}>
            <div className={styles.skeletonBar} />
            <div className={styles.skeletonList}>
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonItem} />
            </div>
        </div>
    );
}
