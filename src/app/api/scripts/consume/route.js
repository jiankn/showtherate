/**
 * Closing Script Consume API
 * POST /api/scripts/consume
 *
 * Flow:
 * - All users: Template script by default
 * - Subscribers with useAI=true: AI-generated script (once per comparison)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { renderClosingScript, resolveClosingScriptTemplateId } = await import('@/lib/scriptTemplates');
        const { consumeClosingScriptQuota, getClosingScriptQuotaState } = await import('@/lib/usageMeter');
        const { generateAIClosingScript, isAIAvailable } = await import('@/lib/ai');
        const { getActiveEntitlement } = await import('@/lib/entitlements');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));

        const title = typeof body?.title === 'string' ? body.title : 'Mortgage Comparison';
        const summary = typeof body?.summary === 'object' && body.summary ? body.summary : null;
        const useAI = body?.useAI === true;
        const comparisonId = typeof body?.comparisonId === 'string' ? body.comparisonId : null;

        // Accept either explicit templateId or legacy uiTone (aiType)
        const templateId = typeof body?.templateId === 'string'
            ? body.templateId
            : resolveClosingScriptTemplateId(body?.uiTone);

        const inputPayload = { templateId, title, summary };
        const inputHash = sha256(JSON.stringify(inputPayload));

        // Check if user wants AI generation
        if (useAI) {
            // Check if user has subscription
            const entitlement = await getActiveEntitlement(session.user.id);

            if (!entitlement) {
                return NextResponse.json({
                    error: 'AI generation requires a paid plan',
                    code: 'PAID_PLAN_REQUIRED',
                }, { status: 403 });
            }

            // Check AI availability
            if (!isAIAvailable()) {
                return NextResponse.json({
                    error: 'AI service not configured',
                    code: 'AI_UNAVAILABLE',
                }, { status: 503 });
            }

            // Use comparisonId for idempotency - only one AI per comparison
            const aiIdempotencyKey = comparisonId
                ? `ai_script_${comparisonId}`
                : `ai_script_${session.user.id}_${inputHash}`;

            // Check and consume quota
            const consume = await consumeClosingScriptQuota({
                userId: session.user.id,
                refId: inputHash,
                idempotencyKey: aiIdempotencyKey,
            });

            if (!consume.ok) {
                // If already consumed for this comparison, return error
                if (consume.alreadyConsumed) {
                    return NextResponse.json({
                        error: 'AI already used for this comparison',
                        code: 'AI_ALREADY_USED',
                    }, { status: 400 });
                }

                const status = consume.errorCode === 'SUBSCRIPTION_REQUIRED' ? 403 : 402;
                return NextResponse.json(
                    { error: consume.reason || 'Quota unavailable', code: consume.errorCode },
                    { status }
                );
            }

            // If already consumed (idempotent), don't regenerate
            if (consume.alreadyConsumed) {
                // Return template since we can't regenerate
                let text;
                try {
                    text = renderClosingScript({ templateId, title, summary });
                } catch (err) {
                    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
                }
                return NextResponse.json({
                    templateId,
                    inputHash,
                    text,
                    isAI: false,
                    aiAlreadyUsed: true,
                    remaining: consume.remaining,
                });
            }

            // Generate AI script
            try {
                const aiText = await generateAIClosingScript({
                    title,
                    summary,
                    tone: templateId,
                });

                return NextResponse.json({
                    templateId,
                    inputHash,
                    text: aiText,
                    isAI: true,
                    remaining: consume.remaining,
                });
            } catch (aiError) {
                console.error('AI generation failed:', aiError);

                // Fallback to template on AI failure
                let text;
                try {
                    text = renderClosingScript({ templateId, title, summary });
                } catch (err) {
                    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
                }

                return NextResponse.json({
                    templateId,
                    inputHash,
                    text,
                    isAI: false,
                    aiFailed: true,
                    remaining: consume.remaining,
                });
            }
        }

        // Default: Template-based generation (no quota for templates)
        let text;
        try {
            text = renderClosingScript({ templateId, title, summary });
        } catch (err) {
            const code = err?.code === 'UNKNOWN_TEMPLATE' ? 'UNKNOWN_TEMPLATE' : (err?.code === 'INVALID_INPUT' ? 'INVALID_INPUT' : 'RENDER_FAILED');
            return NextResponse.json({ error: 'Invalid request', code }, { status: 400 });
        }

        // Check if user can use AI (for UI hint)
        let canUseAI = false;
        let aiRemaining = null;

        const entitlement = await getActiveEntitlement(session.user.id);
        if (entitlement && isAIAvailable()) {
            const quotaState = await getClosingScriptQuotaState(session.user.id);
            canUseAI = quotaState.ok && (quotaState.remaining === -1 || quotaState.remaining > 0);
            aiRemaining = quotaState.remaining;
        }

        return NextResponse.json({
            templateId,
            inputHash,
            text,
            isAI: false,
            canUseAI,
            aiRemaining,
        });
    } catch (error) {
        console.error('Scripts consume POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
