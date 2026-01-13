'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../components/GlobalToast';
import { UserProvider } from '../components/UserContext';
import CookieBanner from '../components/CookieBanner';
import { useEffect } from 'react';

export default function Providers({ children }) {
    useEffect(() => {
        // SEO优化：延迟初始化，避免阻塞页面渲染
        const initializeAppAnalytics = async () => {
            try {
                // 检查是否为搜索引擎爬虫
                const userAgent = navigator.userAgent.toLowerCase();
                const isBot = /bot|crawler|spider|googlebot|bingbot|yandexbot|duckduckbot/i.test(userAgent);

                // 如果是爬虫，不初始化分析工具
                if (isBot) return;

                const { getConsentStatus, CONSENT_STATUS } = await import('../lib/cookieConsent');
                const { initializeAnalytics } = await import('../lib/analytics');

                const consentStatus = getConsentStatus();
                if (consentStatus === CONSENT_STATUS.ACCEPTED || consentStatus === CONSENT_STATUS.CUSTOM) {
                    initializeAnalytics();
                }
            } catch (error) {
                // SEO优化：静默处理错误
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Failed to initialize analytics on app start:', error);
                }
            }
        };

        // SEO优化：使用更短的延迟
        setTimeout(initializeAppAnalytics, 100);

        // Listen for cookie consent changes
        const handleConsentChange = () => {
            initializeAppAnalytics();
        };

        window.addEventListener('cookieConsentChanged', handleConsentChange);
        window.addEventListener('cookiesAccepted', handleConsentChange);

        return () => {
            window.removeEventListener('cookieConsentChanged', handleConsentChange);
            window.removeEventListener('cookiesAccepted', handleConsentChange);
        };
    }, []);

    return (
        <SessionProvider>
            <UserProvider>
                <ToastProvider>
                    {children}
                    <CookieBanner />
                </ToastProvider>
            </UserProvider>
        </SessionProvider>
    );
}
