import React from 'react';
import { formatCurrency } from '@/lib/calculator';
import styles from '@/app/s/[shareId]/page.module.css';

export default function LongTermComparison({ scenarios }) {
    if (scenarios.length < 2) return null;

    const outputs = scenarios.map(s => s.outputs).filter(Boolean);
    if (outputs.length < 2) return null;

    const labels = ['Option A', 'Option B', 'Option C', 'Option D'];

    return (
        <div className={styles.longTermSection}>
            <h3 className={styles.sectionTitle}>Long-Term Cost Comparison</h3>

            <div className={styles.longTermGrid}>
                <div className={styles.longTermCard}>
                    <h4>5-Year Totals</h4>
                    <div className={styles.longTermRows}>
                        {outputs.slice(0, 2).map((output, index) => (
                            <div key={index} className={styles.longTermRow}>
                                <span>{labels[index]}</span>
                                <span className="number">{formatCurrency(output.projections.year5.totalPaid)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.longTermDiff}>
                        Difference: {formatCurrency(Math.abs(outputs[0].projections.year5.totalPaid - outputs[1].projections.year5.totalPaid))}
                    </div>
                </div>

                <div className={styles.longTermCard}>
                    <h4>10-Year Totals</h4>
                    <div className={styles.longTermRows}>
                        {outputs.slice(0, 2).map((output, index) => (
                            <div key={index} className={styles.longTermRow}>
                                <span>{labels[index]}</span>
                                <span className="number">{formatCurrency(output.projections.year10.totalPaid)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.longTermDiff}>
                        Difference: {formatCurrency(Math.abs(outputs[0].projections.year10.totalPaid - outputs[1].projections.year10.totalPaid))}
                    </div>
                </div>
            </div>
        </div>
    );
}
