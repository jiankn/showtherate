/**
 * Workflow Calculator Component
 * Interactive calculator for closing costs and cash to close
 */

'use client';

import { useState, useEffect } from 'react';
import { calculateClosingCosts, calculateCashToClose } from '../../lib/calculators/workflow';
import styles from './BuydownCalculator.module.css'; // Reuse styles

export default function WorkflowCalculator({ config = {} }) {
    const { calculationType = 'closing-costs', defaultInputs = {} } = config;

    const [inputs, setInputs] = useState({
        loanAmount: defaultInputs.loanAmount || 400000,
        homePrice: defaultInputs.homePrice || 500000,
        state: defaultInputs.state || 'CA',
        downPaymentPercent: defaultInputs.downPaymentPercent || 20,
        closingCostPercent: defaultInputs.closingCostPercent || 3,
        sellerCredit: defaultInputs.sellerCredit || 0,
        lenderCredit: defaultInputs.lenderCredit || 0,
        earnestMoneyDeposit: defaultInputs.earnestMoneyDeposit || 0,
    });

    const [results, setResults] = useState(null);

    useEffect(() => {
        calculateResults();
    }, [inputs]);

    const calculateResults = () => {
        try {
            let result;

            if (calculationType === 'cash-to-close') {
                result = calculateCashToClose({
                    homePrice: inputs.homePrice,
                    downPaymentPercent: inputs.downPaymentPercent,
                    closingCostPercent: inputs.closingCostPercent,
                    sellerCredit: inputs.sellerCredit,
                    lenderCredit: inputs.lenderCredit,
                    earnestMoneyDeposit: inputs.earnestMoneyDeposit,
                });
            } else {
                // closing-costs
                result = calculateClosingCosts({
                    loanAmount: inputs.loanAmount,
                    homePrice: inputs.homePrice,
                    state: inputs.state,
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

    const states = ['CA', 'TX', 'FL', 'NY', 'WA', 'CO', 'AZ'];

    return (
        <div className={styles.calculator}>
            {/* Input Section */}
            <div className={styles.inputSection}>
                <h3 className={styles.sectionTitle}>
                    {calculationType === 'closing-costs' ? 'Property Details' : 'Purchase Details'}
                </h3>

                <div className={styles.inputGrid}>
                    {calculationType === 'closing-costs' ? (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="homePrice">Home Price</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.prefix}>$</span>
                                    <input
                                        type="number"
                                        id="homePrice"
                                        value={inputs.homePrice}
                                        onChange={(e) => handleInputChange('homePrice', Number(e.target.value))}
                                        min="50000"
                                        max="10000000"
                                        step="10000"
                                    />
                                </div>
                            </div>

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
                                <label htmlFor="state">State</label>
                                <select
                                    id="state"
                                    value={inputs.state}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                >
                                    {states.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="homePrice">Home Price</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.prefix}>$</span>
                                    <input
                                        type="number"
                                        id="homePrice"
                                        value={inputs.homePrice}
                                        onChange={(e) => handleInputChange('homePrice', Number(e.target.value))}
                                        min="50000"
                                        max="10000000"
                                        step="10000"
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="downPaymentPercent">Down Payment</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="downPaymentPercent"
                                        value={inputs.downPaymentPercent}
                                        onChange={(e) => handleInputChange('downPaymentPercent', Number(e.target.value))}
                                        min="0"
                                        max="50"
                                        step="1"
                                    />
                                    <span className={styles.suffix}>%</span>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="closingCostPercent">Est. Closing Costs</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        id="closingCostPercent"
                                        value={inputs.closingCostPercent}
                                        onChange={(e) => handleInputChange('closingCostPercent', Number(e.target.value))}
                                        min="1"
                                        max="6"
                                        step="0.5"
                                    />
                                    <span className={styles.suffix}>%</span>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="sellerCredit">Seller Credit</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.prefix}>$</span>
                                    <input
                                        type="number"
                                        id="sellerCredit"
                                        value={inputs.sellerCredit}
                                        onChange={(e) => handleInputChange('sellerCredit', Number(e.target.value))}
                                        min="0"
                                        max="100000"
                                        step="1000"
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="lenderCredit">Lender Credit</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.prefix}>$</span>
                                    <input
                                        type="number"
                                        id="lenderCredit"
                                        value={inputs.lenderCredit}
                                        onChange={(e) => handleInputChange('lenderCredit', Number(e.target.value))}
                                        min="0"
                                        max="50000"
                                        step="500"
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="earnestMoneyDeposit">Earnest Money Deposit</label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.prefix}>$</span>
                                    <input
                                        type="number"
                                        id="earnestMoneyDeposit"
                                        value={inputs.earnestMoneyDeposit}
                                        onChange={(e) => handleInputChange('earnestMoneyDeposit', Number(e.target.value))}
                                        min="0"
                                        max="100000"
                                        step="1000"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className={styles.resultsSection}>
                    <h3 className={styles.sectionTitle}>Results</h3>

                    {calculationType === 'closing-costs' ? (
                        <>
                            {/* Summary Cards */}
                            <div className={styles.summaryCards}>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Total Closing Costs</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.totalClosingCosts)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>As % of Loan</span>
                                    <span className={styles.cardValue}>{formatPercent(results.closingCostPercent)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Lender Fees</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.lenderFees.total)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Third Party</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.thirdPartyFees.total)}</span>
                                </div>
                            </div>

                            {/* Lender Fees Breakdown */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Lender Fees</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Fee</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Origination Fee</span>
                                        <span>{formatCurrency(results.lenderFees.originationFee)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Underwriting Fee</span>
                                        <span>{formatCurrency(results.lenderFees.underwritingFee)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Processing Fee</span>
                                        <span>{formatCurrency(results.lenderFees.processingFee)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Credit Report</span>
                                        <span>{formatCurrency(results.lenderFees.creditReport)}</span>
                                    </div>
                                    <div className={`${styles.scheduleRow} ${styles.noteRateRow}`}>
                                        <span><strong>Subtotal</strong></span>
                                        <span><strong>{formatCurrency(results.lenderFees.total)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Third Party Fees */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Third Party Fees</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Fee</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Appraisal</span>
                                        <span>{formatCurrency(results.thirdPartyFees.appraisal)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Title Search</span>
                                        <span>{formatCurrency(results.thirdPartyFees.titleSearch)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Title Insurance</span>
                                        <span>{formatCurrency(results.thirdPartyFees.titleInsurance)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Escrow Fee</span>
                                        <span>{formatCurrency(results.thirdPartyFees.escrowFee)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Transfer Tax</span>
                                        <span>{formatCurrency(results.thirdPartyFees.transferTax)}</span>
                                    </div>
                                    <div className={`${styles.scheduleRow} ${styles.noteRateRow}`}>
                                        <span><strong>Subtotal</strong></span>
                                        <span><strong>{formatCurrency(results.thirdPartyFees.total)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Prepaid Items */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Prepaid Items</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Item</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Homeowners Insurance (1 yr)</span>
                                        <span>{formatCurrency(results.prepaidItems.homeownersInsurance)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Property Tax Escrow (3 mo)</span>
                                        <span>{formatCurrency(results.prepaidItems.propertyTaxEscrow)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Insurance Escrow (2 mo)</span>
                                        <span>{formatCurrency(results.prepaidItems.homeownersInsuranceEscrow)}</span>
                                    </div>
                                    <div className={styles.scheduleRow}>
                                        <span>Prepaid Interest (~15 days)</span>
                                        <span>{formatCurrency(results.prepaidItems.prepaidInterest)}</span>
                                    </div>
                                    <div className={`${styles.scheduleRow} ${styles.noteRateRow}`}>
                                        <span><strong>Subtotal</strong></span>
                                        <span><strong>{formatCurrency(results.prepaidItems.total)}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Cash to Close Summary */}
                            <div className={styles.summaryCards}>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Cash to Close</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.cashToClose)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Down Payment</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.downPayment)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Closing Costs</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.closingCosts)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.cardLabel}>Total Credits</span>
                                    <span className={styles.cardValue}>{formatCurrency(results.credits.total)}</span>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Cash to Close Breakdown</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Item</span>
                                        <span>Amount</span>
                                    </div>
                                    {results.breakdown.map((item, idx) => (
                                        <div key={idx} className={styles.scheduleRow}>
                                            <span>{item.item}</span>
                                            <span className={item.type === 'credit' ? styles.savings : ''}>
                                                {item.type === 'credit' && item.amount !== 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                                            </span>
                                        </div>
                                    ))}
                                    <div className={`${styles.scheduleRow} ${styles.noteRateRow}`}>
                                        <span><strong>Total Cash to Close</strong></span>
                                        <span><strong>{formatCurrency(results.cashToClose)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Down Payment Scenarios */}
                            <div className={styles.scheduleSection}>
                                <h4 className={styles.scheduleTitle}>Down Payment Scenarios</h4>
                                <div className={styles.scheduleTable}>
                                    <div className={styles.scheduleHeader}>
                                        <span>Down Payment</span>
                                        <span>Amount</span>
                                        <span>Cash to Close</span>
                                    </div>
                                    {results.scenarios.map((scenario) => (
                                        <div
                                            key={scenario.downPaymentPercent}
                                            className={`${styles.scheduleRow} ${scenario.downPaymentPercent === inputs.downPaymentPercent ? styles.noteRateRow : ''}`}
                                        >
                                            <span>{scenario.downPaymentPercent}%</span>
                                            <span>{formatCurrency(scenario.downPayment)}</span>
                                            <span>{formatCurrency(scenario.cashToClose)}</span>
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
