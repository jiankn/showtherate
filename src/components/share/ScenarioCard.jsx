import React from 'react';
import { formatCurrency, formatPercent } from '@/lib/calculator';
import styles from '@/app/s/[shareId]/page.module.css';

export default function ScenarioCard({ scenario, index }) {
    const colors = ['a', 'b', 'c', 'd'];
    const colorClass = colors[index % colors.length];
    const labels = ['Option A', 'Option B', 'Option C', 'Option D'];

    const outputs = scenario.outputs;
    if (!outputs) return null;

    // Capitalize Card class: cardA, cardB...
    const cardClassProperty = `card${colorClass.toUpperCase()}`;

    return (
        <div className={`${styles.card} ${styles[cardClassProperty]}`}>
            <div className={styles.cardHeader}>
                <span className={styles.cardBadge}>{labels[index]}</span>
                <span className={styles.loanType}>{scenario.inputs.loanType?.toUpperCase() || 'LOAN'}</span>
            </div>

            <div className={styles.mainAmount}>
                <span className={`${styles.amount} number-display`}>{formatCurrency(outputs.monthly.total)}</span>
                <span className={styles.amountLabel}>/month</span>
            </div>

            <div className={styles.rateTermRow}>
                <span>{formatPercent(scenario.inputs.interestRate)} APR</span>
                <span>•</span>
                <span>{scenario.inputs.termYears}-year Fixed</span>
            </div>

            <div className={styles.breakdown}>
                <div className={styles.breakdownItem}>
                    <span>Principal & Interest</span>
                    <span className="number">{formatCurrency(outputs.monthly.principalInterest)}</span>
                </div>
                <div className={styles.breakdownItem}>
                    <span>Property Tax</span>
                    <span className="number">{formatCurrency(outputs.monthly.propertyTax)}</span>
                </div>
                <div className={styles.breakdownItem}>
                    <span>Insurance</span>
                    <span className="number">{formatCurrency(outputs.monthly.insurance)}</span>
                </div>
                {outputs.monthly.hoa > 0 && (
                    <div className={styles.breakdownItem}>
                        <span>HOA</span>
                        <span className="number">{formatCurrency(outputs.monthly.hoa)}</span>
                    </div>
                )}
                {outputs.monthly.pmi > 0 && (
                    <div className={styles.breakdownItem}>
                        <span>PMI</span>
                        <span className="number">{formatCurrency(outputs.monthly.pmi)}</span>
                    </div>
                )}
                {outputs.monthly.mip > 0 && (
                    <div className={styles.breakdownItem}>
                        <span>MIP</span>
                        <span className="number">{formatCurrency(outputs.monthly.mip)}</span>
                    </div>
                )}
            </div>

            <div className={styles.cashToClose}>
                <span>Cash to Close</span>
                <span className="number">{formatCurrency(outputs.closing.cashToClose)}</span>
            </div>

            <div className={styles.loanInfo}>
                <div>
                    <span className={styles.infoLabel}>Home Price</span>
                    <span className="number">{formatCurrency(scenario.inputs.homePrice)}</span>
                </div>
                <div>
                    <span className={styles.infoLabel}>Loan Amount</span>
                    <span className="number">{formatCurrency(outputs.loan.totalLoanAmount)}</span>
                </div>
                <div>
                    <span className={styles.infoLabel}>Down Payment</span>
                    <span className="number">{formatPercent(scenario.inputs.downPaymentPercent, 0)}</span>
                </div>
            </div>
        </div>
    );
}
