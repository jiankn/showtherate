/**
 * Buydown Calculator Component
 * Interactive calculator for 2-1, 3-2-1, and 1-0 temporary buydowns
 */

'use client';

import { useState, useEffect } from 'react';
import { calculateBuydown, calculateBuydownSubsidy, calculateSellerConcessionBuydown } from '../../lib/calculators/buydown';
import styles from './BuydownCalculator.module.css';

export default function BuydownCalculator({ config = {} }) {
    const { buydownType = '2-1', showCostFocus, showSubsidyFocus, showConcessionFocus, defaultInputs = {} } = config;

    const [inputs, setInputs] = useState({
        loanAmount: defaultInputs.loanAmount || 400000,
        noteRate: defaultInputs.noteRate || 7.0,
        termYears: defaultInputs.termYears || 30,
        buydownType: buydownType === 'all' ? '2-1' : buydownType,
        sellerConcession: defaultInputs.sellerConcession || 10000,
    });

    const [results, setResults] = useState(null);

    useEffect(() => {
        calculateResults();
    }, [inputs]);

    const calculateResults = () => {
        try {
            let result;

            if (showConcessionFocus) {
                result = calculateSellerConcessionBuydown({
                    loanAmount: inputs.loanAmount,
                    noteRate: inputs.noteRate,
                    termYears: inputs.termYears,
                    buydownType: inputs.buydownType,
                    sellerConcession: inputs.sellerConcession,
                });
            } else if (showSubsidyFocus) {
                result = calculateBuydownSubsidy({
                    loanAmount: inputs.loanAmount,
                    noteRate: inputs.noteRate,
                    termYears: inputs.termYears,
                    buydownType: inputs.buydownType,
                });
            } else {
                result = calculateBuydown({
                    loanAmount: inputs.loanAmount,
                    noteRate: inputs.noteRate,
                    termYears: inputs.termYears,
                    buydownType: inputs.buydownType,
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

    const formatPercent = (value) => `${value.toFixed(2)}%`;

    return (
        <div className={styles.calculator}>
            {/* Input Section */}
            <div className={styles.inputSection}>
                <h3 className={styles.sectionTitle}>Loan Details</h3>

                <div className={styles.inputGrid}>
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
                        <label htmlFor="noteRate">Note Rate (Full Rate)</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                id="noteRate"
                                value={inputs.noteRate}
                                onChange={(e) => handleInputChange('noteRate', Number(e.target.value))}
                                min="1"
                                max="15"
                                step="0.125"
                            />
                            <span className={styles.suffix}>%</span>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="termYears">Loan Term</label>
                        <select
                            id="termYears"
                            value={inputs.termYears}
                            onChange={(e) => handleInputChange('termYears', Number(e.target.value))}
                        >
                            <option value={30}>30 Years</option>
                            <option value={15}>15 Years</option>
                            <option value={20}>20 Years</option>
                        </select>
                    </div>

                    {buydownType === 'all' && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="buydownType">Buydown Type</label>
                            <select
                                id="buydownType"
                                value={inputs.buydownType}
                                onChange={(e) => handleInputChange('buydownType', e.target.value)}
                            >
                                <option value="2-1">2-1 Buydown</option>
                                <option value="3-2-1">3-2-1 Buydown</option>
                                <option value="1-0">1-0 Buydown</option>
                            </select>
                        </div>
                    )}

                    {showConcessionFocus && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="sellerConcession">Seller Concession</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>$</span>
                                <input
                                    type="number"
                                    id="sellerConcession"
                                    value={inputs.sellerConcession}
                                    onChange={(e) => handleInputChange('sellerConcession', Number(e.target.value))}
                                    min="0"
                                    max="100000"
                                    step="1000"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className={styles.resultsSection}>
                    <h3 className={styles.sectionTitle}>Results</h3>

                    {/* Summary Cards */}
                    <div className={styles.summaryCards}>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Buydown Cost</span>
                            <span className={styles.cardValue}>{formatCurrency(results.totalBuydownCost)}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Year 1 Payment</span>
                            <span className={styles.cardValue}>{formatCurrency(results.year1Payment)}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Year 1 Rate</span>
                            <span className={styles.cardValue}>{formatPercent(results.year1Rate)}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Full Payment</span>
                            <span className={styles.cardValue}>{formatCurrency(results.fullMonthlyPayment)}</span>
                        </div>
                    </div>

                    {/* Payment Schedule */}
                    <div className={styles.scheduleSection}>
                        <h4 className={styles.scheduleTitle}>Payment Schedule</h4>
                        <div className={styles.scheduleTable}>
                            <div className={styles.scheduleHeader}>
                                <span>Year</span>
                                <span>Rate</span>
                                <span>Monthly Payment</span>
                                <span>Monthly Savings</span>
                            </div>
                            {results.schedule.map((year) => (
                                <div
                                    key={year.year}
                                    className={`${styles.scheduleRow} ${year.isNoteRate ? styles.noteRateRow : ''}`}
                                >
                                    <span>Year {year.year}{year.isNoteRate ? '+' : ''}</span>
                                    <span>{formatPercent(year.rate)}</span>
                                    <span>{formatCurrency(year.monthlyPayment)}</span>
                                    <span className={year.savings > 0 ? styles.savings : ''}>
                                        {year.savings > 0 ? `${formatCurrency(year.savings)}/mo` : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Seller Concession Info */}
                    {showConcessionFocus && results.coversBuydown !== undefined && (
                        <div className={styles.concessionInfo}>
                            {results.coversBuydown ? (
                                <div className={styles.successMessage}>
                                    ✅ Your {formatCurrency(inputs.sellerConcession)} seller concession covers the buydown!
                                    {results.remainingCredit > 0 && (
                                        <span> You have {formatCurrency(results.remainingCredit)} left for closing costs.</span>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.warningMessage}>
                                    ⚠️ You need {formatCurrency(results.shortfall)} more to cover the buydown cost.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
