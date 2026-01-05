/**
 * Usage metering helpers
 *
 * Centralizes quota checks/consumption and maps them to user-facing errors.
 */

import { checkQuota, consumeQuota, QUOTA_TYPES } from '@/lib/entitlements';

export const METERING_ERRORS = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
    QUOTA_EXHAUSTED: 'QUOTA_EXHAUSTED',
    INTERNAL: 'INTERNAL',
};

export async function getClosingScriptQuotaState(userId) {
    const qc = await checkQuota(userId, QUOTA_TYPES.CLOSING_SCRIPT);

    if (!qc.hasQuota) {
        if (qc.reason === 'Subscription required') {
            return {
                ok: false,
                errorCode: METERING_ERRORS.SUBSCRIPTION_REQUIRED,
                remaining: 0,
                reason: qc.reason,
            };
        }

        return {
            ok: false,
            errorCode: METERING_ERRORS.QUOTA_EXHAUSTED,
            remaining: 0,
            reason: qc.reason,
        };
    }

    return {
        ok: true,
        remaining: qc.remaining,
        quota: qc.quota,
        used: qc.used,
        entitlementId: qc.entitlementId,
    };
}

export async function consumeClosingScriptQuota({ userId, refId, idempotencyKey }) {
    const result = await consumeQuota(userId, QUOTA_TYPES.CLOSING_SCRIPT, refId, idempotencyKey);

    if (result.success) {
        return {
            ok: true,
            remaining: typeof result.remaining === 'number' ? result.remaining : null,
            alreadyConsumed: !!result.alreadyConsumed,
        };
    }

    // consumeQuota already runs checkQuota; map common errors
    const reason = typeof result.error === 'string' ? result.error : 'Unknown error';

    if (reason === 'Subscription required') {
        return { ok: false, errorCode: METERING_ERRORS.SUBSCRIPTION_REQUIRED, reason };
    }

    if (reason === 'Quota exhausted' || reason === 'No active subscription or pass') {
        return { ok: false, errorCode: METERING_ERRORS.QUOTA_EXHAUSTED, reason };
    }

    return { ok: false, errorCode: METERING_ERRORS.INTERNAL, reason };
}
