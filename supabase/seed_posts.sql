-- Seed data for Blog Posts
INSERT INTO posts (title, slug, excerpt, content, published, published_at, tags)
VALUES 
(
    'Market Update: Mortgage Rates in 2026', 
    'market-update-mortgage-rates-2026', 
    'An in-depth look at the current state of mortgage rates and what to expect in the coming months.', 
    '# Market Update: Mortgage Rates in 2026

As we step into 2026, the housing market continues to evolve. Mortgage rates have seen some adjustments...

## Key Takeaways
- Rates are stabilizing.
- Inventory is slightly up.
- It might be a good time to refinance.

## Detailed Analysis
(Content goes here...)
', 
    TRUE, 
    NOW(), 
    ARRAY['Market Update', 'Mortgage Rates', '2026']
),
(
    'Understanding Adjusted Rates', 
    'understanding-adjusted-rates', 
    'How do adjusted rates work and are they right for you? We break it down.', 
    '# Understanding Adjusted Rates

Adjustable-rate mortgages (ARMs) can be complex. In this guide, we explain how they work...

## What is an ARM?
An adjustable-rate mortgage is...

## Pros and Cons
...
', 
    TRUE, 
    NOW() - INTERVAL '2 days', 
    ARRAY['Education', 'ARM']
);
