'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import ScrollProgress from '../components/ScrollProgress';
import {
  LogoIcon, RocketIcon, LightningIcon, LinkIcon, RobotIcon,
  ChartIcon, HouseIcon, PhoneIcon, MoneyIcon, CalculatorIcon, CheckIcon
} from '../components/Icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FAQ from '../components/FAQ';
import { useToast } from '../components/GlobalToast';
import styles from './page.module.css';

const formatNumberInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};


// ===== QUICK COMPARE COMPONENT =====
function QuickCompare() {
  const [homePrice, setHomePrice] = useState(500000);

  // Calculate mortgage for two scenarios
  const calculatePayment = (price, rate, downPct = 20, term = 30) => {
    const loanAmount = price * (1 - downPct / 100);
    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const monthlyTax = (price * 0.012) / 12;
    const monthlyInsurance = (price * 0.004) / 12;
    return Math.round(monthlyPayment + monthlyTax + monthlyInsurance);
  };

  const optionA = calculatePayment(homePrice, 6.5);
  const optionB = calculatePayment(homePrice, 5.875);
  const savings = optionA - optionB;

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className={styles.quickCompare}>
      <div className={styles.quickCompareTitle}>
        <LightningIcon className={styles.iconSm} /> Quick Compare
      </div>

      <div className={styles.quickCompareInput}>
        <label>
          <HouseIcon className={styles.iconSm} /> Home Price
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.inputIcon}>$</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberInput(homePrice)}
            onChange={(e) => setHomePrice(Number(e.target.value.replace(/,/g, '')) || 0)}
          />
        </div>
      </div>

      <div className={styles.comparisonCardsWrapper}>
        <div className={styles.comparisonCards}>
          <div className={`${styles.optionCard} ${styles.optionCardA}`}>
            <div className={`${styles.optionLabel} ${styles.optionLabelA}`}>Option A</div>
            <div className={styles.optionAmount}>${formatPrice(optionA)}</div>
            <div className={styles.optionPeriod}>/month</div>
            <div className={styles.optionRate}>6.5% APR</div>
          </div>
          <div className={`${styles.optionCard} ${styles.optionCardB}`}>
            <div className={`${styles.optionLabel} ${styles.optionLabelB}`}>Option B</div>
            <div className={styles.optionAmount}>${formatPrice(optionB)}</div>
            <div className={styles.optionPeriod}>/month</div>
            <div className={styles.optionRate}>5.875% APR</div>
          </div>
        </div>
        <div className={styles.vsIndicator}>VS</div>
      </div>

      <div className={styles.savingsBadge}>
        <MoneyIcon className={styles.iconSm} /> Save ${formatPrice(savings)}/month with Option B
      </div>

      <a href="/app/new" className={styles.quickCompareBtn}>
        Create Full Comparison
        <span>→</span>
      </a>
    </div>
  );
}

// ===== HERO SECTION =====
function HeroSection() {
  return (
    <section className={styles.hero}>
      {/* Animated background */}
      <div className={styles.heroBackground}>
        <div className={`${styles.heroOrb} ${styles.heroOrb1}`}></div>
        <div className={`${styles.heroOrb} ${styles.heroOrb2}`}></div>
        <div className={`${styles.heroOrb} ${styles.heroOrb3}`}></div>
        <div className={`${styles.heroOrb} ${styles.heroOrb4}`}></div>
      </div>
      <div className={styles.heroMesh}></div>

      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badge}>
              <RocketIcon className={styles.badgeIcon} /> For Loan Officers
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Generate Mortgage Comparisons in
            <span className={styles.heroHighlight}> 60 Seconds</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Create professional comparison reports, share instantly via link,
            and close more deals with AI-powered scripts.
          </p>

          <div className={styles.heroActions}>
            <a href="/app/new" className={`btn btn-lg ${styles.btnPrimary}`}>
              Start Free Demo
              <span>→</span>
            </a>
            <a href="#demo" className={`btn btn-lg ${styles.btnSecondary}`}>
              See How It Works
            </a>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} number`}>60s</span>
              <span className={styles.statLabel}>To Generate</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} number`}>1-Click</span>
              <span className={styles.statLabel}>Share Link</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} number`}>AI</span>
              <span className={styles.statLabel}>Closing Scripts</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <QuickCompare />
        </div>
      </div>
    </section>
  );
}

// ===== FEATURES SECTION =====
function FeaturesSection() {
  const features = [
    {
      icon: <LightningIcon className={styles.featureIconSvg} />,
      title: '60-Second Generation',
      description: 'Input loan details and generate professional comparison reports instantly. Perfect for Open House scenarios.'
    },
    {
      icon: <LinkIcon className={styles.featureIconSvg} />,
      title: 'One-Click Share Links',
      description: 'Generate shareable links that clients can open without login. Works on any device, any platform.'
    },
    {
      icon: <RobotIcon className={styles.featureIconSvg} />,
      title: 'AI Closing Scripts',
      description: 'Get AI-generated talking points and recommendations tailored to each comparison scenario.'
    },
    {
      icon: <ChartIcon className={styles.featureIconSvg} />,
      title: 'Visual Comparisons',
      description: 'Side-by-side scenario cards with clear breakdowns. Clients understand the difference at a glance.'
    },
    {
      icon: <HouseIcon className={styles.featureIconSvg} />,
      title: 'Auto Property Tax',
      description: 'Fetch property tax data automatically. Just enter the address and we handle the rest.'
    },
    {
      icon: <PhoneIcon className={styles.featureIconSvg} />,
      title: 'Mobile-First Design',
      description: 'Built for the field. Works flawlessly on your phone at Open Houses and client meetings.'
    }
  ];

  return (
    <section id="features" className={styles.features}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Close Deals Faster</h2>
          <p className="section-subtitle">
            ShowTheRate puts professional mortgage presentations in your pocket
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FREE TOOLS SECTION =====
function FreeToolsSection() {
  const tools = [
    {
      icon: '🧮',
      title: '2-1 Buydown Calculator',
      description: 'Calculate temporary rate reduction costs and monthly savings',
      href: '/calculator/2-1-buydown-calculator',
      hot: true,
    },
    {
      icon: '📊',
      title: 'Points Break-Even',
      description: 'See how long until discount points pay for themselves',
      href: '/calculator/discount-points-break-even',
      hot: true,
    },
    {
      icon: '💰',
      title: 'Cash to Close',
      description: 'Estimate total cash needed including down payment and closing costs',
      href: '/calculator/cash-to-close-calculator',
    },
    {
      icon: '⚖️',
      title: 'Buydown vs Points',
      description: 'Compare temporary buydown vs permanent rate reduction',
      href: '/compare/temporary-buydown-vs-points',
    },
    {
      icon: '🔒',
      title: 'Lock vs Float',
      description: 'Decide whether to lock your rate now or wait',
      href: '/compare/lock-vs-float',
    },
    {
      icon: '📋',
      title: 'Closing Costs Worksheet',
      description: 'Detailed breakdown of all closing costs',
      href: '/calculator/closing-costs-worksheet',
    },
  ];

  return (
    <section className={styles.freeTools}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Free Mortgage Calculators</h2>
          <p className="section-subtitle">
            Help your clients understand their options with these free tools
          </p>
        </div>

        <div className={styles.toolsGrid}>
          {tools.map((tool, index) => (
            <a key={index} href={tool.href} className={styles.toolCard}>
              <div className={styles.toolIcon}>{tool.icon}</div>
              <div className={styles.toolContent}>
                <h3 className={styles.toolTitle}>
                  {tool.title}
                  {tool.hot && <span className={styles.toolHot}>HOT</span>}
                </h3>
                <p className={styles.toolDescription}>{tool.description}</p>
              </div>
              <svg className={styles.toolArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>

        <div className={styles.toolsCta}>
          <a href="/calculator" className="btn btn-secondary">
            View All Calculators →
          </a>
        </div>

        {/* Compare Section */}
        <div className={styles.compareSection}>
          <h3 className={styles.subSectionTitle}>Compare Your Options</h3>
          <div className={styles.compareGrid}>
            <a href="/compare/fha-vs-conventional" className={styles.compareCard}>
              <span className={styles.compareIcon}>🏠</span>
              <div className={styles.compareContent}>
                <h4>FHA vs Conventional</h4>
                <p>Compare down payment, MI, and requirements</p>
              </div>
            </a>
            <a href="/compare/temporary-buydown-vs-points" className={styles.compareCard}>
              <span className={styles.compareIcon}>⚖️</span>
              <div className={styles.compareContent}>
                <h4>Buydown vs Points</h4>
                <p>Temporary savings vs permanent reduction</p>
              </div>
            </a>
            <a href="/compare/15-year-vs-30-year" className={styles.compareCard}>
              <span className={styles.compareIcon}>📅</span>
              <div className={styles.compareContent}>
                <h4>15 vs 30 Year</h4>
                <p>Monthly payment vs total interest</p>
              </div>
            </a>
            <a href="/compare/lock-vs-float" className={styles.compareCard}>
              <span className={styles.compareIcon}>🔒</span>
              <div className={styles.compareContent}>
                <h4>Lock vs Float</h4>
                <p>Lock now or wait for better rates?</p>
              </div>
            </a>
          </div>
          <div className={styles.toolsCta}>
            <a href="/compare" className="btn">
              View All Comparisons
            </a>
          </div>
        </div>

        {/* Blog Teaser */}
        <div className={styles.blogTeaser}>
          <h3 className={styles.subSectionTitle}>Latest Insights</h3>
          <p className={styles.blogTeaserText}>
            Scripts, tutorials, and strategies to help you close more deals.
          </p>
          <a href="/blog" className="btn btn-secondary">
            Read News & Insight →
          </a>
        </div>
      </div>
    </section>
  );
}


// ===== TRUST BADGES SECTION =====
function TrustMockup({ className }) {
  return (
    <div className={className} aria-hidden="true">
      <div className={styles.mockupTopBar}>
        <div className={styles.mockupBrand}>
          <span className={styles.mockupDot} />
          <span className={styles.mockupBrandText}>ShowTheRate</span>
        </div>
        <span className={styles.mockupPill}>Share link</span>
      </div>

      <div className={styles.mockupGrid}>
        <div className={styles.mockupCard}>
          <div className={styles.mockupCardHeader}>
            <span className={styles.mockupBadgeA}>Option A</span>
            <span className={styles.mockupTiny}>30y Fixed</span>
          </div>
          <div className={styles.mockupAmount}>$2,341</div>
          <div className={styles.mockupRows}>
            <div className={styles.mockupRow}>
              <span>P&amp;I</span>
              <span>$1,892</span>
            </div>
            <div className={styles.mockupRow}>
              <span>Tax</span>
              <span>$302</span>
            </div>
            <div className={styles.mockupRow}>
              <span>Ins</span>
              <span>$147</span>
            </div>
          </div>
        </div>

        <div className={styles.mockupCard}>
          <div className={styles.mockupCardHeader}>
            <span className={styles.mockupBadgeB}>Option B</span>
            <span className={styles.mockupTiny}>30y Fixed</span>
          </div>
          <div className={styles.mockupAmount}>$2,214</div>
          <div className={styles.mockupRows}>
            <div className={styles.mockupRow}>
              <span>P&amp;I</span>
              <span>$1,786</span>
            </div>
            <div className={styles.mockupRow}>
              <span>Tax</span>
              <span>$302</span>
            </div>
            <div className={styles.mockupRow}>
              <span>Ins</span>
              <span>$126</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mockupFooter}>
        <div className={styles.mockupAvatars}>
          <span className={styles.mockupAvatar} />
          <span className={styles.mockupAvatar} />
          <span className={styles.mockupAvatar} />
        </div>
        <div className={styles.mockupFooterText}>Mobile-ready preview</div>
      </div>
    </div>
  );
}

function TrustBadges() {
  const stats = [
    { value: '60s', label: 'Average Build Time' },
    { value: '4+', label: 'Scenarios Per Link' },
    { value: '100%', label: 'Mobile Friendly' },
    { value: '$0', label: 'To Try Demo' }
  ];

  const highlights = [
    'Bank-level security practices',
    'No login required for clients',
    'Works on any device',
    'AI closing scripts included'
  ];

  const assurances = [
    { title: 'NMLS Compliant', icon: '🏦' },
    { title: '256-bit SSL', icon: '🔐' },
    { title: 'Cloud Powered', icon: '☁️' },
    { title: 'US-Based', icon: '🇺🇸' }
  ];

  return (
    <section className={styles.trustSection}>
      <div className="container">
        <div className={styles.trustGrid}>
          <div className={styles.trustCopy}>
            <p className={styles.trustLabel}>Trusted by Loan Officers Nationwide</p>
            <h2 className={styles.trustTitle}>Make options obvious in minutes.</h2>
            <p className={styles.trustSubtitle}>
              Build clean, client-friendly comparisons that look great on mobile — perfect for open houses, calls, and follow-ups.
            </p>

            <div className={styles.trustBadges}>
              {highlights.map((text) => (
                <span key={text} className={styles.trustBadge}>
                  <CheckIcon className={styles.trustBadgeIcon} />
                  {text}
                </span>
              ))}
            </div>

            <div className={styles.partnerSection}>
              <p className={styles.partnerLabel}>Built for modern mortgage professionals</p>
              <div className={styles.partnerLogos}>
                {assurances.map((item) => (
                  <div key={item.title} className={styles.partnerLogo}>
                    <span className={styles.partnerIcon} aria-hidden="true">{item.icon}</span>
                    <span className={styles.partnerName}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.trustMedia}>
            <figure className={styles.trustVisual}>
              <TrustMockup className={styles.trustMockup} />

              <dl className={styles.trustStats}>
                {stats.map((stat) => (
                  <div key={stat.label} className={styles.trustStat}>
                    <dt className={styles.trustStatLabel}>{stat.label}</dt>
                    <dd className={styles.trustStatValue}>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== DEMO SECTION =====
function DemoSection() {
  const [homePrice, setHomePrice] = useState(300000);
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [term, setTerm] = useState(30);

  // Calculate mortgage
  const loanAmount = homePrice * (1 - downPayment / 100);
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = term * 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  // Estimate taxes and insurance
  const monthlyTax = (homePrice * 0.012) / 12;
  const monthlyInsurance = (homePrice * 0.004) / 12;
  const totalMonthly = monthlyPayment + monthlyTax + monthlyInsurance;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <section id="demo" className={styles.demo}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Build Your Scenario</h2>
          <p className="section-subtitle">
            Adjust every parameter to see real numbers
          </p>
        </div>

        <div className={styles.demoContainer}>
          <div className={styles.demoInputs}>
            <h3 className={styles.demoInputsTitle}>
              <CalculatorIcon className={styles.calculatorIcon} /> Loan Details
            </h3>

            <div className="input-group">
              <label className="input-label">Home Price</label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input input-number input-with-prefix"
                  value={formatNumberInput(homePrice)}
                  onChange={(e) => setHomePrice(Number(e.target.value.replace(/,/g, '')))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Down Payment</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  className="input input-number input-with-suffix"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                />
                <span className="input-suffix">%</span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Interest Rate (APR)</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  step="0.125"
                  className="input input-number input-with-suffix"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
                <span className="input-suffix">%</span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Loan Term</label>
              <div className={styles.termButtons}>
                {[15, 20, 30].map((t) => (
                  <button
                    key={t}
                    className={`btn ${term === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setTerm(t)}
                  >
                    {t} years
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-full" style={{ marginTop: 'var(--space-lg)' }}>
              Generate Comparison →
            </button>

            <p className={styles.demoNote}>
              🔒 Full features require <a href="#pricing">Starter Pass ($9.9)</a>
            </p>
          </div>

          <div className={styles.demoPreview}>
            <div className={styles.previewCard}>
              <div className="badge badge-scenario-a">Your Scenario</div>

              <div className={styles.previewAmount}>
                <span className="number-display">{formatCurrency(totalMonthly)}</span>
                <span className={styles.previewAmountLabel}>/month (PITI)</span>
              </div>

              <div className={styles.previewBreakdown}>
                <div className={styles.breakdownItem}>
                  <span>Principal & Interest</span>
                  <span className="number">{formatCurrency(monthlyPayment)}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span>Property Tax</span>
                  <span className="number">{formatCurrency(monthlyTax)}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span>Insurance</span>
                  <span className="number">{formatCurrency(monthlyInsurance)}</span>
                </div>
              </div>

              <div className={styles.previewBar}>
                <div className={styles.barSegment} style={{ width: `${(monthlyPayment / totalMonthly) * 100}%`, background: 'var(--color-scenario-a)' }}></div>
                <div className={styles.barSegment} style={{ width: `${(monthlyTax / totalMonthly) * 100}%`, background: 'var(--color-scenario-b)' }}></div>
                <div className={styles.barSegment} style={{ width: `${(monthlyInsurance / totalMonthly) * 100}%`, background: 'var(--color-scenario-c)' }}></div>
              </div>

              <div className={styles.previewDetails}>
                <div>
                  <span className={styles.detailLabel}>Loan Amount</span>
                  <span className="number">{formatCurrency(loanAmount)}</span>
                </div>
                <div>
                  <span className={styles.detailLabel}>Cash to Close</span>
                  <span className="number">{formatCurrency(homePrice * downPayment / 100 * 1.03)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== PRICING SECTION =====
function PricingSection() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loadingProduct, setLoadingProduct] = useState(null);
  const [billingTab, setBillingTab] = useState('individual');

  const handleCheckout = async (productKey) => {
    // 如果用户未登录，跳转到登录页并携带 product 参数
    if (status !== 'authenticated') {
      window.location.href = `/login?product=${productKey}&mode=signup`;
      return;
    }

    // 已登录，直接调用 Stripe Checkout
    setLoadingProduct(productKey);
    try {
      toast.info('Redirecting to checkout...');

      const response = await fetch(`/api/billing/checkout?product=${productKey}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to start checkout' }));
        throw new Error(error.error || 'Failed to start checkout');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setLoadingProduct(null);
    }
  };

  const handleSignUp = () => {
    window.location.href = '/login?mode=signup';
  };

  const handleContactSales = () => {
    window.location.href = 'mailto:enterprise@showtherate.com?subject=Enterprise%20Plan%20Inquiry';
  };

  return (
    <section id="pricing" className={styles.pricing}>
      <div className="container">
        <div className={`section-header ${styles.sectionHeader}`}>
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">
            Start with a low-risk trial, upgrade when you&apos;re ready
          </p>
        </div>

        {/* Billing Toggle */}
        <div className={styles.billingToggleWrapper}>
          <div className={styles.billingToggle}>
            <button
              className={`${styles.billingToggleBtn} ${billingTab === 'individual' ? styles.billingToggleActive : ''}`}
              onClick={() => setBillingTab('individual')}
            >
              Individual
            </button>
            <button
              className={`${styles.billingToggleBtn} ${billingTab === 'team' ? styles.billingToggleActive : ''}`}
              onClick={() => setBillingTab('team')}
            >
              Team & Annual
            </button>
          </div>
          <span className={styles.savingsTip}>
            💰 Save 20% with annual
          </span>
        </div>

        {billingTab === 'individual' ? (
          /* Individual Plans */
          <div className={styles.pricingGrid}>
            {/* Free Demo */}
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingName}>Free Demo</h3>
              <div className={styles.pricingPrice}>
                <span className={`number-display ${styles.numberDisplay}`}>$0</span>
              </div>
              <p className={styles.pricingDescription}>Try before you buy</p>

              <ul className={styles.pricingFeatures}>
                <li>✓ Local calculations only</li>
                <li>✓ See how it works</li>
                <li className={styles.disabled}>✗ No share links</li>
                <li className={styles.disabled}>✗ No AI features</li>
                <li className={styles.disabled}>✗ No saving</li>
              </ul>

              <button
                onClick={handleSignUp}
                className={`btn btn-full ${styles.btnSecondary}`}
              >
                Try Demo
              </button>
            </div>

            {/* Starter Pass */}
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingName}>Starter Pass</h3>
              <div className={styles.pricingPrice}>
                <span className={`number-display ${styles.numberDisplay}`}>$9.9</span>
                <span className={styles.pricingPeriod}> / 7 days</span>
              </div>
              <p className={styles.pricingDescription}>Perfect for trying the full experience</p>

              <ul className={styles.pricingFeatures}>
                <li>✓ 5 Share Links</li>
                <li>✓ 10 Property Tax Lookups</li>
                <li>✓ 30 AI Generations</li>
                <li>✓ Full comparison features</li>
                <li>✓ $9.9 credit on upgrade</li>
              </ul>

              <button
                onClick={() => handleCheckout('STARTER_PASS')}
                disabled={loadingProduct === 'STARTER_PASS'}
                className={`btn btn-full ${styles.btnSecondary}`}
              >
                {loadingProduct === 'STARTER_PASS' ? 'Processing...' : 'Get Starter Pass'}
              </button>
            </div>

            {/* Pro Monthly */}
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <div className={styles.pricingBadge}>
                <span className={styles.badge}>✨ Most Popular</span>
              </div>
              <h3 className={styles.pricingName}>Pro Monthly</h3>
              <div className={styles.pricingPrice}>
                <span className={`number-display ${styles.numberDisplay}`}>$99</span>
                <span className={styles.pricingPeriod}> / month</span>
              </div>
              <p className={styles.pricingDescription}>For serious loan officers</p>

              <ul className={styles.pricingFeatures}>
                <li>✓ Unlimited Share Links</li>
                <li>✓ 150 Property Lookups/mo</li>
                <li>✓ 300 AI Generations/mo</li>
                <li>✓ Priority support</li>
                <li>✓ PWA for mobile</li>
              </ul>

              <button
                onClick={() => handleCheckout('MONTHLY')}
                disabled={loadingProduct === 'MONTHLY'}
                className={`btn btn-primary btn-full ${styles.btnPrimary}`}
              >
                {loadingProduct === 'MONTHLY' ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          </div>
        ) : (
          /* Team & Annual Plans */
          <div className={`${styles.pricingGrid} ${styles.pricingGridCentered}`}>
            {/* Annual Pro */}
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <div className={styles.pricingBadge}>
                <span className={styles.badge}>💰 Best Value</span>
              </div>
              <h3 className={styles.pricingName}>Annual Pro</h3>
              <div className={styles.pricingPrice}>
                <span className={`number-display ${styles.numberDisplay}`}>$950</span>
                <span className={styles.pricingPeriod}> / year</span>
              </div>
              <p className={styles.pricingDescription}>Save $238 vs monthly</p>

              <ul className={styles.pricingFeatures}>
                <li><span className={styles.checkIcon}>✓</span> <strong>Save $238/year</strong></li>
                <li><span className={styles.checkIcon}>✓</span> Unlimited Share Links</li>
                <li><span className={styles.checkIcon}>✓</span> 200 Property Lookups/mo</li>
                <li><span className={styles.checkIcon}>✓</span> 350 AI Generations/mo</li>
                <li><span className={styles.checkIcon}>✓</span> Priority support</li>
              </ul>

              <button
                onClick={() => handleCheckout('YEARLY')}
                disabled={loadingProduct === 'YEARLY'}
                className={`btn btn-primary btn-full ${styles.btnPrimary}`}
              >
                {loadingProduct === 'YEARLY' ? 'Processing...' : 'Subscribe Yearly'}
              </button>
            </div>

            {/* Enterprise */}
            <div className={`${styles.pricingCard} ${styles.pricingCardEnterprise}`}>
              <div className={styles.pricingBadge}>
                <span className={styles.badge}>🏢 Teams</span>
              </div>
              <h3 className={styles.pricingName}>Enterprise</h3>
              <div className={styles.pricingPrice}>
                <span className={`number-display ${styles.numberDisplay}`}>Custom</span>
              </div>
              <p className={styles.pricingDescription}>For teams & brokerages</p>

              <ul className={styles.pricingFeatures}>
                <li><span className={styles.checkIcon}>✓</span> <strong>Unlimited</strong> users</li>
                <li><span className={styles.checkIcon}>✓</span> Team management dashboard</li>
                <li><span className={styles.checkIcon}>✓</span> White-label branding</li>
                <li><span className={styles.checkIcon}>✓</span> Custom integrations (CRM, LOS)</li>
                <li><span className={styles.checkIcon}>✓</span> Dedicated account manager</li>
                <li><span className={styles.checkIcon}>✓</span> Priority support & SLA</li>
              </ul>

              <button
                onClick={handleContactSales}
                className={`btn btn-full ${styles.btnEnterprise}`}
              >
                Contact Sales
              </button>
            </div>
          </div>
        )}

        {/* Link to full pricing page */}
        <div className={styles.pricingPageLink}>
          <a href="/pricing">View Full Pricing & FAQ →</a>
        </div>
      </div>
    </section>
  );
}

// ===== TESTIMONIALS SECTION =====
// Trusted Partners Logo Wall Component
function TrustedPartners() {
  // Use local PNG logos (Google Favicon) for faster loading
  const partners = [
    // Major Banks
    { name: 'Wells Fargo', src: '/images/logos/wellsfargo.png' },
    { name: 'Chase', src: '/images/logos/chase.png' },
    { name: 'Bank of America', src: '/images/logos/bankofamerica.png' },
    { name: 'Citibank', src: '/images/logos/citi.png' },
    // Mortgage Companies
    { name: 'Rocket Mortgage', src: '/images/logos/rocketmortgage.png' },
    { name: 'United Wholesale Mortgage', src: '/images/logos/uwm.png' },
    { name: 'loanDepot', src: '/images/logos/loandepot.png' },
    { name: 'Fairway Independent', src: '/images/logos/fairway.svg' },
    { name: 'Guild Mortgage', src: '/images/logos/guildmortgage.png' },
    { name: 'CrossCountry Mortgage', src: '/images/logos/crosscountry.png' },
    // Other Financial
    { name: 'Movement Mortgage', src: '/images/logos/movement.png' },
    { name: 'PrimeLending', src: '/images/logos/primelending.png' },
    { name: 'Caliber Home Loans', src: '/images/logos/caliber.png' },
    { name: 'Fannie Mae', src: '/images/logos/fanniemae.png' },
    { name: 'Freddie Mac', src: '/images/logos/freddiemac.png' },
    // Tech/Real Estate
    { name: 'Zillow', src: '/images/logos/zillow.png' },
    { name: 'Redfin', src: '/images/logos/redfin.png' },
    { name: 'Keller Williams', src: '/images/logos/kellerwilliams.png' },
    { name: 'RE/MAX', src: '/images/logos/remax.png' },
    { name: 'Compass', src: '/images/logos/compass.png' },
    { name: 'Coldwell Banker', src: '/images/logos/coldwellbanker.png' },
    { name: 'Century 21', src: '/images/logos/century21.png' },
    // More Mortgage
    { name: 'Guaranteed Rate', src: '/images/logos/guaranteedrate.png' },
    { name: 'Mr. Cooper', src: '/images/logos/mrcooper.png' }
  ];

  return (
    <div className={styles.trustedPartners}>
      <p className={styles.trustedLabel}>Our users work at</p>
      <div className={styles.logoWall}>
        <div className={styles.logoGrid}>
          {partners.map((partner, index) => (
            <div key={index} className={styles.partnerLogo} role="img" aria-label={partner.name}>
              <img
                src={partner.src}
                alt={partner.name}
                loading="lazy"
                width="140"
                height="40"
                style={{ maxWidth: '120px', height: 'auto' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "This tool has completely changed how I present options at Open Houses. Clients get it instantly.",
      author: "Sarah M.",
      role: "Loan Officer, CA",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      quote: "The AI scripts are surprisingly good. They help me explain complex scenarios in simple terms.",
      author: "Michael R.",
      role: "Mortgage Broker, TX",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "60 seconds is not an exaggeration. I've closed 3 more deals this month using ShowTheRate.",
      author: "Jennifer L.",
      role: "Senior LO, FL",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      quote: "Finally, a tool that makes mortgage comparisons visual and easy. My clients love the side-by-side view.",
      author: "David K.",
      role: "Mortgage Consultant, AZ",
      avatar: "https://randomuser.me/api/portraits/men/67.jpg"
    },
    {
      quote: "The property data integration saves me so much time. No more manual research for comps.",
      author: "Lisa T.",
      role: "Real Estate Agent, WA",
      avatar: "https://randomuser.me/api/portraits/women/29.jpg"
    },
    {
      quote: "Shareable links are a game-changer. Clients can review options anytime, anywhere.",
      author: "Robert S.",
      role: "Branch Manager, NV",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
      quote: "Perfect for virtual closings. The digital experience is seamless and professional.",
      author: "Maria G.",
      role: "Digital LO, CO",
      avatar: "https://randomuser.me/api/portraits/women/52.jpg"
    },
    {
      quote: "The 60-second promise is real. I've increased my conversion rate by 40% since using this.",
      author: "James P.",
      role: "Senior Mortgage Advisor, GA",
      avatar: "https://randomuser.me/api/portraits/men/81.jpg"
    }
  ];

  return (
    <section className={styles.testimonials}>
      <div className="container">
        <TrustedPartners />

        <div className="section-header">
          <h2 className="section-title">Loved by Loan Officers</h2>
          <p className="section-subtitle">Join hundreds of LOs closing more deals</p>
        </div>

        <TestimonialsCarousel items={testimonials} speedPxPerSec={40} />
      </div>
    </section>
  );
}

// ===== CTA SECTION =====
function CTASection() {
  const router = useRouter();
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      toast.info('Redirecting to checkout...');

      const response = await fetch('/api/billing/checkout?product=STARTER_PASS', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to start checkout' }));
        throw new Error(error.error || 'Failed to start checkout');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
    }
  };

  return (
    <section className={styles.cta}>
      <div className="container">
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Close More Deals?</h2>
          <p className={styles.ctaSubtitle}>
            Start generating professional comparisons in 60 seconds
          </p>
          <div className={styles.ctaActions}>
            <button onClick={handleCheckout} className={styles.ctaBtn}>
              ✨ Get Started for $9.9
            </button>
            <p className={styles.ctaNote}>No subscription required. Try for 7 days.</p>
          </div>
        </div>
      </div>
    </section>
  );
}



// ===== MAIN PAGE =====
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FreeToolsSection />
        <TrustBadges />
        <DemoSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQ />
        <CTASection />
      </main>
      <ScrollProgress />
      <Footer />
    </>
  );
}
