'use client';

import { Suspense, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../../components/GlobalToast';
import { useUser } from '../../../components/UserContext';
import ClientSearchInput from '../../../components/ClientSearchInput';
import {
    calculateScenario,
    compareScenarios,
    createEmptyScenario,
    validateScenarioInputs,
    formatCurrency,
    formatPercent,
    LOAN_TYPES
} from '@/lib/calculator';
import { CopyIcon, TrashIcon, PlusIcon, RocketIcon, CloseIcon } from '../../../components/Icons';
import styles from './page.module.css';

// Helper to format number with commas
const formatNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// ===== SCENARIO CARD COMPONENT =====
function ScenarioCard({ scenario, index, onUpdate, onDuplicate, onRemove, canRemove, forceShowAdvanced }) {
    const colors = ['a', 'b', 'c', 'd'];
    const colorClass = colors[index % colors.length];
    const labels = ['Option A', 'Option B', 'Option C', 'Option D'];

    const [showAdvanced, setShowAdvanced] = useState(forceShowAdvanced || false);

    // 当 forceShowAdvanced 变为 true 时自动展开 Advanced 区域
    useEffect(() => {
        if (forceShowAdvanced) {
            setShowAdvanced(true);
        }
    }, [forceShowAdvanced]);

    const handleInputChange = (field, value) => {
        onUpdate({
            ...scenario,
            inputs: {
                ...scenario.inputs,
                [field]: value,
            },
            updatedAt: new Date().toISOString(),
        });
    };

    const handleNumberChange = (field, e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '') {
            handleInputChange(field, 0);
        } else if (!isNaN(rawValue)) {
            handleInputChange(field, Number(rawValue));
        }
    };

    const handleNullableNumberChange = (field, e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '') {
            handleInputChange(field, null);
            return;
        }

        if (!isNaN(rawValue)) {
            handleInputChange(field, Number(rawValue));
        }
    };

    const outputs = scenario.outputs;

    return (
        <div className={`${styles.scenarioCard} ${styles[`scenario${colorClass.toUpperCase()}`]}`}>
            <div className={styles.scenarioHeader}>
                <span className={styles.scenarioLabel}>{labels[index]}</span>
                <div className={styles.scenarioActions}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => onDuplicate(scenario)}
                        title="Duplicate"
                    >
                        <CopyIcon className={styles.iconSvg} />
                    </button>
                    {canRemove && (
                        <button
                            className={styles.iconBtn}
                            onClick={() => onRemove(scenario.id)}
                            title="Remove"
                        >
                            <TrashIcon className={styles.iconSvg} />
                        </button>
                    )}
                </div>
            </div>

            {/* Inputs */}
            <div className={styles.inputsGrid}>
                <div className={styles.inputGroup}>
                    <label>Home Price</label>
                    <div className={styles.inputWrapper}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumberInput(scenario.inputs.homePrice)}
                            onChange={(e) => handleNumberChange('homePrice', e)}
                        />
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Down Payment</label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="number"
                            value={scenario.inputs.downPaymentPercent}
                            onChange={(e) => handleInputChange('downPaymentPercent', Number(e.target.value))}
                        />
                        <span className={styles.inputSuffix}>%</span>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Interest Rate</label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="number"
                            step="0.125"
                            value={scenario.inputs.interestRate}
                            onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                        />
                        <span className={styles.inputSuffix}>%</span>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Loan Term</label>
                    <div className={styles.termButtons}>
                        {[15, 20, 30].map((term) => (
                            <button
                                key={term}
                                className={`${styles.termBtn} ${scenario.inputs.termYears === term ? styles.termBtnActive : ''}`}
                                onClick={() => handleInputChange('termYears', term)}
                            >
                                {term}yr
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Loan Type</label>
                    <div className={styles.typeButtons}>
                        {[
                            { value: LOAN_TYPES.CONVENTIONAL, label: 'Conv' },
                            { value: LOAN_TYPES.FHA, label: 'FHA' },
                            { value: LOAN_TYPES.VA, label: 'VA' },
                        ].map((type) => (
                            <button
                                key={type.value}
                                className={`${styles.typeBtn} ${scenario.inputs.loanType === type.value ? styles.typeBtnActive : ''}`}
                                onClick={() => handleInputChange('loanType', type.value)}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label>Points</label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="number"
                            step="0.25"
                            value={scenario.inputs.points}
                            onChange={(e) => handleInputChange('points', Number(e.target.value))}
                        />
                        <span className={styles.inputSuffix}>pts</span>
                    </div>
                </div>
            </div>

            <button
                className={styles.advancedToggle}
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                {showAdvanced ? 'Hide Advanced ▲' : 'Advanced ▼'}
            </button>

            {showAdvanced && (
                <div className={styles.advancedSection}>
                    <div className={styles.inputGroup}>
                        <label>HOA (Monthly)</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputPrefix}>$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatNumberInput(scenario.inputs.hoa)}
                                onChange={(e) => handleNumberChange('hoa', e)}
                            />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Property Tax (Annual)</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputPrefix}>$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatNumberInput(scenario.inputs.propertyTax ?? '')}
                                onChange={(e) => handleNullableNumberChange('propertyTax', e)}
                            />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Property Tax Rate</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                step="0.1"
                                value={scenario.inputs.propertyTaxRate ?? 1.2}
                                onChange={(e) => {
                                    const nextRate = Number(e.target.value);
                                    onUpdate({
                                        ...scenario,
                                        inputs: {
                                            ...scenario.inputs,
                                            propertyTax: null,
                                            propertyTaxRate: nextRate,
                                        },
                                        updatedAt: new Date().toISOString(),
                                    });
                                }}
                            />
                            <span className={styles.inputSuffix}>%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Outputs */}
            {outputs && (
                <div className={styles.outputsSection}>
                    <div className={styles.totalPayment}>
                        <span className={styles.totalValue}>{formatCurrency(outputs.monthly.total)}</span>
                        <span className={styles.totalLabel}>/month (PITI)</span>
                    </div>

                    <div className={styles.breakdown}>
                        <div className={styles.breakdownRow}>
                            <span>Principal & Interest</span>
                            <span>{formatCurrency(outputs.monthly.principalInterest)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span>Tax & Insurance</span>
                            <span>{formatCurrency(outputs.monthly.propertyTax + outputs.monthly.insurance)}</span>
                        </div>
                        {outputs.monthly.pmi > 0 && (
                            <div className={styles.breakdownRow}>
                                <span>PMI</span>
                                <span>{formatCurrency(outputs.monthly.pmi)}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.cashToClose}>
                        <span>Cash to Close</span>
                        <span>{formatCurrency(outputs.closing.cashToClose)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== COMPARISON SUMMARY =====
function ComparisonSummary({ scenarios }) {
    if (scenarios.length < 2) return null;

    const outputs = scenarios.map(s => s.outputs).filter(Boolean);
    if (outputs.length < 2) return null;

    const comparison = compareScenarios(outputs[0], outputs[1]);
    const labels = ['Option A', 'Option B'];

    const monthlyDiff = Math.abs(comparison.monthlyDifference);
    const betterLabel = labels[comparison.betterMonthly === 'A' ? 0 : 1];

    return (
        <div className={styles.summaryCard}>
            <h3>Quick Comparison</h3>
            <div className={styles.summaryHighlight}>
                <span className={styles.savingsAmount}>
                    {betterLabel} saves {formatCurrency(monthlyDiff)}/month
                </span>
                <span className={styles.savingsDetail}>
                    = {formatCurrency(monthlyDiff * 12)}/year • {formatCurrency(monthlyDiff * 60)}/5 years
                </span>
            </div>
        </div>
    );
}

// ===== MAIN PAGE COMPONENT =====
function ScenarioBuilderPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast, confirm } = useToast();
    const { profile: userProfile, session } = useUser();
    const [scenarios, setScenarios] = useState([
        createEmptyScenario('Option A'),
        { ...createEmptyScenario('Option B'), inputs: { ...createEmptyScenario().inputs, interestRate: 5.875 } },
    ]);
    const [comparisonTitle, setComparisonTitle] = useState('Mortgage Comparison');
    const [selectedClient, setSelectedClient] = useState(null);
    const [entitlements, setEntitlements] = useState(null);
    const [isLoadingEntitlements, setIsLoadingEntitlements] = useState(true);
    const [propertyAddress, setPropertyAddress] = useState('');
    const [propertyDetails, setPropertyDetails] = useState(null);
    const [isFetchingProperty, setIsFetchingProperty] = useState(false);
    const [aiType, setAiType] = useState('summary');
    const [aiText, setAiText] = useState('');
    const [aiMeta, setAiMeta] = useState(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // RentCast 数据获取后自动展开 Advanced
    const [expandAdvanced, setExpandAdvanced] = useState(false);
    // AI script tracking
    const [hasUsedAI, setHasUsedAI] = useState(false);
    const [isAIGenerated, setIsAIGenerated] = useState(false);
    const [canUseAI, setCanUseAI] = useState(false);

    // Draft storage
    const DRAFT_STORAGE_KEY = 'showtherate_comparison_draft';
    const hasDraftRestored = useRef(false);
    const [showDraftPrompt, setShowDraftPrompt] = useState(false);
    const [savedDraft, setSavedDraft] = useState(null);

    const isSubscriber = entitlements?.type === 'subscription';
    const hasPaidPlan = entitlements?.hasActiveEntitlement === true;
    const closingScriptRemaining = typeof entitlements?.quotas?.closingScript?.remaining === 'number'
        ? entitlements.quotas.closingScript.remaining
        : null;

    // Share quota state
    const shareQuotaRemaining = typeof entitlements?.quotas?.share?.remaining === 'number'
        ? entitlements.quotas.share.remaining
        : null;
    const hasShareQuota = shareQuotaRemaining === null || shareQuotaRemaining === -1 || shareQuotaRemaining > 0;

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch('/api/user/entitlements');
                const data = await res.json().catch(() => ({}));
                if (!cancelled) setEntitlements(data);
            } catch {
                // ignore
            } finally {
                if (!cancelled) setIsLoadingEntitlements(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Pre-fetch client from URL param
    useEffect(() => {
        const clientId = searchParams.get('clientId');
        if (!clientId) return;

        (async () => {
            try {
                const res = await fetch(`/api/clients/${clientId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.client) {
                        setSelectedClient(data.client);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch client:', err);
            }
        })();
    }, [searchParams]);

    // Clone existing comparison from URL param
    const hasClonedRef = useRef(false);
    useEffect(() => {
        const cloneId = searchParams.get('clone');
        if (!cloneId || hasClonedRef.current) return;

        hasClonedRef.current = true;

        (async () => {
            try {
                const res = await fetch(`/api/comparisons/${cloneId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.scenarios) {
                        // Set title with "Copy of" prefix
                        setComparisonTitle(`Copy of ${data.title || 'Mortgage Comparison'}`);

                        // Map scenarios to the expected format
                        const clonedScenarios = data.scenarios.map((s, idx) => ({
                            id: `${Date.now()}-${idx}`,
                            name: s.name || `Option ${String.fromCharCode(65 + idx)}`,
                            inputs: s.inputs || {},
                        }));

                        if (clonedScenarios.length > 0) {
                            setScenarios(clonedScenarios);
                        }

                        // Set property address if available
                        const firstScenario = clonedScenarios[0];
                        if (firstScenario?.inputs?.propertyAddress) {
                            setPropertyAddress(firstScenario.inputs.propertyAddress);
                        }

                        // Set AI script if available
                        if (data.aiScript) {
                            setAiText(data.aiScript);
                            setIsAIGenerated(true);
                        }

                        toast.info('Comparison loaded! Make your changes and save as a new comparison.');
                    }
                } else {
                    toast.error('Failed to load comparison for cloning');
                }
            } catch (err) {
                console.error('Failed to clone comparison:', err);
                toast.error('Failed to load comparison');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Calculate all scenarios
    const calculatedScenarios = useMemo(() => {
        return scenarios.map(scenario => {
            const validation = validateScenarioInputs(scenario.inputs);
            if (!validation.isValid) {
                return { ...scenario, outputs: null, errors: validation.errors };
            }
            const outputs = calculateScenario(scenario.inputs);
            return { ...scenario, outputs, errors: [] };
        });
    }, [scenarios]);

    const handleUpdateScenario = useCallback((updatedScenario) => {
        setScenarios(prev => prev.map(s =>
            s.id === updatedScenario.id ? updatedScenario : s
        ));
    }, []);

    const handleDuplicateScenario = useCallback((scenario) => {
        if (scenarios.length >= 4) {
            toast.error('Maximum 4 scenarios allowed');
            return;
        }
        const newScenario = {
            ...createEmptyScenario(`Option ${String.fromCharCode(65 + scenarios.length)}`),
            inputs: { ...scenario.inputs },
        };
        setScenarios(prev => [...prev, newScenario]);
        toast.success('Scenario duplicated');
    }, [scenarios.length]); // 移除toast依赖

    const handleRemoveScenario = useCallback((id) => {
        setScenarios(prev => prev.filter(s => s.id !== id));
        toast.success('Scenario removed');
    }, []); // 移除toast依赖

    const handleAddScenario = useCallback(() => {
        if (scenarios.length >= 4) {
            toast.error('Maximum 4 scenarios allowed');
            return;
        }
        const newScenario = createEmptyScenario(`Option ${String.fromCharCode(65 + scenarios.length)}`);
        setScenarios(prev => [...prev, newScenario]);
    }, [scenarios.length]); // 移除toast依赖

    const handleFetchProperty = useCallback(async () => {
        const address = propertyAddress.trim();
        if (!address) {
            toast.error('Enter an address first');
            return;
        }

        try {
            setIsFetchingProperty(true);

            const res = await fetch('/api/property/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, countryCode: 'US' }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const message = typeof data?.error === 'string' ? data.error : 'Failed to fetch property details';
                toast.error(message);
                return;
            }

            setPropertyDetails(data);
            if (typeof data?.address === 'string') {
                setPropertyAddress(data.address);
            }

            const annualPropertyTax = typeof data?.annualPropertyTax === 'number' ? data.annualPropertyTax : null;
            const hoaMonthly = typeof data?.hoaMonthly === 'number' ? data.hoaMonthly : null;
            const lastSalePrice = typeof data?.lastSalePrice === 'number' ? data.lastSalePrice : null;

            let homePriceAutoFilled = false;

            setScenarios((prev) =>
                prev.map((scenario) => {
                    const nextInputs = { ...scenario.inputs };

                    // 无条件覆盖 Home Price（如果有数据）
                    if (lastSalePrice !== null) {
                        nextInputs.homePrice = lastSalePrice;
                        homePriceAutoFilled = true;
                    }

                    // 无条件覆盖 Property Tax（如果有数据）
                    if (annualPropertyTax !== null) {
                        nextInputs.propertyTax = annualPropertyTax;
                        // 重新计算 Tax Rate 基于当前 Home Price
                        if (typeof nextInputs.homePrice === 'number' && nextInputs.homePrice > 0) {
                            nextInputs.propertyTaxRate = Number(((annualPropertyTax / nextInputs.homePrice) * 100).toFixed(2));
                        }
                    }

                    // 无条件覆盖 HOA（如果有数据）
                    if (hoaMonthly !== null) {
                        nextInputs.hoa = hoaMonthly;
                    }

                    return {
                        ...scenario,
                        inputs: nextInputs,
                        updatedAt: new Date().toISOString(),
                    };
                })
            );

            // 如果有数据填充到 Advanced 字段，自动展开
            if (annualPropertyTax !== null || hoaMonthly !== null) {
                setExpandAdvanced(true);
            }

            // 组合成功提示
            const filledFields = [];
            if (homePriceAutoFilled) filledFields.push('Home Price');
            if (annualPropertyTax !== null) filledFields.push('Tax');
            if (hoaMonthly !== null) filledFields.push('HOA');

            if (filledFields.length > 0) {
                toast.success(`Auto-filled: ${filledFields.join(', ')}`);
            } else {
                toast.success('Property fetched (no auto-fill data)');
            }
        } catch (err) {
            toast.error('Failed to fetch property details');
        } finally {
            setIsFetchingProperty(false);
        }
    }, [propertyAddress]); // 移除toast依赖

    const aiSummaryPayload = useMemo(() => {
        const outputs = calculatedScenarios.map(s => s.outputs).filter(Boolean);
        if (outputs.length < 2) return null;

        const comparison = compareScenarios(outputs[0], outputs[1]);
        const labels = ['Option A', 'Option B'];
        const betterMonthlyLabel = labels[comparison.betterMonthly === 'A' ? 0 : 1];
        const betterCashLabel = labels[comparison.betterCashToClose === 'A' ? 0 : 1];

        return {
            betterMonthly: comparison.betterMonthly,
            betterMonthlyLabel,
            monthlySavings: Math.abs(comparison.monthlyDifference),
            cashToCloseDifference: Math.abs(comparison.cashToCloseDifference),
            betterCashLabel,
            fiveYearTotalDifference: Math.abs(comparison.fiveYearTotalDifference),
            tenYearTotalDifference: Math.abs(comparison.tenYearTotalDifference),
            optionA: {
                monthly: outputs[0].monthly.total,
                rate: calculatedScenarios[0]?.inputs?.interestRate,
                termYears: calculatedScenarios[0]?.inputs?.termYears,
                cashToClose: outputs[0].closing.cashToClose,
            },
            optionB: {
                monthly: outputs[1].monthly.total,
                rate: calculatedScenarios[1]?.inputs?.interestRate,
                termYears: calculatedScenarios[1]?.inputs?.termYears,
                cashToClose: outputs[1].closing.cashToClose,
            },
        };
    }, [calculatedScenarios]);

    // Generate template script (available for all users)
    const handleGenerateScript = useCallback(async () => {
        if (!aiSummaryPayload) {
            toast.error('Add at least two valid scenarios first');
            return;
        }

        try {
            setIsGeneratingAI(true);
            setAiMeta(null);

            const res = await fetch('/api/scripts/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uiTone: aiType,
                    title: comparisonTitle,
                    summary: aiSummaryPayload,
                    useAI: false,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = typeof data?.error === 'string' ? data.error : 'Failed to generate script';
                toast.error(message);
                return;
            }

            const text = typeof data?.text === 'string' ? data.text : '';
            setAiText(text);
            setIsAIGenerated(false);
            setCanUseAI(data?.canUseAI === true);
            setAiMeta({
                remaining: data?.aiRemaining,
                templateId: data?.templateId,
                isAI: false,
            });

            toast.success('Script generated');
        } catch {
            toast.error('Failed to generate script');
        } finally {
            setIsGeneratingAI(false);
        }
    }, [aiSummaryPayload, aiType, comparisonTitle]); // 移除toast依赖

    // Generate AI script (subscribers only, once per comparison)
    const handleGenerateAIScript = useCallback(async () => {
        if (!aiSummaryPayload) {
            toast.error('Add at least two valid scenarios first');
            return;
        }

        if (!hasPaidPlan) {
            toast.error('AI generation requires a paid plan');
            return;
        }

        if (hasUsedAI) {
            toast.error('AI can only be used once per comparison');
            return;
        }

        if (closingScriptRemaining === 0) {
            toast.error('AI quota exhausted');
            return;
        }

        try {
            setIsGeneratingAI(true);

            const res = await fetch('/api/scripts/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uiTone: aiType,
                    title: comparisonTitle,
                    summary: aiSummaryPayload,
                    useAI: true,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 403) {
                    toast.error('Subscribe to unlock AI generation');
                    return;
                }
                if (res.status === 402) {
                    toast.error('AI quota exhausted');
                    return;
                }
                const message = typeof data?.error === 'string' ? data.error : 'Failed to generate AI script';
                toast.error(message);
                return;
            }

            const text = typeof data?.text === 'string' ? data.text : '';
            setAiText(text);
            setHasUsedAI(true);
            setIsAIGenerated(data?.isAI === true);
            setCanUseAI(false);
            setAiMeta({
                remaining: data?.remaining,
                templateId: data?.templateId,
                isAI: data?.isAI === true,
            });

            if (data?.isAI) {
                toast.success('AI script generated');
            } else if (data?.aiFailed) {
                toast.warning('AI failed, using template instead');
            } else {
                toast.success('Script generated');
            }
        } catch {
            toast.error('Failed to generate AI script');
        } finally {
            setIsGeneratingAI(false);
        }
    }, [aiSummaryPayload, aiType, comparisonTitle, hasPaidPlan, hasUsedAI, closingScriptRemaining]); // 移除toast依赖

    const handleCopyAIScript = useCallback(async () => {
        if (!aiText) return;
        try {
            await navigator.clipboard.writeText(aiText);
            toast.success('Script copied');
        } catch {
            toast.error('Failed to copy');
        }
    }, [aiText]); // 移除toast依赖

    const handlePreview = useCallback(() => {
        if (!aiSummaryPayload) {
            toast.error('Add at least two valid scenarios first');
            return;
        }

        const previewId = 'preview';
        const profileName = [userProfile?.firstName, userProfile?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
        const loName = profileName || session?.user?.name || null;
        const normalizedScenarios = calculatedScenarios.map((scenario, idx) => ({
            id: scenario.id || `${previewId}-${idx}`,
            name: scenario.name || `Option ${String.fromCharCode(65 + idx)}`,
            inputs: idx === 0
                ? { ...scenario.inputs, propertyAddress: propertyAddress.trim() || null }
                : scenario.inputs,
            outputs: scenario.outputs || null,
        }));
        const rawHomePrice = normalizedScenarios[0]?.inputs?.homePrice;
        const homePrice = typeof rawHomePrice === 'number' && !Number.isNaN(rawHomePrice)
            ? rawHomePrice
            : null;

        const previewPayload = {
            id: previewId,
            title: comparisonTitle,
            aiScript: aiText || null,
            scenarios: normalizedScenarios,
            createdAt: new Date().toISOString(),
            viewCount: 0,
            loName,
            loNmls: userProfile?.nmls || null,
            loEmail: userProfile?.email || session?.user?.email || null,
            loPhone: userProfile?.phone || null,
            loX: userProfile?.xHandle || null,
            loFacebook: userProfile?.facebook || null,
            loTikTok: userProfile?.tiktok || null,
            loInstagram: userProfile?.instagram || null,
            loAvatarUrl: userProfile?.avatarUrl || session?.user?.image || null,
            propertyAddress: propertyAddress.trim() || null,
            homePrice,
        };

        try {
            localStorage.setItem(`comparison_${previewId}`, JSON.stringify(previewPayload));
        } catch (error) {
            console.error('Failed to store preview data:', error);
            toast.error('Preview failed. Please allow local storage and try again.');
            return;
        }

        const previewUrl = `/s/${previewId}`;
        const previewWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');
        if (!previewWindow) {
            router.push(previewUrl);
        }
    }, [
        aiSummaryPayload,
        calculatedScenarios,
        comparisonTitle,
        aiText,
        userProfile,
        session,
        propertyAddress,
        toast,
        router,
    ]);

    // Refresh entitlements (for real-time quota update)
    const refreshEntitlements = useCallback(async () => {
        try {
            const res = await fetch('/api/user/entitlements');
            const data = await res.json().catch(() => ({}));
            setEntitlements(data);
        } catch {
            // ignore
        }
    }, []);

    // Save and then share (generate link)
    const handleSaveAndShare = useCallback(async () => {
        if (calculatedScenarios.length < 2) {
            toast.error('Add at least two scenarios to share');
            return;
        }

        if (!comparisonTitle.trim()) {
            toast.error('Enter a title first');
            return;
        }

        // Check share quota before proceeding
        if (!hasShareQuota) {
            if (await confirm('Share link quota exhausted. Upgrade to Pro for more shares?', { title: 'Quota Exceeded', confirmText: 'Upgrade', type: 'warning' })) {
                router.push('/app/upgrade');
            }
            return;
        }

        setIsSaving(true);
        try {
            // First save
            const saveRes = await fetch('/api/comparisons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: comparisonTitle,
                    clientId: selectedClient?.id || null,
                    aiScript: aiText || null,
                    scenarios: calculatedScenarios.map((s, idx) => ({
                        name: s.name,
                        inputs: idx === 0
                            ? { ...s.inputs, propertyAddress: propertyAddress.trim() || null }
                            : s.inputs,
                        outputs: s.outputs,
                    })),
                }),
            });

            const saveData = await saveRes.json();

            if (!saveRes.ok) {
                toast.error(saveData.error || 'Failed to save comparison');
                return;
            }

            const comparisonId = saveData.id;

            // Then generate share link
            const shareRes = await fetch('/api/shares', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comparisonId }),
            });

            const shareData = await shareRes.json();

            if (shareRes.ok && shareData.shareId) {
                const shareUrl = `${window.location.origin}/s/${shareData.shareId}`;
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Saved & share link copied!');
                // Refresh entitlements to update quota display
                await refreshEntitlements();
                router.push('/app/comparisons');
            } else {
                if (shareRes.status === 402) {
                    // Quota exhausted - redirect to upgrade or show modal
                    if (await confirm('Share link quota exhausted. Upgrade to Pro for unlimited shares?', { title: 'Quota Exceeded', confirmText: 'Upgrade', type: 'warning' })) {
                        router.push('/app/upgrade');
                    }
                } else {
                    toast.error(shareData.error || 'Failed to generate share link');
                }
                // Still redirect since comparison was saved
                router.push('/app/comparisons');
            }
        } catch (err) {
            toast.error('Failed to save and share');
        } finally {
            setIsSaving(false);
        }
    }, [calculatedScenarios, comparisonTitle, selectedClient, hasShareQuota, confirm, refreshEntitlements, router]); // 移除toast依赖

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerTop}>
                    <div>
                        <h1>New Comparison</h1>
                        <p className={styles.stepIndicator}>Step 1 of 2 • Configure Scenarios</p>
                    </div>
                </div>
                <div className={styles.headerInputRow}>
                    <div className={styles.titleSection}>
                        <label className={styles.clientLabel}>Comparison Title</label>
                        <input
                            type="text"
                            className={styles.titleInput}
                            value={comparisonTitle}
                            onChange={(e) => setComparisonTitle(e.target.value)}
                            placeholder="Enter comparison title..."
                        />
                    </div>

                    {/* Client Selection */}
                    <div className={styles.clientSection}>
                        <label className={styles.clientLabel}>Client (Optional)</label>
                        <ClientSearchInput
                            value={selectedClient}
                            onChange={setSelectedClient}
                            placeholder="Search or add client..."
                        />
                    </div>
                </div>

                <div className={styles.propertyLookup}>
                    <label className={styles.propertyLookupLabel}>Property Address (US)</label>
                    <div className={styles.propertyLookupRow}>
                        <div className={styles.propertyLookupInput}>
                            <input
                                type="text"
                                value={propertyAddress}
                                onChange={(e) => setPropertyAddress(e.target.value)}
                                placeholder="123 Main St, City, ST 12345"
                            />
                        </div>
                        <button
                            className={styles.fetchPropertyBtn}
                            onClick={handleFetchProperty}
                            disabled={isFetchingProperty || !propertyAddress.trim()}
                        >
                            {isFetchingProperty ? 'Fetching…' : 'Fetch tax & details'}
                        </button>
                    </div>

                    {propertyDetails && (
                        <div className={styles.propertyMeta}>
                            {/* 房产属性 */}
                            {(propertyDetails.bedrooms || propertyDetails.bathrooms || propertyDetails.squareFootage) && (
                                <span className={styles.propertyAttr}>
                                    🏠 {propertyDetails.bedrooms ? `${propertyDetails.bedrooms} bed` : ''}
                                    {propertyDetails.bathrooms ? ` • ${propertyDetails.bathrooms} bath` : ''}
                                    {propertyDetails.squareFootage ? ` • ${propertyDetails.squareFootage.toLocaleString()} sqft` : ''}
                                    {propertyDetails.yearBuilt ? ` • Built ${propertyDetails.yearBuilt}` : ''}
                                </span>
                            )}
                            {/* 成交价 */}
                            {typeof propertyDetails.lastSalePrice === 'number' && (
                                <span>
                                    💰 Last Sale: {formatCurrency(propertyDetails.lastSalePrice)}
                                    {propertyDetails.lastSaleDate ? ` (${propertyDetails.lastSaleDate.slice(0, 10)})` : ''}
                                </span>
                            )}
                            {/* 税费与 HOA */}
                            <span>
                                📋 Tax: {typeof propertyDetails.annualPropertyTax === 'number' ? formatCurrency(propertyDetails.annualPropertyTax) : '—'}
                                {propertyDetails.taxYear ? ` (${propertyDetails.taxYear})` : ''}
                            </span>
                            <span>
                                HOA: {typeof propertyDetails.hoaMonthly === 'number' ? `${formatCurrency(propertyDetails.hoaMonthly)}/mo` : '—'}
                            </span>
                            {typeof propertyDetails.remaining === 'number' && (
                                <span>Quota: {propertyDetails.remaining === -1 ? '∞' : propertyDetails.remaining}</span>
                            )}
                            <span className={styles.cacheTag}>{propertyDetails.cached ? '📦 Cached' : '🔴 Live'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scenarios Grid */}
            <div className={styles.scenariosGrid}>
                {calculatedScenarios.map((scenario, index) => (
                    <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        index={index}
                        onUpdate={handleUpdateScenario}
                        onDuplicate={handleDuplicateScenario}
                        onRemove={handleRemoveScenario}
                        canRemove={scenarios.length > 1}
                        forceShowAdvanced={expandAdvanced}
                    />
                ))}

                {scenarios.length < 4 && (
                    <button className={styles.addScenarioBtn} onClick={handleAddScenario}>
                        <PlusIcon className={styles.iconSvg} />
                        <span>Add Scenario</span>
                    </button>
                )}
            </div>

            {/* Comparison Summary */}
            <ComparisonSummary scenarios={calculatedScenarios} />

            <section className={styles.aiSection}>
                <div className={styles.aiCard}>
                    <div className={styles.aiHeader}>
                        <div className={styles.aiTitle}>
                            <h3>Closing Script</h3>
                        </div>
                        <div className={styles.aiControls}>
                            <div className={styles.aiTone}>
                                {[
                                    { value: 'summary', label: 'Balanced' },
                                    { value: 'tone_professional', label: 'Professional' },
                                    { value: 'tone_friendly', label: 'Friendly' },
                                    { value: 'tone_urgency', label: 'Urgency' },
                                ].map((t) => (
                                    <button
                                        key={t.value}
                                        className={`${styles.aiToneBtn} ${aiType === t.value ? styles.aiToneBtnActive : ''}`}
                                        onClick={() => setAiType(t.value)}
                                        disabled={isGeneratingAI}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                className={styles.aiGenerateBtn}
                                onClick={handleGenerateScript}
                                disabled={isGeneratingAI || !aiSummaryPayload}
                            >
                                {isGeneratingAI ? 'Generating…' : 'Generate Script'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.aiBody}>
                        <textarea
                            className={styles.aiTextarea}
                            value={aiText}
                            onChange={(e) => setAiText(e.target.value)}
                            placeholder={aiText ? "Edit your script here..." : "Draft a short script you can read to the borrower while comparing options, or click Generate Script to get AI assistance."}
                            rows={8}
                        />
                        <div className={styles.aiFooter}>
                            <div className={styles.aiActions}>
                                <button
                                    className={styles.aiCopyBtn}
                                    onClick={handleCopyAIScript}
                                    disabled={!aiText}
                                >
                                    <CopyIcon className={styles.aiCopyIcon} />
                                    Copy
                                </button>
                                {/* Show Try AI button for paid users who haven't used AI yet */}
                                {hasPaidPlan && canUseAI && !hasUsedAI && (
                                    <button
                                        className={styles.aiTryAIBtn}
                                        onClick={handleGenerateAIScript}
                                        disabled={isGeneratingAI}
                                    >
                                        ✨ Try AI
                                    </button>
                                )}
                            </div>
                            <div className={styles.aiMeta}>
                                {isAIGenerated && <span className={styles.aiTag}>AI Generated</span>}
                                {aiMeta?.isAI === false && <span>Template</span>}
                                {typeof aiMeta?.remaining === 'number' && hasPaidPlan && (
                                    <span>AI remaining: {aiMeta.remaining === -1 ? '∞' : aiMeta.remaining}</span>
                                )}
                                {!aiText && (
                                    <span className={styles.aiHint}>💡 Start typing or generate with AI</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Action Bar */}
            <div className={styles.actionBar}>
                <Link href="/app" className={styles.saveDraftBtn}>
                    ← Back to Dashboard
                </Link>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.previewBtn}
                        onClick={handlePreview}
                        disabled={isSaving || calculatedScenarios.length === 0}
                        title="Preview how it looks"
                    >
                        👁 Preview
                    </button>
                    {shareQuotaRemaining !== null && shareQuotaRemaining !== -1 && (
                        <span className={styles.quotaInfo}>
                            {shareQuotaRemaining} share{shareQuotaRemaining !== 1 ? 's' : ''} remaining
                        </span>
                    )}
                    <button
                        className={styles.generateBtn}
                        onClick={handleSaveAndShare}
                        disabled={isSaving || calculatedScenarios.length < 2 || !hasShareQuota}
                    >
                        <RocketIcon className={styles.iconSvg} />
                        {isSaving ? 'Saving...' : 'Save & Share'}
                    </button>
                </div>
            </div>

        </div>
    );
}

export default function ScenarioBuilderPage() {
    return (
        <Suspense fallback={<div />}>
            <ScenarioBuilderPageInner />
        </Suspense>
    );
}
