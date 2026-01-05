/**
 * ShowTheRate - Mortgage Calculator Engine
 * 
 * Core calculation logic for mortgage scenarios
 * Supports: Conventional, FHA, VA loans
 */

// ===== CONSTANTS =====
export const LOAN_TYPES = {
    CONVENTIONAL: 'conventional',
    FHA: 'fha',
    VA: 'va',
    USDA: 'usda',
    JUMBO: 'jumbo',
};

export const DEFAULT_VALUES = {
    PMI_RATE: 0.005, // 0.5% annually
    FHA_UPFRONT_MIP: 0.0175, // 1.75%
    FHA_ANNUAL_MIP: 0.0055, // 0.55% annually
    VA_FUNDING_FEE_FIRST: 0.023, // 2.3% for first use
    USDA_UPFRONT_FEE: 0.01, // 1%
    USDA_ANNUAL_FEE: 0.0035, // 0.35%
    PROPERTY_TAX_RATE: 0.012, // 1.2% annually
    INSURANCE_RATE: 0.004, // 0.4% annually
    CLOSING_COST_RATE: 0.02, // 2% of loan amount
};

// ===== CORE CALCULATIONS =====

/**
 * Calculate monthly mortgage payment (P&I)
 */
export function calculateMonthlyPayment(principal, annualRate, termYears) {
    if (principal <= 0 || annualRate <= 0 || termYears <= 0) {
        return 0;
    }

    const monthlyRate = annualRate / 100 / 12;
    const numPayments = termYears * 12;

    // Standard amortization formula
    const payment = principal *
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

    return Math.round(payment * 100) / 100;
}

/**
 * Calculate PMI (Private Mortgage Insurance)
 * Required when LTV > 80% for Conventional loans
 */
export function calculatePMI(loanAmount, homePrice, pmiRate = DEFAULT_VALUES.PMI_RATE) {
    const ltv = loanAmount / homePrice;

    if (ltv <= 0.8) {
        return 0; // No PMI required
    }

    return Math.round((loanAmount * pmiRate / 12) * 100) / 100;
}

/**
 * Calculate FHA MIP (Mortgage Insurance Premium)
 */
export function calculateFHAMIP(baseLoanAmount, annualMipRate = DEFAULT_VALUES.FHA_ANNUAL_MIP) {
    return Math.round((baseLoanAmount * annualMipRate / 12) * 100) / 100;
}

/**
 * Calculate VA Funding Fee
 */
export function calculateVAFundingFee(loanAmount, fundingFeeRate = DEFAULT_VALUES.VA_FUNDING_FEE_FIRST) {
    return Math.round(loanAmount * fundingFeeRate * 100) / 100;
}

/**
 * Calculate USDA Guarantee Fee
 */
export function calculateUSDAGuaranteeFee(baseLoanAmount, annualFeeRate = DEFAULT_VALUES.USDA_ANNUAL_FEE) {
    return Math.round((baseLoanAmount * annualFeeRate / 12) * 100) / 100;
}

/**
 * Calculate complete mortgage scenario
 */
export function calculateScenario(inputs) {
    const {
        homePrice,
        downPaymentPercent,
        interestRate,
        termYears,
        loanType = LOAN_TYPES.CONVENTIONAL,
        propertyTax = null, // Annual, null = estimate
        insurance = null, // Annual, null = estimate
        hoa = 0, // Monthly
        points = 0, // Discount points percentage
        otherClosingCosts = null, // null = estimate
    } = inputs;

    // === Base Calculations ===
    const downPayment = homePrice * (downPaymentPercent / 100);
    let baseLoanAmount = homePrice - downPayment;

    // === Loan Type Specific ===
    let upfrontMIP = 0;
    let totalLoanAmount = baseLoanAmount;
    let monthlyMIP = 0;
    let vaFundingFee = 0;

    if (loanType === LOAN_TYPES.FHA) {
        // FHA: Upfront MIP is financed into the loan
        upfrontMIP = baseLoanAmount * DEFAULT_VALUES.FHA_UPFRONT_MIP;
        totalLoanAmount = baseLoanAmount + upfrontMIP;
        monthlyMIP = calculateFHAMIP(baseLoanAmount);
    } else if (loanType === LOAN_TYPES.VA) {
        // VA: Funding fee can be financed
        vaFundingFee = calculateVAFundingFee(baseLoanAmount);
        totalLoanAmount = baseLoanAmount + vaFundingFee;
    } else if (loanType === LOAN_TYPES.USDA) {
        // USDA: Upfront Guarantee Fee is financed
        upfrontMIP = baseLoanAmount * DEFAULT_VALUES.USDA_UPFRONT_FEE;
        totalLoanAmount = baseLoanAmount + upfrontMIP;
        monthlyMIP = calculateUSDAGuaranteeFee(baseLoanAmount);
    } else if (loanType === LOAN_TYPES.JUMBO) {
        // Jumbo: Typically stricter, treating like Conventional but often different rates
        // For simplicity here, we treat PMI same as Conventional but usually Jumbo requires 20% down or has stricter PMI
        // We will leave standard PMI logic for now
        totalLoanAmount = baseLoanAmount;
    }

    // === Monthly P&I ===
    const monthlyPI = calculateMonthlyPayment(totalLoanAmount, interestRate, termYears);

    // === PMI (Conventional & Jumbo only) ===
    let monthlyPMI = 0;
    if (loanType === LOAN_TYPES.CONVENTIONAL || loanType === LOAN_TYPES.JUMBO) {
        monthlyPMI = calculatePMI(baseLoanAmount, homePrice);
    }

    // === Taxes & Insurance ===
    const taxRate = (inputs.propertyTaxRate ?? (DEFAULT_VALUES.PROPERTY_TAX_RATE * 100)) / 100;
    const insuranceRate = (inputs.insuranceRate ?? (DEFAULT_VALUES.INSURANCE_RATE * 100)) / 100;
    
    const annualPropertyTax = propertyTax ?? (homePrice * taxRate);
    const annualInsurance = insurance ?? (homePrice * insuranceRate);
    const monthlyTax = annualPropertyTax / 12;
    const monthlyInsurance = annualInsurance / 12;

    // === Total Monthly Payment ===
    const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + hoa + monthlyPMI + monthlyMIP;

    // === Closing Costs ===
    const pointsCost = baseLoanAmount * (points / 100);
    const estimatedOtherCosts = otherClosingCosts ?? (baseLoanAmount * DEFAULT_VALUES.CLOSING_COST_RATE);
    const totalClosingCosts = pointsCost + estimatedOtherCosts;

    // === Cash to Close ===
    const cashToClose = downPayment + totalClosingCosts;

    // === Amortization Snapshots (5yr / 10yr) ===
    const snapshot5yr = calculateAmortizationSnapshot(totalLoanAmount, interestRate, termYears, 5);
    const snapshot10yr = calculateAmortizationSnapshot(totalLoanAmount, interestRate, termYears, 10);

    return {
        // Input Echo
        inputs: {
            homePrice,
            downPaymentPercent,
            downPayment,
            interestRate,
            termYears,
            loanType,
        },

        // Loan Details
        loan: {
            baseLoanAmount,
            upfrontMIP,
            vaFundingFee,
            totalLoanAmount,
            ltv: (baseLoanAmount / homePrice) * 100,
        },

        // Monthly Breakdown
        monthly: {
            principalInterest: round(monthlyPI),
            propertyTax: round(monthlyTax),
            insurance: round(monthlyInsurance),
            hoa: round(hoa),
            pmi: round(monthlyPMI),
            mip: round(monthlyMIP),
            total: round(totalMonthlyPayment),
        },

        // Closing Costs
        closing: {
            points: round(pointsCost),
            otherCosts: round(estimatedOtherCosts),
            total: round(totalClosingCosts),
            cashToClose: round(cashToClose),
        },

        // Long-term Projections
        projections: {
            year5: snapshot5yr,
            year10: snapshot10yr,
        },

        // Metadata
        isEstimate: propertyTax === null || insurance === null || otherClosingCosts === null,
    };
}

/**
 * Calculate amortization snapshot at specific year
 */
function calculateAmortizationSnapshot(principal, annualRate, termYears, targetYear) {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = termYears * 12;
    const targetPayments = targetYear * 12;
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

    let balance = principal;
    let totalPaid = 0;
    let totalPrincipal = 0;
    let totalInterest = 0;

    for (let i = 0; i < Math.min(targetPayments, totalPayments); i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;

        totalPaid += monthlyPayment;
        totalInterest += interestPayment;
        totalPrincipal += principalPayment;
        balance -= principalPayment;
    }

    return {
        totalPaid: round(totalPaid),
        principalPaid: round(totalPrincipal),
        interestPaid: round(totalInterest),
        remainingBalance: round(Math.max(0, balance)),
        equityBuilt: round(totalPrincipal),
    };
}

/**
 * Compare two scenarios and return the difference
 */
export function compareScenarios(scenarioA, scenarioB) {
    return {
        monthlyDifference: round(scenarioA.monthly.total - scenarioB.monthly.total),
        cashToCloseDifference: round(scenarioA.closing.cashToClose - scenarioB.closing.cashToClose),
        fiveYearTotalDifference: round(scenarioA.projections.year5.totalPaid - scenarioB.projections.year5.totalPaid),
        tenYearTotalDifference: round(scenarioA.projections.year10.totalPaid - scenarioB.projections.year10.totalPaid),
        betterMonthly: scenarioA.monthly.total < scenarioB.monthly.total ? 'A' : 'B',
        betterCashToClose: scenarioA.closing.cashToClose < scenarioB.closing.cashToClose ? 'A' : 'B',
    };
}

// ===== UTILITY FUNCTIONS =====

function round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format currency for display
 */
export function formatCurrency(value, showCents = false) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
    }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Generate unique ID for scenarios/comparisons
 */
export function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty scenario template
 */
export function createEmptyScenario(name = 'New Scenario') {
    return {
        id: generateId(),
        name,
        inputs: {
            homePrice: 300000,
            downPaymentPercent: 20,
            interestRate: 6.5,
            termYears: 30,
            loanType: LOAN_TYPES.CONVENTIONAL,
            propertyTax: null,
            propertyTaxRate: 1.2,
            insurance: null,
            insuranceRate: 0.4,
            hoa: 0,
            points: 0,
            otherClosingCosts: null,
        },
        outputs: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Validate scenario inputs
 */
export function validateScenarioInputs(inputs) {
    const errors = [];

    if (!inputs.homePrice || inputs.homePrice <= 0) {
        errors.push({ field: 'homePrice', message: 'Home price is required' });
    }

    if (inputs.downPaymentPercent < 0 || inputs.downPaymentPercent > 100) {
        errors.push({ field: 'downPaymentPercent', message: 'Down payment must be 0-100%' });
    }

    if (!inputs.interestRate || inputs.interestRate <= 0 || inputs.interestRate > 30) {
        errors.push({ field: 'interestRate', message: 'Interest rate must be between 0-30%' });
    }

    if (!inputs.termYears || ![10, 15, 20, 25, 30].includes(inputs.termYears)) {
        errors.push({ field: 'termYears', message: 'Invalid loan term' });
    }

    // FHA minimum down payment
    if (inputs.loanType === LOAN_TYPES.FHA && inputs.downPaymentPercent < 3.5) {
        errors.push({ field: 'downPaymentPercent', message: 'FHA requires minimum 3.5% down' });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
