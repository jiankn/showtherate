-- Give all users a 'subscription' entitlement with unlimited quotas
-- This is useful for development/testing environments

INSERT INTO public.entitlements (
    user_id,
    type,
    starts_at,
    ends_at,
    share_quota,
    share_used,
    property_quota,
    property_used,
    ai_quota,
    ai_used
)
SELECT 
    id as user_id,
    'subscription' as type,
    NOW() as starts_at,
    NOW() + INTERVAL '1 year' as ends_at,
    -1 as share_quota, -- Unlimited
    0 as share_used,
    -1 as property_quota, -- Unlimited
    0 as property_used,
    -1 as ai_quota, -- Unlimited
    0 as ai_used
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.entitlements 
    WHERE user_id = auth.users.id 
    AND ends_at > NOW()
);

-- Update existing entitlements to be unlimited if they exist but are limited
UPDATE public.entitlements
SET 
    share_quota = -1,
    property_quota = -1,
    ai_quota = -1,
    ends_at = NOW() + INTERVAL '1 year'
WHERE type = 'subscription';
