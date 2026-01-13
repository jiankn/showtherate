/**
 * Points Calculator Module
 * 
 * Calculates discount points costs, break-even analysis, and comparisons
 */

import { calculateMonthlyPayment } from '../calculator';

/**
 * Calculate discount points break-even
 * @param {Object} params - Input parameters
 * @param {number} params.loanAmount - Loan amount
 * @param {number} params.baseRate - Rate without points
 * @param {number} params.pointsRate - Rate with points
 * @param {number} params.pointsCost - Points percentage (e.g., 1 = 1 point = 1% of loan)
 * @param {number} params.termYears - Loan term
 * @returns {Object} Break-even analysis
 */
export function calculatePointsBreakEven({
    loanAmount,
    baseRate,
    pointsRate,
    pointsCost = 1,
    termYears = 30,
}) {
    const basePayment = calculateMonthlyPayment(loanAmount, baseRate, termYears);
    const pointsPayment = calculateMonthlyPayment(loanAmount, pointsRate, termYears);
    const monthlySavings = basePayment - pointsPayment;

    const totalPointsCost = loanAmount * (pointsCost / 100);

    // Break-even in months
    const breakEvenMonths = monthlySavings > 0
        ? Math.ceil(totalPointsCost / monthlySavings)
        : Infinity;

    const breakEvenYears = round(breakEvenMonths / 12, 1);

    // Total savings over loan term
    const totalPayments = termYears * 12;
    const totalSavingsIfKept = (monthlySavings * totalPayments) - totalPointsCost;

    // Savings at different time horizons
    const savingsAt5Years = (monthlySavings * 60) - totalPointsCost;
    const savingsAt10Years = (monthlySavings * 120) - totalPointsCost;

    return {
        loanAmount,
        baseRate,
        pointsRate,
        rateReduction: round(baseRate - pointsRate, 3),
        pointsCost,
        totalPointsCost: round(totalPointsCost),
        basePayment: round(basePayment),
        pointsPayment: round(pointsPayment),
        monthlySavings: round(monthlySavings),
        breakEvenMonths,
        breakEvenYears,
        isWorthIt: breakEvenMonths < totalPayments,
        totalSavingsIfKept: round(totalSavingsIfKept),
        savingsAt5Years: round(savingsAt5Years),
        savingsAt10Years: round(savingsAt10Years),
        // Recommendations
        recommendation: getPointsRecommendation(breakEvenMonths),
    };
}

/**
 * Calculate the cost of points
 */
export function calculatePointsCost({
    loanAmount,
    pointsCount = 1,
    rateReduction = 0.25,
}) {
    const cost = loanAmount * (pointsCount / 100);

    return {
        loanAmount,
        pointsCount,
        rateReduction,
        totalCost: round(cost),
        costPerPoint: round(loanAmount / 100),
        // Common scenarios
        scenarios: [0.5, 1, 1.5, 2].map(points => ({
            points,
            cost: round(loanAmount * (points / 100)),
            estimatedRateReduction: round(points * 0.25, 3),
        })),
    };
}

/**
 * Compare points vs lender credits
 */
export function comparePointsVsCredits({
    loanAmount,
    termYears = 30,
    pointsRate,
    pointsCost,
    creditsRate,
    creditsAmount,
}) {
    const pointsPayment = calculateMonthlyPayment(loanAmount, pointsRate, termYears);
    const creditsPayment = calculateMonthlyPayment(loanAmount, creditsRate, termYears);

    const pointsTotalCost = loanAmount * (pointsCost / 100);
    const monthlyDiff = creditsPayment - pointsPayment;

    // Net upfront difference (credits reduce, points increase)
    const upfrontDiff = pointsTotalCost + creditsAmount;

    // Break-even for choosing points over credits
    const breakEvenMonths = monthlyDiff > 0
        ? Math.ceil(upfrontDiff / monthlyDiff)
        : Infinity;

    // Total cost comparison at different horizons
    const compare = (months) => {
        const pointsTotal = (pointsPayment * months) + pointsTotalCost;
        const creditsTotal = (creditsPayment * months) - creditsAmount;
        return {
            months,
            years: round(months / 12, 1),
            pointsTotal: round(pointsTotal),
            creditsTotal: round(creditsTotal),
            difference: round(creditsTotal - pointsTotal),
            betterOption: pointsTotal < creditsTotal ? 'points' : 'credits',
        };
    };

    return {
        points: {
            rate: pointsRate,
            cost: round(pointsTotalCost),
            monthlyPayment: round(pointsPayment),
        },
        credits: {
            rate: creditsRate,
            amount: creditsAmount,
            monthlyPayment: round(creditsPayment),
        },
        monthlyDifference: round(monthlyDiff),
        breakEvenMonths,
        breakEvenYears: round(breakEvenMonths / 12, 1),
        comparisons: [36, 60, 84, 120, 180, 360].map(compare),
    };
}

/**
 * Compare points vs no points (higher rate)
 */
export function comparePointsVsHigherRate({
    loanAmount,
    termYears = 30,
    pointsRate,
    pointsCost,
    noPointsRate,
}) {
    return calculatePointsBreakEven({
        loanAmount,
        baseRate: noPointsRate,
        pointsRate,
        pointsCost,
        termYears,
    });
}

/**
 * Get recommendation based on break-even
 */
function getPointsRecommendation(breakEvenMonths) {
    if (breakEvenMonths <= 24) {
        return {
            label: 'Strongly Recommended',
            description: 'You\'ll break even quickly. Great if you plan to stay.',
            color: 'green',
        };
    } else if (breakEvenMonths <= 48) {
        return {
            label: 'Recommended',
            description: 'Reasonable break-even. Good if staying 4+ years.',
            color: 'green',
        };
    } else if (breakEvenMonths <= 84) {
        return {
            label: 'Consider Carefully',
            description: 'Long break-even. Only worth it if staying 7+ years.',
            color: 'yellow',
        };
    } else {
        return {
            label: 'Not Recommended',
            description: 'Very long break-even. Consider skipping points or refinancing later.',
            color: 'red',
        };
    }
}

function round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
