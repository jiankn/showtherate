# Multi-Calculator SEO Matrix Strategy
> Inspired by: "Stop doing Wikis! Why calculators are a dimension reduction attack."

## 1. 核心理念：Tool > Content
传统的 SEO 是写文章 (Wiki模式)，比如解释 "什么是 FHA 贷款"。这种内容竞争极其激烈，且用户读完就走。
**Calculator 模式** 是提供工具，比如 "FHA 贷款计算器"。用户会反复使用、调整输入、分享结果。
在 Mortgage 领域，**"算账"是最高频、最刚需、离钱最近的意图。**

## 2. 为什么要搞"多个"计算器？(The Army of Calculators)
不要只做一个 "Mortgage Calculator"。因为：
1.  **关键词覆盖**：一个通用计算器只能覆盖 "Mortgage Calculator" 这个红海词。
2.  **意图匹配**：搜 "Should I pay points" 的人，不想看通用的计算器，他想看 "Points Break-even Calculator"（买点回本计算器）。
3.  **开发成本低**：你的 Core Engine 已经写好了。衍生出 50 个微型计算器，只是 **UI + Preset 参数** 的排列组合。

## 3. Calculator Matrix (计算器矩阵规划)

我们通过三个维度来裂变出 50+ 个计算器页面：

### 维度 A：决策类 (Decision Makers) - 转化率最高
解决 "A vs B" 的纠结。
1.  **Rent vs Buy Calculator**: 租房划算还是买房划算？
2.  **Points Calculator (Break-even)**: 买点（Points）要多久才能回本？
3.  **Refinance Savings Calculator**: 转按揭能省多少钱？
4.  **Extra Payment Calculator**: 每月多还 $200，能提前几年还清？
5.  **15-yr vs 30-yr Calculator**: 短期压力 vs 长期利息对比。
6.  **Affordability Calculator**: 我月薪 $10,000 能买多少钱的房？

### 维度 B：贷款类型类 (Loan Types) - 精准流量
针对特定人群的专用计算器。
7.  **FHA Loan Calculator**: 专攻 3.5% 首付 + MIP 计算。
8.  **VA Loan Calculator**: 专攻 0 首付 + Funding Fee 计算。
9.  **Jumbo Loan Calculator**: 豪宅贷款计算。
10. **DSCR Loan Calculator**: 投资房（以租养贷）计算器（LO 非常喜欢这个）。
11. **Interest-Only Calculator**: 前几年只还利息。

### 维度 C：地理位置类 (Geo-Specific) - 避开竞争
结合你的 Tax Data 优势。
12. **Chicago Mortgage Calculator**: 预置 Chicago Tax (2.1%)。
13. **Texas Property Tax Calculator**: 预置 TX Tax & Homestead Exemption。
14. **Florida Closing Cost Estimator**: 预置 FL 的 Intangible Tax。
... (覆盖 Top 50 热门城市)

## 4. 执行落地的降维打击 (Implementation)

不要手写 50 个页面。使用 **Programmatic** 方式生成。

### 架构设计
*   **URL Pattern**: `showtherate.com/calculator/[slug]`
    *   `/calculator/rent-vs-buy`
    *   `/calculator/fha-loan`
    *   `/calculator/mortgage-calculator-texas`
*   **Shared Component**: 所有页面复用同一个 `<ScenarioBuilder />` 核心组件。
*   **Config Driven**: 每个页面只是一个 JSON 配置：
    ```json
    {
      "slug": "fha-loan",
      "title": "FHA Loan Calculator 2026",
      "preset": { "type": "FHA", "downPaymentPercent": 3.5 },
      "ui": { "showMIP": true, "showPoints": false },
      "content_template": "fha_explanation.md"
    }
    ```

## 5. SEO 增强 (The "Wiki" part inside Calculator)
虽然不做纯 Wiki，但每个计算器页面 **下面** 必须带一段高质量内容（800字+），解释"怎么算"。
*   **结构**:
    *   [Top]: **The Calculator (Tool)** - 让用户一来就爽。
    *   [Middle]: **Analysis** - 解释计算结果（"Your break-even is 30 months..."）。
    *   [Bottom]: **Guide (SEO Content)** - "How FHA loans work", "Current FHA limits in 2026".

## 6. 总结
**"Mortgage Wiki" 是红海，"Mortgage Tools" 是蓝海。**
用一个核心引擎，换 50 种皮肤（配置），覆盖 50 个高意图场景。这就是 SaaS 玩法的降维打击。
