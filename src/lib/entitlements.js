/**
 * Entitlements Management
 * Handles quota checking and consumption
 */

import { supabaseAdmin } from '@/lib/supabase/server';

// Quota types
export const QUOTA_TYPES = {
    SHARE: 'share',
    PROPERTY: 'property',
    AI: 'ai',
    CLOSING_SCRIPT: 'closing_script',
};

/**
 * Get user's active entitlement
 * Returns the most permissive active entitlement (subscription > starter pass)
 */
export async function getActiveEntitlement(userId) {
    const now = new Date().toISOString();

    // Get all active entitlements
    const { data: entitlements, error } = await supabaseAdmin
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .gte('ends_at', now)
        .order('type', { ascending: false }); // subscription > starter_pass_7d

    if (error || !entitlements?.length) {
        return null;
    }

    // Prefer subscription over starter pass
    return entitlements.find(e => e.type === 'subscription') || entitlements[0];
}

/**
 * Check if user has quota for a specific action
 */
export async function checkQuota(userId, quotaType) {
    const entitlement = await getActiveEntitlement(userId);

    if (!entitlement) {
        return { hasQuota: false, remaining: 0, reason: 'No active subscription or pass' };
    }

    let quota, used;
    switch (quotaType) {
        case QUOTA_TYPES.SHARE:
            quota = entitlement.share_quota;
            used = entitlement.share_used;
            break;
        case QUOTA_TYPES.PROPERTY:
            quota = entitlement.property_quota;
            used = entitlement.property_used;
            break;
        case QUOTA_TYPES.AI:
            quota = entitlement.ai_quota;
            used = entitlement.ai_used;
            break;
        case QUOTA_TYPES.CLOSING_SCRIPT:
            // Closing Script is subscription-only
            if (entitlement.type !== 'subscription') {
                return { hasQuota: false, remaining: 0, reason: 'Subscription required' };
            }
            // Reuse ai_quota/ai_used as the Closing Script quota bucket (no AI generation).
            quota = entitlement.ai_quota;
            used = entitlement.ai_used;
            break;
        default:
            return { hasQuota: false, remaining: 0, reason: 'Invalid quota type' };
    }

    // -1 means unlimited
    if (quota === -1) {
        return { hasQuota: true, remaining: -1, entitlementId: entitlement.id };
    }

    const remaining = quota - used;
    return {
        hasQuota: remaining > 0,
        remaining,
        quota,
        used,
        entitlementId: entitlement.id,
        reason: remaining <= 0 ? 'Quota exhausted' : null,
    };
}

/**
 * Consume quota for an action (with idempotency)
 */
export async function consumeQuota(userId, quotaType, refId, idempotencyKey = null) {
    // Check idempotency first
    if (idempotencyKey) {
        const { data: existing } = await supabaseAdmin
            .from('usage_ledger')
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .single();

        if (existing) {
            // Already processed
            return { success: true, alreadyConsumed: true };
        }
    }

    // Check quota
    const quotaCheck = await checkQuota(userId, quotaType);
    if (!quotaCheck.hasQuota) {
        return { success: false, error: quotaCheck.reason };
    }

    // Map quota type to ledger kind and column
    const mapping = {
        [QUOTA_TYPES.SHARE]: { kind: 'share_create', column: 'share_used' },
        [QUOTA_TYPES.PROPERTY]: { kind: 'property_fetch', column: 'property_used' },
        [QUOTA_TYPES.AI]: { kind: 'ai_generate', column: 'ai_used' },
        [QUOTA_TYPES.CLOSING_SCRIPT]: { kind: 'closing_script_generate', column: 'ai_used' },
    };

    const { kind, column } = mapping[quotaType];

    // Update entitlement usage (only if not unlimited)
    if (quotaCheck.remaining !== -1) {
        const { error: updateError } = await supabaseAdmin
            .from('entitlements')
            .update({ [column]: quotaCheck.used + 1 })
            .eq('id', quotaCheck.entitlementId);

        if (updateError) {
            console.error('Failed to update quota:', updateError);
            return { success: false, error: 'Failed to update quota' };
        }
    }

    // Record in ledger
    await supabaseAdmin.from('usage_ledger').insert({
        user_id: userId,
        entitlement_id: quotaCheck.entitlementId,
        kind,
        delta: 1,
        ref_id: refId,
        idempotency_key: idempotencyKey,
    });

    return {
        success: true,
        remaining: quotaCheck.remaining === -1 ? -1 : quotaCheck.remaining - 1,
    };
}

/**
 * Get all quotas for a user (for display in UI)
 */
export async function getUserQuotas(userId) {
    const entitlement = await getActiveEntitlement(userId);
    const now = new Date();
    const startOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const { count: comparisonsCount } = await supabaseAdmin
        .from('comparisons')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonthUtc);
    const comparisonsUsed = typeof comparisonsCount === 'number' ? comparisonsCount : 0;

    if (!entitlement) {
        const comparisonsQuota = 5;
        return {
            hasActiveEntitlement: false,
            type: 'free',
            expiresAt: null,
            quotas: {
                comparisons: {
                    quota: comparisonsQuota,
                    used: comparisonsUsed,
                    remaining: Math.max(0, comparisonsQuota - comparisonsUsed),
                },
                share: { quota: 0, used: 0, remaining: 0 },
                property: { quota: 0, used: 0, remaining: 0 },
                ai: { quota: 0, used: 0, remaining: 0 },
                closingScript: { enabled: false, quota: 0, used: 0, remaining: 0 },
            },
        };
    }

    const comparisonsQuota = entitlement.type === 'subscription' ? -1 : -1;

    return {
        hasActiveEntitlement: true,
        type: entitlement.type,
        expiresAt: entitlement.ends_at,
        quotas: {
            comparisons: {
                quota: comparisonsQuota,
                used: comparisonsUsed,
                remaining: comparisonsQuota === -1 ? -1 : Math.max(0, comparisonsQuota - comparisonsUsed),
            },
            share: {
                quota: entitlement.share_quota,
                used: entitlement.share_used,
                remaining: entitlement.share_quota === -1 ? -1 : entitlement.share_quota - entitlement.share_used,
            },
            property: {
                quota: entitlement.property_quota,
                used: entitlement.property_used,
                remaining: entitlement.property_quota - entitlement.property_used,
            },
            ai: {
                quota: entitlement.ai_quota,
                used: entitlement.ai_used,
                remaining: entitlement.ai_quota - entitlement.ai_used,
            },
            closingScript: entitlement.type !== 'subscription'
                ? { enabled: false, quota: 0, used: 0, remaining: 0 }
                : {
                    enabled: true,
                    quota: entitlement.ai_quota,
                    used: entitlement.ai_used,
                    remaining: entitlement.ai_quota === -1 ? -1 : entitlement.ai_quota - entitlement.ai_used,
                },
        },
    };
}
