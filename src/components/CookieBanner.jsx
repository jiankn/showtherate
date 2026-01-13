'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  initializeCookieConsent,
  getConsentStatus,
  acceptAllCookies,
  rejectAllCookies,
  requiresConsent,
  CONSENT_STATUS,
  detectUserRegion
} from '../lib/cookieConsent';
import styles from './CookieBanner.module.css';

export default function CookieBanner() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [region, setRegion] = useState('OTHER');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchBot, setIsSearchBot] = useState(false);

  // Listen for cookie settings modal trigger
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };

    window.addEventListener('openCookieSettings', handleOpenSettings);

    return () => {
      window.removeEventListener('openCookieSettings', handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    // SEO优化：立即初始化，不阻塞页面渲染
    initializeCookieConsent();

    // 检查是否为搜索引擎爬虫
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /bot|crawler|spider|googlebot|bingbot|yandexbot|duckduckbot/i.test(userAgent);
    setIsSearchBot(isBot);

    // 如果是搜索引擎爬虫，不显示Cookie横幅
    if (isBot) {
      return;
    }

    // Check if consent is needed and banner should be shown
    const consentStatus = getConsentStatus();
    const needsConsent = requiresConsent();
    const userRegion = detectUserRegion();

    setRegion(userRegion);

    // SEO优化：减少延迟，提高LCP
    if ((consentStatus === CONSENT_STATUS.PENDING || consentStatus === CONSENT_STATUS.EXPIRED) && needsConsent) {
      // 使用requestAnimationFrame替代setTimeout，提升性能
      requestAnimationFrame(() => {
        setTimeout(() => setIsVisible(true), 100);
      });
    }
  }, []);

  const handleAcceptAll = async () => {
    setIsLoading(true);
    const success = acceptAllCookies();

    if (success) {
      setIsVisible(false);
      // Initialize analytics and other services
      try {
        const { initializeAnalytics } = await import('../lib/analytics');
        initializeAnalytics();
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
      }
      window.dispatchEvent(new CustomEvent('cookiesAccepted'));
    } else {
      alert('Failed to save cookie preferences. Please try again.');
    }

    setIsLoading(false);
  };

  const handleRejectAll = async () => {
    setIsLoading(true);
    const success = rejectAllCookies();

    if (success) {
      setIsVisible(false);
      // Disable non-essential cookies
      window.dispatchEvent(new CustomEvent('cookiesRejected'));
    } else {
      alert('Failed to save cookie preferences. Please try again.');
    }

    setIsLoading(false);
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const handleSettingsSaved = () => {
    setShowSettings(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* SEO优化：noscript fallback */}
      <noscript>
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          color: '#1e293b',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          borderTop: '2px solid #2563eb',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000
        }}>
          This website uses cookies to enhance your experience.
          By continuing to use this site, you agree to our use of cookies.
          <a href="/privacy" style={{
            color: '#2563eb',
            marginLeft: '0.5rem',
            textDecoration: 'underline'
          }}>
            Learn more
          </a>
        </div>
      </noscript>

      {/* Cookie Banner */}
      <div className={`${styles.banner} ${styles.animateIn}`}>
        <div className={styles.content}>
          <div className={styles.text}>
            <h3 className={styles.title}>
              <span className={styles.icon}>🍪</span>
              {region === 'GDPR' && 'Cookie Preferences'}
              {region === 'CCPA' && 'Privacy Choices'}
              {(region === 'LGPD' || region === 'PIPEDA' || region === 'PDPA' || region === 'POPIA') && 'Privacy Notice'}
              {region === 'OTHER' && 'Cookie Preferences'}
            </h3>
            <p className={styles.description}>
              We use cookies and similar technologies to improve our services, analyze website usage, and personalize content.
              {region === 'GDPR' && ' We require your consent for non-essential cookies under GDPR.'}
              {region === 'CCPA' && ' You have the right to opt-out of the sale of your personal information under CCPA.'}
              {region === 'LGPD' && ' We process your data in accordance with Brazil\'s General Data Protection Law (LGPD).'}
              {region === 'PIPEDA' && ' We comply with Canada\'s Personal Information Protection and Electronic Documents Act (PIPEDA).'}
              {region === 'PDPA' && ' We adhere to Singapore\'s Personal Data Protection Act (PDPA).'}
              {region === 'POPIA' && ' We comply with South Africa\'s Protection of Personal Information Act (POPIA).'}
              {' '}
              <a href="/privacy" className={styles.link}>Learn more in our Privacy Policy</a>.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleCustomize}
              className={styles.customizeBtn}
              disabled={isLoading}
            >
              Customize
            </button>

            {region !== 'CCPA' && (
              <button
                onClick={handleRejectAll}
                className={styles.rejectBtn}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Reject All'}
              </button>
            )}

            <button
              onClick={handleAcceptAll}
              className={styles.acceptBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : region === 'CCPA' ? 'Accept' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      {showSettings && (
        <CookieSettings
          onClose={handleSettingsClose}
          onSave={handleSettingsSaved}
          region={region}
        />
      )}
    </>
  );
}

// Cookie Settings Component
function CookieSettings({ onClose, onSave, region }) {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePreferenceChange = (category, value) => {
    if (category === 'necessary') return; // Necessary cookies cannot be disabled

    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    const { saveConsentPreferences, CONSENT_STATUS } = await import('../lib/cookieConsent');
    const success = saveConsentPreferences(preferences, CONSENT_STATUS.CUSTOM);

    if (success) {
      onSave();

      // Initialize analytics based on new preferences
      try {
        const { initializeAnalytics } = await import('../lib/analytics');
        initializeAnalytics();
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
      }

      window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
        detail: { preferences, status: CONSENT_STATUS.CUSTOM }
      }));
    } else {
      alert('Failed to save cookie preferences. Please try again.');
    }

    setIsLoading(false);
  };

  const cookieCategories = [
    {
      key: 'necessary',
      title: 'Necessary Cookies',
      description: 'Essential cookies required for the website to function properly. These cannot be disabled.',
      required: true,
      examples: 'Authentication, security, basic functionality',
      services: ['ShowTheRate', 'Supabase', 'Vercel'],
      retention: 'Session / 30 days'
    },
    {
      key: 'analytics',
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website by collecting anonymous usage statistics.',
      required: false,
      examples: 'Page views, user journeys, performance metrics',
      services: ['Google Analytics', 'Vercel Analytics'],
      retention: '26 months'
    },
    {
      key: 'functional',
      title: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization features.',
      required: false,
      examples: 'Language preferences, theme settings, saved preferences',
      services: ['ShowTheRate'],
      retention: '1 year'
    },
    {
      key: 'marketing',
      title: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements and track campaign effectiveness across websites.',
      required: false,
      examples: 'Advertising pixels, retargeting, conversion tracking',
      services: ['Google Ads', 'Facebook Pixel', 'LinkedIn Insight'],
      retention: '13 months'
    }
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Cookie Settings</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>
            Manage your cookie preferences. You can change these settings at any time.
            {region === 'GDPR' && ' Under GDPR, we require your explicit consent for non-essential cookies.'}
            {region === 'CCPA' && ' Under CCPA, you have the right to opt-out of the sale of personal information.'}
            {region === 'LGPD' && ' Under LGPD, you have rights over your personal data processing.'}
            {region === 'PIPEDA' && ' Under PIPEDA, you have rights regarding your personal information.'}
            {region === 'PDPA' && ' Under PDPA, you have rights over your personal data.'}
            {region === 'POPIA' && ' Under POPIA, you have rights regarding your personal information.'}
            {region === 'OTHER' && ' We respect your privacy and give you control over your data.'}
          </p>

          <div className={styles.cookieCategories}>
            {cookieCategories.map((category) => (
              <div key={category.key} className={styles.category}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <h4 className={styles.categoryTitle}>
                      {category.title}
                      {category.required && <span className={styles.requiredBadge}>Required</span>}
                    </h4>
                    <p className={styles.categoryDescription}>{category.description}</p>

                    <div className={styles.categoryDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Examples:</span>
                        <span className={styles.detailValue}>{category.examples}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Services:</span>
                        <span className={styles.detailValue}>{category.services.join(', ')}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Retention:</span>
                        <span className={styles.detailValue}>{category.retention}</span>
                      </div>
                    </div>
                  </div>

                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={preferences[category.key]}
                      disabled={category.required}
                      onChange={(e) => handlePreferenceChange(category.key, e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.privacyLinks}>
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            {region === 'GDPR' && (
              <>
                <span>•</span>
                <a href="/data-rights" target="_blank" rel="noopener noreferrer">Data Rights</a>
              </>
            )}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveBtn} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
