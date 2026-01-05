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
import { ChartIcon, EyeIcon, LinkIcon } from '../../../components/Icons';
import styles from './page.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6B7280'];

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7d');

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
                    {['7d', '30d'].map((r) => (
                        <button
                            key={r}
                            className={`${styles.rangeBtn} ${range === r ? styles.active : ''}`}
                            onClick={() => setRange(r)}
                        >
                            {r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                        </button>
                    ))}
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

            {/* Recent Client Activity */}
            <div className={styles.activitySection}>
                <h2>Recent Client Activity</h2>
                {recentActivity.length > 0 ? (
                    <div className={styles.activityList}>
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className={styles.activityItem}>
                                <div className={styles.activityIcon}>
                                    {activity.eventType === 'share_page_view' ? '👁' : '👆'}
                                </div>
                                <div className={styles.activityContent}>
                                    <p className={styles.activityText}>
                                        {activity.eventType === 'share_page_view'
                                            ? 'A client opened a share link'
                                            : `CTA clicked: ${activity.ctaType || 'unknown'}`
                                        }
                                        {activity.device && ` on ${activity.device}`}
                                    </p>
                                    <span className={styles.activityTime}>
                                        {new Date(activity.time).toLocaleString()}
                                    </span>
                                </div>
                                {activity.comparisonId && (
                                    <Link
                                        href={`/app/comparisons/${activity.comparisonId}`}
                                        className={styles.activityLink}
                                    >
                                        View →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyActivity}>
                        <p>No activity yet. Share a comparison to start tracking.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
