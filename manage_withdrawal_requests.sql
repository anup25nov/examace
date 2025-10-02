-- Function to get user's withdrawal requests
CREATE OR REPLACE FUNCTION get_user_withdrawal_requests(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    amount numeric,
    payment_method character varying,
    payment_details jsonb,
    status character varying,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wr.id,
        wr.amount,
        wr.payment_method,
        wr.payment_details,
        wr.status,
        wr.created_at
    FROM withdrawal_requests wr
    WHERE wr.user_id = p_user_id
    ORDER BY wr.created_at DESC;
END;
$$;

-- Function to cancel a withdrawal request (admin only)
CREATE OR REPLACE FUNCTION cancel_withdrawal_request(
    p_withdrawal_id uuid,
    p_admin_notes text DEFAULT 'Cancelled by user request'
)
RETURNS TABLE(
    success boolean,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the withdrawal request status
    UPDATE withdrawal_requests 
    SET 
        status = 'cancelled',
        admin_notes = p_admin_notes,
        updated_at = NOW()
    WHERE id = p_withdrawal_id;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Withdrawal request cancelled successfully';
    ELSE
        RETURN QUERY SELECT false, 'Withdrawal request not found';
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_withdrawal_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_withdrawal_request(uuid, text) TO authenticated;

-- Check current withdrawal requests for the specific user
SELECT 
    'Current withdrawal requests for user aea4b9df-d1d6-4701-b33c-480a5d17ec87:' as info,
    id,
    amount,
    payment_method,
    status,
    created_at
FROM withdrawal_requests 
WHERE user_id = 'aea4b9df-d1d6-4701-b33c-480a5d17ec87'
ORDER BY created_at DESC;
