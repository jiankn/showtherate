/**
 * Points Calculator Component
 * Interactive calculator for discount points break-even analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { calculatePointsBreakEven, calculatePointsCost } from '../../lib/calculators/points';
import styles from './BuydownCalculator.module.css'; // Reuse styles

export default function PointsCalculator({ config = {} }) {
    const { calculationType = 'break-even', defaultInputs = {} } = config;

    const [inputs, setInputs] = useState({
        loanAmount: defaultInputs.loanAmount || 400000,
        baseRate: defaultInputs.baseRate || 7.0,
        pointsRate: defaultInputs.pointsRate || 6.75,
        pointsCost: defaultInputs.pointsCost || 1.0,
        pointsCount: defaultInputs.pointsCount || 1.0,
        pointsPercent: defaultInputs.pointsPercent || 1.0,
        rateReduction: defaultInputs.rateReduction || 0.25,
        termYears: defaultInputs.termYears || 30,
    });

    const [results, setResults] = useState(null);

    useEffect(() => {
        calculateResults();
    }, [inputs]);

    const calculateResults = () => {
        try {
            let result;

            if (calculationType === 'cost') {
                result = calculatePointsCost({
                    loanAmount: inputs.loanAmount,
                    pointsCount: inputs.pointsCount,
                    rateReduction: inputs.rateReduction,
                });
            } else {
                // break-even, discount-points, and other types use break-even calculation
                result = calculatePointsBreakEven({
                    loanAmount: inputs.loanAmount,
                    baseRate: inputs.baseRate,
                    pointsRate: inputs.pointsRate || inputs.baseRate - (inputs.pointsPercent * inputs.rateReduction),
                    pointsCost: inputs.pointsCost || inputs.pointsPercent || 1.0,
                    termYears: inputs.termYears,
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

                    {(calculationType === 'break-even' || calculationType === 'discount-points' || calculationType === 'points-with-formula' || calculationType === 'quick-points' || calculationType === 'break-even-months' || calculationType === 'formula-focused' || calculationType === 'examples') ? (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="baseRate">Rate Without Points</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="baseRate"
                                        value={inputs.baseRate}
                                        onChange={(e) => handleInputChange('baseRate', Number(e.target.value))}
                                        min="1"
                                        max="15"
                                        step="0.125"
                                    />
                                    <span className={styles.suffix}>%</span>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="pointsRate">Rate With Points</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="pointsRate"
                                        value={inputs.pointsRate}
                                        onChange={(e) => handleInputChange('pointsRate', Number(e.target.value))}
                                        min="1"
                                        max="15"
                                        step="0.125"
                                    />
                                    <span className={styles.suffix}>%</span>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="pointsCost">Points to Buy</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="pointsCost"
                                        value={inputs.pointsCost}
                                        onChange={(e) => handleInputChange('pointsCost', Number(e.target.value))}
                                        min="0.25"
                                        max="4"
                                        step="0.25"
                                    />
                                    <span className={styles.suffix}>pts</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="pointsCount">Number of Points</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="pointsCount"
                                        value={inputs.pointsCount}
                                        onChange={(e) => handleInputChange('pointsCount', Number(e.target.value))}
                                        min="0.25"
                                        max="4"
                                        step="0.25"
                                    />
                                    <span className={styles.suffix}>pts</span>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="rateReduction">Rate Reduction per Point</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="rateReduction"
                                        value={inputs.rateReduction}
                                        onChange={(e) => handleInputChange('rateReduction', Number(e.target.value))}
                                        min="0.1"
                                        max="0.5"
                                        step="0.05"
                                    />
                                    <span className={styles.suffix}>%</span>
                                </div>
                            </div>
                        </>
                    )}

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
                    <h3 className={styles.sectionTitle}>Results</h3>

                    {(calculationType === 'break-even' || calculationType === 'discount-points' || calculationType === 'points-with-formula' || calculationType === 'quick-points' || calculationType === 'break-even-months' || calculationType === 'formula-focused' || calculationType === 'examples') ? (
                        <>
                            {/* Summary Cards */}
                            <div className={styles.summaryCards}>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Points Cost</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.totalPointsCost)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Monthly Savings</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.monthlySavings)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Break-Even</span>
                                    <span className={styles.cardValue}>{results.breakEvenMonths} mo ({results.breakEvenYears} yr)</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Rate Reduction</span>
                                    <span className={styles.cardValue}>{formatPercent(results.rateReduction)}</span>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Recommendation</h4>
                                <div className={`${styles.concessionInfo} ${results.recommendation.color === 'green' ? styles.successMessage :
                                    results.recommendation.color === 'yellow' ? styles.warningMessage : ''
                                    }`}>
                                    <strong>{results.recommendation.label}</strong>
                                    <p style={{ margin: '8px 0 0', opacity: 0.8 }}>{results.recommendation.description}</p>
                                </div>
                            </div>

                            {/* Savings Timeline */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Savings Timeline</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Timeline</span>
                                        <span>Net Savings</span>
                                        <span>Verdict</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>At 5 Years</span>
                                        <span className={results.savingsAt5Years > 0 ? styles.savings : ''}>{formatCurrency(results.savingsAt5Years)}</span>
                                        <span>{results.savingsAt5Years > 0 ? '✅ Worth it' : '❌ Not yet'}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>At 10 Years</span>
                                        <span className={results.savingsAt10Years > 0 ? styles.savings : ''}>{formatCurrency(results.savingsAt10Years)}</span>
                                        <span>{results.savingsAt10Years > 0 ? '✅ Worth it' : '❌ Not yet'}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Full Term</span>
                                        <span className={results.totalSavingsIfKept > 0 ? styles.savings : ''}>{formatCurrency(results.totalSavingsIfKept)}</span>
                                        <span>{results.totalSavingsIfKept > 0 ? '✅ Worth it' : '❌ Not worth'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Cost Calculator Results */}
                            <div className={styles.summaryCards}>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Total Points Cost</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.totalCost)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Cost Per Point</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.costPerPoint)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Points Bought</span>
                                    <span className={styles.cardValue}>{results.pointsCount}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Est. Rate Reduction</span>
                                    <span className={styles.cardValue}>{formatPercent(results.rateReduction)}</span>
                                </div>
                            </div>

                            {/* Scenarios */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Points Scenarios</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Points</span>
                                        <span>Cost</span>
                                        <span>Est. Rate Reduction</span>
                                    </div>
                                    {results.scenarios.map((scenario) => (
                                        <div key={scenario.points} className={styles.scheduleRow}>
                                            <span>{scenario.points} pts</span>
                                            <span>{formatCurrency(scenario.cost)}</span>
                                            <span>~{formatPercent(scenario.estimatedRateReduction)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
