/**
 * ShowTheRate - Cookie Consent Management
 * GDPR/CCPA Compliant Cookie Consent System
 */

// Cookie consent keys
export const COOKIE_KEYS = {
  CONSENT_STATUS: 'cookie_consent_status',
  CONSENT_VERSION: 'cookie_consent_version',
  CONSENT_DATE: 'cookie_consent_date',
  CONSENT_REGION: 'cookie_consent_region',
  NECESSARY_COOKIES: 'necessary_cookies',
  ANALYTICS_COOKIES: 'analytics_cookies',
  MARKETING_COOKIES: 'marketing_cookies',
  FUNCTIONAL_COOKIES: 'functional_cookies',
};

// Cookie consent status
export const CONSENT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CUSTOM: 'custom',
  EXPIRED: 'expired',
};

// Cookie categories
export const COOKIE_CATEGORIES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  FUNCTIONAL: 'functional',
};

// Current consent version (increment when policies change)
export const CONSENT_VERSION = '1.0.0';

// Default consent preferences
export const DEFAULT_CONSENT = {
  necessary: true, // Always true, cannot be disabled
  analytics: false,
  marketing: false,
  functional: false,
};

// Regions requiring consent
export const CONSENT_REGIONS = {
  GDPR: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK', 'IS', 'LI', 'NO', 'CH'],
  CCPA: ['US-CA'], // California
  LGPD: ['BR'], // Brazil
  PIPEDA: ['CA'], // Canada
  PDPA: ['SG'], // Singapore
  POPIA: ['ZA'], // South Africa
};

/**
 * Detect user region based on IP, browser settings, or geolocation
 */
export function detectUserRegion() {
  // Try to get from localStorage first
  const cached = localStorage.getItem(COOKIE_KEYS.CONSENT_REGION);
  if (cached) return cached;

  try {
    // Try to detect from navigator.language
    const language = navigator.language.toUpperCase();
    const parts = language.split('-');
    const country = parts[1] || parts[0];

    // Handle different country code formats
    let detectedCountry = country;

    // Handle special cases
    if (country === 'EN') detectedCountry = 'GB'; // English -> UK
    if (country === 'EL') detectedCountry = 'GR'; // Greek -> Greece

    // Check all regions
    if (CONSENT_REGIONS.GDPR.includes(detectedCountry)) return 'GDPR';
    if (CONSENT_REGIONS.CCPA.includes(`US-${detectedCountry}`)) return 'CCPA';
    if (CONSENT_REGIONS.LGPD.includes(detectedCountry)) return 'LGPD';
    if (CONSENT_REGIONS.PIPEDA.includes(detectedCountry)) return 'PIPEDA';
    if (CONSENT_REGIONS.PDPA.includes(detectedCountry)) return 'PDPA';
    if (CONSENT_REGIONS.POPIA.includes(detectedCountry)) return 'POPIA';

    // Try geolocation API as fallback (if available and user consents)
    if ('geolocation' in navigator) {
      // Note: In production, you might want to use a geolocation service
      // For now, we'll rely on language detection
    }

  } catch (error) {
    console.warn('Error detecting user region:', error);
  }

  return 'OTHER';
}

/**
 * Check if user needs to give consent
 * SEO优化：无论地区都显示Cookie横幅
 */
export function requiresConsent() {
  // 无论用户在什么地区都要求Cookie同意
  return true;
}

/**
 * Get current consent status
 */
export function getConsentStatus() {
  try {
    const status = localStorage.getItem(COOKIE_KEYS.CONSENT_STATUS);
    const version = localStorage.getItem(COOKIE_KEYS.CONSENT_VERSION);
    const date = localStorage.getItem(COOKIE_KEYS.CONSENT_DATE);

    // Check if consent is expired (1 year)
    if (date) {
      const consentDate = new Date(date);
      const now = new Date();
      const daysSinceConsent = (now - consentDate) / (1000 * 60 * 60 * 24);

      if (daysSinceConsent > 365) {
        return CONSENT_STATUS.EXPIRED;
      }
    }

    // Check version compatibility
    if (version !== CONSENT_VERSION) {
      return CONSENT_STATUS.EXPIRED;
    }

    return status || CONSENT_STATUS.PENDING;
  } catch (error) {
    console.warn('Error reading consent status:', error);
    return CONSENT_STATUS.PENDING;
  }
}

/**
 * Get detailed consent preferences
 */
export function getConsentPreferences() {
  try {
    const necessary = localStorage.getItem(COOKIE_KEYS.NECESSARY_COOKIES) === 'true';
    const analytics = localStorage.getItem(COOKIE_KEYS.ANALYTICS_COOKIES) === 'true';
    const marketing = localStorage.getItem(COOKIE_KEYS.MARKETING_COOKIES) === 'true';
    const functional = localStorage.getItem(COOKIE_KEYS.FUNCTIONAL_COOKIES) === 'true';

    return {
      necessary: necessary || true, // Necessary cookies are always true
      analytics,
      marketing,
      functional,
    };
  } catch (error) {
    console.warn('Error reading consent preferences:', error);
    return { ...DEFAULT_CONSENT };
  }
}

/**
 * Save consent preferences
 */
export function saveConsentPreferences(preferences, status = CONSENT_STATUS.CUSTOM) {
  try {
    const now = new Date().toISOString();

    localStorage.setItem(COOKIE_KEYS.CONSENT_STATUS, status);
    localStorage.setItem(COOKIE_KEYS.CONSENT_VERSION, CONSENT_VERSION);
    localStorage.setItem(COOKIE_KEYS.CONSENT_DATE, now);
    localStorage.setItem(COOKIE_KEYS.CONSENT_REGION, detectUserRegion());

    // Save individual preferences
    Object.entries(preferences).forEach(([key, value]) => {
      const storageKey = COOKIE_KEYS[`${key.toUpperCase()}_COOKIES`];
      if (storageKey) {
        localStorage.setItem(storageKey, value.toString());
      }
    });

    // Trigger consent change event
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: { preferences, status }
    }));

    return true;
  } catch (error) {
    console.error('Error saving consent preferences:', error);
    return false;
  }
}

/**
 * Accept all cookies
 */
export function acceptAllCookies() {
  const preferences = {
    necessary: true,
    analytics: true,
    marketing: true,
    functional: true,
  };

  return saveConsentPreferences(preferences, CONSENT_STATUS.ACCEPTED);
}

/**
 * Reject all non-necessary cookies
 */
export function rejectAllCookies() {
  const preferences = {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  };

  return saveConsentPreferences(preferences, CONSENT_STATUS.REJECTED);
}

/**
 * Check if a specific cookie category is allowed
 */
export function isCookieCategoryAllowed(category) {
  const preferences = getConsentPreferences();
  return preferences[category] === true;
}

/**
 * Initialize cookie consent system (SEO optimized)
 */
export function initializeCookieConsent() {
  // SEO优化：不在服务端和爬虫环境下执行
  if (typeof window === 'undefined') return { region: 'OTHER', status: CONSENT_STATUS.PENDING, preferences: DEFAULT_CONSENT };

  try {
    const region = detectUserRegion();
    const status = getConsentStatus();
    const preferences = getConsentPreferences();

    // Cookie consent initialized

    return { region, status, preferences };
  } catch (error) {
    // SEO优化：静默失败，不影响页面渲染
    console.warn('Cookie consent initialization failed:', error);
    return { region: 'OTHER', status: CONSENT_STATUS.PENDING, preferences: DEFAULT_CONSENT };
  }
}

/**
 * Clear all consent data (for GDPR right to erasure)
 */
export function clearConsentData() {
  try {
    Object.values(COOKIE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Trigger consent cleared event
    window.dispatchEvent(new CustomEvent('cookieConsentCleared'));

    return true;
  } catch (error) {
    console.error('Error clearing consent data:', error);
    return false;
  }
}
