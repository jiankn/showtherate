/**
 * ShowTheRate - Analytics Integration
 * Cookie-compliant analytics and tracking management
 */

import { isCookieCategoryAllowed } from './cookieConsent';

// Analytics providers configuration
export const ANALYTICS_PROVIDERS = {
  GOOGLE_ANALYTICS: 'google-analytics',
  VERCEL_ANALYTICS: 'vercel-analytics',
  GOOGLE_ADS: 'google-ads',
  FACEBOOK_PIXEL: 'facebook-pixel',
  LINKEDIN_INSIGHT: 'linkedin-insight',
};

// Analytics initialization state
let analyticsInitialized = {
  [ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS]: false,
  [ANALYTICS_PROVIDERS.VERCEL_ANALYTICS]: false,
  [ANALYTICS_PROVIDERS.GOOGLE_ADS]: false,
  [ANALYTICS_PROVIDERS.FACEBOOK_PIXEL]: false,
  [ANALYTICS_PROVIDERS.LINKEDIN_INSIGHT]: false,
};

/**
 * Initialize Google Analytics
 */
function initGoogleAnalytics() {
  if (analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS]) return;

  // Google Analytics 4
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`;

  script.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_features: false,
    });

  analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS] = true;
  };

  document.head.appendChild(script);
}

/**
 * Initialize Vercel Analytics
 */
function initVercelAnalytics() {
  if (analyticsInitialized[ANALYTICS_PROVIDERS.VERCEL_ANALYTICS]) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://vitals.vercel-analytics.com/v1/vitals.js';

  document.head.appendChild(script);
  analyticsInitialized[ANALYTICS_PROVIDERS.VERCEL_ANALYTICS] = true;
}

/**
 * Initialize Google Ads conversion tracking
 */
function initGoogleAds() {
  if (analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ADS]) return;

  // Google Ads conversion tracking
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GADS_ID}`;

  script.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    if (!window.gtag) window.gtag = gtag;

    gtag('config', process.env.NEXT_PUBLIC_GADS_ID);
  analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ADS] = true;
  };

  document.head.appendChild(script);
}

/**
 * Initialize Facebook Pixel
 */
function initFacebookPixel() {
  if (analyticsInitialized[ANALYTICS_PROVIDERS.FACEBOOK_PIXEL]) return;

  // Facebook Pixel
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
    fbq('track', 'PageView');
  `;

  document.head.appendChild(script);
  analyticsInitialized[ANALYTICS_PROVIDERS.FACEBOOK_PIXEL] = true;
}

/**
 * Initialize LinkedIn Insight Tag
 */
function initLinkedInInsight() {
  if (analyticsInitialized[ANALYTICS_PROVIDERS.LINKEDIN_INSIGHT]) return;

  // LinkedIn Insight Tag
  const script = document.createElement('script');
  script.innerHTML = `
    _linkedin_partner_id = "${process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID}";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
  `;

  const script2 = document.createElement('script');
  script2.innerHTML = `
    (function(l) {
    if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.type = "text/javascript";b.async = true;
    b.src = "https://snap.licdn.com/li/lms/analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);})(window.lintrk);
  `;

  document.head.appendChild(script);
  document.head.appendChild(script2);
  analyticsInitialized[ANALYTICS_PROVIDERS.LINKEDIN_INSIGHT] = true;
}

/**
 * Initialize all allowed analytics based on cookie consent
 */
export function initializeAnalytics() {
  // Always initialize necessary analytics (if any)
  // Note: Vercel Analytics is considered necessary for performance monitoring

  if (isCookieCategoryAllowed('analytics')) {
    initGoogleAnalytics();
    initVercelAnalytics();
  }

  if (isCookieCategoryAllowed('marketing')) {
    initGoogleAds();
    initFacebookPixel();
    initLinkedInInsight();
  }
}

/**
 * Track page view event
 */
export function trackPageView(pagePath, pageTitle) {
  if (isCookieCategoryAllowed('analytics')) {
    if (window.gtag && analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS]) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }
  }

  // Track marketing events
  if (isCookieCategoryAllowed('marketing')) {
    if (window.fbq && analyticsInitialized[ANALYTICS_PROVIDERS.FACEBOOK_PIXEL]) {
      window.fbq('track', 'PageView');
    }

    // LinkedIn tracking would go here
  }
}

/**
 * Track custom event
 */
export function trackEvent(eventName, parameters = {}) {
  if (isCookieCategoryAllowed('analytics')) {
    if (window.gtag && analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS]) {
      window.gtag('event', eventName, parameters);
    }
  }

  if (isCookieCategoryAllowed('marketing')) {
    // Marketing event tracking
    if (window.fbq && analyticsInitialized[ANALYTICS_PROVIDERS.FACEBOOK_PIXEL]) {
      // Map common events to Facebook Pixel
      const fbEventMap = {
        'lead': 'Lead',
        'purchase': 'Purchase',
        'signup': 'CompleteRegistration',
        'contact': 'Contact',
      };

      const fbEvent = fbEventMap[eventName] || 'CustomEvent';
      window.fbq('track', fbEvent, parameters);
    }
  }
}

/**
 * Track conversion event (for Stripe payments, etc.)
 */
export function trackConversion(conversionType, value, currency = 'USD') {
  if (isCookieCategoryAllowed('analytics')) {
    if (window.gtag && analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS]) {
      window.gtag('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GA_CONVERSION_ID,
        value: value,
        currency: currency,
      });
    }
  }

  if (isCookieCategoryAllowed('marketing')) {
    if (window.fbq && analyticsInitialized[ANALYTICS_PROVIDERS.FACEBOOK_PIXEL]) {
      window.fbq('track', 'Purchase', { value, currency });
    }

    if (window.gtag && analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ADS]) {
      window.gtag('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GADS_CONVERSION_ID,
        value: value,
        currency: currency,
      });
    }
  }
}

/**
 * Update analytics consent (call when cookie preferences change)
 */
export function updateAnalyticsConsent() {
  // Disable analytics if consent is withdrawn
  if (!isCookieCategoryAllowed('analytics')) {
    // Note: We can't actually disable GA once loaded, but we can stop tracking
  }

  if (!isCookieCategoryAllowed('marketing')) {
    // Marketing consent withdrawn
  }

  // Re-initialize based on new consent
  initializeAnalytics();
}

/**
 * Check if analytics is ready for tracking
 */
export function isAnalyticsReady() {
  return analyticsInitialized[ANALYTICS_PROVIDERS.GOOGLE_ANALYTICS] ||
         analyticsInitialized[ANALYTICS_PROVIDERS.VERCEL_ANALYTICS];
}

/**
 * Get analytics status for debugging
 */
export function getAnalyticsStatus() {
  return {
    initialized: { ...analyticsInitialized },
    consent: {
      analytics: isCookieCategoryAllowed('analytics'),
      marketing: isCookieCategoryAllowed('marketing'),
    }
  };
}
