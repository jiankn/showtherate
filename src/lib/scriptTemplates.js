/**
 * Closing Script Templates
 *
 * IMPORTANT:
 * - These scripts are NOT AI-generated.
 * - Output must be deterministic based on a standard, pre-defined template.
 */

import { formatCurrency } from '@/lib/calculator';

const DISCLAIMER = 'Not financial advice; estimates only.';
const DEFAULT_MAX_WORDS = 120;

function countWords(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function ensureDisclaimerOnce(text) {
    const next = String(text || '').trim();
    const without = next.replace(/\s*Not financial advice; estimates only\./gi, '').trim();
    const withPunct = without.endsWith('.') ? without : `${without}.`;
    return `${withPunct} ${DISCLAIMER}`.trim();
}

function truncateToMaxWords(text, maxWords) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return String(text || '').trim();
    return words.slice(0, maxWords).join(' ').replace(/[.,;:!?]+$/, '') + '.';
}

function enforceConstraints(text, { maxWords = DEFAULT_MAX_WORDS, ensureNumbers = [] } = {}) {
    let next = ensureDisclaimerOnce(text);

    const hasAtLeastTwoNumbers = (next.match(/\d[\d,]*(\.\d+)?/g) || []).length >= 2;
    if (!hasAtLeastTwoNumbers && ensureNumbers.length >= 2) {
        next = `${next} Key numbers: ${ensureNumbers[0]}, ${ensureNumbers[1]}.`;
        next = ensureDisclaimerOnce(next);
    }

    next = truncateToMaxWords(next, maxWords);
    next = ensureDisclaimerOnce(next);

    // If disclaimer pushed us over the limit, trim again (but keep disclaimer)
    if (countWords(next) > maxWords) {
        const trimmed = truncateToMaxWords(next, maxWords);
        next = ensureDisclaimerOnce(trimmed);
        if (countWords(next) > maxWords) {
            // Final hard cut while preserving disclaimer
            const words = next.split(/\s+/).filter(Boolean);
            const disclaimerWords = DISCLAIMER.split(/\s+/).filter(Boolean);
            const allowed = Math.max(1, maxWords - disclaimerWords.length);
            const head = words.slice(0, allowed).join(' ').replace(/[.,;:!?]+$/, '');
            next = `${head}. ${DISCLAIMER}`.trim();
        }
    }

    return next;
}

function toMoney(value) {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return formatCurrency(n);
}

function getLabels(summary) {
    const betterMonthlyLabel = typeof summary?.betterMonthlyLabel === 'string' ? summary.betterMonthlyLabel : null;
    const betterCashLabel = typeof summary?.betterCashLabel === 'string' ? summary.betterCashLabel : null;

    const best = betterMonthlyLabel || (summary?.betterMonthly === 'A' ? 'Option A' : 'Option B');
    const alt = best === 'Option A' ? 'Option B' : 'Option A';

    const lowerCash = betterCashLabel || (summary?.betterCashToClose === 'A' ? 'Option A' : 'Option B');

    return { best, alt, lowerCash };
}

function normalizeSummary(summary) {
    const monthlySavings = typeof summary?.monthlySavings === 'number' ? summary.monthlySavings : null;
    const fiveYearTotalDifference = typeof summary?.fiveYearTotalDifference === 'number' ? summary.fiveYearTotalDifference : null;
    const cashToCloseDifference = typeof summary?.cashToCloseDifference === 'number' ? summary.cashToCloseDifference : null;

    return {
        monthlySavings: monthlySavings ?? 0,
        fiveYearTotalDifference: fiveYearTotalDifference ?? 0,
        cashToCloseDifference: cashToCloseDifference ?? 0,
    };
}

function validateInputs({ title, summary }) {
    if (typeof title !== 'string' || !title.trim()) {
        return { ok: false, error: 'Invalid title' };
    }
    if (!summary || typeof summary !== 'object') {
        return { ok: false, error: 'Invalid summary' };
    }
    return { ok: true };
}

const TEMPLATE_DEFINITIONS = {
    balanced: {
        id: 'balanced',
        name: 'Balanced',
        description: 'Clear, straightforward, and neutral.',
        render: ({ title, summary }) => {
            const { best, alt, lowerCash } = getLabels(summary);
            const s = normalizeSummary(summary);

            const monthly = toMoney(s.monthlySavings);
            const year5 = toMoney(s.fiveYearTotalDifference);
            const cash = toMoney(s.cashToCloseDifference);

            return [
                `Here’s the quick takeaway on ${title}: ${best} is the better fit on payment.`,
                `We’re looking at about ${monthly}/month and roughly ${year5} over 5 years.`,
                `If upfront cash is your priority, we can lean toward ${lowerCash} (about ${cash} difference in cash-to-close).`,
                `If/when you plan to keep the loan for 3–5 years or more, the monthly savings usually matters more than small fee differences—so ${best} is the one I’d choose.`,
            ].join(' ');
        },
    },

    professional: {
        id: 'professional',
        name: 'Professional',
        description: 'Concise, confident, and businesslike.',
        render: ({ title, summary }) => {
            const { best, lowerCash } = getLabels(summary);
            const s = normalizeSummary(summary);

            const monthly = toMoney(s.monthlySavings);
            const year5 = toMoney(s.fiveYearTotalDifference);
            const cash = toMoney(s.cashToCloseDifference);

            return [
                `${title} recommendation: choose ${best} based on total monthly payment.`,
                `Estimated impact is ${monthly}/mo and about ${year5} over 5 years.`,
                `If/when minimizing upfront cash is the priority, ${lowerCash} is better on cash-to-close (about ${cash} difference).`,
                `Otherwise, ${best} is the cleaner long-term value.`,
            ].join(' ');
        },
    },

    friendly: {
        id: 'friendly',
        name: 'Friendly',
        description: 'Warm, conversational, and easy to follow.',
        render: ({ title, summary }) => {
            const { best, alt, lowerCash } = getLabels(summary);
            const s = normalizeSummary(summary);

            const monthly = toMoney(s.monthlySavings);
            const year5 = toMoney(s.fiveYearTotalDifference);
            const cash = toMoney(s.cashToCloseDifference);

            return [
                `Quick recap on ${title}: ${best} comes out ahead on the monthly payment.`,
                `That’s about ${monthly}/month, or roughly ${year5} over 5 years.`,
                `If/when you’d rather keep more cash in your pocket upfront, we can go with ${lowerCash}—it’s about ${cash} better on cash-to-close.`,
                `If not, I’d stick with ${best}. Either way, we’ll pick the option that fits how long you expect to keep the loan.`,
            ].join(' ');
        },
    },

    urgency: {
        id: 'urgency',
        name: 'Urgency',
        description: 'Confident with gentle urgency and a clear next step.',
        render: ({ title, summary }) => {
            const { best, lowerCash } = getLabels(summary);
            const s = normalizeSummary(summary);

            const monthly = toMoney(s.monthlySavings);
            const year5 = toMoney(s.fiveYearTotalDifference);
            const cash = toMoney(s.cashToCloseDifference);

            return [
                `On ${title}, ${best} is the stronger choice on monthly payment.`,
                `We’re talking about roughly ${monthly}/month and around ${year5} over 5 years.`,
                `If/when cash-to-close is the deciding factor, ${lowerCash} helps upfront by about ${cash}.`,
                `If you’re comfortable with the payment, the next step is to lock the structure that matches your timeline—my recommendation is ${best}.`,
            ].join(' ');
        },
    },
};

export const CLOSING_SCRIPT_TEMPLATES = Object.values(TEMPLATE_DEFINITIONS).map(({ id, name, description }) => ({
    id,
    name,
    description,
}));

export function resolveClosingScriptTemplateId(uiTone) {
    // UI uses legacy aiType values; we map them to standard template ids.
    switch (uiTone) {
        case 'tone_professional':
            return 'professional';
        case 'tone_friendly':
            return 'friendly';
        case 'tone_urgency':
            return 'urgency';
        case 'summary':
        default:
            return 'balanced';
    }
}

export function renderClosingScript({ templateId, title, summary }) {
    const validation = validateInputs({ title, summary });
    if (!validation.ok) {
        const err = new Error(validation.error);
        err.code = 'INVALID_INPUT';
        throw err;
    }

    const tmpl = TEMPLATE_DEFINITIONS[templateId];
    if (!tmpl) {
        const err = new Error('Unknown template');
        err.code = 'UNKNOWN_TEMPLATE';
        throw err;
    }

    const s = normalizeSummary(summary);
    const ensureNumbers = [
        `${toMoney(s.monthlySavings)}/mo`,
        `${toMoney(s.fiveYearTotalDifference)} over 5 years`,
    ];

    const raw = tmpl.render({ title: title.trim(), summary });
    return enforceConstraints(raw, { maxWords: DEFAULT_MAX_WORDS, ensureNumbers });
}
