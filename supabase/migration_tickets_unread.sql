-- =============================================
-- 工单系统 - 添加未读回复字段
-- has_unread_reply: 用于追踪用户是否有未读的客服回复
-- has_unread_customer_reply: 用于追踪管理员是否有未读的用户回复
-- =============================================

-- 1. 添加 has_unread_reply 字段（用户端）
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS has_unread_reply BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. 添加 has_unread_customer_reply 字段（管理员端）
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS has_unread_customer_reply BOOLEAN NOT NULL DEFAULT TRUE;
-- 默认为TRUE，因为新工单对管理员来说是未读的

-- 3. 创建索引（用于快速查询未读工单）
CREATE INDEX IF NOT EXISTS idx_tickets_unread_reply 
ON tickets(requester_id, has_unread_reply) 
WHERE has_unread_reply = TRUE;

CREATE INDEX IF NOT EXISTS idx_tickets_unread_customer_reply 
ON tickets(has_unread_customer_reply) 
WHERE has_unread_customer_reply = TRUE;

-- 4. 添加字段注释
COMMENT ON COLUMN tickets.has_unread_reply IS '用户是否有未读的客服回复：客服回复时设为TRUE，用户查看后设为FALSE';
COMMENT ON COLUMN tickets.has_unread_customer_reply IS '管理员是否有未读的用户回复：用户回复或创建工单时设为TRUE，管理员查看后设为FALSE';

-- 完成
