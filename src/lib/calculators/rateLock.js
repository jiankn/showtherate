/**
 * Rate Lock Calculator Module
 * 
 * Calculates lock fees, extension costs, and lock vs float analysis
 */

import { calculateMonthlyPayment } from '../calculator';

/**
 * Standard lock fee structure (in basis points / bps)
 * These are typical industry averages, actual fees vary by lender
 */
const LOCK_FEE_SCHEDULE = {
    15: 0,        // 15-day lock: usually free
    30: 0,        // 30-day lock: usually free
    45: 0.125,    // 45-day lock: ~0.125%
    60: 0.25,     // 60-day lock: ~0.25%
    90: 0.375,    // 90-day lock: ~0.375%
    120: 0.50,    // 120-day lock: ~0.50%
};

/**
 * Extension fee per week (typical)
 */
const EXTENSION_FEE_PER_WEEK = 0.125; // 0.125% per week

/**
 * Calculate rate lock fee
 */
export function calculateLockFee({
    loanAmount,
    lockDays = 30,
}) {
    // Find the appropriate fee tier
    const tiers = Object.keys(LOCK_FEE_SCHEDULE).map(Number).sort((a, b) => a - b);
    let feePercent = 0;

    for (const tier of tiers) {
        if (lockDays <= tier) {
            feePercent = LOCK_FEE_SCHEDULE[tier];
            break;
        }
        feePercent = LOCK_FEE_SCHEDULE[tier];
    }

    const lockFee = loanAmount * (feePercent / 100);

    return {
        loanAmount,
        lockDays,
        feePercent: round(feePercent, 3),
        lockFee: round(lockFee),
        // Compare different lock periods
        comparison: tiers.map(days => ({
            days,
            feePercent: LOCK_FEE_SCHEDULE[days],
            fee: round(loanAmount * (LOCK_FEE_SCHEDULE[days] / 100)),
        })),
    };
}

/**
 * Calculate rate lock extension fee
 */
export function calculateExtensionFee({
    loanAmount,
    extensionDays = 7,
    currentLockExpired = false,
}) {
    const weeks = Math.ceil(extensionDays / 7);
    const feePercent = weeks * EXTENSION_FEE_PER_WEEK;
    const extensionFee = loanAmount * (feePercent / 100);

    // Some lenders charge more if lock already expired
    const expiredPenalty = currentLockExpired ? 0.125 : 0;
    const totalFeePercent = feePercent + expiredPenalty;
    const totalFee = loanAmount * (totalFeePercent / 100);

    return {
        loanAmount,
        extensionDays,
        weeks,
        feePercent: round(feePercent, 3),
        extensionFee: round(extensionFee),
        expiredPenalty: round(expiredPenalty, 3),
        totalFeePercent: round(totalFeePercent, 3),
        totalFee: round(totalFee),
        // Common extension scenarios
        scenarios: [7, 14, 21].map(days => ({
            days,
            weeks: Math.ceil(days / 7),
            feePercent: round(Math.ceil(days / 7) * EXTENSION_FEE_PER_WEEK, 3),
            fee: round(loanAmount * (Math.ceil(days / 7) * EXTENSION_FEE_PER_WEEK / 100)),
        })),
    };
}

/**
 * Compare locking now vs floating
 */
export function compareLockVsFloat({
    loanAmount,
    termYears = 30,
    currentRate,
    lockDays = 30,
    expectedRateChange = 0, // Positive = rates go up, Negative = rates go down
}) {
    const lockedPayment = calculateMonthlyPayment(loanAmount, currentRate, termYears);
    const floatRate = currentRate + expectedRateChange;
    const floatPayment = calculateMonthlyPayment(loanAmount, floatRate, termYears);

    const lockFeeData = calculateLockFee({ loanAmount, lockDays });

    const paymentDiff = floatPayment - lockedPayment;
    const totalPayments = termYears * 12;
    const lifetimeDiff = paymentDiff * totalPayments;

    return {
        lock: {
            rate: currentRate,
            monthlyPayment: round(lockedPayment),
            lockFee: lockFeeData.lockFee,
            totalWithFee: round(lockedPayment + (lockFeeData.lockFee / totalPayments)),
        },
        float: {
            currentRate,
            expectedRate: round(floatRate, 3),
            expectedChange: expectedRateChange,
            monthlyPayment: round(floatPayment),
        },
        comparison: {
            monthlyDifference: round(paymentDiff),
            lifetimeDifference: round(lifetimeDiff),
            recommendation: getFloatRecommendation(expectedRateChange, lockFeeData.lockFee, lifetimeDiff),
        },
        // Scenario analysis
        scenarios: [-0.5, -0.25, 0, 0.25, 0.5].map(change => {
            const scenarioRate = currentRate + change;
            const scenarioPayment = calculateMonthlyPayment(loanAmount, scenarioRate, termYears);
            const diff = scenarioPayment - lockedPayment;
            return {
                rateChange: change,
                newRate: round(scenarioRate, 3),
                monthlyPayment: round(scenarioPayment),
                monthlyImpact: round(diff),
                lifetimeImpact: round(diff * totalPayments),
                verdict: diff > 0 ? 'Lock wins' : diff < 0 ? 'Float wins' : 'Even',
            };
        }),
    };
}

/**
 * Calculate float down option value
 */
export function calculateFloatDownValue({
    loanAmount,
    termYears = 30,
    lockedRate,
    floatDownFee = 0.25, // Percent of loan
    expectedRateDrop = 0.25,
    holdingPeriodYears = 7,
}) {
    const feeCost = loanAmount * (floatDownFee / 100);

    const lockedPayment = calculateMonthlyPayment(loanAmount, lockedRate, termYears);
    const floatDownRate = lockedRate - expectedRateDrop;
    const floatDownPayment = calculateMonthlyPayment(loanAmount, floatDownRate, termYears);

    const monthlySavings = lockedPayment - floatDownPayment;
    const holdingMonths = holdingPeriodYears * 12;
    const totalSavings = monthlySavings * holdingMonths;
    const netSavings = totalSavings - feeCost;

    // Break-even rate drop needed
    const minRateDropForBreakEven = calculateMinRateDropForBreakEven({
        loanAmount,
        termYears,
        lockedRate,
        floatDownFee,
        holdingPeriodYears,
    });

    return {
        loanAmount,
        lockedRate,
        floatDownFee,
        feeCost: round(feeCost),
        expectedRateDrop,
        floatDownRate: round(floatDownRate, 3),
        lockedPayment: round(lockedPayment),
        floatDownPayment: round(floatDownPayment),
        monthlySavings: round(monthlySavings),
        holdingPeriodYears,
        totalSavings: round(totalSavings),
        netSavings: round(netSavings),
        isWorthIt: netSavings > 0,
        minRateDropForBreakEven: round(minRateDropForBreakEven, 3),
        // Different rate drop scenarios
        scenarios: [0.125, 0.25, 0.375, 0.5, 0.75, 1.0].map(drop => {
            const newRate = lockedRate - drop;
            const newPayment = calculateMonthlyPayment(loanAmount, newRate, termYears);
            const savings = (lockedPayment - newPayment) * holdingMonths - feeCost;
            return {
                rateDrop: drop,
                newRate: round(newRate, 3),
                newPayment: round(newPayment),
                netSavings: round(savings),
                worthIt: savings > 0,
            };
        }),
    };
}

/**
 * Calculate minimum rate drop needed for float down to break even
 */
function calculateMinRateDropForBreakEven({
    loanAmount,
    termYears,
    lockedRate,
    floatDownFee,
    holdingPeriodYears,
}) {
    const feeCost = loanAmount * (floatDownFee / 100);
    const lockedPayment = calculateMonthlyPayment(loanAmount, lockedRate, termYears);
    const holdingMonths = holdingPeriodYears * 12;

    // Binary search for the rate drop
    let low = 0;
    let high = 2; // Max 2% drop to search

    while (high - low > 0.001) {
        const mid = (low + high) / 2;
        const testPayment = calculateMonthlyPayment(loanAmount, lockedRate - mid, termYears);
        const savings = (lockedPayment - testPayment) * holdingMonths;

        if (savings < feeCost) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return (low + high) / 2;
}

/**
 * Get float recommendation
 */
function getFloatRecommendation(expectedChange, lockFee, lifetimeDiff) {
    if (expectedChange > 0.25) {
        return {
            action: 'Lock',
            reason: 'Rates expected to rise significantly. Lock now to protect your rate.',
            confidence: 'High',
        };
    } else if (expectedChange < -0.25) {
        return {
            action: 'Float',
            reason: 'Rates expected to drop significantly. Consider floating to get a better rate.',
            confidence: 'Medium',
        };
    } else {
        return {
            action: 'Lock',
            reason: 'Uncertain market. Locking provides certainty and peace of mind.',
            confidence: 'Low',
        };
    }
}

function round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
