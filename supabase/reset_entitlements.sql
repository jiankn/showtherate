-- Reset quotas from Unlimited (-1) to Standard Limits
-- Use this script if you want to revert users back to a limited plan

-- 1. Reset Unlimited Subscriptions to specific limits (e.g., 5 shares)
UPDATE public.entitlements
SET 
    share_quota = 5,        -- Limit to 5 shares
    property_quota = 10,    -- Limit to 10 property fetches
    ai_quota = 5,           -- Limit to 5 AI credits
    type = 'starter_pass_7d' -- Reset type label if desired (optional)
WHERE share_quota = -1;     -- Target only the unlimited ones

-- OPTIONAL: If you want to delete these manual entitlements entirely 
-- and rely on your payment webhook to create fresh ones:
-- DELETE FROM public.entitlements WHERE share_quota = -1;
