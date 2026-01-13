/**
 * Rate Lock Calculator Component
 * Interactive calculator for lock fees, extensions, and float-down analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { calculateLockFee, calculateExtensionFee, calculateFloatDownValue, compareLockVsFloat } from '../../lib/calculators/rateLock';
import styles from './BuydownCalculator.module.css'; // Reuse styles

export default function RateLockCalculator({ config = {} }) {
    const { calculationType = 'lock-fee', defaultInputs = {} } = config;

    const [inputs, setInputs] = useState({
        loanAmount: defaultInputs.loanAmount || 400000,
        lockDays: defaultInputs.lockDays || 30,
        extensionDays: defaultInputs.extensionDays || 7,
        lockedRate: defaultInputs.lockedRate || 7.0,
        floatDownFee: defaultInputs.floatDownFee || 0.25,
        currentRate: defaultInputs.currentRate || 7.0,
        termYears: defaultInputs.termYears || 30,
        expectedRateDrop: defaultInputs.expectedRateDrop || 0.25,
        holdingPeriodYears: defaultInputs.holdingPeriodYears || 7,
    });

    const [results, setResults] = useState(null);

    useEffect(() => {
        calculateResults();
    }, [inputs]);

    const calculateResults = () => {
        try {
            let result;

            switch (calculationType) {
                case 'lock-fee':
                    result = calculateLockFee({
                        loanAmount: inputs.loanAmount,
                        lockDays: inputs.lockDays,
                    });
                    break;
                case 'extension-fee':
                    result = calculateExtensionFee({
                        loanAmount: inputs.loanAmount,
                        extensionDays: inputs.extensionDays,
                    });
                    break;
                case 'float-down':
                    result = calculateFloatDownValue({
                        loanAmount: inputs.loanAmount,
                        lockedRate: inputs.lockedRate,
                        floatDownFee: inputs.floatDownFee,
                        expectedRateDrop: inputs.expectedRateDrop,
                        holdingPeriodYears: inputs.holdingPeriodYears,
                        termYears: inputs.termYears,
                    });
                    break;
                case 'lock-vs-float':
                    result = compareLockVsFloat({
                        loanAmount: inputs.loanAmount,
                        currentRate: inputs.currentRate,
                        lockDays: inputs.lockDays,
                        termYears: inputs.termYears,
                    });
                    break;
                default:
                    result = calculateLockFee({
                        loanAmount: inputs.loanAmount,
                        lockDays: inputs.lockDays,
                    });
            }

            setResults(result);
        } catch (error) {
            console.error('Calculation error:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setInputs(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPercent = (value) => `${value.toFixed(3)}%`;

    const renderInputs = () => {
        switch (calculationType) {
            case 'lock-fee':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label htmlFor="loanAmount">Loan Amount</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>$</span>
                                <input
                                    type="number"
                                    id="loanAmount"
                                    value={inputs.loanAmount}
                                    onChange={(e) => handleInputChange('loanAmount', Number(e.target.value))}
                                    min="50000"
                                    max="5000000"
                                    step="10000"
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="lockDays">Lock Period</label>
                            <select
                                id="lockDays"
                                value={inputs.lockDays}
                                onChange={(e) => handleInputChange('lockDays', Number(e.target.value))}
                            >
                                <option value={15}>15 Days</option>
                                <option value={30}>30 Days</option>
                                <option value={45}>45 Days</option>
                                <option value={60}>60 Days</option>
                                <option value={90}>90 Days</option>
                                <option value={120}>120 Days</option>
                            </select>
                        </div>
                    </>
                );
            case 'extension-fee':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label htmlFor="loanAmount">Loan Amount</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>$</span>
                                <input
                                    type="number"
                                    id="loanAmount"
                                    value={inputs.loanAmount}
                                    onChange={(e) => handleInputChange('loanAmount', Number(e.target.value))}
                                    min="50000"
                                    max="5000000"
                                    step="10000"
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="extensionDays">Extension Days</label>
                            <select
                                id="extensionDays"
                                value={inputs.extensionDays}
                                onChange={(e) => handleInputChange('extensionDays', Number(e.target.value))}
                            >
                                <option value={7}>7 Days (1 Week)</option>
                                <option value={14}>14 Days (2 Weeks)</option>
                                <option value={21}>21 Days (3 Weeks)</option>
                            </select>
                        </div>
                    </>
                );
            case 'float-down':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label htmlFor="loanAmount">Loan Amount</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>$</span>
                                <input
                                    type="number"
                                    id="loanAmount"
                                    value={inputs.loanAmount}
                                    onChange={(e) => handleInputChange('loanAmount', Number(e.target.value))}
                                    min="50000"
                                    max="5000000"
                                    step="10000"
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="lockedRate">Locked Rate</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="number"
                                    id="lockedRate"
                                    value={inputs.lockedRate}
                                    onChange={(e) => handleInputChange('lockedRate', Number(e.target.value))}
                                    min="1"
                                    max="15"
                                    step="0.125"
                                />
                                <span className={styles.suffix}>%</span>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="floatDownFee">Float Down Fee</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="number"
                                    id="floatDownFee"
                                    value={inputs.floatDownFee}
                                    onChange={(e) => handleInputChange('floatDownFee', Number(e.target.value))}
                                    min="0.125"
                                    max="1"
                                    step="0.125"
                                />
                                <span className={styles.suffix}>%</span>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="holdingPeriodYears">How Long You'll Keep Loan</label>
                            <select
                                id="holdingPeriodYears"
                                value={inputs.holdingPeriodYears}
                                onChange={(e) => handleInputChange('holdingPeriodYears', Number(e.target.value))}
                            >
                                <option value={3}>3 Years</option>
                                <option value={5}>5 Years</option>
                                <option value={7}>7 Years</option>
                                <option value={10}>10 Years</option>
                                <option value={15}>15 Years</option>
                            </select>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const renderResults = () => {
        if (!results) return null;

        switch (calculationType) {
            case 'lock-fee':
                return (
                    <>
                        <div className={styles.summaryCards}>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Lock Period</span>
                                <span className={styles.cardValue}>{results.lockDays} Days</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Lock Fee</span>
                                <span className={styles.cardValue}>{formatCurrency(results.lockFee)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Fee Percent</span>
                                <span className={styles.cardValue}>{formatPercent(results.feePercent)}</span>
                            </div>
                        </div>

                        <div className={styles.scheduleSection}>
                            <h4 className={styles.scheduleTitle}>Lock Period Comparison</h4>
                            <div className={styles.scheduleTable}>
                                <div className={styles.scheduleHeader}>
                                    <span>Lock Period</span>
                                    <span>Fee %</span>
                                    <span>Fee Amount</span>
                                </div>
                                {results.comparison.map((tier) => (
                                    <div
                                        key={tier.days}
                                        className={`${styles.scheduleRow} ${tier.days === inputs.lockDays ? styles.noteRateRow : ''}`}
                                    >
                                        <span>{tier.days} Days</span>
                                        <span>{formatPercent(tier.feePercent)}</span>
                                        <span>{formatCurrency(tier.fee)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'extension-fee':
                return (
                    <>
                        <div className={styles.summaryCards}>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Extension Days</span>
                                <span className={styles.cardValue}>{results.extensionDays} Days</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Extension Fee</span>
                                <span className={styles.cardValue}>{formatCurrency(results.extensionFee)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Fee Percent</span>
                                <span className={styles.cardValue}>{formatPercent(results.feePercent)}</span>
                            </div>
                        </div>

                        <div className={styles.scheduleSection}>
                            <h4 className={styles.scheduleTitle}>Extension Scenarios</h4>
                            <div className={styles.scheduleTable}>
                                <div className={styles.scheduleHeader}>
                                    <span>Extension</span>
                                    <span>Fee %</span>
                                    <span>Fee Amount</span>
                                </div>
                                {results.scenarios.map((scenario) => (
                                    <div key={scenario.days} className={styles.scheduleRow}>
                                        <span>{scenario.days} Days ({scenario.weeks} week{scenario.weeks > 1 ? 's' : ''})</span>
                                        <span>{formatPercent(scenario.feePercent)}</span>
                                        <span>{formatCurrency(scenario.fee)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'float-down':
                return (
                    <>
                        <div className={styles.summaryCards}>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Float Down Cost</span>
                                <span className={styles.cardValue}>{formatCurrency(results.feeCost)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Min Rate Drop Needed</span>
                                <span className={styles.cardValue}>{formatPercent(results.minRateDropForBreakEven)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Monthly Savings</span>
                                <span className={styles.cardValue}>{formatCurrency(results.monthlySavings)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.cardLabel}>Net Savings ({results.holdingPeriodYears}yr)</span>
                                <span className={styles.cardValue}>{formatCurrency(results.netSavings)}</span>
                            </div>
                        </div>

                        <div className={styles.concessionInfo}>
                            {results.isWorthIt ? (
                                <div className={styles.successMessage}>
                                    ✅ With a {formatPercent(results.expectedRateDrop)} rate drop, the float down saves you {formatCurrency(results.netSavings)} over {results.holdingPeriodYears} years!
                                </div>
                            ) : (
                                <div className={styles.warningMessage}>
                                    ⚠️ The expected rate drop doesn't justify the float down fee. Rates need to drop at least {formatPercent(results.minRateDropForBreakEven)} to break even.
                                </div>
                            )}
                        </div>

                        <div className={styles.scheduleSection}>
                            <h4 className={styles.scheduleTitle}>Rate Drop Scenarios</h4>
                            <div className={styles.scheduleTable}>
                                <div className={styles.scheduleHeader}>
                                    <span>Rate Drop</span>
                                    <span>New Rate</span>
                                    <span>Net Savings</span>
                                    <span>Worth It?</span>
                                </div>
                                {results.scenarios.map((scenario) => (
                                    <div key={scenario.rateDrop} className={styles.scheduleRow}>
                                        <span>{formatPercent(scenario.rateDrop)}</span>
                                        <span>{formatPercent(scenario.newRate)}</span>
                                        <span className={scenario.netSavings > 0 ? styles.savings : ''}>{formatCurrency(scenario.netSavings)}</span>
                                        <span>{scenario.worthIt ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.calculator}>
            {/* Input Section */}
            <div className={styles.inputSection}>
                <h3 className={styles.sectionTitle}>
                    {calculationType === 'lock-fee' && 'Rate Lock Details'}
                    {calculationType === 'extension-fee' && 'Extension Details'}
                    {calculationType === 'float-down' && 'Float Down Analysis'}
                </h3>

                <div className={styles.inputGrid}>
                    {renderInputs()}
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className={styles.resultsSection}>
                    <h3 className={styles.sectionTitle}>Results</h3>
                    {renderResults()}
                </div>
            )}
        </div>
    );
}
