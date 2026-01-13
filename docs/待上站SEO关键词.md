# SEO_Keywords_and_PSEO_Execution.md — ShowTheRate（按截图提词 + AI 上站落地）
> Updated: 2026-01-06  
> 目标：把你截图里的“新词”整理成 **可上站的页面清单**（calculator-first），并给一套 **让 AI 直接改代码上站** 的执行步骤。

---

## 1) 从截图提取到的新词（去重后）
### 1.1 Discount Points（8）
- discount point calculator
- discount points formula
- discount points mortgage example
- discount points vs buydown
- how many discount points can you buy
- how to calculate discount points on a mortgage
- how much is 3 points on a mortgage
- how much is 25 points on a mortgage

### 1.2 2-1 / 3-2-1 Temporary Buydown（10）
- how to calculate a 2:1 buy down?
- is it smart to do a 2:1 buydown?
- what is a 2:1 temporary rate buydown?
- what is the average cost of a 2:1 buydown?
- 2-1 buydown calculator excel
- 2-1 buydown calculator free
- 2-1 buydown cost
- 2-1 buydown meaning
- 2-1 buydown pros and cons
- 2/1 buydown amortization calculator
- 2/1 buydown amortization schedule
- 3-2-1 buydown calculator
- 3 2-1 buydown calculator excel
- how much does a 3-2-1 buydown cost

> 备注：截图里出现了“25 points”这种极端词，真实搜索里可能有人把 2.5 写成 25；但它**依然值得做**，因为你可以在页面里用“calculator + 解释”把用户导回正确概念（并承接流量）。

---

## 2) 把“词”翻译成“页面”（符合工具站玩法）
工具站的规则：**每个 SEO 入口页必须能算**；解释型问题也要“先给 calculator，再解释”。

下面是我建议你实际落地的页面清单（含 slug、页面类型、优先级）。

### 2.1 P0：立刻做（最贴近工具词/成交链路）
| 关键词 | 页面类型 | 建议 URL slug | 这页必须提供的核心输出（本地计算即可） |
|---|---|---|---|
| discount point calculator | calculator | /calculator/discount-points-calculator | points 成本、月供差、break-even（月） |
| how to calculate discount points on a mortgage | calculator+guide | /calculator/how-to-calculate-discount-points | 同上 + 展示公式与示例 |
| how much is 3 points on a mortgage | quick calculator | /calculator/how-much-is-3-points | points 成本 = loan * points%（含 3 points 快速 preset） |
| discount points vs buydown | compare | /compare/discount-points-vs-temporary-buydown | 方案 A(points) vs 方案 B(2-1/3-2-1) 的月供曲线与总成本 |
| 2-1 buydown cost | calculator | /calculator/2-1-buydown-cost | 年1/2/3 月供、补贴总额、PITI(可选) |
| 3-2-1 buydown calculator | calculator | /calculator/3-2-1-buydown-calculator | 年1/2/3 月供 + 补贴总额 |
| how much does a 3-2-1 buydown cost | calculator+guide | /calculator/how-much-3-2-1-buydown-cost | 同上 + 示例解释 |
| 2/1 buydown amortization schedule | calculator (schedule) | /calculator/2-1-buydown-amortization-schedule | 生成 36 个月分月表（payment/interest/principal） |

### 2.2 P1：第二波做（同主题扩页，提高 topical authority）
| 关键词 | 页面类型 | 建议 URL slug | 落地方式（仍然要有 calculator） |
|---|---|---|---|
| discount points formula | calculator+guide | /calculator/discount-points-formula | 公式区 + 可算区 + 示例 |
| discount points mortgage example | calculator+example | /calculator/discount-points-example | 多个 preset（$300k/$500k）一键切换 |
| how many discount points can you buy | guide+calculator | /blog/how-many-discount-points-can-you-buy | 解释限制差异 + 计算器（points→成本/回本） |
| how much is 25 points on a mortgage | quick calculator | /calculator/how-much-is-25-points | 快速 preset + “常见误写 2.5 points”解释 |
| 2-1 buydown meaning | guide+calculator | /blog/2-1-buydown-meaning | calculator 放首屏，下面解释 |
| 2-1 buydown pros and cons | guide+calculator | /blog/2-1-buydown-pros-cons | 用表格列 pros/cons + calculator |
| is it smart to do a 2:1 buydown | decision page | /compare/is-2-1-buydown-worth-it | “适合/不适合”判断 + 计算器结果支撑 |
| 2-1 buydown calculator free | calculator landing | /calculator/free-2-1-buydown-calculator | 免费算（本地），但保存/分享/AI 需要付费 |
| 2-1 buydown calculator excel | template page | /calculator/2-1-buydown-calculator-excel | “复制到 Excel/下载 CSV” + calculator |
| 3 2-1 buydown calculator excel | template page | /calculator/3-2-1-buydown-calculator-excel | 同上 |

> 关键：**“excel / free”这种词并不意味着你要免费试用**。  
> 你可以提供“免费在线计算（本地）”，付费解锁 Share/PDF/AI；或者提供“导出 CSV（本地生成）”来满足 Excel 意图。

---

## 3) 页面统一模板（让 AI 批量生成，避免薄页）
对 AI 说清楚：所有 `/calculator/*`、`/compare/*` 页面必须按下面骨架渲染（这是工具站能跑起来的关键）。

### 3.1 Calculator Page 必备区块（从上到下）
1. **H1 + 一句话解释（面向 LO）**
2. **Mini Calculator（3–6 输入）**
3. **Default Example（首屏就能看到结果，SSR/静态可见）**
4. **LO Script（30 秒讲给客户听：text/email/script）**
5. **FAQ（5–8 条）+ FAQ schema（JSON-LD）**
6. **Related Tools（3–6 内链）**
7. **CTA（Starter Pass / Pro）**

### 3.2 Compare Page 必备区块
1. **对比输入区**（A/B 两套方案）
2. **对比输出区**：月供差、总成本、break-even、风险提示
3. **一段结论**：适合谁、不适合谁（LO 可复制话术）
4. FAQ + Related Tools + CTA

---

## 4) 让 AI 把 SEO 关键词“上站”的工程方案（可复制执行）
> 你说“上站”，本质是：**pSEO 数据驱动 + 动态路由模板 + sitemap/robots + 内链**。

### 4.1 代码结构建议（不绑定框架，但更适合 Next.js）
```
src/
  seo/
    pages.ts            # SEO 页面注册表（你把上面表格写进来）
    build-related.ts     # relatedSlugs 生成/校验
  app/                  # 如果是 Next.js App Router
    calculator/[slug]/page.tsx
    compare/[slug]/page.tsx
    blog/[slug]/page.tsx
    sitemap.ts
    robots.ts
  components/
    seo/Meta.tsx
    seo/FAQSchema.tsx
    seo/BreadcrumbSchema.tsx
    tools/DiscountPointsCalculator.tsx
    tools/BuydownCalculator.tsx
    tools/BuydownAmortizationTable.tsx
```

### 4.2 AI 必须遵守的“SEO 页面硬规则”
- SEO 页 **禁止** 外部 API 调用（RentCast / LLM）
- SEO 页 **禁止** 保存/生成 share link
- SEO 页 **允许** 本地计算 + 导出 CSV（可选）
- `/s/:shareId` 强制 `noindex,nofollow`
- 所有 SEO 页必须：
  - meta title/description
  - canonical
  - FAQ schema
  - related internal links
  - sitemap 收录

### 4.3 最低可行 pSEO（MVP）实现方式
- 在 `src/seo/pages.ts` 建一个数组 `SeoPage[]`：
  - `slug`, `kind`(calculator/compare/blog)
  - `title`, `metaTitle`, `metaDescription`
  - `primaryKeyword`, `secondaryKeywords[]`
  - `calculatorId`（points / 2-1 / 3-2-1 / schedule）
  - `defaultInputs`
  - `faq[]`
  - `relatedSlugs[]`
- `calculator/[slug]/page.tsx` 根据 slug 查配置：
  - 找不到：404
  - 找到：渲染统一模板 + 对应 calculator component
- `sitemap.ts`：读取 `SeoPage[]` 自动生成 sitemap（不要手写）
- `robots.ts`：允许 /calculator /compare /blog；禁止 /s/ 与登录态

---

## 5) 给你的 AI（Antigravity / 任何代码 AI）一套“上站提示词”（按顺序）
> 你直接复制粘贴给 AI。每条任务都让它“只做这一件事”，避免跑偏。

### Prompt 1 — 建 SEO 注册表（只建数据，不写页面）
```
You are working on ShowTheRate.
Create a single SEO registry file `src/seo/pages.ts` that exports an array of SeoPage objects.
Include these slugs and map them to page types and calculator ids:
- /calculator/discount-points-calculator (calculatorId=discount_points)
- /calculator/how-to-calculate-discount-points (calculatorId=discount_points)
- /calculator/how-much-is-3-points (calculatorId=points_cost_presets)
- /compare/discount-points-vs-temporary-buydown (calculatorId=compare_points_vs_buydown)
- /calculator/2-1-buydown-cost (calculatorId=buydown_2_1)
- /calculator/3-2-1-buydown-calculator (calculatorId=buydown_3_2_1)
- /calculator/how-much-3-2-1-buydown-cost (calculatorId=buydown_3_2_1)
- /calculator/2-1-buydown-amortization-schedule (calculatorId=buydown_schedule_2_1)
Each entry must include: slug, kind, title, metaTitle, metaDescription, defaultInputs, faq[], relatedSlugs[].
Do NOT create any UI pages yet.
Acknowledge and confirm you will not deviate. Do not implement anything else.
```

### Prompt 2 — 做通用页面模板（calculator/compare 复用）
```
Implement generic page templates for `/calculator/[slug]` and `/compare/[slug]` routes.
The page must read from `src/seo/pages.ts` and render:
H1, subtitle, a calculator slot, default example output, LO script section, FAQ section with JSON-LD, Related tools, CTA.
No external API calls allowed on these SEO pages.
Acknowledge and confirm you will not deviate. Do not implement anything else.
```

### Prompt 3 — 实现 Discount Points Calculator（本地计算）
```
Implement the Discount Points calculator component used by the SEO pages.
Inputs: loanAmount, currentApr, newApr, termYears, pointsPercent, expectedHoldMonths.
Outputs: pointsCost, paymentCurrent, paymentNew, monthlySavings, breakEvenMonths, netBenefitAtHold.
All calculations must be client-side/local only.
Acknowledge and confirm you will not deviate. Do not implement anything else.
```

### Prompt 4 — 实现 2-1 / 3-2-1 Buydown Calculator（本地计算）
```
Implement buydown calculators for 2-1 and 3-2-1.
Inputs: homePrice, downPayment(or loanAmount), baseApr, termYears, optional taxesInsuranceMonthly.
Outputs: basePayment, year1Payment, year2Payment, year3Payment(if applicable), totalSubsidy.
No external API calls.
Acknowledge and confirm you will not deviate. Do not implement anything else.
```

### Prompt 5 — 实现 2-1 Buydown 36-month amortization schedule
```
Implement a 36-month amortization schedule table for a 2-1 buydown.
Show month, appliedRate, payment, interest, principal, balance.
Allow export as CSV generated locally.
Acknowledge and confirm you will not deviate. Do not implement anything else.
```

### Prompt 6 — 上站必做：sitemap / robots / canonical
```
Implement sitemap and robots generation.
- Include all calculator/compare/blog SEO pages from registry in sitemap.
- Disallow indexing for /s/* and any authenticated app routes.
- Ensure each SEO page sets canonical to its own URL and has meta title/description.
Acknowledge and confirm you will not deviate. Do not implement anything else.
```

---

## 6) 上线后的“SEO 检查清单”（避免你做了但不收录）
- [ ] 每个 SEO 页有唯一 title/description（不要重复）
- [ ] 首屏可见：H1 + 默认示例结果（不要全靠交互后才出现）
- [ ] FAQ schema 正常输出（查看页面源代码能看到 JSON-LD）
- [ ] sitemap.xml 能访问且包含新页面
- [ ] robots.txt 没把 /calculator /compare 禁掉
- [ ] 页面速度（别塞大图/大动画）
- [ ] 内链：每页至少 3 个 related tools

---

## 7) 你现在可以立刻做的“小步快跑”
按优先级，你今天就可以先上 4 页（最快见效）：
1) `/calculator/discount-points-calculator`
2) `/compare/discount-points-vs-temporary-buydown`
3) `/calculator/2-1-buydown-cost`
4) `/calculator/3-2-1-buydown-calculator`

把这 4 页做扎实（能算、能解释、能内链），再扩 P1。

