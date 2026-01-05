# Stripe 支付接入配置指南

## 环境变量配置

在你的 `.env.local` 文件中需要设置以下 Stripe 相关变量：

```bash
# Stripe 密钥配置
STRIPE_SECRET_KEY=sk_test_...          # Stripe 密钥 (生产环境用 sk_live_)
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook 签名密钥

# 产品价格 ID (从 Stripe 控制台获取)
STRIPE_STARTER_PASS_PRICE_ID=price_... # 7天体验卡价格 ID
STRIPE_MONTHLY_PRICE_ID=price_...      # 月度订阅价格 ID
STRIPE_YEARLY_PRICE_ID=price_...       # 年度订阅价格 ID
```

## 获取 Stripe 密钥

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** > **API keys**
3. 复制 **Secret key** (测试环境用 `sk_test_`, 生产环境用 `sk_live_`)

## 创建产品和价格

1. 进入 **Products** 页面
2. 创建以下产品：
   - **Starter Pass (7 Days)**: 一次性支付，价格自定
   - **Monthly Subscription**: 月度订阅
   - **Annual Subscription**: 年度订阅
3. 为每个产品创建价格，获取对应的 `price_` 开头的 ID

## 配置 Webhook

1. 进入 **Developers** > **Webhooks**
2. 添加 endpoint: `https://yourdomain.com/api/stripe/webhook`
3. 选择监听事件：
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 复制生成的 **Webhook signing secret**

## 当前接入状态

✅ **已完成**
- Stripe SDK 集成 (`src/lib/stripe.js`)
- Checkout 会话创建 (`src/app/api/billing/checkout/route.js`)
- Webhook 事件处理 (`src/app/api/stripe/webhook/route.js`)
- 管理员面板集成 (`src/lib/adminStripe.js`)
- 数据库订阅表结构

⚠️ **需要配置**
- 在 `.env.local` 中设置上述环境变量
- 在 Stripe 控制台创建产品和价格
- 配置 webhook endpoint