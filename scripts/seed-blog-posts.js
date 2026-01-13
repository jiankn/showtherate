/**
 * Blog Posts Seed Script
 * Creates 8 SEO-optimized tutorial articles for mortgage calculators
 * 
 * Run with: node scripts/seed-blog-posts.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const blogPosts = [
    {
        title: 'What is a 2-1 Buydown? Complete Guide for 2024',
        slug: '2-1-buydown-explained',
        excerpt: 'Learn how a 2-1 buydown can lower your mortgage payments for the first two years. Understand the costs, benefits, and when it makes sense.',
        content: `# What is a 2-1 Buydown?

A 2-1 buydown is a temporary mortgage financing arrangement that reduces your interest rate for the first two years of your loan. The rate is 2% lower in year one, 1% lower in year two, then returns to the full rate from year three onward.

## How Does a 2-1 Buydown Work?

When you get a 2-1 buydown, the payment difference is funded upfront and placed in an escrow account. This money is used to subsidize your monthly payments during the buydown period.

**Example:** On a $400,000 loan at 7%:
- **Year 1:** Pay at 5% = $2,147/month (save ~$514/month)
- **Year 2:** Pay at 6% = $2,398/month (save ~$263/month)
- **Year 3+:** Pay at 7% = $2,661/month (full payment)

## Who Pays for the Buydown?

The buydown cost is typically paid by:
- **Sellers** as a concession to attract buyers
- **Builders** to move new construction inventory
- **Lenders** as a promotional incentive

## When Does a 2-1 Buydown Make Sense?

A 2-1 buydown is ideal when:
1. You expect to refinance within 2-3 years
2. You need lower initial payments to qualify
3. You anticipate income growth
4. Rates are expected to drop

## Calculate Your 2-1 Buydown

Use our [2-1 Buydown Calculator](/calculator/2-1-buydown-calculator) to see exactly how much you can save and what the buydown will cost.`,
        cover_image: '/images/blog/buydown-guide.png',
        tags: ['buydown', 'mortgage', 'guide', 'first-time-buyer'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Should You Buy Mortgage Points? Break-Even Analysis',
        slug: 'should-you-buy-mortgage-points',
        excerpt: 'Discover when buying discount points makes financial sense. Learn the break-even formula and how to calculate if points are worth it for you.',
        content: `# Should You Buy Mortgage Points?

Discount points are upfront fees paid to the lender to reduce your interest rate. One point costs 1% of your loan amount and typically reduces your rate by 0.25%.

## The Break-Even Formula

To determine if points are worth it:

**Break-Even Months = Points Cost / Monthly Savings**

**Example:**
- Loan Amount: $400,000
- Points Cost: $4,000 (1 point)
- Monthly Savings: $65
- Break-Even: 62 months (5.2 years)

## When to Buy Points

**Buy points if:**
- You'll keep the loan past the break-even point
- You have extra cash at closing
- You want predictable long-term savings

**Skip points if:**
- You might sell or refinance soon
- You're short on closing funds
- Break-even is longer than your expected tenure

## Calculate Your Break-Even

Use our [Points Break-Even Calculator](/calculator/discount-points-break-even) to see exactly how long until your points pay off.`,
        cover_image: '/images/blog/discount-points.png',
        tags: ['points', 'mortgage', 'savings', 'analysis'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Rate Lock vs Float: Making the Right Decision',
        slug: 'rate-lock-vs-float-decision',
        excerpt: 'Should you lock your mortgage rate now or wait? Understand the risks and rewards of each strategy to make an informed decision.',
        content: `# Rate Lock vs Float: Making the Right Decision

One of the most critical decisions during your mortgage process is whether to lock your rate or float.

## What is a Rate Lock?

A rate lock guarantees your interest rate for a specific period (typically 30-60 days). If rates go up, you're protected. If rates drop, you're usually stuck.

## What is Floating?

Floating means you don't lock your rate, betting that rates will drop before closing.

## Factors to Consider

### Lock Your Rate When:
- You're comfortable with the current rate
- Market volatility is high
- You can close within the lock period

### Consider Floating When:
- Economic indicators suggest rates will drop
- You have flexibility on closing timing
- You have a float-down option

## Float-Down Options

Some lenders offer float-down provisions. Use our [Float Down Calculator](/calculator/float-down-worth-it) to see if it's worth the cost.`,
        cover_image: '/images/blog/rate-lock.png',
        tags: ['rate-lock', 'strategy', 'mortgage', 'decision'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Complete Guide to Closing Costs: What to Expect',
        slug: 'closing-costs-complete-guide',
        excerpt: 'Everything you need to know about mortgage closing costs. Understand each fee, who pays what, and how to reduce your costs.',
        content: `# Complete Guide to Closing Costs

Closing costs typically range from 2% to 5% of your loan amount.

## Types of Closing Costs

### Lender Fees
- **Origination Fee:** 0.5% - 1% of loan amount
- **Underwriting Fee:** $500 - $1,000
- **Processing Fee:** $300 - $500

### Third-Party Fees
- **Appraisal:** $400 - $700
- **Title Insurance:** 0.5% - 1% of loan amount
- **Escrow/Settlement Fee:** $500 - $1,500

### Prepaid Items
- **Homeowners Insurance:** 1 year upfront
- **Property Tax Escrow:** 2-6 months

## How to Reduce Closing Costs

1. **Negotiate with sellers** for concessions
2. **Shop for title insurance**
3. **Ask for lender credits**
4. **Compare loan estimates** from multiple lenders

## Estimate Your Costs

Use our [Closing Costs Worksheet](/calculator/closing-costs-worksheet) to get a detailed estimate.`,
        cover_image: '/images/blog/closing-costs.png',
        tags: ['closing-costs', 'fees', 'guide', 'preparation'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'How Much Cash Do You Need to Close?',
        slug: 'cash-to-close-breakdown',
        excerpt: 'Calculate exactly how much money you need to bring to closing. Includes down payment, closing costs, credits, and reserves.',
        content: `# How Much Cash Do You Need to Close?

Your "cash to close" is the total amount you need to bring to the closing table.

## Cash to Close Formula

**Cash to Close = Down Payment + Closing Costs - Credits**

## Breaking It Down

### Down Payment
| Loan Type | Minimum Down |
|-----------|--------------|
| Conventional | 3% - 20% |
| FHA | 3.5% |
| VA | 0% |
| USDA | 0% |

### Credits That Reduce Cash Needed
- **Seller Concessions:** Credits from seller
- **Lender Credits:** Trade higher rate for closing help
- **Earnest Money:** Already deposited, applied at closing

## Example Calculation

For a $500,000 home with 20% down:
- Down Payment: $100,000
- Closing Costs (~3%): $12,000
- Less Seller Credit: -$5,000
- **Cash to Close: $107,000**

## Calculate Yours

Use our [Cash to Close Calculator](/calculator/cash-to-close-calculator) for a personalized estimate.`,
        cover_image: '/images/blog/cash-to-close.png',
        tags: ['cash-to-close', 'down-payment', 'preparation', 'first-time-buyer'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: '3-2-1 Buydown vs 2-1 Buydown: Which is Better?',
        slug: '3-2-1-vs-2-1-buydown-comparison',
        excerpt: 'Compare the two most popular temporary buydown options. Learn the cost differences and when each makes sense.',
        content: `# 3-2-1 Buydown vs 2-1 Buydown

Both buydown types reduce your initial mortgage payments, but they work differently.

## How They Compare

### 2-1 Buydown
- Year 1: Rate is 2% lower
- Year 2: Rate is 1% lower
- Year 3+: Full rate

### 3-2-1 Buydown
- Year 1: Rate is 3% lower
- Year 2: Rate is 2% lower
- Year 3: Rate is 1% lower
- Year 4+: Full rate

## Cost Comparison

On a $400,000 loan at 7%:

| Buydown | Total Cost | Year 1 Savings |
|---------|------------|----------------|
| 2-1 | ~$9,300 | ~$514/month |
| 3-2-1 | ~$17,500 | ~$763/month |

## When to Choose Each

### Choose 2-1 Buydown When:
- Seller concessions are limited
- You expect to refinance within 2 years

### Choose 3-2-1 Buydown When:
- Maximum first-year savings is priority
- You have more concession dollars available

## Calculate Both Options

- [2-1 Buydown Calculator](/calculator/2-1-buydown-calculator)
- [3-2-1 Buydown Calculator](/calculator/3-2-1-buydown-calculator)`,
        cover_image: '/images/blog/buydown-comparison.png',
        tags: ['buydown', 'comparison', '3-2-1', '2-1'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Seller Concessions Explained: How to Use Them Wisely',
        slug: 'seller-concessions-explained',
        excerpt: 'Learn how to maximize seller concessions for buydowns, closing costs, or rate reductions.',
        content: `# Seller Concessions Explained

Seller concessions are credits the seller provides to help cover your closing costs or other expenses.

## Maximum Allowed Concessions

| Loan Type | Max Concession |
|-----------|---------------|
| Conventional (< 10% down) | 3% |
| Conventional (10-25% down) | 6% |
| FHA | 6% |
| VA | 4% |
| USDA | 6% |

## Ways to Use Concessions

### 1. Pay Closing Costs
Reduce your out-of-pocket expenses at closing.

### 2. Fund a Temporary Buydown
Use concessions to pay for a [2-1 buydown](/calculator/2-1-buydown-calculator).

### 3. Buy Down the Rate Permanently
Pay for discount points to reduce your rate.

## Which Is Best?

Use our [Seller Concession Buydown Calculator](/calculator/seller-concession-buydown) to compare options.`,
        cover_image: '/images/blog/seller-concession.png',
        tags: ['seller-concession', 'negotiation', 'strategy'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'How to Read Your Loan Estimate: Line by Line Guide',
        slug: 'how-to-read-loan-estimate',
        excerpt: 'Demystify your loan estimate with this comprehensive guide. Understand every section and compare offers.',
        content: `# How to Read Your Loan Estimate

The Loan Estimate (LE) is a standardized 3-page document that helps you understand and compare mortgage offers.

## Page 1: Loan Terms & Costs

### Loan Terms Box
- **Loan Amount:** How much you're borrowing
- **Interest Rate:** Your locked or estimated rate
- **Monthly Principal & Interest:** Base payment

### Costs at Closing
- **Closing Costs:** Total fees (detailed on Page 2)
- **Cash to Close:** What you need to bring

## Page 2: Closing Cost Breakdown

### Section A: Origination Charges
Lender fees including points.

### Section B: Services You Cannot Shop For
Required services chosen by lender.

### Section C: Services You Can Shop For
Title, survey, pest inspection.

## Page 3: Comparisons

### APR
True cost of borrowing including fees.

## Compare Offers

Use our calculators to verify:
- [Closing Costs Worksheet](/calculator/closing-costs-worksheet)
- [Cash to Close Calculator](/calculator/cash-to-close-calculator)`,
        cover_image: '/images/blog/loan-estimate.png',
        tags: ['loan-estimate', 'education', 'guide'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Market Update: Mortgage Rates in 2026',
        slug: 'market-update-mortgage-rates-2026',
        excerpt: 'An in-depth look at the current state of mortgage rates and what to expect in the coming months. Essential insights for Loan Officers and homebuyers.',
        content: `# Market Update: Mortgage Rates in 2026

As we move into 2026, the mortgage landscape continues to evolve. Whether you're a Loan Officer helping clients navigate their options or a homebuyer weighing your timing, understanding the current rate environment is crucial.

## Current Rate Snapshot

As of early 2026, here's where we stand:

| Loan Type | Current Rate Range |
|-----------|-------------------|
| 30-Year Fixed | 6.25% - 6.75% |
| 15-Year Fixed | 5.50% - 6.00% |
| 5/1 ARM | 5.75% - 6.25% |
| 7/1 ARM | 5.90% - 6.40% |

*Rates are for illustrative purposes and vary by lender, credit score, and other factors.*

## Key Factors Shaping 2026 Rates

### 1. Federal Reserve Policy

The Federal Reserve's stance on interest rates remains the most significant driver. After the rate hikes of 2022-2024, we've seen a gradual easing trend. Economists expect:

- **2-3 additional rate cuts** in 2026
- A target federal funds rate of **4.00% - 4.25%** by year-end
- Continued focus on balancing inflation control with economic growth

### 2. Inflation Trends

Inflation has moderated but remains above the Fed's 2% target:

- **Current CPI**: ~2.8%
- **Core PCE**: ~2.5%
- **Impact**: Sustained disinflation could accelerate rate cuts

### 3. Housing Market Dynamics

The housing market shows mixed signals:

- **Inventory**: Still below historical norms in most markets
- **Home Prices**: Moderate appreciation of 3-5% expected
- **Demand**: Strong demographic tailwinds from Millennials entering peak homebuying years

## What This Means for Your Clients

### For First-Time Buyers

**Key Message**: Waiting may not help.

While lower rates are possible, consider this scenario:

> A $400,000 home at 6.5% = $2,528/month (P&I)
> 
> Same home in 6 months at 6.0% but 4% price increase:
> $416,000 at 6.0% = $2,494/month (P&I)
>
> **Savings**: Only $34/month, but $16,000 more principal owed

Use our [Cost of Waiting Calculator](/calculator/cost-of-waiting) to show clients this tradeoff.

### For Refinance Candidates

The refinance opportunity window is opening:

- Homeowners with rates above **7.5%** should evaluate now
- Break-even analysis is critical—most refinances pay off within 18-24 months
- Consider [rate-and-term vs. cash-out](/calculator/refinance-comparison) options

### For Investment Property Buyers

- DSCR loans remain competitive at 7.0% - 7.5%
- Rental income continues to support positive cash flow in many markets
- Consider our [Rental Cash Flow Calculator](/calculator/rental-cash-flow) for quick analysis

## Script: Explaining Rates to Your Clients

Here's a conversation framework for discussing current rates:

> **Client**: "Should I wait for rates to drop?"
>
> **You**: "I understand the temptation to wait. Let me show you what the numbers say. Based on current trends, if rates drop 0.5% over the next 6 months but home prices rise just 3%, you'd actually pay more monthly AND owe more on the home. Let me run a quick comparison for you..."

## Rate Lock Strategy

Given current volatility, here's our recommended approach:

1. **Lock Early**: With rates trending sideways, lock when you're within 45 days of closing
2. **Consider Float-Down**: If available, a float-down option for 0.125-0.25 points can be worth it
3. **Watch the Calendar**: Fed meetings (March, June, September, December) can cause swings

Use our [Rate Lock Calculator](/calculator/rate-lock-cost) to analyze lock costs.

## Looking Ahead: 2026 Rate Forecast

| Scenario | Probability | Year-End 30-Year Rate |
|----------|-------------|----------------------|
| Optimistic | 25% | 5.75% - 6.00% |
| Base Case | 50% | 6.25% - 6.50% |
| Pessimistic | 25% | 6.75% - 7.00% |

## Action Items for Loan Officers

1. **Update your rate sheets** weekly and communicate proactively
2. **Pre-qualify clients now** before spring buying season heats up
3. **Use comparison tools** to show value—clients respond to data
4. **Position ARMs strategically** for clients planning shorter holds

---

*Ready to show your clients a clear comparison? Create a professional rate comparison in 60 seconds with [ShowTheRate](/app/new).*`,
        cover_image: '/images/blog/market-update-2026.png',
        tags: ['market-update', 'rates', '2026', 'strategy'],
        published: true,
        published_at: '2026-01-01T09:00:00.000Z',
    },
    {
        title: 'Understanding Adjustable Rate Mortgages (ARMs)',
        slug: 'understanding-adjusted-rates',
        excerpt: 'How do adjustable rates work and are they right for you? We break down ARM loans, their pros and cons, and when they make sense for your clients.',
        content: `# Understanding Adjustable Rate Mortgages (ARMs)

Adjustable Rate Mortgages often get a bad reputation, but in the right circumstances, they can save your clients thousands of dollars. Let's break down how ARMs work and when to recommend them.

## What is an ARM?

An Adjustable Rate Mortgage (ARM) is a home loan with an interest rate that changes over time. Unlike fixed-rate mortgages where your rate stays the same for 15 or 30 years, ARMs have:

1. **Initial Fixed Period**: A set number of years at a lower, fixed rate
2. **Adjustment Period**: After the initial period, the rate adjusts periodically

## Common ARM Types

| ARM Type | Initial Fixed Period | Then Adjusts |
|----------|---------------------|--------------|
| 5/1 ARM | 5 years | Every 1 year |
| 7/1 ARM | 7 years | Every 1 year |
| 10/1 ARM | 10 years | Every 1 year |
| 5/6 ARM | 5 years | Every 6 months |

**Pro Tip**: The first number indicates years of fixed rate; the second indicates adjustment frequency.

## How ARM Rates Are Calculated

After the initial period, your rate is determined by:

**New Rate = Index + Margin**

- **Index**: A benchmark rate (commonly SOFR - Secured Overnight Financing Rate)
- **Margin**: A fixed percentage the lender adds (typically 2-3%)

### Rate Caps Protection

ARMs include caps that limit how much your rate can change:

| Cap Type | Typical Limit | Example |
|----------|--------------|---------|
| Initial Adjustment Cap | 2% | If starting at 5%, max first adjustment to 7% |
| Periodic Cap | 1-2% | Max change per adjustment period |
| Lifetime Cap | 5-6% | If starting at 5%, can never exceed 10-11% |

## ARM vs. Fixed Rate: The Numbers

Let's compare a 5/1 ARM at 5.75% vs. a 30-Year Fixed at 6.50% on a $400,000 loan:

### Monthly Payment Comparison

| Loan Type | Rate | Payment (P&I) |
|-----------|------|---------------|
| 30-Year Fixed | 6.50% | $2,528 |
| 5/1 ARM (Initial) | 5.75% | $2,334 |

**Monthly Savings with ARM**: $194

### 5-Year Cost Analysis

| Metric | 30-Year Fixed | 5/1 ARM |
|--------|---------------|---------|
| Total Payments | $151,680 | $140,040 |
| Interest Paid | $124,680 | $113,640 |
| Principal Paid | $27,000 | $26,400 |

**5-Year Savings with ARM**: ~$11,640

Use our [ARM vs Fixed Calculator](/calculator/arm-vs-fixed-rate-comparison) for personalized comparisons.

## When ARMs Make Sense

### Ideal ARM Candidates

1. **Short-Term Homeowners**: Planning to sell within 5-7 years
2. **Expecting Income Growth**: Can absorb potential payment increases
3. **Refinance-Ready**: Plan to refinance before adjustment
4. **Rate-Drop Speculators**: Believe rates will fall (can benefit from adjustments)

### When to Avoid ARMs

1. **Forever Home**: If staying 10+ years, fixed offers predictability
2. **Tight Budget**: Can't absorb payment increases
3. **Risk-Averse**: Peace of mind matters more than savings

## 2026 ARM Strategy

Given current market conditions, ARMs deserve serious consideration:

### Why ARMs Are Attractive Now

1. **Rate Spread**: ARMs are 0.50-0.75% below fixed rates
2. **Fed Outlook**: Expected rate cuts could benefit ARM holders
3. **Refinance Opportunity**: Many ARM borrowers may refinance within 3-5 years anyway

### The Refinance Safety Net

If a client takes a 5/1 ARM today at 5.75% and refinances in year 3 at 5.50%:

- **3 Years of Savings**: ~$7,000 vs. 30-year fixed
- **New Lower Fixed Rate**: Locked in for 30 years
- **Total Benefit**: Lower payments throughout

## Client Conversation Scripts

### Introducing ARMs

> "Have you considered an adjustable rate? I know they have a reputation, but let me show you the math. Given your plans to be in this home for about 5 years, an ARM could save you $200 per month—that's $12,000 you keep in your pocket. And here's the key: you're protected by rate caps, so there's a ceiling on how high it can go. Let me build you a comparison..."

### Addressing Rate Increase Fears

> "I totally understand the concern about rate increases. Let's look at the worst-case scenario. Even if rates hit the lifetime cap, your payment would go from $2,334 to $2,800—still manageable. But here's what's more likely: you'll refinance long before then, especially since rates are expected to drop. The question is: do you want to guarantee paying an extra $194/month for certainty, or use that money for other goals?"

### Closing the ARM Conversation

> "Here's my recommendation: take the ARM, bank the $194 monthly savings, and we'll monitor rates together. In 2-3 years, if fixed rates drop below your ARM rate, we refinance. If they don't, your ARM rate is still competitive. You're in the driver's seat."

## ARM Checklist for Loan Officers

Before recommending an ARM, verify:

- [ ] Client's expected homeownership duration
- [ ] Income stability and growth trajectory  
- [ ] Understanding of rate adjustment mechanics
- [ ] Comfort with potential payment increases
- [ ] Refinance feasibility (credit, equity)

## Tools for ARM Analysis

Make your ARM conversations data-driven:

1. **[ARM vs Fixed Comparison](/calculator/arm-vs-fixed-rate-comparison)**: Side-by-side analysis
2. **[Break-Even Calculator](/calculator/discount-points-break-even)**: When does the ARM advantage pay off?
3. **[Refinance Calculator](/calculator/refinance-comparison)**: Model the refinance scenario

---

*Need to show a client exactly how an ARM stacks up against fixed? Build a professional comparison in 60 seconds with [ShowTheRate](/app/new).*`,
        cover_image: '/images/blog/adjusted-rates.png',
        tags: ['education', 'ARM', 'strategy', 'guide'],
        published: true,
        published_at: '2025-12-30T09:00:00.000Z',
    },
    // ========== LO Script 系列文章 ==========
    {
        title: 'How to Explain a 2-1 Buydown to Your Buyers (LO Script)',
        slug: 'explain-2-1-buydown-script',
        excerpt: 'Master the art of explaining 2-1 buydowns to your clients. Copy-paste scripts, common objection handlers, and visual aids to close more deals.',
        content: `# How to Explain a 2-1 Buydown to Your Buyers

As a Loan Officer, you know the power of a 2-1 buydown—but can you explain it in 30 seconds flat? Here's your complete script toolkit.

## The 30-Second Elevator Pitch

> "A 2-1 buydown is like getting a discount on your interest rate for the first two years. The rate is 2% lower in year one, 1% lower in year two, then goes to your normal rate. The best part? The seller or builder usually pays for it—so you get lower payments without paying extra."

## Step-by-Step Explanation Script

### Opening the Conversation

*"Let me show you something that could save you hundreds each month for the next two years..."*

### The Numbers Talk

Use a real example your client can relate to:

| Year | Rate | Monthly Payment | Monthly Savings |
|------|------|-----------------|-----------------|
| Year 1 | 5.0% | $2,147 | **$514** |
| Year 2 | 6.0% | $2,398 | **$263** |
| Year 3+ | 7.0% | $2,661 | $0 |

*"On a $400,000 loan, you'd save over $9,000 in the first two years. That's real money in your pocket."*

### Addressing the "What Happens After?" Question

> "Great question! After two years, your payment goes to the full rate. But here's the thing—if rates drop, you can refinance. If your income grows, the payment is more affordable. Either way, you've had two years of breathing room."

## Handling Common Objections

### "That sounds too good to be true."
*"I get it. But here's how it works: the seller puts money in escrow upfront to cover the difference. It's not magic—it's just smart use of seller concessions."*

### "Why would the seller pay for this?"
*"Because it helps them sell faster. Instead of dropping the price $10,000, they can offer a buydown that gives you $9,000 in savings AND helps you qualify more easily."*

### "What if I want to sell in 3 years?"
*"Even better! You've enjoyed lower payments for 2 of those 3 years. The buydown cost you nothing—it came from the seller."*

## Visual Aid: Draw This for Your Client

\`\`\`
Payment Timeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Year 1:  ████████░░░░░░░░  $2,147 (Save $514/mo)
Year 2:  ██████████████░░  $2,398 (Save $263/mo)  
Year 3+: ████████████████  $2,661 (Full payment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`

## Closing the Conversation

*"Here's what I recommend: let me run your numbers through our [2-1 Buydown Calculator](/calculator/2-1-buydown-calculator) so we can see exactly what this looks like for your situation. Then you can decide if it makes sense."*

---

## Ready to Create a Professional Buydown Comparison?

Use [ShowTheRate](/app/new) to generate a beautiful, client-ready 2-1 buydown comparison in 60 seconds.`,
        cover_image: '/images/blog/explain-buydown-script.png',
        tags: ['LO-script', 'buydown', 'sales', 'training'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: '2-1 Buydown Sales Script: Close More Deals in High-Rate Markets',
        slug: '2-1-buydown-lo-script',
        excerpt: 'Complete sales scripts for pitching 2-1 buydowns. Phone, in-person, and email templates designed for today\'s high-rate environment.',
        content: `# 2-1 Buydown Sales Script for Loan Officers

In a 7%+ rate environment, the 2-1 buydown is your secret weapon. Here's how to pitch it like a pro.

## When to Pitch a 2-1 Buydown

### Perfect Scenarios:
- ✅ Buyers hesitant about high rates
- ✅ Sellers offering concessions
- ✅ New construction with builder incentives
- ✅ Buyers expecting income growth
- ✅ Clients planning to refinance when rates drop

## Phone/Video Call Script

### The Opening Hook

*"Hey [Name], I've been running some numbers on your loan, and I found a way to cut your monthly payment by over $500 for the first year. Do you have 5 minutes so I can explain?"*

### The Core Pitch

*"Here's what I'm thinking. Instead of asking the seller for a price reduction, let's ask for a 2-1 buydown. That means:*

- *Year 1: You pay at 5% instead of 7%*
- *Year 2: You pay at 6%*
- *Year 3 and beyond: You pay the full 7%*

*The seller funds the difference upfront—about $9,000 on your loan. But you get over $9,000 in payment savings. It's basically free money."*

### The Close

*"Want me to put together a side-by-side comparison showing exactly what this looks like? I can have it to you in 10 minutes."*

## In-Person Meeting Script

### Setting the Stage

*"Before we finalize your loan structure, I want to show you an option that's really popular right now—especially with rates where they are."*

### The Whiteboard Moment

Draw a simple chart:

| Without Buydown | With 2-1 Buydown |
|-----------------|------------------|
| Year 1: $2,661/mo | Year 1: $2,147/mo |
| Year 2: $2,661/mo | Year 2: $2,398/mo |
| **No savings** | **Save $9,324** |

*"This is the power of a 2-1 buydown. Same loan, same home, but you pocket an extra $9,000+ over two years."*

## Email/Text Follow-Up Templates

### Quick Follow-Up Text

> "Hey [First Name]! Quick thought on your loan—what if we could drop your first year payment by $514/mo using seller concessions? Zero extra cost to you. Worth a quick call?"

### Formal Email

**Subject: Found a way to save you $9,000+ on your mortgage**

Hi [Name],

I ran some numbers on your purchase and found an opportunity I wanted to share.

By structuring the seller's concession as a 2-1 buydown (instead of just closing cost credits), you'd save:
- **Year 1:** $514/month
- **Year 2:** $263/month
- **Total 2-year savings:** $9,324

The best part? It costs you nothing extra—we just redirect the seller's concession strategically.

I put together a visual breakdown: [Link to ShowTheRate comparison]

Worth a quick call to discuss?

Best,
[Your Name]

## Math Breakdown to Share with Clients

For a **$400,000 loan at 7.0%**:

| Scenario | Year 1 Payment | Year 2 Payment | Total 2-Year Cost |
|----------|----------------|----------------|-------------------|
| No Buydown | $2,661 | $2,661 | $63,864 |
| 2-1 Buydown | $2,147 | $2,398 | $54,540 |
| **Savings** | **$514/mo** | **$263/mo** | **$9,324** |

**Buydown Cost:** ~$9,300 (paid by seller)
**Your Cost:** $0

## Closing Techniques

### The Alternative Close
*"Would you prefer to use the seller concession for closing costs, or would you rather have the lower payments for two years?"*

### The Urgency Close
*"Builders are offering buydowns right now because inventory is high. This won't last forever."*

### The Logic Close
*"If rates drop in the next two years, you refinance and win. If they don't, you've had two years of lower payments. It's a win-win."*

---

## Generate Your Comparison in 60 Seconds

Use our [Seller Concession Buydown Calculator](/calculator/seller-concession-buydown) to model the numbers, then create a client-ready presentation with [ShowTheRate](/app/new).`,
        cover_image: '/images/blog/buydown-sales-script.png',
        tags: ['LO-script', 'buydown', 'sales', 'high-rates'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'How to Explain Discount Points to Borrowers (LO Script)',
        slug: 'explain-discount-points-script',
        excerpt: 'Simple scripts to explain mortgage discount points to clients. Includes break-even visuals, decision frameworks, and objection handlers.',
        content: `# How to Explain Discount Points to Borrowers

Discount points can be confusing for clients. Here's how to explain them simply—and help clients decide if they're worth it.

## The Simple Explanation Script

> "Think of discount points like prepaying interest. You pay a little extra upfront to lock in a lower rate for the life of your loan. One point costs 1% of your loan and usually drops your rate by 0.25%."

## The "Should I Buy Points?" Conversation

### Opening Question
*"How long do you plan to stay in this home?"*

### Decision Tree Script

**If they say 2-3 years:**
*"In that case, I'd probably skip the points. You won't be in the loan long enough to recoup the upfront cost."*

**If they say 5+ years:**
*"Points could make a lot of sense for you. Let me show you the math..."*

**If they're unsure:**
*"Let's calculate the break-even point so you can make an informed decision."*

## The Break-Even Explanation

### Visual Aid

\`\`\`
BREAK-EVEN TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Month 1-61:  ████████████████░░░░░░░  Recovering cost
Month 62+:   ░░░░░░░░░░░░░░░░████████  Pure savings!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ↑ Break-Even Point (5.2 years)
\`\`\`

### The Math Script

*"Here's how it works. On your $400,000 loan:*

- *1 point costs $4,000*
- *It saves you $65/month*
- *$4,000 ÷ $65 = 62 months to break even*

*So if you keep this loan for more than 5 years, you come out ahead. Every month after that is pure savings."*

## Quick Reference: Points Decision Matrix

| Situation | Recommendation | Why |
|-----------|----------------|-----|
| Staying 7+ years | ✅ Buy points | Plenty of time to profit |
| Staying 3-5 years | ⚖️ Calculate carefully | Might break even |
| Staying <3 years | ❌ Skip points | Won't recoup cost |
| Cash-strapped | ❌ Skip points | Need funds elsewhere |
| Extra closing cash | ✅ Consider points | Good use of cash |

## Handling Common Objections

### "That's a lot of money upfront."
*"I hear you. Let's look at it this way: you're essentially buying a guaranteed return. Over 10 years, that $4,000 becomes $7,800 in savings. That's almost a 100% return, tax-free."*

### "What if I refinance?"
*"Great point. If rates drop significantly and you refinance in 3 years, you might not break even. But if rates stay flat or rise, you've locked in a great deal."*

### "My friend said never buy points."
*"That might have been the right advice for their situation. But everyone's timeline is different. Let's look at YOUR numbers."*

## Points vs. No Points Comparison

**$400,000 Loan, 30-Year Fixed**

| Option | Rate | Monthly Payment | Cost | 10-Year Total |
|--------|------|-----------------|------|---------------|
| No Points | 7.00% | $2,661 | $0 | $319,320 |
| 1 Point | 6.75% | $2,596 | $4,000 | $311,520 + $4,000 |
| **Difference** | | **-$65/mo** | **+$4,000** | **Save $3,800** |

## Closing the Points Conversation

*"Here's my recommendation: Let's run your specific numbers through our [Points Break-Even Calculator](/calculator/discount-points-break-even). Then you'll know exactly how long until you're in the green."*

---

## Create a Points Comparison for Your Client

Use [ShowTheRate](/app/new) to generate a professional side-by-side comparison showing points vs. no points scenarios.`,
        cover_image: '/images/blog/explain-points-script.png',
        tags: ['LO-script', 'points', 'sales', 'training'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'How to Explain Rate Lock vs Float to Borrowers',
        slug: 'explain-lock-vs-float-script',
        excerpt: 'Help clients understand the lock vs. float decision. Scripts for explaining market risk, float-down options, and when each strategy makes sense.',
        content: `# How to Explain Rate Lock vs Float to Borrowers

The lock vs. float decision can stress out clients. Here's how to explain it clearly and help them choose confidently.

## The Basic Explanation Script

> "Locking your rate means we guarantee today's rate until you close—even if rates go up tomorrow. Floating means we wait and hope rates drop before closing. It's basically a choice between certainty and possibility."

## The Lock vs. Float Conversation

### Opening the Discussion

*"We're at the point where we need to decide: do you want to lock in today's rate, or float and see if we can get better terms before closing?"*

### Explaining the Trade-Off

*"Here's the deal:*

**If you lock:**
- ✅ Your rate is guaranteed
- ✅ You know exactly what your payment will be
- ❌ If rates drop, you're stuck (usually)

**If you float:**
- ✅ You could get a lower rate if the market moves down
- ❌ If rates go up, your payment goes up too
- ❌ More uncertainty until closing"*

## When to Recommend Locking

### The "Lock Now" Script

*"Based on what I'm seeing in the market right now, I'd recommend locking. Here's why:*

1. *Rates have been volatile—they moved [X] basis points just this week*
2. *We have enough time in your lock period to close comfortably*
3. *A bird in the hand is worth two in the bush*

*The peace of mind alone is worth it. You can focus on the move instead of watching rate charts."*

### Lock When:
- ✅ Rates are historically favorable
- ✅ Client is risk-averse
- ✅ Closing is within 30-45 days
- ✅ Market is volatile

## When to Consider Floating

### The "Float" Script

*"In your situation, floating might make sense because:*

1. *[Economic indicator] suggests rates might dip*
2. *You have flexibility on your closing date*
3. *We can add a float-down option for protection*

*But I want to be clear: this is a gamble. If rates go up instead of down, your payment could increase by $[X]/month."*

### Float When:
- ✅ Strong indication rates will drop (Fed announcement, etc.)
- ✅ Client has flexible closing timeline
- ✅ Float-down option is available
- ✅ Client understands and accepts the risk

## Explaining Float-Down Options

### The Float-Down Script

*"There's a middle-ground option called a 'float-down.' Here's how it works:*

*You lock your rate today at 7%. But if rates drop below 6.75% before closing, you can 'float down' to the lower rate.*

*The catch? It costs about 0.25% of your loan amount upfront—that's $1,000 on a $400,000 loan.*

*So you're paying $1,000 for rate protection. Worth it if rates drop significantly; wasted if they stay flat or go up."*

### Float-Down Decision Matrix

| Scenario | Rate Drops 0.5% | Rates Flat | Rates Rise 0.5% |
|----------|-----------------|------------|-----------------|
| Locked (no float-down) | 😐 Stuck at higher rate | 😊 Safe | 😊 Protected |
| Floating | 😊 Win! | 😐 Same | 😱 Lose |
| Lock + Float-Down | 😊 Win! | 😐 Paid $1K for nothing | 😊 Protected |

## Handling Client Anxiety

### "I don't want to make the wrong decision."

*"I totally understand. Here's how I think about it: if you lock and rates drop, you might leave some money on the table—but you'll still have the home you want at a payment you can afford. If you float and rates rise, you could price yourself out entirely. One risk is regret; the other is losing the home."*

### "What would you do?"

*"Honestly? I'm risk-averse—I'd lock. The rate we have today is good, and markets are unpredictable. But everyone's comfort level is different. Let me show you the numbers both ways so you can decide."*

### "Can I change my mind after locking?"

*"Usually no—a lock is a commitment. That's why we want to make sure you're comfortable before we pull the trigger. Some lenders offer one-time float-down options, but not all. Let me check what's available for your loan."*

## Visual: Lock vs. Float Risk

\`\`\`
RATE MOVEMENT SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If you LOCK at 7.0%:
  Rates ↑ to 7.5%  →  You pay 7.0% ✅ Protected
  Rates → stay 7%  →  You pay 7.0% ✅ No change  
  Rates ↓ to 6.5%  →  You pay 7.0% 😐 Missed savings

If you FLOAT:
  Rates ↑ to 7.5%  →  You pay 7.5% 😱 Lost $$$
  Rates → stay 7%  →  You pay 7.0% ✅ No change
  Rates ↓ to 6.5%  →  You pay 6.5% 😊 Saved $$$
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`

## Closing the Conversation

*"Let's do this: I'll pull up our [Lock vs Float Calculator](/compare/lock-vs-float) and show you exactly what the numbers look like in both scenarios. Then you can make an informed decision. Sound good?"*

---

## Need a Professional Rate Comparison?

Generate a client-ready lock vs. float analysis with [ShowTheRate](/app/new). Show your clients exactly what's at stake in 60 seconds.`,
        cover_image: '/images/blog/explain-lock-float-script.png',
        tags: ['LO-script', 'rate-lock', 'sales', 'training'],
        published: true,
        published_at: new Date().toISOString(),
    },
    // ========== P1 SEO 博客文章 ==========
    {
        title: 'How Many Discount Points Can You Buy on a Mortgage?',
        slug: 'how-many-discount-points-can-you-buy',
        excerpt: 'Learn the limits on buying mortgage discount points. Understand how many points you can purchase, when it makes sense, and the diminishing returns.',
        content: `# How Many Discount Points Can You Buy?

The short answer: **Most lenders allow 3-4 discount points maximum**, though some may allow more. But should you buy that many? Let's break it down.

## Typical Limits by Lender

| Lender Type | Typical Maximum Points |
|-------------|----------------------|
| Conventional | 3-4 points |
| FHA | 2-3 points |
| VA | 2 points (seller limits) |
| Jumbo | 4+ points |

## The Law of Diminishing Returns

Here's the key insight most borrowers miss: **the more points you buy, the less value each additional point provides**.

| Points | Rate Reduction | Break-Even |
|--------|----------------|------------|
| 1 point | 0.25% | ~5 years |
| 2 points | 0.50% | ~5.5 years |
| 3 points | 0.75% | ~6 years |
| 4 points | 1.00% | ~6.5 years |

## When Buying Multiple Points Makes Sense

✅ **Buy more points if:**
- You're certain you'll keep the loan 10+ years
- You have excess cash at closing
- You're in the highest tax bracket (potential deduction)
- Rates are historically high and won't drop soon

❌ **Buy fewer (or no) points if:**
- You might refinance in 3-5 years
- You need that cash for other purposes
- Rates are expected to drop significantly

## Calculate Your Optimal Points

Use our [Discount Points Break-Even Calculator](/calculator/discount-points-break-even) to find the sweet spot for your situation.

## LO Script: Explaining Points Limits to Clients

> "Most lenders cap points at 3-4, but honestly, buying more than 2 points rarely makes sense. Here's why: each additional point takes longer to pay off. Let me show you the math for your specific loan..."

---

*Need to create a points comparison for your client? Use [ShowTheRate](/app/new) to build a professional analysis in 60 seconds.*`,
        cover_image: '/images/blog/discount-points.png',
        tags: ['points', 'mortgage', 'education', 'guide'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'What is a 2-1 Buydown? Complete Definition & Meaning',
        slug: '2-1-buydown-meaning',
        excerpt: 'Understand exactly what a 2-1 buydown means. Clear definition, how it works, who pays, and when it makes sense for homebuyers.',
        content: `# What is a 2-1 Buydown? Definition & Meaning

A **2-1 buydown** is a temporary mortgage financing arrangement where your interest rate is reduced for the first two years of the loan.

## The Simple Definition

> **2-1 Buydown:** Your rate is 2% below the note rate in Year 1, 1% below in Year 2, then returns to the full rate from Year 3 onward.

## How a 2-1 Buydown Works

Let's use a real example:

**Loan Details:** $400,000 at 7% for 30 years

| Year | Interest Rate | Monthly Payment | Monthly Savings |
|------|---------------|-----------------|-----------------|
| Year 1 | 5.0% | $2,147 | $514 |
| Year 2 | 6.0% | $2,398 | $263 |
| Year 3+ | 7.0% | $2,661 | $0 |

**Total 2-Year Savings:** $9,324

## Who Pays for a 2-1 Buydown?

The buydown cost (~$9,000-12,000) is typically paid by:

1. **Sellers** - As a concession to attract buyers
2. **Builders** - To move new construction inventory
3. **Lenders** - As a promotional incentive
4. **Buyers** - Rarely, but possible

The funds go into an escrow account and subsidize your payments each month.

## Why It's Called "2-1"

The name refers to the rate reduction pattern:
- **2** = 2% rate reduction in Year 1
- **1** = 1% rate reduction in Year 2

Other variations include:
- **3-2-1 Buydown:** 3% off → 2% off → 1% off → full rate
- **1-0 Buydown:** 1% off → full rate

## Calculate Your 2-1 Buydown

Ready to see your numbers? Use our [2-1 Buydown Calculator](/calculator/2-1-buydown-calculator) to calculate exact payments and costs.

---

*Need to show a client how a 2-1 buydown works? Create a visual comparison with [ShowTheRate](/app/new).*`,
        cover_image: '/images/blog/buydown-guide.png',
        tags: ['buydown', 'education', 'definition', 'guide'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: '2-1 Buydown Pros and Cons: Is It Right for You?',
        slug: '2-1-buydown-pros-cons',
        excerpt: 'Comprehensive list of 2-1 buydown advantages and disadvantages. Make an informed decision with this complete pros and cons analysis.',
        content: `# 2-1 Buydown Pros and Cons

Thinking about a 2-1 buydown? Here's an honest look at the advantages and disadvantages.

## ✅ Pros of a 2-1 Buydown

### 1. Lower Initial Payments
Your payments are significantly reduced for the first two years:
- **Year 1:** ~$500/month savings
- **Year 2:** ~$250/month savings

### 2. Easier Qualification
Some lenders qualify you at the Year 1 rate, making it easier to afford more home.

### 3. Cash Flow Flexibility
Extra monthly cash in years 1-2 can go toward:
- Building emergency fund
- Home improvements
- Paying down other debt

### 4. Usually Seller/Builder Paid
In most cases, **you don't pay for it** - the seller or builder does as a concession.

### 5. Refinance Opportunity
If rates drop significantly in 2-3 years, you can refinance and never pay the full rate.

### 6. Income Growth Alignment
Perfect if you expect raises or promotions that will cover the higher payment later.

---

## ❌ Cons of a 2-1 Buydown

### 1. Payment Shock in Year 3
Your payment jumps significantly when the buydown ends. Example:
- Year 2: $2,398/month
- Year 3: $2,661/month (+$263 increase)

### 2. Doesn't Reduce Total Interest
Unlike discount points, a buydown **doesn't lower your long-term costs** - you still pay the full rate eventually.

### 3. Opportunity Cost
That $9,000+ buydown cost could have been:
- A price reduction
- Closing cost credits
- Rate buy-down with points

### 4. Refinance Risk
If rates don't drop (or rise), you're stuck paying the full rate without an easy exit.

### 5. Qualification Confusion
Some lenders qualify at Year 3 rate anyway, eliminating one key benefit.

---

## Quick Decision Matrix

| Situation | Recommendation |
|-----------|----------------|
| Seller offering concessions | ✅ Consider buydown |
| Expecting income growth | ✅ Good fit |
| Planning to refinance in 2-3 years | ✅ Good fit |
| Need lowest possible long-term rate | ❌ Choose points instead |
| Unsure you can afford Year 3 payment | ❌ Risky |
| Paying for it yourself | ⚠️ Calculate ROI carefully |

## Calculate Your Specific Situation

Use our [2-1 Buydown Calculator](/calculator/2-1-buydown-calculator) to see exact numbers for your loan.

Or compare options with [Is a 2-1 Buydown Worth It?](/compare/is-2-1-buydown-worth-it)

---

*Ready to show a client the pros and cons visually? Create a comparison with [ShowTheRate](/app/new) in 60 seconds.*`,
        cover_image: '/images/blog/buydown-guide.png',
        tags: ['buydown', 'pros-cons', 'decision', 'guide'],
        published: true,
        published_at: new Date().toISOString(),
    },
];

async function seedBlogPosts() {
    console.log('Starting to seed blog posts...\n');

    for (const post of blogPosts) {
        console.log(`Creating post: "${post.title}"...`);

        // Check if post already exists
        const { data: existing } = await supabase
            .from('posts')
            .select('id')
            .eq('slug', post.slug)
            .single();

        if (existing) {
            console.log(`  Already exists, skipping.\n`);
            continue;
        }

        const { data, error } = await supabase
            .from('posts')
            .insert(post)
            .select()
            .single();

        if (error) {
            console.error(`  Error:`, error.message);
        } else {
            console.log(`  Created successfully!\n`);
        }
    }

    console.log('Done seeding blog posts!');
}

seedBlogPosts().catch(console.error);
