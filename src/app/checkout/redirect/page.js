'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '../../../components/GlobalToast';
import styles from './page.module.css';

function CheckoutRedirectInner() {
    const searchParams = useSearchParams();
    const product = searchParams.get('product');
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // 等待 session 加载完成
        if (status === 'loading') return;

        // 如果未登录，跳转到登录页
        if (status === 'unauthenticated') {
            window.location.href = `/login?product=${product}&mode=signup`;
            return;
        }

        // 如果没有 product 参数，跳转到首页
        if (!product) {
            window.location.href = '/app';
            return;
        }

        // 已登录且有 product，触发 checkout
        const triggerCheckout = async () => {
            if (isProcessing) return;
            setIsProcessing(true);

            try {
                toast.info('Redirecting to payment...');

                const response = await fetch(`/api/billing/checkout?product=${product}`, {
                    method: 'POST',
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to start checkout' }));
                    throw new Error(errorData.error || 'Failed to start checkout');
                }

                const { url } = await response.json();
                window.location.href = url;
            } catch (err) {
                console.error('Checkout error:', err);
                setError(err.message || 'Failed to start checkout');
                toast.error(err.message || 'Failed to start checkout. Please try again.');
            }
        };

        triggerCheckout();
    }, [status, product, toast, isProcessing]);

    // 显示加载状态
    if (status === 'loading' || (status === 'authenticated' && !error)) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.spinner}></div>
                    <h1 className={styles.title}>Preparing your checkout...</h1>
                    <p className={styles.subtitle}>Please wait while we redirect you to the payment page.</p>
                </div>
            </div>
        );
    }

    // 显示错误状态
    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h1 className={styles.title}>Something went wrong</h1>
                    <p className={styles.subtitle}>{error}</p>
                    <div className={styles.actions}>
                        <button
                            onClick={() => window.location.reload()}
                            className={styles.retryBtn}
                        >
                            Try Again
                        </button>
                        <a href="/pricing" className={styles.backLink}>
                            Back to Pricing
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default function CheckoutRedirectPage() {
    return (
        <Suspense
            fallback={
                <div className={styles.page}>
                    <div className={styles.container}>
                        <div className={styles.spinner}></div>
                        <h1 className={styles.title}>Loading...</h1>
                    </div>
                </div>
            }
        >
            <CheckoutRedirectInner />
        </Suspense>
    );
}
