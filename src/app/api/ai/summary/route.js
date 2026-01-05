import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CACHE_TTL_DAYS = 7;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

function addDaysUtcMidnight(date, days) {
    const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    return new Date(utcMidnight.getTime() + days * 24 * 60 * 60 * 1000);
}

function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function enforceConstraints(text, { mustIncludeDisclaimer = true, maxWords = 120, ensureNumbers = [] } = {}) {
    let next = String(text || '').trim();

    const hasDisclaimer = /not financial advice/i.test(next);
    if (mustIncludeDisclaimer && !hasDisclaimer) {
        next = `${next}${next.endsWith('.') ? '' : '.'} Not financial advice; estimates only.`;
    }

    const hasAtLeastTwoNumbers = (next.match(/\d[\d,]*(\.\d+)?/g) || []).length >= 2;
    if (!hasAtLeastTwoNumbers && ensureNumbers.length >= 2) {
        next = `${next}${next.endsWith('.') ? '' : '.'} Key numbers: ${ensureNumbers[0]}, ${ensureNumbers[1]}.`;
    }

    if (countWords(next) <= maxWords) return next;

    const words = next.split(/\s+/).filter(Boolean);
    const truncated = words.slice(0, maxWords).join(' ').replace(/[.,;:!?]+$/, '');

    if (!mustIncludeDisclaimer) return truncated;
    if (/not financial advice/i.test(truncated)) return truncated;

    const withDisclaimer = `${truncated}. Not financial advice; estimates only.`;
    if (countWords(withDisclaimer) <= maxWords) return withDisclaimer;

    const trimmedWords = withDisclaimer.split(/\s+/).filter(Boolean).slice(0, maxWords);
    return trimmedWords.join(' ').replace(/[.,;:!?]+$/, '') + '.';
}

function buildPrompt({ title, type, summary, scenariosCount }) {
    const toneMap = {
        summary: 'balanced and clear',
        tone_professional: 'professional and concise',
        tone_friendly: 'friendly and approachable',
        tone_urgency: 'confident with gentle urgency',
    };

    const tone = toneMap[type] || toneMap.summary;
    const stable = {
        title: title || 'Mortgage Comparison',
        scenariosCount,
        summary,
    };

    const system = [
        'Act as a veteran US Mortgage Loan Officer with 20 years experience.',
        'Write in English.',
        'Max 120 words.',
        'Must cite at least 2 specific numbers.',
        'Must include one "if/when" condition for fit.',
        'Must include exactly one disclaimer sentence: "Not financial advice; estimates only."',
    ].join(' ');

    const user = [
        `Create a short closing script for the borrower based on this comparison (${tone}).`,
        'Avoid jargon; sound like a human.',
        `Comparison data JSON:\n${JSON.stringify(stable)}`,
    ].join('\n\n');

    return { system, user };
}

async function callOpenAI({ system, user }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { provider: 'local', model: 'local-template', text: null, tokens: null, cost: null };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            temperature: 0.4,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`OpenAI error: ${res.status}`);
        error.status = res.status;
        error.body = text;
        throw error;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const usage = data?.usage || null;

    return {
        provider: 'openai',
        model: data?.model || DEFAULT_MODEL,
        text: typeof content === 'string' ? content : null,
        tokens: typeof usage?.total_tokens === 'number' ? usage.total_tokens : null,
        cost: null,
    };
}

function localTemplate({ summary }) {
    const best = summary?.betterMonthly === 'A' ? 'Option A' : 'Option B';
    const alt = best === 'Option A' ? 'Option B' : 'Option A';

    const monthlySavings = typeof summary?.monthlySavings === 'number' ? summary.monthlySavings : null;
    const cashDiff = typeof summary?.cashToCloseDifference === 'number' ? summary.cashToCloseDifference : null;
    const year5 = typeof summary?.fiveYearTotalDifference === 'number' ? summary.fiveYearTotalDifference : null;

    const parts = [];
    parts.push(`Here’s the quick takeaway: ${best} is the better fit on payment while keeping the structure simple.`);

    const numbers = [];
    if (monthlySavings !== null) numbers.push(`$${monthlySavings.toLocaleString()}/mo`);
    if (year5 !== null) numbers.push(`$${year5.toLocaleString()} over 5 years`);
    if (cashDiff !== null) numbers.push(`$${Math.abs(cashDiff).toLocaleString()} cash-to-close`);

    if (numbers.length >= 2) {
        parts.push(`We’re looking at about ${numbers[0]} and roughly ${numbers[1]}.`);
    }

    if (cashDiff !== null) {
        parts.push(`If upfront cash is your priority, we can also lean toward the option with lower cash-to-close (${alt} may be better there).`);
    } else {
        parts.push('If you plan to stay at least 3–5 years, the monthly savings tends to matter more than small fee differences.');
    }

    parts.push('Not financial advice; estimates only.');
    return parts.join(' ');
}

export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { checkQuota, consumeQuota, QUOTA_TYPES } = await import('@/lib/entitlements');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const type = typeof body?.type === 'string' ? body.type : 'summary';
        const title = typeof body?.title === 'string' ? body.title : 'Mortgage Comparison';
        const summary = typeof body?.summary === 'object' && body.summary ? body.summary : null;
        const scenariosCount = typeof body?.scenariosCount === 'number' ? body.scenariosCount : null;

        const inputPayload = { type, title, summary, scenariosCount };
        const inputHash = sha256(JSON.stringify(inputPayload));
        const now = new Date();

        const { data: cached } = await supabaseAdmin
            .from('ai_runs')
            .select('output_text, model, expires_at')
            .eq('type', type)
            .eq('input_hash', inputHash)
            .gt('expires_at', now.toISOString())
            .single();

        if (cached?.output_text) {
            return NextResponse.json({
                cached: true,
                type,
                inputHash,
                provider: 'cache',
                model: cached.model,
                text: cached.output_text,
                expiresAt: cached.expires_at,
            });
        }

        const prompt = buildPrompt({ title, type, summary, scenariosCount });

        let generation;
        try {
            generation = await callOpenAI(prompt);
        } catch (err) {
            const localText = localTemplate({ summary });
            const constrainedLocal = enforceConstraints(localText, {
                mustIncludeDisclaimer: true,
                maxWords: 120,
                ensureNumbers: [
                    typeof summary?.monthlySavings === 'number' ? `$${summary.monthlySavings.toLocaleString()}/mo` : '$0/mo',
                    typeof summary?.fiveYearTotalDifference === 'number' ? `$${summary.fiveYearTotalDifference.toLocaleString()} over 5 years` : '$0 over 5 years',
                ],
            });

            return NextResponse.json({
                cached: false,
                type,
                inputHash,
                provider: 'local',
                model: 'local-template',
                text: constrainedLocal,
                error: 'AI provider unavailable',
            });
        }

        if (generation.provider === 'local') {
            const localText = localTemplate({ summary });
            const constrainedLocal = enforceConstraints(localText, {
                mustIncludeDisclaimer: true,
                maxWords: 120,
                ensureNumbers: [
                    typeof summary?.monthlySavings === 'number' ? `$${summary.monthlySavings.toLocaleString()}/mo` : '$0/mo',
                    typeof summary?.fiveYearTotalDifference === 'number' ? `$${summary.fiveYearTotalDifference.toLocaleString()} over 5 years` : '$0 over 5 years',
                ],
            });

            return NextResponse.json({
                cached: false,
                type,
                inputHash,
                provider: 'local',
                model: 'local-template',
                text: constrainedLocal,
            });
        }

        const quotaCheck = await checkQuota(session.user.id, QUOTA_TYPES.AI);
        if (!quotaCheck.hasQuota) {
            return NextResponse.json(
                { error: 'AI quota exhausted', reason: quotaCheck.reason },
                { status: 402 }
            );
        }

        const ensureNumbers = [
            typeof summary?.monthlySavings === 'number' ? `$${summary.monthlySavings.toLocaleString()}/mo` : '$0/mo',
            typeof summary?.fiveYearTotalDifference === 'number' ? `$${summary.fiveYearTotalDifference.toLocaleString()} over 5 years` : '$0 over 5 years',
        ];

        const constrained = enforceConstraints(generation.text || '', {
            mustIncludeDisclaimer: true,
            maxWords: 120,
            ensureNumbers,
        });

        const expiresAt = addDaysUtcMidnight(now, CACHE_TTL_DAYS).toISOString();

        const { error: cacheError } = await supabaseAdmin
            .from('ai_runs')
            .insert({
                share_id: null,
                type,
                input_hash: inputHash,
                output_text: constrained,
                model: generation.model || DEFAULT_MODEL,
                tokens_used: generation.tokens,
                cost_estimate: generation.cost,
                expires_at: expiresAt,
            });

        if (cacheError) {
            console.error('AI cache insert error:', cacheError);
        }

        const idempotencyKey = `ai_${type}_${inputHash}`;
        const consumeResult = await consumeQuota(
            session.user.id,
            QUOTA_TYPES.AI,
            inputHash,
            idempotencyKey
        );

        if (!consumeResult.success && !consumeResult.alreadyConsumed) {
            return NextResponse.json(
                { error: 'Failed to consume quota', reason: consumeResult.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            cached: false,
            type,
            inputHash,
            provider: generation.provider,
            model: generation.model,
            text: constrained,
            expiresAt,
            remaining: consumeResult.remaining,
        });
    } catch (error) {
        console.error('AI summary POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

