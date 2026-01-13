/**
 * RentCast API 多 Key 轮询模块 v2
 * 
 * 功能：
 * - 自定义重置日（默认每月 11 日）
 * - 严格顺序轮询（Key 0 用完 → Key 1 → ...）
 * - 成功后才计数（API 返回 200 后再记录）
 * - 纯数据库判断配额
 */

import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 配置
const MONTHLY_LIMIT_PER_KEY = parseInt(process.env.RENTCAST_MONTHLY_LIMIT_PER_KEY || '50', 10);
const RESET_DAY = parseInt(process.env.RENTCAST_RESET_DAY || '11', 10);

/**
 * 获取所有配置的 RentCast API Keys
 */
function getApiKeys() {
    const keysString = process.env.RENTCAST_API_KEYS || process.env.RENTCAST_API_KEY || '';
    const keys = keysString.split(',').map(k => k.trim()).filter(Boolean);

    if (keys.length === 0) {
        throw new Error('No RentCast API keys configured');
    }

    return keys;
}

/**
 * 计算当前计费周期
 * 基于重置日计算，例如重置日=11：
 * - 2026-01-15 → "2026-01" (1月11日开始的周期)
 * - 2026-01-05 → "2025-12" (12月11日开始的周期)
 */
function getCurrentBillingPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const day = now.getDate();

    if (day >= RESET_DAY) {
        // 当前月的周期
        return `${year}-${String(month + 1).padStart(2, '0')}`;
    } else {
        // 上个月的周期
        if (month === 0) {
            return `${year - 1}-12`;
        }
        return `${year}-${String(month).padStart(2, '0')}`;
    }
}

/**
 * 获取所有 Key 的当前周期使用量
 */
async function getKeyUsages(period) {
    const keys = getApiKeys();
    const { data, error } = await supabaseAdmin
        .from('rentcast_key_usage')
        .select('key_index, usage_count')
        .eq('month', period);

    if (error) {
        console.error('[RentCast] Failed to get key usages:', error);
        // 如果表不存在或查询失败，返回全部为 0
        return keys.map((_, index) => ({ key_index: index, usage_count: 0 }));
    }

    // 补全缺失的 Key 记录，保持索引顺序
    const usageMap = new Map(data.map(d => [d.key_index, d.usage_count]));
    return keys.map((_, index) => ({
        key_index: index,
        usage_count: usageMap.get(index) || 0
    }));
}

/**
 * 增加指定 Key 的使用计数（只在成功后调用）
 */
async function incrementKeyUsage(keyIndex, period) {
    try {
        // 尝试使用 RPC 函数（原子操作）
        const { error: rpcError } = await supabaseAdmin.rpc('increment_rentcast_usage', {
            p_key_index: keyIndex,
            p_month: period
        });

        if (!rpcError) {
            console.log(`[RentCast] Key ${keyIndex} usage incremented for period ${period}`);
            return;
        }

        // RPC 失败，回退到 upsert
        console.warn('[RentCast] RPC failed, falling back to upsert:', rpcError);
    } catch (e) {
        console.warn('[RentCast] RPC exception, falling back to upsert:', e);
    }

    // 回退方案：先查询再更新
    const { data: existing } = await supabaseAdmin
        .from('rentcast_key_usage')
        .select('usage_count')
        .eq('key_index', keyIndex)
        .eq('month', period)
        .single();

    if (existing) {
        await supabaseAdmin
            .from('rentcast_key_usage')
            .update({
                usage_count: existing.usage_count + 1,
                updated_at: new Date().toISOString()
            })
            .eq('key_index', keyIndex)
            .eq('month', period);
    } else {
        await supabaseAdmin
            .from('rentcast_key_usage')
            .insert({
                key_index: keyIndex,
                month: period,
                usage_count: 1,
                updated_at: new Date().toISOString()
            });
    }

    console.log(`[RentCast] Key ${keyIndex} usage incremented for period ${period} (fallback)`);
}

/**
 * 严格顺序选择下一个可用的 API Key
 * - 单 Key 时：不检查配额，直接返回
 * - 多 Key 时：从 Key 0 开始，找第一个使用量 < 限制的 Key
 * 
 * @returns {{ key: string, index: number } | null}
 */
async function selectNextKey() {
    const keys = getApiKeys();

    // 单 Key 模式：不检查配额，直接返回
    if (keys.length === 1) {
        console.log('[RentCast] Single key mode - no quota limit');
        return { key: keys[0], index: 0 };
    }

    // 多 Key 模式：启用配额控制
    const period = getCurrentBillingPeriod();
    const usages = await getKeyUsages(period);

    console.log(`[RentCast] Billing period: ${period}, Reset day: ${RESET_DAY}`);
    console.log(`[RentCast] Key usages:`, usages.map(u => `Key${u.key_index}=${u.usage_count}/${MONTHLY_LIMIT_PER_KEY}`).join(', '));

    // 严格按索引顺序查找第一个未满的 Key
    for (let i = 0; i < usages.length; i++) {
        if (usages[i].usage_count < MONTHLY_LIMIT_PER_KEY) {
            console.log(`[RentCast] Selected Key ${i} (usage: ${usages[i].usage_count})`);
            return {
                key: keys[i],
                index: i
            };
        }
    }

    console.warn('[RentCast] All API keys have reached monthly limit');
    return null;
}

/**
 * 调用 RentCast API（带自动 Key 轮询，成功后计数）
 * 
 * @param {string} endpoint - API 端点 URL
 * @param {object} options - fetch 选项
 * @returns {Promise<Response>} API 响应
 */
export async function callRentCast(endpoint, options = {}) {
    const keyInfo = await selectNextKey();

    if (!keyInfo) {
        const totalKeys = getApiKeys().length;
        const totalLimit = totalKeys * MONTHLY_LIMIT_PER_KEY;
        throw new Error(`All RentCast API keys have reached their monthly limit (${totalLimit} total calls). Resets on day ${RESET_DAY}.`);
    }

    const { key, index } = keyInfo;
    const period = getCurrentBillingPeriod();

    const response = await fetch(endpoint, {
        ...options,
        headers: {
            ...options.headers,
            'X-Api-Key': key,
            'Accept': 'application/json'
        }
    });

    // 只有成功（200-299）才计数
    if (response.ok) {
        await incrementKeyUsage(index, period);
    } else {
        console.warn(`[RentCast] API returned ${response.status}, not counting usage`);
    }

    return response;
}

/**
 * 获取当前配额状态
 * 
 * @returns {Promise<object>} 配额信息
 */
export async function getRentCastQuotaStatus() {
    const keys = getApiKeys();
    const period = getCurrentBillingPeriod();
    const usages = await getKeyUsages(period);

    const totalLimit = keys.length * MONTHLY_LIMIT_PER_KEY;
    const totalUsed = usages.reduce((sum, u) => sum + u.usage_count, 0);
    const remaining = totalLimit - totalUsed;

    // 计算下次重置日期
    const now = new Date();
    let nextResetDate;
    if (now.getDate() >= RESET_DAY) {
        // 下个月的重置日
        nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, RESET_DAY);
    } else {
        // 本月的重置日
        nextResetDate = new Date(now.getFullYear(), now.getMonth(), RESET_DAY);
    }

    return {
        period,
        resetDay: RESET_DAY,
        nextResetDate: nextResetDate.toISOString().split('T')[0],
        totalKeys: keys.length,
        limitPerKey: MONTHLY_LIMIT_PER_KEY,
        totalLimit,
        totalUsed,
        remaining,
        keys: usages.map(u => ({
            index: u.key_index,
            used: u.usage_count,
            remaining: Math.max(0, MONTHLY_LIMIT_PER_KEY - u.usage_count),
            exhausted: u.usage_count >= MONTHLY_LIMIT_PER_KEY
        }))
    };
}

export default {
    callRentCast,
    getRentCastQuotaStatus
};
