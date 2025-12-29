# PRD.md — ShowTheRate.com（Phase 1：Independent Loan Officer）
> **文档版本**：v1.2.1  > **最后更新**：2025-12-30  
> **产品域名**：showtherate.com  
> **产品一句话定位**：Loan Officer 口袋里的「60秒出方案 + 一键分享 + AI成交话术」工具（Responsive Web/PWA：Mobile-first，但必须在 Tablet / Desktop 同样优秀）。  
> **本次更新摘要**：v1.2.1 写入 Neo Pop (Gamified) 视觉体系与多端适配规范（Desktop/Tablet/Mobile）；保留并强化 Multi-Calculator Matrix（SEO 降维打击）规划与配置驱动页面生成思路。

---

## 1. 背景与机会

Loan Officer（LO）给客户展示贷款方案时，常见痛点是：
- 方案数字复杂、客户看不懂、沟通成本高；
- Excel/银行系统导出的 worksheet 丑且不适合移动端；
- Open House / 看房现场需要“立刻算、立刻解释、立刻发给客户”。

**ShowTheRate 的目标**：把“算清楚 + 讲明白 + 发出去”做成一个 60 秒闭环，并用 AI 在最后一公里提升成交率。

---

## 2. 产品目标（Goals）与边界（Non-goals）

### 2.1 Goals（Phase 1）
1. **60秒内生成并分享**：在手机上完成输入 → 生成对比报告链接 → 发送给客户（短信/WhatsApp/iMessage/微信均可）。
2. **更专业的可视化对比**：多方案并列对比（Scenario Comparison）+ 关键指标可视化（Payment breakdown / 5y-10y total cost）。
3. **房产税自动填充（US）**：输入地址后按需获取 property tax（失败可优雅降级手填）。
4. **AI 成交副驾驶（基础版）**：根据方案数据，生成可复制的“人话解释 + 推荐结论”，并提供语气改写。
5. **PLG 自助付费**：独立 LO 可自助购买 Starter Pass 或订阅（Stripe），无需销售介入即可开始使用。
6. **成本可控**：所有外部成本项（房产数据、AI）必须有“配额 + 缓存 + 手动触发 + 反滥用”。**任何套餐都禁止 address typing auto-fetch；也不允许 Generate 自动触发外部请求**（必须由用户点击按钮确认）。

### 2.2 Non-goals（Phase 1 不做）
- 复杂合规/机构级「100%精确」贷款引擎（本产品是“销售展示与沟通工具”，非放贷核心系统）。
- 加拿大/多国家计算逻辑（Phase 1 仅 US；为未来扩展保留字段）。
- CRM 全量集成/团队权限体系（Enterprise 放 Phase 2+）。
- 原生 App（iOS/Android）；Phase 1 只做 Mobile-first Web + PWA。

---

## 3. 目标用户与画像（Persona）

### 3.1 主 Persona：Independent Loan Officer（第一阶段唯一主攻）
- 规模：个人执业/小经纪人
- 诉求：省时间、显专业、提升成交率、随时随地报价
- 付费能力：愿意为“多成交 1 单/月”付 $59/月（或先付 $9.9 试用）

### 3.2 次 Persona（Phase 2）
- 5–20 人的小团队（Brokerage/Branch）：需要白标、团队报表、统一计费、权限与模板。

---

## 4. 核心用户旅程（User Journey）

### Journey A：Open House 现场“30秒闭环”（Starter Pass / Subscription）
1. LO 打开 showtherate.com（手机）
2. 点击 **New Comparison**
3. 输入：Home Price、Down Payment、Rate、Term、Address（可选）
4. （可选）点击 **Fetch tax & details** 获取税费（不自动触发）
5. 点击 **Generate**（不触发外部查询，仅使用已获取/手填/估算值）
6. 生成 Share Link + 自动生成分享文案（可复制）
6. 点击 **AI Summary** → 得到 80–120 字建议话术 → 复制发给客户
7. 客户打开链接（无需登录） → 看懂差异 → 促成下一步（pre-approval / application）

### Journey B：营销站 Demo（免费，不等同试用）
1. 访客打开 `/` 或 SEO 页面
2. 使用“可编辑的示例输入”做本地试算
3. 看到生成分享链接/AI 的入口，但会被提示：**购买 $9.9 Starter Pass 或订阅解锁**

---

## 5. 信息架构与页面清单

### 5.1 页面
- Marketing
  - `/` 首页（价值主张 + $9.9 Starter Pass + 订阅定价 + Demo）
  - `/pricing`
  - `/compare/[slug]`（Programmatic SEO：A vs B 决策类）
  - `/calculator/[slug]`（Programmatic SEO：Loan Type / Geo 类）
  - `/blog/*`（内容 SEO）
- App（需登录）
  - `/app` Dashboard（Recent comparisons）
  - `/app/new` 新建对比
  - `/app/c/[comparisonId]` 编辑对比
  - `/app/settings` 账户与计费（订阅、Pass 状态与配额）
- Public（无需登录）
  - `/s/[shareId]` 分享报告页（客户打开）

### 5.2 导航原则（Mobile-first + Responsive）
- 主 CTA 固定在底部（拇指热区）：**Generate / Share**
- 输入页避免多键盘：滑块、分段选择器、快捷按钮（+/-）
- Desktop/Tablet：CTA 可在顶部工具栏或右侧栏保持可见，但必须与 Mobile 的“主 CTA”保持同一语义与样式（Neo Pop Primary CTA）。

---

## 6. 功能需求（Functional Requirements）

> 说明：每个功能均给出“用户故事 / 规则 / 验收标准（AC）”。

### 6.1 访问层级（Access Tiers）与计费（Billing）

#### 6.1.1 产品可用性分层（必须实现）
**Free Demo（免费）**
- 不要求登录
- 仅支持“本地试算”（不保存，不生成 share link，不调用 RentCast，不调用 AI）
- 用于 SEO/营销转化

**Starter Pass（一次性）：$9.9 / 7 days**
- 需要登录后购买（Email magic link / Google）
- 解锁 App 保存、生成 share link、调用 RentCast、调用 AI（均受配额控制）
- 付费后立即生效，有效期 7×24 小时

**Subscription（订阅）：$59/mo 或 $588/yr**
- 解锁完整能力
- RentCast：150 queries / month（可配置），按月重置
- AI：Fair use（建议 300 次/月，按月重置；可配置）

#### 6.1.2 Starter Pass 配额（成本封顶）
> 配额设计必须满足“能完成真实成交闭环”，同时能把外部成本封顶。

- Share Links：**5**（创建 `shareId` 才扣）
- RentCast property fetch：**10**（仅 cache miss 才扣）
- AI generations：**30**（仅 cache miss 才扣）
- Comparisons 保存数量：建议不限制（或上限 20，避免滥存）

**Starter Pass 的 share link 过期策略**
- Starter Pass 创建的 share link：默认 **14 天过期**
- 若用户在 Pass 有效期内升级订阅：所有未过期的 share link 自动延长为“订阅规则”（建议：不再过期/或延长 1 年）

#### 6.1.3 升级激励（推荐）
- 用户在 Starter Pass 有效期内升级订阅：**首月立减 $9.9（等额抵扣）**
- 技术实现：Stripe Promotion Code / Coupon（仅对该用户有效、仅一次）

#### 6.1.4 计费流程（Stripe）
- Starter Pass：一次性 Checkout（one-time payment）
- Subscription：月付/年付订阅 Checkout
- Webhooks：checkout.session.completed、invoice.payment_succeeded、customer.subscription.updated、customer.subscription.deleted

**验收标准（AC）**
- AC1：未付费用户只能 Demo 试算，无法创建 share link/无法调用外部 API/无法使用 AI。
- AC2：购买 Starter Pass 后立即获得有效期与配额显示（settings 页面可见）。
- AC3：Starter Pass 在到期后自动降级为 Free（已创建 share link 仍按“过期策略”工作）。
- AC4：升级订阅后，自动应用 $9.9 抵扣（仅一次），且 share link 过期策略升级。
- AC5：Stripe webhook 可靠处理：重复投递幂等、状态一致。

---

### 6.2 核心：Scenario Builder（对比方案编辑器）
**用户故事**
- 作为 LO，我能在一个对比里创建 2–4 个方案，并快速切换对比。
- 作为 LO，我能在手机上完成输入，且不超过 60 秒。

**字段（Phase 1 必须）**
- Loan basics
  - Home Price（必填）
  - Down Payment（% 或 $，二选一；必填）
  - Loan Amount（自动计算，可编辑开关：默认不可编辑）
  - Interest Rate APR（必填）
  - Term（15/20/30 年，必填）
- Taxes & insurance
  - Address（可选；用于手动触发拉取）
  - Property Tax（年税额，默认通过 API 预填；可手改）
  - Home Insurance（年保费，默认估算；可手改）
  - HOA（每月，可选）
- PMI（可配置）
  - LTV > 80% 默认开启
  - PMI rate 默认 0.50%/年（可在设置页改默认值）
- Closing Costs
  - **Points (Discount Points)**: 输入 %（默认 0），自动计算金额并计入 Closing Costs（交易核心需求）。
  - Other Costs: 输入总额（默认 Loan Amount * 1.5%~2.5%，可手改）。
  - **Total Closing Costs** = Points($) + Other Costs($).

**交互规则**
- 支持 “Duplicate scenario”
- 支持 “Quick presets”：
  - **FHA (Critical)**：若选择 FHA，自动开启 "Financed UFMIP" 逻辑（默认 UFMIP rate 1.75%），Base Loan + UFMIP = Total Loan 用于算月供。
  - Conventional：标准逻辑。

**验收标准（AC）**
- AC1：在 iPhone 视口下可完成 2 个方案创建，并一键生成报告。
- AC2：生成前进行字段校验：必填缺失时高亮提示。
- AC3：同一 comparison 下至少支持 4 个 scenario 且性能不卡顿（<300ms UI 响应）。

---

### 6.3 计算引擎（Calculator Core）
**必须输出指标**
- **Loan Details**: Base Loan Amount, UFMIP (if FHA), Total Loan Amount
- Monthly Payment（P&I）
- Monthly Taxes（Property tax / 12）
- Monthly Insurance（Insurance / 12）
- Monthly HOA
- PMI（若启用）
- **Total Monthly Payment（PITI + HOA + PMI）**
- Upfront Cash to Close（Down payment + Closing costs - Credits）
- 5-year / 10-year snapshot
  - Total paid
  - Principal paid
  - Interest paid

**计算原则**
- 使用标准 amortization monthly payment 公式
- 税费/保险按月均摊
- PMI：Phase 1 用贷款额 * PMI_rate/12（简化，需标注 Estimates）
- 所有“简化模型”在 UI 中明确标注 *Estimates*

**验收标准（AC）**
- AC1：对同一输入，前后端计算结果一致（误差 < $1）。
- AC2：关键函数有单元测试覆盖（>= 20 个用例）。

---

### 6.4 房产数据：RentCast（US）+ 缓存 + 配额 + 降级（成本敏感）
**用户故事**
- 作为 LO，我输入地址后能一键得到 Property Tax（节省输入时间）。
- 作为产品方，我希望外部 API 成本封顶、且不被滥用。

**调用规则（必须）**
- **仅在用户点击 `Fetch tax & details` 按钮时触发外部请求**
- **禁止** address typing auto-fetch（地址输入/粘贴/编辑过程中不得触发）
- **禁止** Generate auto-fetch（点击 Generate/创建 Share Link 不得自动触发外部请求）

**UX 提示（推荐，仍属于手动触发）**
- 如果 Address 已填写但 Property Tax 为空，用户点击 Generate 时可弹出确认提示：`Tax not fetched. Fetch now?`（默认不调用，只有用户点 `Fetch` 才调用外部 API）。

- **先查缓存**：命中缓存直接返回（不扣配额）
- cache miss 才调用 RentCast（扣配额 1 次）

**缓存**
- TTL：30 天
- Key：normalized_address + country_code=US

**降级策略**
- API 失败/查不到：提示 + 允许手填
- 可选：填入估算默认值（Home Price * default_tax_rate，例如 1.2%/年，可在设置配置）

**配额策略**
- Starter Pass：10 次 /10天（只扣 cache miss）
- Subscription：150 次 / 月（只扣 cache miss；按月重置）
- 超额：不再调用外部 API（必须），提示升级或等待重置；仍可手填继续生成报告

**验收标准（AC）**
- AC1：重复查询同一地址命中缓存不调用外部 API，且不扣配额。
- AC2：API 失败不会阻断生成报告；用户仍可继续。
- AC3：点击 Generate/创建 Share Link 不会发出外部 API 请求（任何套餐均如此）。
- AC4：配额耗尽后，系统不会再发出外部 API 请求。

---

### 6.5 分享报告（Public Share Link）
**用户故事**
- 作为 LO，我能生成一个客户无需登录即可打开的分享链接。
- 作为客户，我打开链接能一眼看懂两个方案差异。

**报告内容（/s/[shareId]）**
- 顶部：Comparison Title + LO branding（Name + **NMLS ID** [合规必显]）。
- 方案对比卡片（side-by-side）
  - Total Monthly
  - Cash to close
  - Rate / Term
  - Estimated taxes/insurance
- 图表（至少 1 张）
  - Payment breakdown（stacked）
  - 5y/10y total cost（折线或条形）
- “Copy message” 区：一键复制 LO 分享文本（可由 AI 生成）
- 免责声明（必需）：Estimates / not a loan offer / not financial advice / **NMLS ID: [User NMLS#]**

**Starter Pass 分享页附加规则**
- share link 默认 14 天过期（见 6.1.2）
- 页面角落显示轻水印：`Created with Starter Pass`（不影响阅读，但可控传播）

**Open Graph（OG）**
- OG 预览图展示核心数字（如 Total Monthly / Rate / Cash to Close）
- OG 图动态生成（Edge function / server image generation）

**验收标准（AC）**
- AC1：Share link 不需要登录即可打开。
- AC2：链接打开首屏 LCP < 2.5s（移动网络）。
- AC3：OG 预览在至少 2 个平台显示正常（iMessage + WhatsApp）。
- AC4：Starter Pass 的 share link 到期后返回明确提示页（并引导 LO 升级/重新生成）。

---

### 6.6 AI 成交副驾驶（AI Advisory）— 成本敏感 + 强约束输出
> 设计原则：**AI 不做聊天机器人**；AI 是“按钮式、结果旁边的行动建议”。

#### 6.6.1 AI 模块（Phase 1）
1. **AI Summary（Strategic Comparator Lite）**  
   - 输入：2–4 个 scenarios + 目标（默认 stay 5 years）
   - 输出：80–120 words 推荐结论 + 至少 2 个数字 + 适用条件 + 免责声明
2. **Tone Adjuster（语气魔法师）**  
   - 同一结论 3 种语气：Professional / Friendly / Urgency
3. **Cost of Waiting（买房 vs 等待）**（简化）  
4. **Rent vs Own（租 vs 买）**（简化）

#### 6.6.2 Prompt 规范（必须）
- System：Act as a veteran US Mortgage Loan Officer with 20 years experience.
- Constraints：
  - 不超过 120 words（英文输出）
  - 必须引用至少 2 个具体数字
  - 必须提供“适用条件”（例如：if staying longer than X months）
  - 必须包含 1 句免责声明（Not financial advice; estimates）

#### 6.6.3 成本控制与缓存（必须）
- AI 仅在用户点击按钮时生成
- **先查 AI 缓存**：key = shareId + type + input_hash，TTL 7 天（命中不扣配额）
- Starter Pass：30 次 / 7 天（只扣 cache miss）
- Subscription：建议 300 次 / 月（可配置；只扣 cache miss）

**验收标准（AC）**
- AC1：AI Summary 生成时间 < 3s（p95）。
- AC2：输出符合字数与免责声明规则（自动校验）。
- AC3：同一报告重复点击优先使用缓存结果（不重复扣配额）。
- AC4：配额耗尽后不再调用模型，提示升级/等待重置。

---

### 6.7 Programmatic SEO（Phase 1 增长核心：Calculator Matrix）
**目标**：用“场景化微工具矩阵”取代传统 Wiki，通过 50+ 个高意图页面实现降维打击。

**策略：Tool > Content（30个微工具矩阵规划）**

**Tier 1: 流量型 (Traffic Magnets - Top 5)**
> 目标：覆盖最大的搜索意图，作为漏斗顶部入口。
1. **Mortgage Calculator w/ Taxes**: 标配，PITI 拆解。
2. **Affordability Calculator**: 收入倒推房价。
3. **FHA Loan Calculator**: 3.5% down + MIP。
4. **VA Loan Calculator**: 0% down + Funding Fee。
5. **Refinance Calculator**: 利率敏感型流量。

**Tier 2: 转化型 (Sales Closers - Top 10)**
> 目标：解决 LO 最头疼的异议处理，核心价值区。
6. **Rent vs Buy**: 租房 vs 买房 5 年权益对比。
7. **Cost of Waiting**: 房价涨 vs 利率跌 成本对比。
8. **Points Break-Even**: 买点回本周期计算。
9. **2-1 Buydown**: 前两年低息优惠计算。
10. **Extra Payment**: 提前还款省息计算。
11. **15-yr vs 30-yr**: 月供压力 vs 总利息对比。
12. **ARM vs Fixed**: 浮动 vs 固定风险对比。
13. **Bi-Weekly Payment**: 双周供省息计算。
14. **HELOC Payment**: 房屋净值贷计算。
15. **Seller Concessions**: 卖家 Credit 降价 vs 买点对比。

**Tier 3: 投资/利基型 (Niche - Top 5)**
> 目标：吸引做投资客生意的高净值 LO。
16. **DSCR Loan Calculator**: 租金覆盖率 (投资房)。
17. **BRRRR Calculator**: 翻新-出租-重贷链条计算。
18. **House Hacking Calculator**: 多单元自住+出租。
19. **Interest-Only Calculator**: 先息后本。
20. **Rental Cash Flow Calculator**: 纯现金流计算。

**Tier 4: 地理位置型 (Geo Long-tail - Top 10)**
> 目标：结合 Tax Data 覆盖 Top 10 热门州。
21-30. **State Specific**: TX, CA, FL, NY, IL, NJ, PA, OH, GA, NC (预置当地 Tax/Closing Cost 特性)。

**技术实现**
- **Config Driven**：页面由 JSON 配置生成（Title, Presets, Explanation Template），统一复用 `ScenarioBuilder` 组件。
- **页面结构**：Top: Tool (Calculator) -> Middle: Analysis -> Bottom: SEO Content (Guide)。

---

## 7. 数据模型（建议的最小表设计）

> 以 Postgres 为例（Supabase/Neon 均可）。配额/到期必须可审计（便于处理退款与纠纷）。

### 7.1 表（新增：entitlements + usage_ledger）
- `users`
  - id, email, name, created_at
- `subscriptions`
  - user_id, stripe_customer_id, status, plan, current_period_end
- `entitlements`（新增）
  - id, user_id
  - type: `starter_pass_7d` | `subscription`
  - starts_at, ends_at
  - share_quota, share_used
  - property_quota, property_used
  - ai_quota, ai_used
  - created_at
- `usage_ledger`（新增，推荐）
  - id, user_id, entitlement_id
  - kind: `share_create` | `property_fetch` | `ai_generate`
  - delta (usually +1)
  - ref_id (shareId / addressHash / aiRunId)
  - created_at
- `comparisons`
  - id, user_id, title, created_at, updated_at
- `scenarios`
  - id, comparison_id, name, inputs_json, outputs_json, created_at
- `property_cache`
  - id, normalized_address, country_code, provider, payload_json, fetched_at, expires_at
- `shares`
  - id, comparison_id, share_id (public), is_active, expires_at, created_at
- `ai_runs`
  - id, share_id, type, input_hash, output_text, model, cost_estimate, created_at, expires_at

---

## 8. 后端接口（API Contracts）

### 8.1 Billing
- `POST /api/billing/checkout?product=starter_pass_7d`
- `POST /api/billing/checkout?product=sub_monthly|sub_yearly`
- `POST /api/billing/portal`（Stripe customer portal）
- `POST /api/stripe/webhook`（幂等处理）

### 8.2 App
- `POST /api/comparisons`
- `POST /api/comparisons/<built-in function id>/scenarios`
- `POST /api/compute`
- `POST /api/property/fetch`（地址 → 税费；含缓存与配额）
- `POST /api/shares`（生成 share link；含配额与到期策略）
- `POST /api/ai/summary`（生成 AI 输出；含缓存与配额）

### 8.3 关键中间件（必须）
- `requireEntitlement(kind)`：检查用户是否有有效 entitlement（starter pass 或 subscription）
- `consumeQuota(kind, refId, idempotencyKey)`：只在 cache miss 时扣配额，且幂等

---

## 9. 非功能需求（NFR）

### 9.1 性能
- App 输入交互 < 300ms
- Share 页 LCP < 2.5s（移动端）
- AI p95 < 3s

### 9.2 可靠性
- 外部 API 失败必须降级
- 有监控告警：外部 API error rate、AI error rate、Stripe webhook failures

### 9.3 安全与隐私
- Share 链接默认公开：**禁止**在 Share 页展示敏感 PII（SSN、详细收入等）
- 外部查询只存“公开/非敏感”的 property 数据（税费等）
- 免责声明与合规提示（Not a loan offer）

### 9.4 反滥用（成本控制必需）
- Starter Pass：同一 Stripe customer 30 天内最多购买 1 次（可配置）
- API rate limit：对 property/ai endpoints 进行更严格限流（Starter Pass 更严）
- 异常熔断：短时间触发上限/可疑模式 → 自动禁用外部调用，仅允许本地试算

### 9.5 多端适配（Responsive）
- **必须同时适配**：手机 / 平板 / 电脑（见 23.7）；同一功能在不同端不允许“阉割体验”（除非明确写在分期里）。
- 浏览器基线：
  - Mobile：iOS Safari、Android Chrome
  - Desktop：Chrome、Safari、Edge（最新两个大版本）
- **可访问性**：关键文本与背景对比度达标；键盘可达；`prefers-reduced-motion` 自动降级动效。

---

## 10. 定价与包装（Pricing & Packaging）

### 10.1 Starter Pass（Phase 1 新增，主转化入口）
- **$9.9 / 7 days（一次性）**
- 包含：5 share links + 10 property fetch + 30 AI gens（均 cache miss 才扣）
- share link：默认 14 天过期（升级订阅可延长/永久）
- 推荐：Pass 有效期内升级订阅，首月立减 $9.9（等额抵扣）

### 10.2 Individual Subscription（Phase 1 主收入）
- **$59 / month**
- **$588 / year**（相当于 $49/mo）

**包含权益（建议默认）**
- Unlimited comparisons & share links
- RentCast auto-fetch **150 queries / month**（cache miss 才扣）
- AI: Fair use（建议 300 / month；cache miss 才扣）
- PWA（Add to Home Screen）

### 10.3 Enterprise（Phase 2+）
- Custom Quote（white-label、团队权限、统一模板、CRM 集成、审计日志）

---

## 11. 关键指标（Metrics）

- North Star：Weekly Active LOs（WAU_LO）中“生成分享链接”的人数
- Activation：
  - 访问 → 购买 Starter Pass 转化率
  - Starter Pass 期内完成 ≥1 个 share link 的比例
- Conversion：
  - Starter Pass → Subscription 转化率（7天内）
- Retention：次月留存（付费续订率）
- Cost：平均每个 Starter Pass 的外部调用次数（property/ai），用于验证成本封顶是否生效

---

## 12. Roadmap（Phase 1 开发拆解，4 周）

### Week 1 — 核心计算 & 基础 App
- 项目脚手架（Next.js App Router）
- Scenario builder UI（移动端）
- 计算引擎 + 单测
- Auth（magic link / Google）
- Free Demo（仅本地试算）

### Week 2 — Starter Pass（$9.9）+ Stripe + 权限中间件
- Stripe one-time product（starter_pass_7d）+ webhook
- entitlements/usage_ledger 数据结构
- requireEntitlement + quota 扣减（幂等）
- settings 页展示：剩余配额 + 到期时间
- 升级订阅的 $9.9 抵扣机制（coupon）

### Week 3 — Share Link + OG + 到期策略
- share link 数据模型（expires_at）
- share page + OG image
- Starter Pass 分享页水印 + 到期提示页

### Week 4 — RentCast + AI（带缓存与配额）+ SEO 基建 + Beta
- property_cache + TTL + cache miss 扣配额（仅按钮触发）
- AI Summary/Tone + ai cache
- **Calculator Matrix 基建**：
  - JSON Config 结构定义 (slug, presets, seo_meta)
  - `/calculator/[slug]` 动态路由页面 + 复用核心组件
  - SEO Content 本地化注入
- Beta：邀请 20–50 位 LO 购买 Pass 试用（收集 testimonials）

---

## 13. 风险与对策

1. **计算精度争议**：强调 Estimates；允许 LO 手动覆盖关键字段；保留免责声明。
2. **外部成本失控**：Starter Pass 配额封顶 + cache miss 才扣 + 手动触发 + 反滥用。
3. **AI 生成不稳定**：输出校验 + fallback（固定模板文案）+ 缓存。
4. **转化不达预期**：Starter Pass 体验必须能完成“1 次真实分享”；用 $9.9 抵扣降低升级阻力。

---

## 14. 交付物清单（Definition of Done）

- [ ] 免费 Demo：可本地试算，但无法生成 share link/AI/外部查询
- [ ] Starter Pass：$9.9 一次性购买、7天有效、配额可见且可控
- [ ] 配额扣减：仅 cache miss 扣；并发/重复请求幂等
- [ ] Share page：公开访问 + OG 预览 + Starter Pass 过期策略 + 水印
- [ ] RentCast：缓存 + 降级 + 配额封顶
- [ ] AI：强约束输出 + 缓存 + 配额封顶
- [ ] Stripe：Pass + Subscription + webhook 闭环
- [ ] SEO：至少上线 50 个 compare 页面 + sitemap

---

## 15. 术语表（Glossary）

| 术语 | 全称 | 说明 |
|------|------|------|
| LO | Loan Officer | 贷款经纪人，本产品的核心用户 |
| P&I | Principal & Interest | 本金与利息，月供的核心组成部分 |
| PITI | Principal, Interest, Taxes, Insurance | 本金、利息、税费、保险的总和 |
| PMI | Private Mortgage Insurance | 私人抵押贷款保险，LTV > 80% 时通常需要 |
| LTV | Loan-to-Value | 贷款价值比 = 贷款额 / 房价 |
| APR | Annual Percentage Rate | 年化利率 |
| HOA | Homeowners Association | 业主协会费用（按月） |
| FHA | Federal Housing Administration | 联邦住房管理局贷款（低首付选项） |
| Conventional | - | 常规贷款（非政府担保） |
| OG | Open Graph | 社交媒体分享预览协议 |
| PLG | Product-Led Growth | 产品驱动增长 |
| PWA | Progressive Web App | 渐进式网页应用 |
| ISR | Incremental Static Regeneration | 增量静态再生成（Next.js 特性） |

---

## 16. 竞品差异化分析

### 16.1 主要竞品

| 竞品 | 定位 | 优势 | 劣势 |
|------|------|------|------|
| **MortgageCoach** | 企业级贷款演示平台 | 功能全面、合规性强、CRM 集成 | 价格高（$200+/月）、学习曲线陡、非 Mobile-first |
| **TotalExpert** | 金融营销 + CRM 平台 | 营销自动化强、团队协作 | 定价不透明（Enterprise only）、过于复杂 |
| **Excel/手工** | 无 | 免费、灵活 | 丑、慢、不专业、无法分享 |
| **银行内部系统** | 机构专用 | 精确、合规 | 无法移动端、无法快速分享 |

### 16.2 ShowTheRate 差异化定位

| 维度 | ShowTheRate 优势 |
|------|------------------|
| **速度** | 60秒完成输入→分享闭环（竞品普遍 5-10 分钟） |
| **价格** | $9.9 起步 / $59/月（竞品 $200+/月） |
| **移动端** | Mobile-first 设计（竞品多为桌面端） |
| **AI 加持** | 内置成交话术生成（竞品无此功能） |
| **PLG 自助** | 无需销售介入即可付费使用 |

---

## 17. 假设与依赖（Assumptions & Dependencies）

### 17.1 外部服务依赖

| 服务 | 用途 | 定价 | 风险/备选 |
|------|------|------|----------|
| **RentCast API** | 房产税/房屋信息查询 | ~$0.01/query | 备选：ATTOM / Zillow API |
| **Stripe** | 支付处理 | 2.9% + $0.30/笔 | 无需备选（行业标准） |
| **Vercel** | 托管 + Edge Functions | Pro $20/月起 | 备选：Cloudflare Workers |
| **Supabase / Neon** | PostgreSQL 数据库 | Free tier 起步 | 可互换 |

### 17.2 AI 模型选择

| 模型 | 提供商 | 用途 | 成本估算 |
|------|--------|------|----------|
| **GPT-4o-mini** | OpenAI | 主模型：AI Summary、Tone Adjuster | ~$0.0015/1K tokens |
| **DeepSeek-V3** | DeepSeek | 备选模型 / 成本优化 | ~$0.0003/1K tokens |

**模型切换策略**：
- 默认使用 OpenAI GPT-4o-mini（稳定性优先）
- 可配置降级为 DeepSeek（成本敏感场景）
- 后台可按用户/套餐配置模型路由

### 17.3 关键假设

1. 目标用户（Independent LO）愿意为"省时间 + 提升成交率"付费
2. $9.9 Starter Pass 的价格足够低，可降低首次付费摩擦
3. 30秒完成分享的体验承诺在移动端可实现
4. AI 输出质量在 80-120 words 约束下仍能提供价值

---

## 18. 成功标准（Phase 1 Success Criteria）

### 18.1 核心目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **付费用户数** | **≥ 30** | Phase 1 结束时的付费用户总数（Starter Pass + Subscription） |
| Starter Pass 购买 | ≥ 25 | 低门槛验证产品价值 |
| Subscription 转化 | ≥ 5 | 验证核心用户价值认可 |

### 18.2 辅助指标

| 指标 | 目标值 |
|------|--------|
| 平均生成 Share Link 耗时 | < 45 秒 |
| Share Page 被打开率 | > 60%（发送后 24h 内） |
| Starter Pass → Subscription 转化率 | > 15% |
| 用户 NPS | > 30 |

### 18.3 PMF 验证信号

- ≥ 3 位用户主动留下 Testimonial
- ≥ 1 位用户完成自然推荐（非激励）
- 用户反馈中"省时间""帮助成交"出现频率 > 50%

---

## 19. 退款政策（Refund Policy）

### 19.1 政策声明

> **本产品不支持退款。**

### 19.2 替代方案

- 如客户对产品有顾虑，建议先购买 **$9.9 Starter Pass（7天）** 进行低成本试用
- Starter Pass 可完成完整的核心功能体验（生成分享链接、AI 话术等）
- 满意后再升级 Subscription

### 19.3 特殊情况处理

- 技术故障导致无法使用：可延长有效期或补发配额
- 重复扣款等支付异常：通过 Stripe 进行退款处理
- 用户需在购买后 **48 小时内** 联系客服说明问题

---

## 20. 获客渠道策略（Go-to-Market Channels）

### 20.1 渠道优先级

| 优先级 | 渠道 | 策略 | 预期效果 |
|--------|------|------|----------|
| **P0** | SEO（Programmatic） | /compare/* 和 /calculator/* 长尾页面 | 低成本持续获客 |
| **P0** | LinkedIn | LO 职业社群、个人分享 | 精准触达目标用户 |
| **P1** | Facebook 群组 | Mortgage Broker/LO 社群软性推广 | 社群口碑 |
| **P1** | Referral Program | 老用户推荐新用户 | 低 CAC 增长 |
| **P2** | Reddit | r/mortgage, r/realestate | 内容营销 |
| **P2** | YouTube | 产品演示视频 / 教程 | 品牌认知 |

### 20.2 冷启动策略（Beta 阶段）

1. **定向邀请**：通过 LinkedIn 定向联系 50 位 Independent LO
2. **Beta 福利**：Beta 用户享 Starter Pass 免费（需提供反馈）
3. **Testimonial 收集**：Beta 期间重点收集 3-5 条真实用户评价

---

## 21. PMF 验证计划（Product-Market Fit Validation）

### 21.1 Beta 阶段设计

| 阶段 | 时间 | 目标 |
|------|------|------|
| 招募 | Week 4 Day 1-3 | 通过 LinkedIn/社群邀请 30-50 位 LO |
| 体验 | Week 4 Day 4-7 | Beta 用户免费体验 Starter Pass 功能 |
| 反馈 | Week 5 | 收集反馈问卷 + 1v1 访谈（5-10 位） |

### 21.2 核心验证问题

1. 你会把这个工具推荐给同行吗？（NPS）
2. 如果这个工具明天消失，你会有多失望？（PMF 经典问题）
3. 你愿意为这个工具付多少钱？（价格敏感度）
4. 这个工具帮你节省了多少时间？（价值量化）

### 21.3 成功判定标准

| 指标 | PMF 达标线 |
|------|-----------|
| "非常失望"比例（若产品消失） | ≥ 40% |
| 主动推荐意愿 | ≥ 50% |
| 愿付价格中位数 | ≥ $30/月 |
| 至少 1 位用户自发分享到社群 | ✓ |

---

## 22. Referral Program（推荐计划）

### 22.1 机制设计

| 角色 | 奖励 |
|------|------|
| **推荐人** | 被推荐人付费后，推荐人获 **$10 账户余额**（可抵扣订阅费） |
| **被推荐人** | 首次订阅享 **$10 折扣** |

### 22.2 规则

- 每位用户拥有唯一推荐链接 `showtherate.com/?ref=USER_CODE`
- 被推荐人需在注册后 30 天内完成付费
- 推荐奖励上限：每月 $100 / 用户
- 禁止自推荐（同一支付方式检测）

### 22.3 实现优先级

- **Phase 1**：基础引用计数（推荐码 + 统计）
- **Phase 2**：自动奖励发放 + Dashboard 展示

---

## 23. 视觉设计规范（Visual Design Guidelines）

### 23.0 Neo Pop (Gamified) 设计语言（写入默认 UI/UX）

> **一句话**：在“金融工具的信任底座”之上叠加 **Neo Pop 的高对比、粗线条、霓虹点缀**，并用 **游戏化正反馈**（进度/成就/庆祝动效）把“60 秒出方案 → 一键分享”做成让人上瘾的流程，但整体必须 **不幼稚、不过度娱乐化、不过度花哨**，保持专业与合规。

#### 23.0.1 设计原则（必须）
1. **Trust-first, Pop-second**：底色克制（中性背景 + 清晰排版），霓虹只用作 **高亮与状态提示**，避免像“游戏大厅”。
2. **高密度信息的可扫读**：数字对齐（等宽字体）+ 关键指标“巨型数字”+ 次要信息降噪（灰阶/折叠）。
3. **即时正反馈**：每个关键动作都给明确的“奖励”——生成成功、复制成功、分享成功都要有轻量庆祝（不遮挡、不打断）。
4. **可控动效**：默认开启轻动效；尊重系统 `prefers-reduced-motion`（自动降级为无动画/弱动画）。
5. **户外可读 & 单手可操作**：强光下对比度必须足够；移动端 CTA 固定在拇指热区。

#### 23.0.2 视觉语言（Neo Pop 的“形”）
- **粗线条与轮廓**：关键组件使用 `1.5–2px` 边框（浅灰/品牌色），让卡片“立起来”。
- **偏移投影（Offset Shadow）**：阴影略带偏移与层次（像贴纸/卡牌），比传统商务阴影更有“Pop”感。
- **霓虹点缀（Neon Accents）**：只用于 CTA、Active 状态、关键数字标签、进度条端点；背景不大面积用霓虹。
- **贴纸/徽章（Stickers & Badges）**：用于状态（Starter Pass、Quota、Fetched、Estimate）、提示（Best choice）、合规（NMLS）。
- **卡牌式布局（Card Deck）**：Scenario 以“卡组”呈现，支持滑动/切换/复制，符合“对比”心智模型。

#### 23.0.3 游戏化机制（Gamified 的“神”）
> 目标不是让 LO 来“玩”，而是让 LO **更频繁、更快、更愿意分享**。

- **60s Timer（可选，默认开启）**：新建对比后出现轻量倒计时/进度环，强化“60 秒闭环”心智（不强迫）。
- **Quick Win Milestones**：
  - 完成必填输入 → `Step 1/3`
  - 成功 Generate → `Step 2/3`
  - 成功 Share / Copy message → `Step 3/3` + 微型庆祝
- **Streak / Weekly Goal（可选）**：仅对 LO 展示（客户分享页不展示），例如：`This week: 3 shares / goal 5`。
- **Achievements（可选）**：如 “First Share”、“10 Shares”、“Fast Quote <45s”；只在 Dashboard/Settings 轻量展示，不侵入主流程。
- **Celebration（必须克制）**：成功生成/复制/分享时：微型 Confetti / Check 动画（<= 800ms），不遮挡内容，不强迫停留。

#### 23.0.4 组件风格落地（必须统一）
- **Primary CTA（Generate / Share）**：霓虹渐变填充 + 轻微发光边缘（Glow），按下有 `scale(0.98)` 与阴影加深。
- **Inputs**：大尺寸（移动端更大），Focus 时边框加粗并出现“霓虹描边”，错误态为红色描边 + 轻微抖动（可选）。
- **Tabs / Segmented Control**：像“游戏 UI 的模式选择器”，Active 采用凸起卡片 + 高对比底色。
- **Progress / Quota**：使用“能量条/电量条”视觉呈现配额剩余（Starter Pass/Subscription），更直观。
- **Toast / Tooltip**：像“游戏提示气泡”，出现与消失要有弹性动效，但时长短。

#### 23.0.5 视觉边界（必须遵守）
- **Share Page 对客户**：保持更克制（更像“专业报告”），Neo Pop 只作为品牌点缀；严禁过度游戏化元素分散注意力。
- **合规信息**（免责声明、NMLS）：必须清晰可见，且不被动效/装饰遮挡或弱化。

### 23.1 品牌调性

| 维度 | 定义 |
|------|------|
| **关键词** | 专业、信任、高效、现代 |
| **情感** | 让 LO 感觉"用这个工具显得更专业" |
| **风格** | 简约商务 + 轻度活力感（非死板金融风） |

### 23.2 配色体系（增强对比）

> **核心原则**：LO 在户外强光下使用，方案对比必须一瞄可辨。

| 色彩 | 用途 | 色值（参考） |
|------|------|-------------|
| **主色 Primary** | CTA 按钮、关键高亮 | `#2563EB`（蓝色，信任） |
| **方案 A** | 第一个对比方案 | `#1E40AF`（深蓝） |
| **方案 B** | 第二个对比方案 | `#059669`（翠绿，代表省钱） |
| **方案 C** | 第三个对比方案 | `#D97706`（琥珀橙，值得关注） |
| **负面数字** | 多花钱/警告 | `#DC2626`（红色） |
| **正面数字** | 省钱/增长 | `#16A34A`（绿色） |
| **背景色** | 页面背景 | `#F8FAFC`（浅灰白） |
| **文字色** | 正文 | `#1E293B`（深灰） |

### 23.3 字体（数字必用等宽）

> **核心原则**：数字列必须对齐，方便纵向扫描对比。

| 用途 | 字体 | 备选 |
|------|------|------|
| **标题** | Inter / SF Pro Display | Roboto |
| **正文** | Inter / SF Pro Text | Roboto |
| **金额/数字** | **JetBrains Mono / IBM Plex Mono** (等宽) | SF Mono |

**示例**：
```
Bad (Inter):      Good (Mono):
$2,450.00         $2,450.00
$12,000.00        $12,000.00
```

### 23.4 移动端设计标准（户外场景）

> LO 在 Open House 门口使用，可能手指粗、戴手套、屏幕有水。

| 元素 | 最小尺寸 | 说明 |
|------|----------|------|
| **按钮高度** | `56px` | iOS 标准 44px，我们加高 |
| **输入框高度** | `52px` | 方便点击 |
| **卡片间距** | `16px` | 避免误触 |
| **核心 CTA** | 底部固定，全宽，加粗颜色 | 拇指热区 |

### 23.5 圆角与阴影

- 卡片圆角：`12px`
- 按钮圆角：`8px`
- 阴影：`0 4px 6px -1px rgba(0,0,0,0.1)` (subtle shadow)

### 23.6 竞品视觉参考

| 竞品 | 学什么 |
|------|--------|
| **Linear.app** | 极简主义 + 动画丝滑 |
| **Loom** | 分享页面的品牌感 + 视觉层次 |
| **Robinhood** | 金融数字的呈现方式 + 绿红对比 |
| **Figma** | 工具栏布局 + 协作感 |


### 23.7 响应式与多端适配（Desktop / Tablet / Mobile）

> **目标**：同一套产品在 **电脑端、平板端、手机端** 都“好用且好看”，并且保持 Neo Pop 视觉一致性。

#### 23.7.1 断点与布局策略（必须）
| 设备 | 宽度（建议） | 导航 | 主布局 |
|---|---:|---|---|
| Mobile | < 640px | **底部主 CTA + 简化导航** | 单列、分步输入、Scenario 卡片可横滑 |
| Tablet | 640–1024px | 顶部/侧边轻量导航 | 2 列：左输入/右预览（或对比） |
| Desktop | 1024–1440px | **左侧边栏 + 顶部工具栏** | 2–3 列：左输入、中对比、右 AI/分享 |
| Wide | > 1440px | 同 Desktop | 增加留白与信息密度，不拉伸文本行宽 |

#### 23.7.2 关键页面适配规则（必须）
- **/app/new（Scenario Builder）**
  - Mobile：分步（Basics → Taxes → Closing → Review），底部固定 `Generate`。
  - Tablet：左右分栏（输入 vs 实时对比卡片），键盘遮挡时 CTA 仍可触达。
  - Desktop：3 区域布局（Inputs / Scenario Deck / Summary+AI），支持快捷键（可选）。
- **/s/[shareId]（分享报告页）**
  - Mobile：方案卡片纵向堆叠；图表自动换行；核心数字优先显示。
  - Tablet/Desktop：方案卡片并排；图表区域更宽；“Copy message” 始终可见（右侧栏或顶部固定）。
- **/pricing、/（营销页）**
  - Mobile：卡片堆叠 + 单主 CTA。
  - Tablet/Desktop：价格卡并排，强调年付 Savings 的徽章（Neo Pop Sticker）。

#### 23.7.3 交互与可用性（必须）
- **触控目标**：所有可点击元素 >= 44px；Tablet 仍按触控优先设计。
- **Hover/Focus**：Desktop 需要 hover 反馈（发光边框/偏移阴影）；键盘导航要有清晰 Focus ring。
- **输入体验**：金额/利率输入支持快速 +/-、滑块、预设 Chips；避免频繁唤起键盘。
- **性能**：响应式布局不允许引入重布局抖动（CLS 需控制）；动效遵守 reduced-motion。

#### 23.7.4 适配验收清单（AC）
- AC1：在 3 个关键视口下无明显布局断裂：**375×812**（手机）、**768×1024**（iPad 竖屏）、**1440×900**（桌面）。
- AC2：核心流程（New → Generate → Share）在三端都能 **单手完成** 或 **3 次点击内触达 CTA**。
- AC3：Share Page 在 Mobile 网络下首屏仍满足 LCP < 2.5s（见 9.1）。

---

## 24. Share Page UI 规范

### 24.1 页面结构

```
┌─────────────────────────────────────┐
│  LO Branding Area                   │
│  [头像] [姓名] [联系方式]             │
├─────────────────────────────────────┤
│  Comparison Title                   │
│  "Your Mortgage Options"            │
├─────────────────────────────────────┤
│  Side-by-Side Scenario Cards        │
│  ┌─────────┐  ┌─────────┐           │
│  │ Option A│  │ Option B│           │
│  │ $2,450  │  │ $2,280  │           │
│  │ /month  │  │ /month  │           │
│  └─────────┘  └─────────┘           │
├─────────────────────────────────────┤
│  Charts (Payment Breakdown)         │
├─────────────────────────────────────┤
│  AI Summary (可选)                   │
├─────────────────────────────────────┤
│  Disclaimer                         │
│  "Estimates only. Not a loan offer."│
└─────────────────────────────────────┘
```

### 24.2 LO Branding 展示（仪式感设计）

> Share Page 代表 LO 的专业形象，必须精致。

- 头像：圆角 50%，支持上传（Phase 1：默认占位符）
- 姓名：**Medium Weight** 字体
- **NMLS ID**：**Light Weight** 字体，必须展示（合规强制）
- 联系方式：可选展示电话/邮箱（Phase 1.2）
- Logo：Phase 1.2 支持

### 24.3 方案卡片设计（玻璃拟态）

- 使用 **Glassmorphism** 效果：半透明白底 + 高斯模糊 + 细微边框
- 参考 Apple 的卡片设计
- 方案间使用明确的颜色区分（深蓝/翠绿/琥珀橙）

### 24.4 Disclaimer 设计

- 字号：`12px`
- 颜色：`#94A3B8`（浅灰）
- 绝对不能抢视觉焦点

### 24.5 Dark Mode

- Phase 1：暂不支持
- Phase 2：支持系统跟随 / 手动切换

### 24.6 响应式断点

| 断点 | 宽度 | 卡片布局 |
|------|------|----------|
| Mobile | < 640px | 垂直堆叠（单列优先） |
| Tablet | 640–1024px | Side-by-side（双列对比） |
| Desktop | 1024–1440px | Side-by-side + 更宽间距 |
| Wide | > 1440px | Side-by-side + 增加留白（不拉伸文本行宽） |

---

## 25. 数据可视化规范

### 25.1 图表类型选择

> **核心原则**：简化图表，LO 没时间研究复杂图表。

| 数据类型 | 推荐图表 | 说明 |
|----------|----------|------|
| **Payment Breakdown** | **横向堆叠条形图** | 不用饼图（饼图很难对比） |
| **5y/10y Total Cost** | 分组条形图 | 对比不同方案的累计成本 |
| **Amortization** | 面积图 | 本金/利息随时间变化（Phase 2） |

**Payment Breakdown 示例**：
```
Option A: [===P&I===|=Tax=|Ins|PMI] $2,450
Option B: [===P&I===|Tax|Ins]       $2,280
```

### 25.2 图表配色（方案区分）

- 方案 A: `#1E40AF` (深蓝)
- 方案 B: `#059669` (翠绿)
- 方案 C: `#D97706` (琥珀橙)
- 确保色盲友好（避免纯红/绿对比）

### 25.3 数字变化动效

- 当用户切换方案或输入变化时，条形图使用 **平滑伸缩动画** (300ms ease-out)
- 月供金额变化时，使用 **Odometer 效果**（从旧数字滚动到新数字）

### 25.4 图表库选择

- 推荐：**Recharts**（React 生态、轻量、响应式）
- 备选：Chart.js、Nivo

---

## 26. 空状态与错误状态设计

### 26.1 空状态

| 场景 | 文案 | 插画建议 |
|------|------|----------|
| Dashboard 无 Comparison | "No comparisons yet. Create your first one!" | 空文件夹 + 加号 |
| 配额耗尽 | "You've used all your AI credits. Upgrade to continue." | 空电池图标 |
| 搜索无结果 | "No properties found for this address." | 放大镜 + 问号 |

### 26.2 错误状态

| 场景 | 处理方式 | 文案 |
|------|----------|------|
| API 请求失败 | Toast 提示 + 允许重试 | "Something went wrong. Tap to retry." |
| 网络离线 | Banner 提示 | "You're offline. Some features may not work." |
| Share Link 过期 | 专用页面 | "This link has expired. Ask your loan officer for a new one." |

### 26.3 Loading 状态

- 生成 Share Link：骨架屏 + 进度提示
- AI 生成：流式输出（打字机效果）

---

## 27. 微交互与动效规范

### 27.1 动效原则

- **快速**：基础过渡 150-200ms
- **自然**：使用 ease-out 缓动
- **有意义**：动效服务于反馈，非装饰

### 27.2 关键场景动效

| 场景 | 动效 | 时长 |
|------|------|------|
| 按钮点击 | **Scale 0.98 + 阴影加深** | 100ms |
| 输入框 Focus | **边框 1px → 2px + 主题色** | 150ms |
| 卡片切换 | Fade + Slide | 200ms |
| 数字变化 | **Odometer 滚动效果** | 500ms |
| 生成完成 | Confetti / Check 动画 | 800ms |
| Toast 出现/消失 | Slide in from top | 300ms |
| 条形图变化 | **平滑伸缩** | 300ms |

### 27.3 手势支持（Mobile）

- 左右滑动切换 Scenario 卡片
- 下拉刷新（Dashboard）
- 长按复制（AI 生成文案）

---

## 28. OG Image 设计规范

### 28.1 设计要求

| 尺寸 | 1200 x 630 px |
|------|---------------|
| 格式 | PNG / JPEG |
| 生成方式 | Edge Function 动态生成（@vercel/og） |

### 28.2 内容布局

```
┌────────────────────────────────────────────┐
│  ShowTheRate Logo (左上角)                  │
│                                            │
│      Option A          Option B            │
│     $2,450/mo         $2,280/mo            │
│     30-year            15-year             │
│                                            │
│  "Compare your mortgage options"           │
│                                            │
│  [LO 姓名] • Powered by ShowTheRate        │
└────────────────────────────────────────────┘
```

### 28.3 动态字段

- 方案 A/B 的月供金额
- 贷款期限
- LO 姓名

---

## 29. 合规要求（Compliance）

### 29.1 必须展示的免责声明

> **Estimates only. This is not a loan offer or commitment to lend. Actual rates, payments, and costs may vary. Not financial advice. Please consult a licensed professional.**

位置：
- Share Page 底部
- AI 生成内容结尾
- Calculator 页面底部

### 29.2 美国各州合规注意事项

- 本产品定位为**展示/沟通工具**，非放贷系统
- 不收集 SSN、详细收入等敏感 PII
- 不做信用评估或贷款承诺
- 各州对 LO 的广告/营销有不同规定，产品本身不构成广告，但 LO 分享时需自行合规

### 29.3 GDPR / CCPA

- 需提供隐私政策页面
- 用户数据删除请求需在 30 天内响应
- Cookie 使用需明确告知

---

## 30. Demo 转化优化（Free → Paid）

### 30.1 Demo 限制与引导

| 功能 | 免费 Demo | 付费用户 |
|------|-----------|----------|
| 本地试算 | ✓ | ✓ |
| 生成 Share Link | ✗ 显示预览 | ✓ |
| AI Summary | ✗ 显示占位 | ✓ |
| 保存 Comparison | ✗ | ✓ |

### 30.2 转化触点设计

1. **Share Link 预览**：生成后显示模糊化的分享链接预览 + "Unlock with Starter Pass" CTA
2. **AI 占位区**：显示 AI Summary 区域 + 占位文本 + "Get AI insights for $9.9"
3. **价值锚定**：在限制弹窗中强调 "$9.9 = less than 1 coffee/day for 7 days"

---

## 31. 客户端行为追踪（Share Page Analytics）

### 31.1 追踪事件

| 事件 | 说明 | 价值 |
|------|------|------|
| `share_page_view` | 客户打开分享链接 | 验证分享有效性 |
| `share_page_scroll_depth` | 滚动深度（25%/50%/75%/100%） | 内容吸引力 |
| `share_page_time_on_page` | 页面停留时长 | 内容理解度 |
| `cta_click` | 客户点击联系 LO | 成交意向 |

### 31.2 LO Dashboard 可见指标（Phase 1.2）

- 该分享链接被打开次数
- 平均停留时长
- 是否点击了联系 CTA

> **Phase 1**：仅后台埋点记录，不对 LO 展示
> **Phase 1.2**：在 Dashboard 展示基础统计
