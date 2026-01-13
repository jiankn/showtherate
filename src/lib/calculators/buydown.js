/**
 * Buydown Calculator Module
 * 
 * Supports 2-1, 3-2-1, and 1-0 temporary buydowns
 */

import { calculateMonthlyPayment } from '../calculator';

/**
 * Calculate buydown payment schedule
 * @param {Object} params - Input parameters
 * @param {number} params.loanAmount - Loan amount
 * @param {number} params.noteRate - Note rate (full rate after buydown period)
 * @param {number} params.termYears - Loan term in years
 * @param {string} params.buydownType - '2-1', '3-2-1', or '1-0'
 * @returns {Object} Buydown calculation results
 */
export function calculateBuydown({ loanAmount, noteRate, termYears = 30, buydownType = '2-1' }) {
    const schedule = getBuydownSchedule(buydownType);
    const years = [];
    let totalBuydownCost = 0;
    let totalSavings = 0;

    // Full payment at note rate
    const fullPayment = calculateMonthlyPayment(loanAmount, noteRate, termYears);

    // Calculate each year
    schedule.forEach((reduction, index) => {
        const yearRate = noteRate - reduction;
        const yearPayment = calculateMonthlyPayment(loanAmount, yearRate, termYears);
        const monthlySavings = fullPayment - yearPayment;
        const yearSavings = monthlySavings * 12;

        years.push({
            year: index + 1,
            rate: yearRate,
            monthlyPayment: round(yearPayment),
            savings: round(monthlySavings),
            yearSavings: round(yearSavings),
        });

        totalBuydownCost += yearSavings;
        totalSavings += yearSavings;
    });

    // Add note rate year for comparison
    years.push({
        year: schedule.length + 1,
        rate: noteRate,
        monthlyPayment: round(fullPayment),
        savings: 0,
        yearSavings: 0,
        isNoteRate: true,
    });

    return {
        buydownType,
        loanAmount,
        noteRate,
        termYears,
        fullMonthlyPayment: round(fullPayment),
        schedule: years,
        totalBuydownCost: round(totalBuydownCost),
        totalSavings: round(totalSavings),
        buydownPeriodMonths: schedule.length * 12,
        // For display
        year1Payment: years[0]?.monthlyPayment || fullPayment,
        year1Rate: years[0]?.rate || noteRate,
    };
}

/**
 * Calculate subsidy required for buydown
 */
export function calculateBuydownSubsidy({ loanAmount, noteRate, termYears = 30, buydownType = '2-1' }) {
    const result = calculateBuydown({ loanAmount, noteRate, termYears, buydownType });

    return {
        ...result,
        subsidyRequired: result.totalBuydownCost,
        subsidyAsPercent: round((result.totalBuydownCost / loanAmount) * 100, 2),
        // How much of a seller concession would cover this
        sellerConcessionNeeded: result.totalBuydownCost,
    };
}

/**
 * Calculate if seller concession covers buydown
 */
export function calculateSellerConcessionBuydown({
    loanAmount,
    noteRate,
    termYears = 30,
    buydownType = '2-1',
    sellerConcession = 0,
}) {
    const buydown = calculateBuydown({ loanAmount, noteRate, termYears, buydownType });
    const remaining = sellerConcession - buydown.totalBuydownCost;

    return {
        ...buydown,
        sellerConcession,
        buydownCost: buydown.totalBuydownCost,
        remainingCredit: round(Math.max(0, remaining)),
        shortfall: round(Math.max(0, -remaining)),
        coversBuydown: remaining >= 0,
        // Suggestions
        canApplyToClosingCosts: remaining > 0,
        closingCostCredit: Math.max(0, remaining),
    };
}

/**
 * Compare buydown types
 */
export function compareBuydownTypes({ loanAmount, noteRate, termYears = 30 }) {
    const types = ['1-0', '2-1', '3-2-1'];

    return types.map(type => ({
        type,
        ...calculateBuydown({ loanAmount, noteRate, termYears, buydownType: type }),
    }));
}

/**
 * Get buydown schedule (rate reductions per year)
 */
function getBuydownSchedule(type) {
    switch (type) {
        case '3-2-1':
            return [3, 2, 1]; // Year 1: -3%, Year 2: -2%, Year 3: -1%
        case '2-1':
            return [2, 1]; // Year 1: -2%, Year 2: -1%
        case '1-0':
            return [1]; // Year 1: -1%
        default:
            return [2, 1];
    }
}

function round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
