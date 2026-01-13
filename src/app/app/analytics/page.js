'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { ChartIcon, EyeIcon, LinkIcon, CalendarIcon, BarChartIcon } from '../../../components/Icons';
import styles from './page.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6B7280'];

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7d');
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                const res = await fetch(`/api/analytics?range=${range}`);
                const json = await res.json();
                if (res.ok) {
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [range]);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1>Client Engagement</h1>
                </div>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    const kpi = data?.kpi || { totalViews: 0, activeLinks: 0, clickRate: 0 };
    const viewData = data?.viewData || [];
    const deviceDistribution = data?.deviceDistribution || [];
    const recentActivity = data?.recentActivity || [];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Client Engagement</h1>
                    <p>Track share opens and client engagement</p>
                </div>
                <div className={styles.rangeSelector}>
                    <div className={styles.rangeLabel}>Time Range:</div>
                    <div className={styles.rangeButtons}>
                        {[
                            { key: '7d', label: '7 Days', Icon: CalendarIcon },
                            { key: '30d', label: '30 Days', Icon: BarChartIcon }
                        ].map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                className={`${styles.rangeBtn} ${range === key ? styles.active : ''}`}
                                onClick={() => setRange(key)}
                                aria-pressed={range === key}
                            >
                                <span className={styles.btnIcon}>
                                    <Icon />
                                </span>
                                <span className={styles.btnText}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
                <div className={`${styles.kpiCard} ${styles.kpiCardViews}`}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiTitle}>Share Opens</span>
                        <div className={styles.kpiIcon}>
                            <EyeIcon />
                        </div>
                    </div>
                    <div className={styles.kpiValue}>{kpi.totalViews.toLocaleString()}</div>
                    <div className={styles.kpiTrend}>
                        <span>in selected period</span>
                    </div>
                </div>

                <div className={`${styles.kpiCard} ${styles.kpiCardLinks}`}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiTitle}>Active Shares</span>
                        <div className={styles.kpiIcon}>
                            <LinkIcon />
                        </div>
                    </div>
                    <div className={styles.kpiValue}>{kpi.activeLinks.toLocaleString()}</div>
                    <div className={styles.kpiTrend}>
                        <span>active share links</span>
                    </div>
                </div>

                <div className={`${styles.kpiCard} ${styles.kpiCardRate}`}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiTitle}>CTA Click Rate</span>
                        <div className={styles.kpiIcon}>
                            <ChartIcon />
                        </div>
                    </div>
                    <div className={styles.kpiValue}>{kpi.clickRate}%</div>
                    <div className={styles.kpiTrend}>
                        <span>client actions</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <h2>Share opens - {range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</h2>
                    <div className={styles.chartContainer}>
                        {viewData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={viewData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            border: '1px solid #E5E7EB',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyChart}>No data available</div>
                        )}
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h2>Device Mix</h2>
                    <div className={styles.chartContainer}>
                        {deviceDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {deviceDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyChart}>No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Engagement (Smart Feed) */}
            <div className={styles.activitySection}>
                <h2>Recent Engagement</h2>
                {recentActivity.length > 0 ? (
                    <div className={styles.activityList}>
                        {groupEventsBySession(recentActivity).slice(0, visibleCount).map((session) => (
                            <div key={session.id} className={styles.sessionCard}>
                                <div className={styles.sessionHeader}>
                                    <div className={styles.sessionIcon}>
                                        {session.hasClick ? (
                                            <span style={{ fontSize: '1.2rem' }}>🎯</span>
                                        ) : (
                                            <LinkIcon />
                                        )}
                                    </div>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionTitleRow}>
                                            <Link href={`/app/comparisons/${session.comparisonId}`} className={styles.sessionTitle}>
                                                {session.clientName ? `${session.clientName} - ` : ''}{session.title}
                                            </Link>
                                            {session.clientName && <span className={styles.clientBadge}>Client</span>}
                                            {session.hasClick && <span className={styles.intentBadge}>High Intent</span>}
                                        </div>
                                        <div className={styles.sessionSummary}>
                                            <span className={styles.sessionAction}>
                                                {session.summaryText}
                                            </span>
                                            <span className={styles.sessionTime}>
                                                • {new Date(session.lastActive).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {groupEventsBySession(recentActivity).length > visibleCount && (
                            <button
                                className={styles.loadMoreBtn}
                                onClick={() => setVisibleCount(prev => prev + 10)}
                            >
                                Load More Activity
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyActivity}>
                        <p>No activity in this period. Share a comparison to start tracking.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper: Group consecutive events into sessions
function groupEventsBySession(events) {
    if (!events || events.length === 0) return [];

    const sessions = [];
    let currentSession = null;

    // Events are assumed to be sorted by time DESC
    events.forEach(event => {
        const eventTime = new Date(event.time).getTime();

        // Check if event belongs to current session (same comparison + within 30 mins)
        if (currentSession &&
            currentSession.comparisonId === event.comparisonId &&
            Math.abs(currentSession.lastActive - eventTime) < 30 * 60 * 1000) {

            // Add to current session
            currentSession.events.push(event);
            if (event.eventType !== 'share_page_view') currentSession.hasClick = true;
            // Keep lastActive as the most recent time (which is the first event added)
        } else {
            // Start new session
            if (currentSession) sessions.push(currentSession);
            currentSession = {
                id: event.id, // Use latest event ID as session ID
                comparisonId: event.comparisonId,
                title: event.comparisonTitle || 'Unknown Comparison',
                clientName: event.clientName,
                lastActive: eventTime,
                hasClick: event.eventType !== 'share_page_view',
                events: [event]
            };
        }
    });

    if (currentSession) sessions.push(currentSession);

    // Generate summary text for each session
    return sessions.map(session => {
        const viewCount = session.events.filter(e => e.eventType === 'share_page_view').length;
        const clickCount = session.events.filter(e => e.eventType !== 'share_page_view').length;
        const clickEvents = session.events.filter(e => e.eventType !== 'share_page_view');

        let summaryParts = [];
        if (viewCount > 0) summaryParts.push(`Viewed ${viewCount} time${viewCount !== 1 ? 's' : ''}`);
        if (clickCount > 0) {
            const actions = [...new Set(clickEvents.map(e => e.ctaType || 'CTA'))];
            summaryParts.push(`Clicked ${actions.join(', ')}`);
        }

        return {
            ...session,
            summaryText: summaryParts.join(' & ')
        };
    });
}
