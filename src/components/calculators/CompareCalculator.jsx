/**
 * Compare Calculator Component
 * Displays side-by-side comparison of two mortgage options
 */

'use client';

import { useState, useEffect } from 'react';
import { calculateBuydown } from '../../lib/calculators/buydown';
import { calculatePointsBreakEven, comparePointsVsCredits } from '../../lib/calculators/points';
import { compareLockVsFloat } from '../../lib/calculators/rateLock';
import styles from './CompareCalculator.module.css';

export default function CompareCalculator({ config = {}, pageConfig = {} }) {
    const { optionA, optionB, defaultInputs = {} } = config;

    const [inputs, setInputs] = useState({
        loanAmount: defaultInputs.loanAmount || 400000,
        termYears: defaultInputs.termYears || 30,
        noteRate: defaultInputs.noteRate || 7.0,
        buydownType: defaultInputs.buydownType || '2-1',
        pointsCount: defaultInputs.pointsCount || 1.0,
        pointsRate: defaultInputs.pointsRate || 6.75,
        noPointsRate: defaultInputs.noPointsRate || 7.0,
        creditsRate: defaultInputs.creditsRate || 7.25,
        creditsAmount: defaultInputs.creditsAmount || 4000,
        currentRate: defaultInputs.currentRate || 7.0,
        lockDays: defaultInputs.lockDays || 30,
    });

    const [results, setResults] = useState(null);

    useEffect(() => {
        calculateResults();
    }, [inputs]);

    const calculateResults = () => {
        try {
            // Determine comparison type based on config
            if (optionA?.type === 'buydown' || optionB?.type === 'buydown') {
                // Buydown vs Points comparison
                const buydownResult = calculateBuydown({
                    loanAmount: inputs.loanAmount,
                    noteRate: inputs.noteRate,
                    termYears: inputs.termYears,
                    buydownType: inputs.buydownType,
                });

                const pointsResult = calculatePointsBreakEven({
                    loanAmount: inputs.loanAmount,
                    baseRate: inputs.noteRate,
                    pointsRate: inputs.noteRate - (inputs.pointsCount * 0.25),
                    pointsCost: inputs.pointsCount,
                    termYears: inputs.termYears,
                });

                setResults({
                    type: 'buydown-vs-points',
                    optionA: {
                        name: optionA?.name || 'Temporary Buydown',
                        cost: buydownResult.totalBuydownCost,
                        year1Payment: buydownResult.year1Payment,
                        year3Payment: buydownResult.fullMonthlyPayment,
                        savings: buydownResult.totalSavings,
                        details: buydownResult,
                    },
                    optionB: {
                        name: optionB?.name || 'Discount Points',
                        cost: pointsResult.totalPointsCost,
                        monthlyPayment: pointsResult.pointsPayment,
                        savings: pointsResult.totalSavingsIfKept,
                        breakEvenMonths: pointsResult.breakEvenMonths,
                        details: pointsResult,
                    },
                });
            } else if (optionA?.type === 'points' && optionB?.type === 'credits') {
                // Points vs Credits comparison
                const result = comparePointsVsCredits({
                    loanAmount: inputs.loanAmount,
                    termYears: inputs.termYears,
                    pointsRate: inputs.pointsRate,
                    pointsCost: inputs.pointsCount,
                    creditsRate: inputs.creditsRate,
                    creditsAmount: inputs.creditsAmount,
                });

                setResults({
                    type: 'points-vs-credits',
                    optionA: {
                        name: 'Buy Points',
                        rate: result.points.rate,
                        cost: result.points.cost,
                        monthlyPayment: result.points.monthlyPayment,
                    },
                    optionB: {
                        name: 'Lender Credits',
                        rate: result.credits.rate,
                        credit: result.credits.amount,
                        monthlyPayment: result.credits.monthlyPayment,
                    },
                    breakEvenMonths: result.breakEvenMonths,
                    comparisons: result.comparisons,
                });
            } else if (optionA?.type === 'lock' || optionB?.type === 'float') {
                // Lock vs Float comparison
                const result = compareLockVsFloat({
                    loanAmount: inputs.loanAmount,
                    termYears: inputs.termYears,
                    currentRate: inputs.currentRate,
                    lockDays: inputs.lockDays,
                });

                setResults({
                    type: 'lock-vs-float',
                    lock: result.lock,
                    float: result.float,
                    comparison: result.comparison,
                    scenarios: result.scenarios,
                });
            } else {
                // Default: Points vs Higher Rate
                const result = calculatePointsBreakEven({
                    loanAmount: inputs.loanAmount,
                    baseRate: inputs.noPointsRate || inputs.noteRate,
                    pointsRate: inputs.pointsRate || (inputs.noteRate - 0.25),
                    pointsCost: inputs.pointsCount,
                    termYears: inputs.termYears,
                });

                setResults({
                    type: 'points-break-even',
                    ...result,
                });
            }
        } catch (error) {
            console.error('Comparison calculation error:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setInputs(prev => ({ ...prev, [field]: value }));
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
        <div className={styles.compare}>
            {/* Input Section */}
            <div className={styles.inputSection}>
                <h3 className={styles.sectionTitle}>Comparison Details</h3>

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
                        <label htmlFor="noteRate">Interest Rate</label>
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
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className={styles.resultsSection}>
                    <h3 className={styles.sectionTitle}>Comparison Results</h3>

                    {/* Option Cards */}
                    <div className={styles.optionCards}>
                        <div className={styles.optionCard}>
                            <div className={styles.optionHeader}>
                                <span className={styles.optionLabel}>Option A</span>
                                <h4 className={styles.optionName}>{results.optionA?.name || optionA?.name}</h4>
                            </div>
                            <div className={styles.optionDetails}>
                                {results.optionA?.cost !== undefined && (
                                    <div className={styles.detailRow}>
                                        <span>Upfront Cost</span>
                                        <span>{formatCurrency(results.optionA.cost)}</span>
                                    </div>
                                )}
                                {results.optionA?.monthlyPayment !== undefined && (
                                    <div className={styles.detailRow}>
                                        <span>Monthly Payment</span>
                                        <span>{formatCurrency(results.optionA.monthlyPayment)}</span>
                                    </div>
                                )}
                                {results.optionA?.year1Payment !== undefined && (
                                    <div className={styles.detailRow}>
                                        <span>Year 1 Payment</span>
                                        <span>{formatCurrency(results.optionA.year1Payment)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.vsIndicator}>VS</div>

                        <div className={styles.optionCard}>
                            <div className={styles.optionHeader}>
                                <span className={styles.optionLabel}>Option B</span>
                                <h4 className={styles.optionName}>{results.optionB?.name || optionB?.name}</h4>
                            </div>
                            <div className={styles.optionDetails}>
                                {results.optionB?.cost !== undefined && (
                                    <div className={styles.detailRow}>
                                        <span>Upfront Cost</span>
                                        <span>{formatCurrency(results.optionB.cost)}</span>
                                    </div>
                                )}
                                {results.optionB?.monthlyPayment !== undefined && (
                                    <div className={styles.detailRow}>
                                        <span>Monthly Payment</span>
                                        <span>{formatCurrency(results.optionB.monthlyPayment)}</span>
                                    </div>
                                )}
                                {results.optionB?.breakEvenMonths !== undefined && (
                                    <div className={styles.detailRow}>
                                        <span>Break-Even</span>
                                        <span>{results.optionB.breakEvenMonths} months</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {results.breakEvenMonths && (
                        <div className={styles.summaryBox}>
                            <div className={styles.summaryIcon}>⏱️</div>
                            <div className={styles.summaryContent}>
                                <h4>Break-Even Point</h4>
                                <p>
                                    It takes <strong>{results.breakEvenMonths} months</strong> ({Math.round(results.breakEvenMonths / 12 * 10) / 10} years)
                                    for the lower monthly payment to offset the upfront cost.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
