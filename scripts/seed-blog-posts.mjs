/**
 * Blog Posts Seed Script
 * Creates 8 SEO-optimized tutorial articles for mortgage calculators
 * 
 * Run with: node scripts/seed-blog-posts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
        cover_image: '/images/blog/buydown-guide.jpg',
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

**Break-Even Months = Points Cost ÷ Monthly Savings**

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

## Points vs Other Options

Compare points to alternatives like:
- [Temporary buydowns](/calculator/2-1-buydown-calculator)
- [Lender credits](/compare/points-vs-lender-credits)

## Calculate Your Break-Even

Use our [Points Break-Even Calculator](/calculator/discount-points-break-even) to see exactly how long until your points pay off.`,
        cover_image: '/images/blog/discount-points.jpg',
        tags: ['points', 'mortgage', 'savings', 'analysis'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Rate Lock vs Float: Making the Right Decision',
        slug: 'rate-lock-vs-float-decision',
        excerpt: 'Should you lock your mortgage rate now or wait? Understand the risks and rewards of each strategy to make an informed decision.',
        content: `# Rate Lock vs Float: Making the Right Decision

One of the most critical decisions during your mortgage process is whether to lock your rate or float. Here's how to decide.

## What is a Rate Lock?

A rate lock guarantees your interest rate for a specific period (typically 30-60 days). If rates go up, you're protected. If rates drop, you're usually stuck.

## What is Floating?

Floating means you don't lock your rate, betting that rates will drop before closing. This strategy carries risk—if rates rise, you'll pay more.

## Factors to Consider

### Lock Your Rate When:
- You're comfortable with the current rate
- Market volatility is high
- You can close within the lock period
- You can't afford payment increases

### Consider Floating When:
- Economic indicators suggest rates will drop
- You have flexibility on closing timing
- You can absorb potential rate increases
- You have a float-down option

## Float-Down Options

Some lenders offer float-down provisions that let you reduce your locked rate if market rates drop. Use our [Float Down Calculator](/calculator/float-down-worth-it) to see if it's worth the cost.

## Lock Period Costs

Longer lock periods cost more. Compare options with our [Rate Lock Fee Calculator](/calculator/rate-lock-fee-calculator).`,
        cover_image: '/images/blog/rate-lock.jpg',
        tags: ['rate-lock', 'strategy', 'mortgage', 'decision'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Complete Guide to Closing Costs: What to Expect',
        slug: 'closing-costs-complete-guide',
        excerpt: 'Everything you need to know about mortgage closing costs. Understand each fee, who pays what, and how to reduce your costs.',
        content: `# Complete Guide to Closing Costs

Closing costs typically range from 2% to 5% of your loan amount. Here's a breakdown of what you'll pay and how to prepare.

## Types of Closing Costs

### Lender Fees (Section A)
- **Origination Fee:** 0.5% - 1% of loan amount
- **Underwriting Fee:** $500 - $1,000
- **Processing Fee:** $300 - $500
- **Credit Report:** $50 - $100

### Third-Party Fees (Section B)
- **Appraisal:** $400 - $700
- **Title Insurance:** 0.5% - 1% of loan amount
- **Title Search:** $200 - $400
- **Escrow/Settlement Fee:** $500 - $1,500

### Prepaid Items (Section C)
- **Homeowners Insurance:** 1 year upfront
- **Property Tax Escrow:** 2-6 months
- **Prepaid Interest:** ~15 days

## How to Reduce Closing Costs

1. **Negotiate with sellers** for concessions
2. **Shop for title insurance** - it's negotiable
3. **Ask for lender credits** (higher rate)
4. **Compare loan estimates** from multiple lenders

## Estimate Your Costs

Use our [Closing Costs Worksheet](/calculator/closing-costs-worksheet) to get a detailed estimate for your purchase.`,
        cover_image: '/images/blog/closing-costs.jpg',
        tags: ['closing-costs', 'fees', 'guide', 'preparation'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'How Much Cash Do You Need to Close? Complete Breakdown',
        slug: 'cash-to-close-breakdown',
        excerpt: 'Calculate exactly how much money you need to bring to closing. Includes down payment, closing costs, credits, and reserves.',
        content: `# How Much Cash Do You Need to Close?

Your "cash to close" is the total amount you need to bring to the closing table. Here's how to calculate it.

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

### Closing Costs
Typically 2% - 5% of loan amount. Use our [Closing Costs Worksheet](/calculator/closing-costs-worksheet) for details.

### Credits That Reduce Cash Needed
- **Seller Concessions:** Negotiated credits from seller
- **Lender Credits:** Trade higher rate for closing help
- **Earnest Money:** Already deposited, applied at closing

## Example Calculation

For a $500,000 home with 20% down:
- Down Payment: $100,000
- Closing Costs (~3%): $12,000
- Less Seller Credit: -$5,000
- Less Earnest Money: -$10,000
- **Cash to Close: $97,000**

## Calculate Yours

Use our [Cash to Close Calculator](/calculator/cash-to-close-calculator) for a personalized estimate.`,
        cover_image: '/images/blog/cash-to-close.jpg',
        tags: ['cash-to-close', 'down-payment', 'preparation', 'first-time-buyer'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: '3-2-1 Buydown vs 2-1 Buydown: Which is Better?',
        slug: '3-2-1-vs-2-1-buydown-comparison',
        excerpt: 'Compare the two most popular temporary buydown options. Learn the cost differences and when each makes sense for your situation.',
        content: `# 3-2-1 Buydown vs 2-1 Buydown

Both buydown types reduce your initial mortgage payments, but they work differently. Here's how to choose.

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
- You want lower upfront cost

### Choose 3-2-1 Buydown When:
- Maximum first-year savings is priority
- You have more concession dollars available
- You expect significant rate drops by year 3

## Calculate Both Options

- [2-1 Buydown Calculator](/calculator/2-1-buydown-calculator)
- [3-2-1 Buydown Calculator](/calculator/3-2-1-buydown-calculator)
- [Compare Buydown vs Points](/compare/temporary-buydown-vs-points)`,
        cover_image: '/images/blog/buydown-comparison.jpg',
        tags: ['buydown', 'comparison', '3-2-1', '2-1'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'Seller Concessions Explained: How to Use Them Wisely',
        slug: 'seller-concessions-explained',
        excerpt: 'Learn how to maximize seller concessions for buydowns, closing costs, or rate reductions. Strategic tips for buyers and agents.',
        content: `# Seller Concessions Explained

Seller concessions are credits the seller provides to help cover your closing costs or other expenses. Here's how to use them strategically.

## What Are Seller Concessions?

Seller concessions are funds the seller agrees to pay on your behalf, typically negotiated as part of the purchase contract.

## Maximum Allowed Concessions

| Loan Type | Max Concession |
|-----------|---------------|
| Conventional (< 10% down) | 3% |
| Conventional (10-25% down) | 6% |
| Conventional (> 25% down) | 9% |
| FHA | 6% |
| VA | 4% |
| USDA | 6% |

## Ways to Use Concessions

### 1. Pay Closing Costs
Reduce your out-of-pocket expenses at closing.

### 2. Fund a Temporary Buydown
Use concessions to pay for a [2-1 buydown](/calculator/2-1-buydown-calculator) and lower your first two years of payments.

### 3. Buy Down the Rate Permanently
Pay for discount points to reduce your rate for the life of the loan.

## Which Is Best?

Use our [Seller Concession Buydown Calculator](/calculator/seller-concession-buydown) to compare options and see what makes the most sense for your situation.

## Negotiation Tips

1. Request concessions in a buyer's market
2. Be specific about how you'll use the funds
3. Consider offering a higher purchase price to offset concessions
4. Work with an experienced agent`,
        cover_image: '/images/blog/seller-concession.jpg',
        tags: ['seller-concession', 'negotiation', 'strategy', 'closing-costs'],
        published: true,
        published_at: new Date().toISOString(),
    },
    {
        title: 'How to Read Your Loan Estimate: Line by Line Guide',
        slug: 'how-to-read-loan-estimate',
        excerpt: 'Demystify your loan estimate with this comprehensive guide. Understand every section, compare offers, and spot potential issues.',
        content: `# How to Read Your Loan Estimate

The Loan Estimate (LE) is a standardized 3-page document that helps you understand and compare mortgage offers. Here's how to read each section.

## Page 1: Loan Terms & Costs

### Loan Terms Box
- **Loan Amount:** How much you're borrowing
- **Interest Rate:** Your locked or estimated rate
- **Monthly Principal & Interest:** Base payment (no taxes/insurance)
- **Prepayment Penalty:** Usually "No" — check this!
- **Balloon Payment:** Should be "No" for most loans

### Projected Payments
Shows how your payment may change over time, especially for ARMs.

### Costs at Closing
- **Closing Costs:** Total fees (detailed on Page 2)
- **Cash to Close:** What you need to bring

## Page 2: Closing Cost Breakdown

### Section A: Origination Charges
Lender fees including points. These are negotiable!

### Section B: Services You Cannot Shop For
Required services chosen by lender (appraisal, credit report).

### Section C: Services You Can Shop For
Title, survey, pest inspection — you can find your own providers.

### Sections D-I: Prepaids & Escrows
Property taxes, insurance, prepaid interest.

## Page 3: Comparisons

### APR
True cost of borrowing including fees.

### Total Interest Percentage (TIP)
Total interest you'll pay over the loan term.

## Compare Offers

Use our calculators to verify:
- [Closing Costs Worksheet](/calculator/closing-costs-worksheet)
- [Cash to Close Calculator](/calculator/cash-to-close-calculator)
- [Points Break-Even](/calculator/discount-points-break-even)`,
        cover_image: '/images/blog/loan-estimate.jpg',
        tags: ['loan-estimate', 'education', 'guide', 'first-time-buyer'],
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
            console.log(`  ⚠️  Post already exists, skipping.\n`);
            continue;
        }

        const { data, error } = await supabase
            .from('posts')
            .insert(post)
            .select()
            .single();

        if (error) {
            console.error(`  ❌ Error creating post:`, error.message);
        } else {
            console.log(`  ✅ Created successfully!\n`);
        }
    }

    console.log('Done seeding blog posts!');
}

seedBlogPosts().catch(console.error);
