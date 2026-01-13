/**
 * Workflow Calculator Module
 * 
 * LO workflow tools: closing costs, cash to close, MI estimates
 */

import { calculateMonthlyPayment, DEFAULT_VALUES } from '../calculator';

/**
 * State-specific tax rates and fees (simplified)
 */
const STATE_DATA = {
    CA: { transferTax: 0.11, recordingFee: 75, docStamps: 0 },
    TX: { transferTax: 0, recordingFee: 50, docStamps: 0 },
    FL: { transferTax: 0.70, recordingFee: 10, docStamps: 0.35 },
    NY: { transferTax: 0.40, recordingFee: 75, docStamps: 0.50 },
    WA: { transferTax: 1.28, recordingFee: 85, docStamps: 0 },
    CO: { transferTax: 0.01, recordingFee: 50, docStamps: 0 },
    AZ: { transferTax: 0, recordingFee: 30, docStamps: 0 },
    // Default for other states
    DEFAULT: { transferTax: 0.20, recordingFee: 50, docStamps: 0 },
};

/**
 * Calculate detailed closing costs worksheet
 */
export function calculateClosingCosts({
    loanAmount,
    homePrice,
    state = 'CA',
    loanType = 'conventional',
    isRefinance = false,
}) {
    const stateData = STATE_DATA[state] || STATE_DATA.DEFAULT;

    // Lender Fees (Section A)
    const lenderFees = {
        originationFee: round(loanAmount * 0.01), // 1% typical
        underwritingFee: 995,
        processingFee: 495,
        creditReport: 65,
        floodCertification: 25,
        taxService: 85,
        total: 0,
    };
    lenderFees.total = round(
        lenderFees.originationFee +
        lenderFees.underwritingFee +
        lenderFees.processingFee +
        lenderFees.creditReport +
        lenderFees.floodCertification +
        lenderFees.taxService
    );

    // Third Party Fees (Section B)
    const thirdPartyFees = {
        appraisal: 550,
        titleSearch: 250,
        titleInsurance: round(loanAmount * 0.005), // ~0.5%
        escrowFee: round(homePrice * 0.002), // ~0.2%
        notaryFee: 200,
        recordingFee: stateData.recordingFee,
        transferTax: round(homePrice * (stateData.transferTax / 100)),
        survey: isRefinance ? 0 : 450,
        total: 0,
    };
    thirdPartyFees.total = round(
        thirdPartyFees.appraisal +
        thirdPartyFees.titleSearch +
        thirdPartyFees.titleInsurance +
        thirdPartyFees.escrowFee +
        thirdPartyFees.notaryFee +
        thirdPartyFees.recordingFee +
        thirdPartyFees.transferTax +
        thirdPartyFees.survey
    );

    // Prepaid Items (Section C)
    const annualTax = homePrice * DEFAULT_VALUES.PROPERTY_TAX_RATE;
    const annualInsurance = homePrice * DEFAULT_VALUES.INSURANCE_RATE;
    const dailyInterest = (loanAmount * 0.07) / 365; // Assume 7% rate

    const prepaidItems = {
        homeownersInsurance: round(annualInsurance), // 1 year upfront
        propertyTaxEscrow: round(annualTax / 12 * 3), // 3 months
        homeownersInsuranceEscrow: round(annualInsurance / 12 * 2), // 2 months
        prepaidInterest: round(dailyInterest * 15), // ~15 days
        total: 0,
    };
    prepaidItems.total = round(
        prepaidItems.homeownersInsurance +
        prepaidItems.propertyTaxEscrow +
        prepaidItems.homeownersInsuranceEscrow +
        prepaidItems.prepaidInterest
    );

    // Total Closing Costs
    const totalClosingCosts = round(
        lenderFees.total + thirdPartyFees.total + prepaidItems.total
    );

    const closingCostPercent = round((totalClosingCosts / loanAmount) * 100, 2);

    return {
        loanAmount,
        homePrice,
        state,
        lenderFees,
        thirdPartyFees,
        prepaidItems,
        totalClosingCosts,
        closingCostPercent,
        // Summary
        breakdown: [
            { category: 'Lender Fees', amount: lenderFees.total },
            { category: 'Third Party Fees', amount: thirdPartyFees.total },
            { category: 'Prepaid Items', amount: prepaidItems.total },
        ],
    };
}

/**
 * Calculate cash to close
 */
export function calculateCashToClose({
    homePrice,
    downPaymentPercent = 20,
    closingCostPercent = 3,
    sellerCredit = 0,
    lenderCredit = 0,
    earnestMoneyDeposit = 0,
}) {
    const loanAmount = homePrice * (1 - downPaymentPercent / 100);
    const downPayment = homePrice * (downPaymentPercent / 100);
    const closingCosts = loanAmount * (closingCostPercent / 100);

    const totalCredits = sellerCredit + lenderCredit + earnestMoneyDeposit;

    const cashToClose = downPayment + closingCosts - totalCredits;

    return {
        homePrice,
        downPaymentPercent,
        downPayment: round(downPayment),
        loanAmount: round(loanAmount),
        closingCostPercent,
        closingCosts: round(closingCosts),
        credits: {
            sellerCredit,
            lenderCredit,
            earnestMoneyDeposit,
            total: round(totalCredits),
        },
        cashToClose: round(Math.max(0, cashToClose)),
        // Breakdown for display
        breakdown: [
            { item: 'Down Payment', amount: round(downPayment), type: 'debit' },
            { item: 'Estimated Closing Costs', amount: round(closingCosts), type: 'debit' },
            { item: 'Seller Credit', amount: -sellerCredit, type: 'credit' },
            { item: 'Lender Credit', amount: -lenderCredit, type: 'credit' },
            { item: 'Earnest Money Deposit', amount: -earnestMoneyDeposit, type: 'credit' },
        ],
        // What-if scenarios
        scenarios: [5, 10, 15, 20].map(dp => {
            const dpAmount = homePrice * (dp / 100);
            const loan = homePrice - dpAmount;
            const cc = loan * (closingCostPercent / 100);
            return {
                downPaymentPercent: dp,
                downPayment: round(dpAmount),
                closingCosts: round(cc),
                cashToClose: round(dpAmount + cc - totalCredits),
            };
        }),
    };
}

/**
 * Calculate mortgage insurance estimate
 */
export function calculateMIEstimate({
    loanAmount,
    homePrice,
    loanType = 'conventional',
    creditScore = 740,
    termYears = 30,
}) {
    const ltv = (loanAmount / homePrice) * 100;

    let monthlyMI = 0;
    let upfrontMI = 0;
    let miType = '';

    if (loanType === 'conventional' && ltv > 80) {
        // PMI based on LTV and credit score
        const pmiRate = getPMIRate(ltv, creditScore);
        monthlyMI = (loanAmount * pmiRate) / 12;
        miType = 'PMI';
    } else if (loanType === 'fha') {
        // FHA MIP
        upfrontMI = loanAmount * 0.0175; // 1.75%
        monthlyMI = (loanAmount * 0.0055) / 12; // 0.55% annually
        miType = 'FHA MIP';
    } else if (loanType === 'va') {
        // VA Funding Fee (one-time, can be financed)
        upfrontMI = loanAmount * 0.023; // 2.3% first use
        monthlyMI = 0;
        miType = 'VA Funding Fee';
    } else if (loanType === 'usda') {
        // USDA Guarantee Fee
        upfrontMI = loanAmount * 0.01; // 1%
        monthlyMI = (loanAmount * 0.0035) / 12; // 0.35% annually
        miType = 'USDA Guarantee Fee';
    }

    // When does PMI drop off (Conventional only)
    let pmiDropoffInfo = null;
    if (loanType === 'conventional' && ltv > 80) {
        const monthlyPayment = calculateMonthlyPayment(loanAmount, 7, termYears);
        pmiDropoffInfo = calculatePMIDropoff({
            originalLoanAmount: loanAmount,
            homePrice,
            interestRate: 7,
            termYears,
            monthlyPayment,
        });
    }

    return {
        loanAmount,
        homePrice,
        ltv: round(ltv, 2),
        loanType,
        creditScore,
        miType,
        upfrontMI: round(upfrontMI),
        monthlyMI: round(monthlyMI),
        annualMI: round(monthlyMI * 12),
        requiresMI: ltv > 80 || loanType === 'fha' || loanType === 'usda',
        pmiDropoffInfo,
    };
}

/**
 * Get PMI rate based on LTV and credit score
 */
function getPMIRate(ltv, creditScore) {
    // Simplified PMI rate table
    if (creditScore >= 760) {
        if (ltv <= 85) return 0.003;
        if (ltv <= 90) return 0.004;
        if (ltv <= 95) return 0.005;
        return 0.006;
    } else if (creditScore >= 720) {
        if (ltv <= 85) return 0.004;
        if (ltv <= 90) return 0.005;
        if (ltv <= 95) return 0.007;
        return 0.009;
    } else if (creditScore >= 680) {
        if (ltv <= 85) return 0.006;
        if (ltv <= 90) return 0.008;
        if (ltv <= 95) return 0.011;
        return 0.014;
    } else {
        if (ltv <= 85) return 0.009;
        if (ltv <= 90) return 0.012;
        if (ltv <= 95) return 0.016;
        return 0.020;
    }
}

/**
 * Calculate when PMI drops off
 */
function calculatePMIDropoff({
    originalLoanAmount,
    homePrice,
    interestRate,
    termYears,
    monthlyPayment,
}) {
    const target78LTV = homePrice * 0.78;
    const target80LTV = homePrice * 0.80;

    let balance = originalLoanAmount;
    const monthlyRate = interestRate / 100 / 12;
    let months = 0;
    let months78 = 0;
    let months80 = 0;

    while (balance > target78LTV && months < termYears * 12) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;
        months++;

        if (balance <= target80LTV && months80 === 0) {
            months80 = months;
        }
        if (balance <= target78LTV && months78 === 0) {
            months78 = months;
        }
    }

    return {
        automaticRemovalMonth: months78,
        automaticRemovalYears: round(months78 / 12, 1),
        requestRemovalMonth: months80,
        requestRemovalYears: round(months80 / 12, 1),
        note: 'PMI automatically drops at 78% LTV. You can request removal at 80% LTV.',
    };
}

/**
 * Calculate payment shock (current rent vs new mortgage)
 */
export function calculatePaymentShock({
    currentRent,
    proposedMortgagePayment,
    includesTaxesInsurance = true,
}) {
    const shock = proposedMortgagePayment - currentRent;
    const shockPercent = ((shockAmount) / currentRent) * 100;

    return {
        currentRent,
        proposedMortgagePayment,
        shock: round(shock),
        shockPercent: round(shockPercent, 1),
        isMajorShock: shockPercent > 20,
        recommendation: getPaymentShockRecommendation(shockPercent),
    };
}

function getPaymentShockRecommendation(shockPercent) {
    if (shockPercent <= 10) {
        return { level: 'Low', description: 'Manageable increase. Should adapt quickly.' };
    } else if (shockPercent <= 20) {
        return { level: 'Moderate', description: 'Noticeable increase. Budget adjustment needed.' };
    } else if (shockPercent <= 35) {
        return { level: 'High', description: 'Significant increase. Review budget carefully.' };
    } else {
        return { level: 'Very High', description: 'Major lifestyle change. Consider a lower price point.' };
    }
}

function round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
