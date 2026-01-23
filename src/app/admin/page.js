'use client';

import { useEffect, useState } from 'react';
import styles from './admin.module.css';
import { signIn, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (!errorParam) return;
    if (errorParam === 'unauthorized') {
      setError('This account does not have admin access.');
      return;
    }
    setError('Google sign-in failed. Please try again.');
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError('');
    setStatus('loading');
    try {
      await signIn('google', { callbackUrl: '/admin/overview' });
    } catch (err) {
      setStatus('idle');
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin' });
  };

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginPanel}>
        <p className={styles.topMeta}>ShowTheRate Admin</p>
        <h1 className={styles.loginTitle}>Admin access</h1>
        <p className={styles.loginSubtitle}>
          Sign in with Google to continue. Access is granted by invitation.
        </p>
        <div className={styles.loginForm}>
          <button
            className={styles.buttonPrimary}
            type="button"
            onClick={handleGoogleSignIn}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Redirecting...' : 'Continue with Google'}
          </button>
          <p className={styles.loginHint}>
            Need access? Request approval from the admin owner.
          </p>
        </div>
        {error && <p className={`${styles.loginHint} ${styles.loginError}`}>{error}</p>}
        {error && (
          <button className={styles.buttonGhost} type="button" onClick={handleSignOut}>
            Sign out and try again
          </button>
        )}
      </div>
    </div>
  );
}
