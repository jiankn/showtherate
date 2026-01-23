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
 * Supports base quota + bonus quota (bonus is consumed after base is exhausted)
 */
export async function checkQuota(userId, quotaType) {
    const entitlement = await getActiveEntitlement(userId);

    if (!entitlement) {
        return { hasQuota: false, remaining: 0, reason: 'No active subscription or pass' };
    }

    // Check if bonus quota is still valid
    const bonusValid = entitlement.bonus_expires_at &&
        new Date(entitlement.bonus_expires_at) > new Date();

    let baseQuota, baseUsed, bonusQuota;
    switch (quotaType) {
        case QUOTA_TYPES.SHARE:
            baseQuota = entitlement.share_quota;
            baseUsed = entitlement.share_used;
            bonusQuota = 0; // No bonus for share
            break;
        case QUOTA_TYPES.PROPERTY:
            baseQuota = entitlement.property_quota;
            baseUsed = entitlement.property_used;
            bonusQuota = bonusValid ? (entitlement.bonus_property_quota || 0) : 0;
            break;
        case QUOTA_TYPES.AI:
            baseQuota = entitlement.ai_quota;
            baseUsed = entitlement.ai_used;
            bonusQuota = bonusValid ? (entitlement.bonus_ai_quota || 0) : 0;
            break;
        case QUOTA_TYPES.CLOSING_SCRIPT:
            // Closing Script uses AI quota (available to all paid users)
            baseQuota = entitlement.ai_quota;
            baseUsed = entitlement.ai_used;
            bonusQuota = bonusValid ? (entitlement.bonus_ai_quota || 0) : 0;
            break;
        default:
            return { hasQuota: false, remaining: 0, reason: 'Invalid quota type' };
    }

    // -1 means unlimited base quota
    if (baseQuota === -1) {
        return {
            hasQuota: true,
            remaining: -1,
            quota: baseQuota,
            used: baseUsed,
            bonusQuota,
            entitlementId: entitlement.id
        };
    }

    // Calculate remaining: base remaining + bonus remaining
    const baseRemaining = Math.max(0, baseQuota - baseUsed);
    const totalRemaining = baseRemaining + bonusQuota;

    return {
        hasQuota: totalRemaining > 0,
        remaining: totalRemaining,
        quota: baseQuota,
        used: baseUsed,
        baseRemaining,
        bonusQuota,
        entitlementId: entitlement.id,
        reason: totalRemaining <= 0 ? 'Quota exhausted' : null,
    };
}

/**
 * Consume quota for an action (with idempotency)
 * Consumes base quota first, then bonus quota when base is exhausted
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

    // Map quota type to ledger kind and columns
    const mapping = {
        [QUOTA_TYPES.SHARE]: { kind: 'share_create', usedColumn: 'share_used', bonusColumn: null },
        [QUOTA_TYPES.PROPERTY]: { kind: 'property_fetch', usedColumn: 'property_used', bonusColumn: 'bonus_property_quota' },
        [QUOTA_TYPES.AI]: { kind: 'ai_generate', usedColumn: 'ai_used', bonusColumn: 'bonus_ai_quota' },
        [QUOTA_TYPES.CLOSING_SCRIPT]: { kind: 'closing_script_generate', usedColumn: 'ai_used', bonusColumn: 'bonus_ai_quota' },
    };

    const { kind, usedColumn, bonusColumn } = mapping[quotaType];

    // Determine whether to consume from base or bonus quota
    // Base remaining > 0: consume from base (increment used)
    // Base remaining <= 0 && bonus > 0: consume from bonus (decrement bonus)
    const baseRemaining = quotaCheck.baseRemaining ?? (quotaCheck.quota - quotaCheck.used);
    const consumeFromBonus = baseRemaining <= 0 && quotaCheck.bonusQuota > 0;

    let updateData;
    if (consumeFromBonus && bonusColumn) {
        // Decrement bonus quota
        updateData = { [bonusColumn]: Math.max(0, (quotaCheck.bonusQuota || 0) - 1) };
    } else {
        // Increment used (base quota consumption)
        updateData = { [usedColumn]: (quotaCheck.used || 0) + 1 };
    }

    // Update entitlement
    const { error: updateError } = await supabaseAdmin
        .from('entitlements')
        .update(updateData)
        .eq('id', quotaCheck.entitlementId);

    if (updateError) {
        console.error('Failed to update quota usage:', updateError);
        // Continue anyway as ledger is the source of truth for history
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
        consumedFromBonus: consumeFromBonus,
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

    // Check if bonus quota is valid
    const bonusValid = entitlement.bonus_expires_at &&
        new Date(entitlement.bonus_expires_at) > new Date();
    const bonusPropertyQuota = bonusValid ? (entitlement.bonus_property_quota || 0) : 0;
    const bonusAiQuota = bonusValid ? (entitlement.bonus_ai_quota || 0) : 0;

    // Calculate remaining with bonus
    const propertyBaseRemaining = Math.max(0, entitlement.property_quota - entitlement.property_used);
    const aiBaseRemaining = Math.max(0, entitlement.ai_quota - entitlement.ai_used);

    return {
        hasActiveEntitlement: true,
        type: entitlement.type,
        expiresAt: entitlement.ends_at,
        bonusExpiresAt: entitlement.bonus_expires_at,
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
                bonus: bonusPropertyQuota,
                remaining: propertyBaseRemaining + bonusPropertyQuota,
            },
            ai: {
                quota: entitlement.ai_quota,
                used: entitlement.ai_used,
                bonus: bonusAiQuota,
                remaining: aiBaseRemaining + bonusAiQuota,
            },
            closingScript: {
                enabled: true,
                quota: entitlement.ai_quota,
                used: entitlement.ai_used,
                bonus: bonusAiQuota,
                remaining: entitlement.ai_quota === -1 ? -1 : aiBaseRemaining + bonusAiQuota,
            },
        },
    };
}
