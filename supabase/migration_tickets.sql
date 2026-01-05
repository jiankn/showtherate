-- =============================================
-- 工单系统 (Ticket System) - ShowTheRate
-- STR 前缀 / IMAP 收信 / 加州工时 SLA
-- =============================================

-- 1. 工单主表
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no VARCHAR(15) NOT NULL UNIQUE,  -- STR-000001
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 状态管理
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    -- new: 新建
    -- assigned: 已受理（首次响应完成）
    -- processing: 处理中
    -- waiting_customer: 待用户反馈
    -- resolved: 已解决
    -- closed: 已关闭
    
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    -- low, normal, high, urgent
    
    -- 绑定业务实体（必填）
    bind_type VARCHAR(50) NOT NULL,  -- 'comparison', 'client', 'subscription', 'general'
    bind_id UUID,  -- 关联的业务实体ID（general类型可为空）
    
    -- 用户信息
    requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_name VARCHAR(100),
    
    -- 客服分配（单客服模式）
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- SLA 相关
    sla_deadline TIMESTAMPTZ,  -- 首次响应截止时间
    sla_status VARCHAR(20) NOT NULL DEFAULT 'normal',  -- normal, warn, overdue
    first_response_at TIMESTAMPTZ,  -- 首次响应时间
    
    -- 解决信息
    resolution TEXT,  -- 解决说明
    resolved_at TIMESTAMPTZ,
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 工单消息表
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    
    -- 作者信息（内部用户或外部邮件）
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 内部用户
    author_email VARCHAR(255),  -- 邮件发送者
    author_name VARCHAR(100),
    author_type VARCHAR(20) NOT NULL DEFAULT 'customer',  -- customer, staff, system
    
    -- 消息来源
    source VARCHAR(20) NOT NULL DEFAULT 'web',  -- web, email
    
    -- 消息内容
    body TEXT NOT NULL,
    body_html TEXT,  -- HTML格式（邮件原始格式）
    
    -- 附件（JSON数组）
    attachments JSONB DEFAULT '[]',
    -- 格式: [{"name": "file.pdf", "url": "...", "size": 1024, "type": "application/pdf"}]
    
    -- 邮件相关（用于IMAP去重和关联）
    message_id VARCHAR(255),  -- 邮件Message-ID头
    in_reply_to VARCHAR(255),  -- 邮件In-Reply-To头
    "references" TEXT,  -- 邮件References头（多个ID）
    imap_uid VARCHAR(100),  -- IMAP UID
    mailbox VARCHAR(100),  -- 来源邮箱文件夹
    
    -- 审核状态（非创建人邮件需审核）
    review_status VARCHAR(20) DEFAULT 'approved',  -- approved, pending, rejected
    
    -- 是否为首次响应
    is_first_response BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SLA 配置表
CREATE TABLE IF NOT EXISTS sla_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE DEFAULT 'default',
    
    -- 时区
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
    
    -- 工作日（JSON数组）
    workdays JSONB NOT NULL DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri"]',
    
    -- 工作时间
    work_start TIME NOT NULL DEFAULT '09:00',
    work_end TIME NOT NULL DEFAULT '18:00',
    
    -- 首次响应时限（工作小时）
    first_response_hours INTEGER NOT NULL DEFAULT 8,
    
    -- 提醒阈值（剩余分钟数）
    warn_threshold_1 INTEGER NOT NULL DEFAULT 120,  -- 2小时
    warn_threshold_2 INTEGER NOT NULL DEFAULT 30,   -- 30分钟
    
    -- 节假日列表（JSON数组，格式：YYYY-MM-DD）
    holidays JSONB NOT NULL DEFAULT '[]',
    -- 2025年美国联邦假日示例
    
    -- 是否启用
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 工单号序列
CREATE SEQUENCE IF NOT EXISTS ticket_no_seq START WITH 1;

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_status ON tickets(sla_status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_bind ON tickets(bind_type, bind_id);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at DESC);

-- IMAP去重唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_messages_imap_unique 
ON ticket_messages(imap_uid, message_id) 
WHERE imap_uid IS NOT NULL AND message_id IS NOT NULL;

-- 6. 更新时间触发器
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();

-- 7. 生成工单号函数
CREATE OR REPLACE FUNCTION generate_ticket_no()
RETURNS VARCHAR(15) AS $$
DECLARE
    seq_val BIGINT;
BEGIN
    seq_val := nextval('ticket_no_seq');
    RETURN 'STR-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. RLS 策略
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_config ENABLE ROW LEVEL SECURITY;

-- 用户可查看自己的工单
CREATE POLICY tickets_user_select ON tickets
    FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = assignee_id);

-- 用户可创建工单
CREATE POLICY tickets_user_insert ON tickets
    FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- 用户可查看自己工单的消息
CREATE POLICY ticket_messages_user_select ON ticket_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_messages.ticket_id 
            AND (tickets.requester_id = auth.uid() OR tickets.assignee_id = auth.uid())
        )
    );

-- 用户可在自己的工单中添加消息
CREATE POLICY ticket_messages_user_insert ON ticket_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_messages.ticket_id 
            AND tickets.requester_id = auth.uid()
        )
    );

-- SLA配置只读（管理员通过service role修改）
CREATE POLICY sla_config_select ON sla_config
    FOR SELECT
    USING (TRUE);

-- 9. 插入默认SLA配置
INSERT INTO sla_config (name, holidays)
VALUES ('default', '[
    "2025-01-01",
    "2025-01-20",
    "2025-02-17",
    "2025-05-26",
    "2025-06-19",
    "2025-07-04",
    "2025-09-01",
    "2025-10-13",
    "2025-11-11",
    "2025-11-27",
    "2025-12-25",
    "2026-01-01",
    "2026-01-19",
    "2026-02-16",
    "2026-05-25",
    "2026-06-19",
    "2026-07-03",
    "2026-09-07",
    "2026-10-12",
    "2026-11-11",
    "2026-11-26",
    "2026-12-25"
]')
ON CONFLICT (name) DO NOTHING;

-- 完成
COMMENT ON TABLE tickets IS '工单主表 - STR前缀编号';
COMMENT ON TABLE ticket_messages IS '工单消息记录 - 支持Web和Email来源';
COMMENT ON TABLE sla_config IS 'SLA配置 - 加州工时 8小时首次响应';
