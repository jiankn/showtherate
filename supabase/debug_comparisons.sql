-- Check actual comparisons in DB
SELECT count(*) as total_count FROM public.comparisons;

-- Check comparisons for a specific user (if we knew the ID, but we can list all owners)
SELECT user_id, count(*) FROM public.comparisons GROUP BY user_id;

-- Check if there are any deleted records? (There is no deleted_at column currently)
-- Check structure
SELECT * FROM public.comparisons LIMIT 10;
