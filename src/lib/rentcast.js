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
 * 轮询选择下一个 API Key（Round-Robin 取模轮询）
 * - 单 Key 时：直接返回该 Key
 * - 多 Key 时：基于总调用次数取模，实现负载均衡
 * 
 * @returns {{ key: string, index: number } | null}
 */
async function selectNextKey() {
    const keys = getApiKeys();

    // 单 Key 模式：直接返回
    if (keys.length === 1) {
        console.log('[RentCast] Single key mode');
        return { key: keys[0], index: 0 };
    }

    // 多 Key 模式：轮询分配
    const period = getCurrentBillingPeriod();
    const usages = await getKeyUsages(period);

    // 计算总调用次数
    const totalUsed = usages.reduce((sum, u) => sum + u.usage_count, 0);

    // 取模得到下一个 Key 索引（Round-Robin）
    const nextIndex = totalUsed % keys.length;

    console.log(`[RentCast] Billing period: ${period}, Reset day: ${RESET_DAY}`);
    console.log(`[RentCast] Key usages:`, usages.map(u => `Key${u.key_index}=${u.usage_count}/${MONTHLY_LIMIT_PER_KEY}`).join(', '));
    console.log(`[RentCast] Round-robin: total=${totalUsed}, next=Key${nextIndex}`);

    // 检查选中的 Key 是否已达到配额限制
    const selectedUsage = usages.find(u => u.key_index === nextIndex);
    if (selectedUsage && selectedUsage.usage_count >= MONTHLY_LIMIT_PER_KEY) {
        // 如果轮询到的 Key 已满，尝试找其他可用的 Key
        for (let i = 0; i < keys.length; i++) {
            const usage = usages.find(u => u.key_index === i);
            if (!usage || usage.usage_count < MONTHLY_LIMIT_PER_KEY) {
                console.log(`[RentCast] Key${nextIndex} exhausted, fallback to Key${i}`);
                return {
                    key: keys[i],
                    index: i,
                    usage: usage ? usage.usage_count : 0
                };
            }
        }
        // 所有 Key 都已达到限制
        console.warn('[RentCast] All API keys have reached monthly limit');
        return null;
    }

    return {
        key: keys[nextIndex],
        index: nextIndex,
        usage: selectedUsage ? selectedUsage.usage_count : 0
    };
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

        // 检查配额是否达到阈值，触发告警
        // 阈值：80% (警告) 和 100% (耗尽)
        // 注意：这里用简单判定，可能存在并发重复发送，但对于告警是可以接受的
        const currentUsage = (keyInfo.usage || 0) + 1;
        const limit = MONTHLY_LIMIT_PER_KEY;

        // 80% 阈值 (例如 50 * 0.8 = 40)
        const threshold80 = Math.floor(limit * 0.8);

        if (currentUsage === threshold80 || currentUsage === limit) {
            console.log(`[RentCast] Triggering usage alert for Key ${index}: ${currentUsage}/${limit}`);
            // 动态导入避免循环依赖
            const { sendRentCastUsageAlert } = await import('@/lib/email/mailer');
            // 异步发送，不阻塞 API 响应
            sendRentCastUsageAlert(index, currentUsage, limit, period).catch(err => {
                console.error('[RentCast] Failed to trigger alert:', err);
            });
        }

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
