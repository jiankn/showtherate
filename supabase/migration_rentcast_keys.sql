-- RentCast API Key 使用量追踪表
-- 用于管理多个 API Key 的轮询和配额控制

CREATE TABLE IF NOT EXISTS rentcast_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_index INTEGER NOT NULL,         -- Key 索引 (0, 1, 2, 3)
    month TEXT NOT NULL,                -- 月份格式: "2026-01"
    usage_count INTEGER DEFAULT 0,      -- 当月使用次数
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key_index, month)            -- 每个 Key 每月一条记录
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_rentcast_key_usage_month ON rentcast_key_usage(month);

-- 原子性增加使用次数的函数
CREATE OR REPLACE FUNCTION increment_rentcast_usage(p_key_index INTEGER, p_month TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO rentcast_key_usage (key_index, month, usage_count, updated_at)
    VALUES (p_key_index, p_month, 1, NOW())
    ON CONFLICT (key_index, month)
    DO UPDATE SET 
        usage_count = rentcast_key_usage.usage_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE rentcast_key_usage IS 'RentCast API Key 使用量追踪，用于多 Key 轮询';
COMMENT ON COLUMN rentcast_key_usage.key_index IS 'API Key 索引，对应 RENTCAST_API_KEYS 环境变量中的位置';
COMMENT ON COLUMN rentcast_key_usage.month IS '月份标识，格式 YYYY-MM';
COMMENT ON COLUMN rentcast_key_usage.usage_count IS '该 Key 在该月的使用次数';
