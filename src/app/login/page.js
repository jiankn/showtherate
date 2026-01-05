'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LogoIcon, EmailIcon } from '../../components/Icons';
import styles from './page.module.css';

function LoginPageInner() {
    const searchParams = useSearchParams();
    const product = searchParams.get('product'); // 获取 product 参数

    // 如果有 product 参数，登录后跳转到 checkout 页面
    const defaultCallbackUrl = product
        ? `/checkout/redirect?product=${product}`
        : '/app';
    const callbackUrl = searchParams.get('callbackUrl') || defaultCallbackUrl;

    // If callbackUrl contains /app/new or has product param, assume it's a "Get Started" flow
    const isSignUpFlow = callbackUrl.includes('/app/new') || searchParams.get('mode') === 'signup' || !!product;
    // 是否是从定价页来的支付流程
    const isCheckoutFlow = !!product;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordLogin, setIsPasswordLogin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    // 根据产品类型显示不同提示
    const getProductName = (key) => {
        const names = {
            'STARTER_PASS': 'Starter Pass ($9.9)',
            'MONTHLY': 'Pro Monthly ($59/mo)',
            'YEARLY': 'Annual Pro ($588/yr)'
        };
        return names[key] || key;
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signIn('google', { callbackUrl });
        } catch (err) {
            setError('Failed to sign in with Google');
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        if (isPasswordLogin && !password) return;

        setIsLoading(true);
        setError('');

        try {
            if (isPasswordLogin) {
                // Password Login
                const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                    callbackUrl,
                });

                if (result?.error) {
                    setError('Invalid email or password');
                    setIsLoading(false);
                } else {
                    // 登录成功，跳转到 callbackUrl（如果有 product 会是 checkout 页面）
                    window.location.href = callbackUrl;
                }
            } else {
                // Magic Link Login
                const result = await signIn('email', {
                    email,
                    redirect: false,
                    callbackUrl,
                });

                if (result?.error) {
                    setError('Failed to send magic link');
                    setIsLoading(false);
                } else {
                    setEmailSent(true);
                    setIsLoading(false);
                }
            }
        } catch (err) {
            setError('Something went wrong');
            setIsLoading(false);
        }
    };

    // Text variants based on flow
    const title = isCheckoutFlow
        ? 'Complete your purchase'
        : (isSignUpFlow ? 'Get started for free' : 'Welcome back');
    const subtitle = isCheckoutFlow
        ? `Sign in to continue with ${getProductName(product)}`
        : (isSignUpFlow
            ? 'Join thousands of Loan Officers closing more deals'
            : 'Sign in to create and share mortgage comparisons');
    const googleBtnText = isSignUpFlow ? 'Sign up with Google' : 'Continue with Google';
    const submitBtnText = isLoading
        ? 'Processing...'
        : (isPasswordLogin
            ? (isSignUpFlow ? 'Create Account' : 'Sign In')
            : (isSignUpFlow ? 'Sign up with Email' : 'Continue with Email'));

    return (
        <div className={`${styles.page} ${isSignUpFlow ? styles.pageSignUp : ''}`}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <LogoIcon className={styles.logoIconSvg} />
                    <span className={styles.logoText}>ShowTheRate</span>
                </Link>

                {/* Card */}
                <div className={styles.card}>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.subtitle}>{subtitle}</p>

                    {/* 支付流程提示 */}
                    {isCheckoutFlow && (
                        <div className={styles.checkoutHint}>
                            🔒 You&apos;ll be redirected to secure payment after signing in
                        </div>
                    )}

                    {emailSent ? (
                        <div className={styles.emailSent}>
                            <EmailIcon className={styles.emailSentIconSvg} />
                            <h2>Check your email</h2>
                            <p>
                                We sent a sign-in link to <strong>{email}</strong>
                            </p>
                            <button
                                className={styles.linkButton}
                                onClick={() => setEmailSent(false)}
                            >
                                Use a different email
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Google Sign In */}
                            <button
                                className={styles.googleButton}
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                {googleBtnText}
                            </button>

                            {/* Divider */}
                            <div className={styles.divider}>
                                <span>or</span>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        Email address
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className={styles.input}
                                            required
                                            disabled={isLoading}
                                        />
                                    </label>

                                    {isPasswordLogin && (
                                        <label className={styles.label}>
                                            Password
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className={styles.input}
                                                required
                                                disabled={isLoading}
                                            />
                                        </label>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isLoading || !email || (isPasswordLogin && !password)}
                                >
                                    {submitBtnText}
                                </button>

                                <div className={styles.passwordToggle}>
                                    <button
                                        type="button"
                                        className={styles.toggleButton}
                                        onClick={() => setIsPasswordLogin(!isPasswordLogin)}
                                    >
                                        {isPasswordLogin
                                            ? 'Use magic link instead'
                                            : 'Use password instead'}
                                    </button>
                                </div>
                            </form>

                            {error && (
                                <div className={styles.error}>{error}</div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className={styles.footer}>
                    {isSignUpFlow ? 'Already have an account? ' : 'Don\'t have an account? '}
                    <Link href={isSignUpFlow ? '/login' : '/app/new'}>
                        {isSignUpFlow ? 'Sign in' : 'Get started'}
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className={styles.page}>
                    <div className={styles.container} />
                </div>
            }
        >
            <LoginPageInner />
        </Suspense>
    );
}
