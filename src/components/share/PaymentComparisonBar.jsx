import React from 'react';
import { formatCurrency } from '@/lib/calculator';
import styles from '@/app/s/[shareId]/page.module.css';

export default function PaymentComparisonBar({ scenarios }) {
    if (scenarios.length < 2) return null;

    const outputs = scenarios.map(s => s.outputs).filter(Boolean);
    if (outputs.length < 2) return null;

    const maxPayment = Math.max(...outputs.map(o => o.monthly.total));

    return (
        <div className={styles.comparisonBar}>
            <h3 className={styles.sectionTitle}>Monthly Payment Comparison</h3>
            <div className={styles.barContainer}>
                {outputs.map((output, index) => {
                    const colors = ['#1E40AF', '#059669', '#D97706', '#7C3AED'];
                    const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
                    const width = (output.monthly.total / maxPayment) * 100;

                    return (
                        <div key={index} className={styles.barRow}>
                            <span className={styles.barLabel}>{labels[index]}</span>
                            <div className={styles.barTrack}>
                                <div
                                    className={styles.barFill}
                                    style={{ width: `${width}%`, background: colors[index] }}
                                >
                                    <span className={styles.barValue}>{formatCurrency(output.monthly.total)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {outputs.length >= 2 && (
                <div className={styles.savingsNote}>
                    {outputs[0].monthly.total > outputs[1].monthly.total ? (
                        <span>💰 Option B saves {formatCurrency(outputs[0].monthly.total - outputs[1].monthly.total)}/month</span>
                    ) : outputs[0].monthly.total < outputs[1].monthly.total ? (
                        <span>💰 Option A saves {formatCurrency(outputs[1].monthly.total - outputs[0].monthly.total)}/month</span>
                    ) : (
                        <span>Both options have the same monthly payment</span>
                    )}
                </div>
            )}
        </div>
    );
}
