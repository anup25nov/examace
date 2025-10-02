-- Check existing withdrawal requests for debugging
SELECT 
    id,
    user_id,
    amount,
    payment_method,
    status,
    created_at
FROM withdrawal_requests 
WHERE user_id = 'd791ba76-4059-4460-bda6-3020bf786100'
ORDER BY created_at DESC;

-- Check if there are any pending requests
SELECT 
    COUNT(*) as pending_count,
    SUM(amount) as total_pending_amount
FROM withdrawal_requests 
WHERE user_id = 'd791ba76-4059-4460-bda6-3020bf786100'
AND status IN ('pending', 'approved');
