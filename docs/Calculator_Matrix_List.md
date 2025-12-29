# Calculator Micro-Tools Matrix for US Mortgage Market
> Strategy: 30 highly specific tools to launch. Focus on "Sales Enablement" (helping LOs close) rather than just "Math".

## 总体规划：30个微工具
建议初期上线 **30个** 精选工具，分为四个梯队。不要为了凑数而做，每一个都应该是一个 "Sales Pitch"（销售话术）的数字化体现。

---

## Tier 1: 流量型 (Traffic Magnets) - 5个
> 目标：覆盖最大的搜索意图，作为漏斗顶部入口。

1.  **Mortgage Calculator with Taxes & Insurance**
    *   *Why*: 必须有的标配。虽然竞争大，但必须占位。
    *   *Feature*: 强调 PITI 拆解，比 Zillow 更清晰。
2.  **Affordability Calculator (Based on Income)**
    *   *Why*: "我月薪 8k 能买多少钱房？" 是最Top的购房前问题。
3.  **FHA Loan Calculator**
    *   *Why*: 针对低信用/低首付人群，这类人群极其依赖计算器算月供。
4.  **VA Loan Calculator**
    *   *Why*: 军人贷款，特殊的 Funding Fee 很难算，精准刚需。
5.  **Refinance Calculator**
    *   *Why*: 只要确信利率下降，这个词的搜索量会瞬间爆炸。

---

## Tier 2: 转化型 (Sales Closers) - 10个
> 目标：解决 LO 最头疼的 "Objection Handling"（异议处理）。这是你产品的核心价值区。

6.  **Rent vs Buy Calculator** (租房 vs 买房)
    *   *Scene*: 客户犹豫"要不再租一年吧？" LO 用这个算给他看：5年你也帮房东付了$12万房租，而买房能积累$5万权益。
7.  **Cost of Waiting Calculator** (等待成本)
    *   *Scene*: 客户想等利率跌。LO 用这个算：如果房价涨 5%，你现在不买，明年每月多付 $300。
8.  **Points Break-Even Calculator** (买点回本)
    *   *Scene*: "付$5000买点降0.5%利率划算吗？" 算出：你需要住满 42 个月才回本。
9.  **2-1 Buydown Calculator** (买断利率)
    *   *Scene*: 当下高利率环境神器。前两年利率低，第三年回升。客户看不懂，要算。
10. **Extra Payment Calculator** (提前还款)
    *   *Scene*: "我每月多还$100会怎样？" 结果：缩短 4 年贷款期，省$3万利息。震慑力极强。
11. **15-yr vs 30-yr Comparison**
    *   *Scene*: 经典的 Term 选择困难症。
12. **ARM vs Fixed Calculator**
    *   *Scene*: 浮动利率 (ARM) 在高息环境下开始流行，需要对比风险。
13. **Bi-Weekly Payment Calculator**
    *   *Scene*: 双周供，一种无痛缩短还款期的技巧。
14. **HELOC Payment Calculator**
    *   *Scene*: 房屋净值信贷，老业主套现装修用。
15. **Seller Concessions Calculator**
    *   *Scene*: 卖家给 $10k Credit，是用来降房价好，还是用来买利率好？（高级技巧）。

---

## Tier 3: 投资者/利基型 (Niche/Investor) - 5个
> 目标：吸引高净值 LO (做投资客生意的)。

16. **DSCR Loan Calculator** (投资房)
    *   *Why*: 现在的投资房不看个人收入，看租金覆盖率 (DSCR)。这是目前最火的非标产品。
17. **BRRRR Calculator**
    *   *Why*: Buy, Rehab, Rent, Refinance, Repeat. 这是一个极其复杂的链条，有一个专用计算器会让投资者把你当神。
18. **House Hacking Calculator**
    *   *Why*: 买多单元 (Duplex/Triplex)，自住一间，出租其他的。年轻人的最爱。
19. **Interest-Only Calculator**
    *   *Why*: 前 10 年只还利息。现金流投资客最爱。
20. **Rental Cash Flow Calculator**
    *   *Why*: 输入房租和开销，算单纯的现金流。

---

## Tier 4: 地理位置型 (Geo Long-tail) - 10个
> 目标：利用 Tax Data 覆盖 Top 10 热门州。

21. **Texas Mortgage Calculator** (High Propert Tax)
22. **California Mortgage Calculator** (Prop 13 limits)
23. **Florida Mortgage Calculator**
24. **New York Closing Cost Calculator** (Mortgage Recording Tax 极高)
25. **Illinois Mortgage Calculator**
26. **New Jersey Mortgage Calculator**
27. **Pennsylvania Mortgage Calculator**
28. **Ohio Mortgage Calculator**
29. **Georgia Mortgage Calculator**
30. **North Carolina Mortgage Calculator**

---

## Implementation Strategy (如何落地)

这 30 个工具 **不需要** 30 套代码。
它们本质是 `Generic Calculator` + `Configuration`：

1.  **Preset Values**:
    *   `FHA Calculator` = Generic Calc + `MinDown=3.5%` + `MIP=True`.
    *   `Texas Calculator` = Generic Calc + `TaxRate=1.9%`.
    *   `Interest-Only` = Generic Calc + `AmortizationType=IO`.

2.  **UI Toggles**:
    *   `Rent vs Buy` 需要额外输入 "Current Rent"。
    *   `Extra Payment` 需要额外输入 "Extra Amount"。

**结论**：你的核心引擎只需要支持大约 5-8 种核心变体逻辑，就可以通过配置组合出这 30 个产品。
