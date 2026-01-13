# 环境变量配置指南

## 必需的环境变量

在你的 `.env.local` 文件中需要设置以下变量：

### Supabase 配置
```bash
# Supabase 项目 URL (公开)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase 匿名密钥 (公开)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase 服务角色密钥 (私有 - 仅服务器端使用)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Stripe 配置 (支付功能)
```bash
# Stripe 密钥 (测试环境)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook 签名密钥
STRIPE_WEBHOOK_SECRET=whsec_...

# 产品价格 ID
STRIPE_STARTER_PASS_PRICE_ID=price_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

## 获取 Supabase 配置

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 获取 Stripe 配置

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** > **API keys**
3. 复制 **Secret key**
4. 进入 **Developers** > **Webhooks**
5. 创建 webhook endpoint 并复制签名密钥

## 数据库初始化

运行以下命令来设置数据库：

```bash
# 应用数据库模式
psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql

# 插入种子数据
psql -h your-db-host -U postgres -d postgres -f supabase/seed_posts.sql
```

## 测试连接

运行数据库测试：

```bash
node scripts/test-db.js
```

## 常见问题

### 博客页面显示错误
如果博客页面显示 "Blog Temporarily Unavailable"，说明：

1. **环境变量未设置** - 检查 `.env.local` 文件
2. **数据库连接失败** - 运行 `node scripts/test-db.js` 检查
3. **表不存在** - 确保已运行数据库迁移脚本

### 支付功能不工作
如果支付按钮不工作，说明：

1. **Stripe 环境变量缺失** - 检查所有 STRIPE_* 变量
2. **价格 ID 错误** - 在 Stripe Dashboard 中确认价格 ID
3. **Webhook 未配置** - 确保 webhook endpoint 已设置