'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const { data: session, status: sessionStatus } = useSession();
    const [userState, setUserState] = useState({
        profile: null,
        entitlements: null,
        subscriptionDetails: null,
        loading: true,
        error: null,
    });

    // 从localStorage加载缓存数据
    const loadFromCache = useCallback(() => {
        if (typeof window === 'undefined') return null;

        try {
            const cached = localStorage.getItem('userState');
            if (cached) {
                const parsed = JSON.parse(cached);
                // 检查缓存是否过期 (5分钟)
                if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
                    return parsed.data;
                }
            }
        } catch (error) {
            console.warn('Failed to load cached user state:', error);
        }
        return null;
    }, []);

    // 保存到localStorage缓存
    const saveToCache = useCallback((data) => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem('userState', JSON.stringify({
                data,
                timestamp: Date.now(),
            }));
        } catch (error) {
            console.warn('Failed to cache user state:', error);
        }
    }, []);

    // 更新状态
    const updateUserState = useCallback((updates) => {
        setUserState(prev => {
            const newState = { ...prev, ...updates };
            // 只有当数据完整时才缓存
            if (!newState.loading && !newState.error) {
                saveToCache(newState);
            }
            return newState;
        });
    }, [saveToCache]);

    // 加载用户信息
    const loadUserData = useCallback(async () => {
        if (!session?.user) {
            updateUserState({
                profile: null,
                entitlements: null,
                subscriptionDetails: null,
                loading: false,
                error: null,
            });
            return;
        }

        updateUserState({ loading: true, error: null });

        try {
            // 并行加载profile和entitlements
            const [profileRes, entitlementsRes] = await Promise.allSettled([
                fetch('/api/user/profile'),
                fetch('/api/user/entitlements'),
            ]);

            const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
                ? (await profileRes.value.json())?.profile || null
                : null;

            const entitlements = entitlementsRes.status === 'fulfilled' && entitlementsRes.value.ok
                ? await entitlementsRes.value.json()
                : null;

            // 如果有订阅，加载订阅详情
            let subscriptionDetails = null;
            if (entitlements?.hasActiveEntitlement && entitlements?.type === 'subscription') {
                try {
                    const subRes = await fetch('/api/user/subscription');
                    if (subRes.ok) {
                        subscriptionDetails = await subRes.json();
                    }
                } catch (error) {
                    console.warn('Failed to load subscription details:', error);
                }
            }

            updateUserState({
                profile,
                entitlements,
                subscriptionDetails,
                loading: false,
                error: null,
            });

        } catch (error) {
            console.error('Failed to load user data:', error);
            updateUserState({
                loading: false,
                error: error.message || 'Failed to load user data',
            });
        }
    }, [session?.user, updateUserState]);

    // 当session状态改变时重新加载数据
    useEffect(() => {
        if (sessionStatus === 'loading') return;

        // 如果是已登录用户，先尝试从缓存加载
        if (session?.user) {
            const cachedData = loadFromCache();
            if (cachedData) {
                setUserState(cachedData);
                // 后台静默更新数据
                loadUserData();
            } else {
                loadUserData();
            }
        } else {
            // 未登录状态
            updateUserState({
                profile: null,
                entitlements: null,
                subscriptionDetails: null,
                loading: false,
                error: null,
            });
        }
    }, [sessionStatus, session?.user, loadFromCache, loadUserData, updateUserState]);

    // 提供刷新方法（会清除缓存以获取最新数据）
    const refreshUserData = useCallback(() => {
        // 清除缓存以强制获取最新数据
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('userState');
            } catch (error) {
                console.warn('Failed to clear user cache:', error);
            }
        }
        loadUserData();
    }, [loadUserData]);

    const value = {
        ...userState,
        session,
        sessionStatus,
        refreshUserData,
        // 计算属性
        hasActiveEntitlement: !!(userState.entitlements?.hasActiveEntitlement || userState.entitlements?.type === 'subscription'),
        isPro: userState.entitlements?.type === 'subscription',
        isStarterPass: userState.entitlements?.type === 'starter_pass_7d',
        isFree: !userState.entitlements || (!userState.entitlements.hasActiveEntitlement && userState.entitlements.type !== 'subscription'),
        isMonthly: userState.subscriptionDetails?.billingCycle === 'monthly',
        isYearly: userState.subscriptionDetails?.billingCycle === 'yearly',
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
