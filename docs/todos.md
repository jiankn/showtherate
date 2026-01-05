# ShowTheRate 改动清单（方案）

## 0. 约定
- 复制功能 = 复制分享链接（/s/[shareId]）
- 客户信息：分享前弹出录入，可跳过；未填写归类为“未知客户”
- 登录态显示需覆盖所有有导航的页面（营销页 + App）

## 1. 全站导航登录态统一
- 目标：登录后隐藏 Sign In / Get Started，显示头像 + 下拉菜单；未登录保留原按钮
- 涉及文件：
  - `src/components/Header.jsx`
  - `src/components/Header.module.css`
  - `src/components/TopBar.jsx`
  - `src/components/TopBar.module.css`
  - `src/app/pricing/page.js`
  - `src/app/privacy/page.js`
  - `src/app/terms/page.js`
  - `src/app/blog/page.js`
  - `src/app/blog/[slug]/page.js`
  - `src/app/blog/page.module.css`
  - `src/app/blog/[slug]/page.module.css`
  - `next.config.mjs`（若使用 next/image）
- 改动点：
  - Header 使用 `useSession` 判断登录态，并在未登录时保留现有按钮
  - 登录后显示头像：优先 `session.user.image`，无图用名字/邮箱首字母
  - 下拉菜单项：Dashboard(`/app`)、Settings(`/app/settings`)、Upgrade Plan(`/app/upgrade`)、Sign Out
  - 移动端菜单同步：登录后不显示 Sign In / Get Started，改为用户入口 + 下拉菜单
  - TopBar 同步头像与菜单项；移除 Home；新增 Dashboard；Upgrade 指向 `/app/upgrade`
  - 可抽 `UserMenu` 组件供 Header/TopBar 复用，包含点击外部关闭逻辑
  - 若用 `next/image` 展示头像：`next.config.mjs` 增加 `lh3.googleusercontent.com` 远程域名
  - 博客页引入 `<Header />`，并为主体添加 top padding（避免固定头遮挡）

## 2. Upgrade Plan 链接统一
- 将所有 “Upgrade Plan / Upgrade” 指向 `/app/upgrade`
- 涉及文件：
  - `src/components/TopBar.jsx`
  - `src/components/Header.jsx`
  - `src/app/app/settings/page.js`（Upgrade to Pro 按钮改为 Link）
  - 其他出现 Upgrade 的入口按需排查（如 CTA 或菜单）

## 3. Comparisons 列表与 View 页面
- 目标：列表接入真实数据，支持 View/复制分享链接/删除
- 涉及文件：
  - `src/app/app/comparisons/page.js`
  - `src/app/app/comparisons/page.module.css`
  - 新增 `src/app/app/comparisons/[id]/page.js`
  - 新增 `src/app/app/comparisons/[id]/page.module.css`
  - 新增 `src/app/api/comparisons/[id]/route.js`
- 改动点：
  - 替换 MOCK 数据：`GET /api/comparisons` 获取列表
  - 状态字段：可新增 `comparisons.status`，或基于 share 是否存在/过期推导
  - View 行为：进入 `/app/comparisons/[id]` 展示只读详情（标题、场景、图表、分享信息）
    - 复用 `src/components/share/ScenarioCard.jsx`、`PaymentComparisonBar.jsx`、`LongTermComparison.jsx`
  - 复制分享链接：
    - 调用 `POST /api/shares`（body: `{ comparisonId }`）
    - 使用返回的 `shareId` 复制 `${origin}/s/${shareId}`
    - 若返回 `isExisting`，直接复用
  - 删除：
    - 新增 `DELETE /api/comparisons/[id]`（校验 user_id）
    - 前端二次确认，成功后从列表移除并提示

## 4. Clients 数据与页面设计
- 目标：客户信息可选；未填归类“未知客户”；显示每客户 comparisons 数量与详情
- 关系约定：Comparison 归属 0 或 1 个 Client；Client 可拥有多个 Comparisons（1:N）
- 数据模型（`supabase/schema.sql` + 迁移）：
  - 新建 `clients` 表：`id`, `user_id`, `name`, `email`, `phone`, `status`, `created_at`, `updated_at`
  - `comparisons` 增加 `client_id` 外键（可为空）
  - 索引：`clients(user_id, email)`、`comparisons(user_id, client_id)`
- API：
  - 新增 `GET/POST /api/clients`（列表/新增）
  - 新增 `GET /api/clients/[id]`（详情 + comparisons 列表）
- 交互：
  - 在“复制分享链接”前弹出 Client 信息表单（name/email/phone，均可选）
  - 若填写：创建/复用 client，并写入 `comparisons.client_id`
  - 若跳过：`client_id` 保持为空
- Clients 页展示：
  - 已填客户：展示头像（首字母）、对比数量、最近活动
  - 未填客户：汇总为“未知客户”，数量来自 `client_id IS NULL` 的 comparisons
  - 点击客户卡片进入 `/app/clients/[id]` 详情页
  - “未知客户”可进入 `/app/clients/unknown` 或在列表中打开过滤视图

## 5. Analytics 完善与穿透
- 目标：可查看真实指标，点击穿透到比较详情或筛选活动
- 数据模型（`supabase/schema.sql` + 迁移）：
  - 新增 `share_events` 表：`id`, `share_id`, `comparison_id`, `user_id`, `event_type`, `device`, `referrer`, `created_at`
  - 可选：在 `shares` 维护 `view_count`（累加）
- 事件采集：
  - `src/app/s/[shareId]/page.js`：
    - 页面加载发送 `share_page_view`
    - CTA 点击（Call/Text/Email/Social）发送 `cta_click`
- API：
  - 新增 `GET /api/analytics`（支持 `range`, `comparisonId`, `clientId` 参数）
  - 返回 KPI、时序、设备分布、最近活动
- 前端：
  - `src/app/app/analytics/page.js` 接入真实 API
  - KPI/图表可点击穿透：过滤列表或跳到 `/app/comparisons/[id]`
  - Activity List 支持点击跳转对应 comparison/client

## 6. 基本验收要点（手测）
- 登录/未登录在各导航栏显示一致
- Google 登录显示头像；无头像显示首字母
- Comparisons 列表可复制分享链接并能打开 `/s/[shareId]`
- 删除 comparison 后列表更新
- Clients 页面包含“未知客户”并显示比较数量
- Analytics 页面能展示真实数据并支持穿透
