-- Boost Pack Migration
-- 为加购套餐功能新增必要的数据库字段和表

-- ============================================
-- 1. 修改 entitlements 表，新增加购配额字段
-- ============================================
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS bonus_property_quota INTEGER DEFAULT 0;
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS bonus_ai_quota INTEGER DEFAULT 0;
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS bonus_expires_at TIMESTAMPTZ;

-- ============================================
-- 2. 创建 quota_purchases 表记录加购历史
-- ============================================
CREATE TABLE IF NOT EXISTS quota_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_amount INTEGER NOT NULL DEFAULT 0,
    ai_amount INTEGER NOT NULL DEFAULT 0,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quota_purchases_user ON quota_purchases(user_id);

-- RLS for quota_purchases
ALTER TABLE quota_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quota_purchases_select_own ON quota_purchases;
CREATE POLICY quota_purchases_select_own ON quota_purchases FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 3. 创建累加加购配额的存储函数
-- ============================================
CREATE OR REPLACE FUNCTION add_bonus_quota(
    p_user_id UUID,
    p_property INTEGER,
    p_ai INTEGER,
    p_expires_at TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
    UPDATE entitlements
    SET 
        bonus_property_quota = COALESCE(bonus_property_quota, 0) + p_property,
        bonus_ai_quota = COALESCE(bonus_ai_quota, 0) + p_ai,
        bonus_expires_at = GREATEST(COALESCE(bonus_expires_at, p_expires_at), p_expires_at)
    WHERE user_id = p_user_id AND type = 'subscription';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
