/**
 * AI Provider Library
 * 
 * DeepSeek is the primary provider.
 * Generates closing scripts with max 120 words, professional LO perspective.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `You are a veteran US Mortgage Loan Officer with 20 years of experience. 
Generate a short closing script for presenting mortgage comparison options to a borrower.

STRICT REQUIREMENTS:
- Maximum 120 words (CRITICAL - do not exceed)
- Professional but friendly tone
- Reference at least 2 specific numbers from the comparison data
- Include one sentence about conditions (e.g., "if you plan to stay 5+ years...")
- End with: "Not financial advice; estimates only."
- Write in first person as if speaking directly to the borrower
- Focus on helping them understand the key difference and make a decision`;

/**
 * Generate AI closing script using DeepSeek
 */
export async function generateAIClosingScript({ title, summary, tone = 'balanced' }) {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const toneInstructions = {
        balanced: 'Use a balanced, neutral tone.',
        professional: 'Use a concise, confident, businesslike tone.',
        friendly: 'Use a warm, conversational, easy-to-follow tone.',
        urgency: 'Use a confident tone with gentle urgency and a clear next step.',
    };

    const userPrompt = buildUserPrompt({ title, summary, tone, toneInstructions });

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('DeepSeek API error:', error);
            throw new Error('AI generation failed');
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();

        if (!text) {
            throw new Error('Empty AI response');
        }

        // Ensure disclaimer and enforce word limit
        return enforceOutputConstraints(text);
    } catch (error) {
        console.error('AI generation error:', error);
        throw error;
    }
}

function buildUserPrompt({ title, summary, tone, toneInstructions }) {
    const s = summary || {};

    const betterOption = s.betterMonthlyLabel || (s.betterMonthly === 'A' ? 'Option A' : 'Option B');
    const monthlySavings = formatMoney(s.monthlySavings || 0);
    const fiveYearSavings = formatMoney(s.fiveYearTotalDifference || 0);
    const cashDifference = formatMoney(s.cashToCloseDifference || 0);
    const lowerCashOption = s.betterCashLabel || (s.betterCashToClose === 'A' ? 'Option A' : 'Option B');

    return `Generate a closing script for: "${title}"

Comparison Data:
- Better monthly payment: ${betterOption}
- Monthly savings: ${monthlySavings}/month
- 5-year total savings: ${fiveYearSavings}
- Cash-to-close difference: ${cashDifference}
- Lower cash-to-close option: ${lowerCashOption}

Option A: ${formatMoney(s.optionA?.monthly || 0)}/month at ${s.optionA?.rate || 0}% rate
Option B: ${formatMoney(s.optionB?.monthly || 0)}/month at ${s.optionB?.rate || 0}% rate

Tone: ${toneInstructions[tone] || toneInstructions.balanced}

Remember: Maximum 120 words. End with disclaimer.`;
}

function formatMoney(value) {
    const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

function enforceOutputConstraints(text) {
    const DISCLAIMER = 'Not financial advice; estimates only.';
    const MAX_WORDS = 120;

    let output = String(text || '').trim();

    // Remove duplicate disclaimers
    output = output.replace(/\s*Not financial advice;?\s*estimates only\.?/gi, '').trim();

    // Count words
    const words = output.split(/\s+/).filter(Boolean);

    // Truncate if over limit (reserving space for disclaimer)
    const disclaimerWords = DISCLAIMER.split(/\s+/).length;
    const maxContentWords = MAX_WORDS - disclaimerWords;

    if (words.length > maxContentWords) {
        output = words.slice(0, maxContentWords).join(' ');
        // Clean up trailing punctuation
        output = output.replace(/[.,;:!?]+$/, '');
    }

    // Ensure proper ending punctuation
    if (!/[.!?]$/.test(output)) {
        output += '.';
    }

    // Add disclaimer
    output = `${output} ${DISCLAIMER}`;

    return output;
}

/**
 * Check if AI generation is available (has API key configured)
 */
export function isAIAvailable() {
    return !!process.env.DEEPSEEK_API_KEY;
}
