'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '../../components/GlobalToast';
import { ChartIcon, LinkIcon, RobotIcon, RocketIcon, HouseIcon, CalendarIcon, UsersIcon, FileEditIcon, SearchIcon } from '../../components/Icons';
import styles from './page.module.css';

export default function DashboardPage() {
    const { data: session } = useSession();
    const { toast, confirm } = useToast();
    const [comparisons, setComparisons] = useState([]);
    const [totalComparisons, setTotalComparisons] = useState(0);
    const [entitlements, setEntitlements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pollingRef = useRef(null);
    const hasShownToast = useRef(false);

    // 检测 checkout 成功
    const checkoutSuccess = searchParams.get('checkout') === 'success';
    const productKey = searchParams.get('product');

    useEffect(() => {
        const hasVisited = localStorage.getItem('dashboard_visited');
        if (!hasVisited) {
            setIsFirstVisit(true);
            localStorage.setItem('dashboard_visited', 'true');
        }
        loadData();
    }, []);

    // 处理 checkout 成功后的订阅状态刷新
    useEffect(() => {
        if (!checkoutSuccess) return;

        setCheckoutProcessing(true);
        let attempts = 0;
        const maxAttempts = 5;

        const pollEntitlements = async () => {
            attempts++;
            try {
                const res = await fetch('/api/user/entitlements');
                if (res.ok) {
                    const data = await res.json();
                    // 检查是否已有正确的活跃订阅
                    // 根据购买的产品判断期望的 entitlement 类型
                    const expectedType = ['monthly', 'yearly'].includes(productKey?.toLowerCase())
                        ? 'subscription'
                        : 'starter_pass_7d';
                    const isCorrectType = data.type === expectedType ||
                        (expectedType === 'subscription' && data.type === 'subscription') ||
                        (expectedType === 'starter_pass_7d' && data.type === 'starter_pass_7d');

                    if (data.hasActiveEntitlement && data.type !== 'free' && isCorrectType) {
                        setEntitlements(data);
                        setCheckoutProcessing(false);

                        // 清除 URL 参数
                        router.replace('/app', { scroll: false });

                        // 显示成功提示（只弹一次）
                        if (!hasShownToast.current) {
                            hasShownToast.current = true;
                            // 根据 URL 参数中的 product 判断产品类型
                            const productMap = {
                                'MONTHLY': 'Pro Plan',
                                'YEARLY': 'Pro Plan (Annual)',
                                'STARTER_PASS': 'Starter Pass'
                            };
                            const planName = productMap[productKey?.toUpperCase()] ||
                                (data.type === 'subscription' ? 'Pro Plan' : 'Starter Pass');
                            toast.success(`🎉 Welcome to ${planName}! Your subscription is now active.`);
                        }

                        // 触发全局事件通知其他组件刷新
                        window.dispatchEvent(new Event('entitlementsUpdated'));
                        localStorage.setItem('entitlementsUpdate', Date.now().toString());

                        // 停止轮询
                        if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                            pollingRef.current = null;
                        }
                        return;
                    }
                }
            } catch (error) {
                console.error('Failed to poll entitlements:', error);
            }

            // 达到最大尝试次数
            if (attempts >= maxAttempts) {
                setCheckoutProcessing(false);
                router.replace('/app', { scroll: false });
                toast.info('Payment received! Your subscription should be active within a minute.');
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
        };

        // 立即执行一次
        pollEntitlements();

        // 每 2 秒轮询一次
        pollingRef.current = setInterval(pollEntitlements, 2000);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [checkoutSuccess, productKey, router]); // 移除toast依赖

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

// ===== COMPARISONS MANAGER =====
function ComparisonsList({ comparisons, onCopyLink, onDelete, formatDate }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(5);

    // Filter comparisons
    const filteredComparisons = comparisons.filter(c =>
        (c.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const hasHiddenItems = filteredComparisons.length > visibleCount;

    return (
        <div className={styles.listSection}>
            <div className={styles.listHeader}>
                <h2 className={styles.sectionTitle}>Recent Comparisons</h2>
                <div className={styles.searchBox}>
                    <SearchIcon className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search client or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.list}>
                {filteredComparisons.length > 0 ? (
                    filteredComparisons.slice(0, visibleCount).map((c) => (
                        <div key={c.id} className={styles.listItem}>
                            <div className={styles.listIcon}>
                                {c.scenarioCount >= 3 ? '💼' : '🏠'}
                            </div>
                            <div className={styles.listInfo}>
                                <div className={styles.listTitleRow}>
                                    <Link href={`/app/comparisons/${c.id}`} className={styles.listTitle}>
                                        {c.title}
                                    </Link>
                                    {c.clientName && (
                                        <span className={styles.clientBadge}>
                                            {c.clientName}
                                        </span>
                                    )}
                                </div>
                                <p className={styles.listMeta}>
                                    {c.scenarioCount || 0} scenarios • {formatDate(c.createdAt)}
                                </p>
                            </div>
                            <div className={styles.listActions}>
                                {c.shareLink ? (
                                    <>
                                        <Link href={`/s/${c.shareLink}`} target="_blank" className={styles.actionBtnGhost}>
                                            View
                                        </Link>
                                        <button onClick={() => onCopyLink(c.shareLink)} className={styles.actionBtnPrimary}>
                                            Copy
                                        </button>
                                    </>
                                ) : (
                                    <span className={styles.noLink}>No link</span>
                                )}
                                <button
                                    onClick={() => onDelete(c.id)}
                                    className={styles.deleteBtn}
                                    title="Delete Comparison"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptySearch}>
                        <p>No comparisons found matching "{searchTerm}"</p>
                    </div>
                )}

                {hasHiddenItems && (
                    <button
                        className={styles.loadMoreBtn}
                        onClick={() => setVisibleCount(prev => prev + 10)}
                    >
                        Load More Comparisons
                    </button>
                )}
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
    const getRemaining = (q) => {
        if (!q) return 0;
        if (q.quota === -1) return '∞';
        return Math.max(0, q.remaining);
    };

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
                <span className={styles.statValue}>{entitlements?.quotas?.share?.used || 0}</span>
                <span className={styles.statLabel}>Links Shared</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
                <HouseIcon className={styles.statIcon} />
                <span className={styles.statValue}>{getRemaining(entitlements?.quotas?.property)}</span>
                <span className={styles.statLabel}>Lookups Left</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
                <RobotIcon className={styles.statIcon} />
                <span className={styles.statValue}>{getRemaining(entitlements?.quotas?.ai)}</span>
                <span className={styles.statLabel}>AI Credits Left</span>
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
