-- Fix process_withdrawal_request_with_message function to use withdrawal_requests table
CREATE OR REPLACE FUNCTION process_withdrawal_request_with_message(
    request_id uuid, 
    admin_user_id uuid, 
    action text, 
    admin_notes text DEFAULT NULL
)
RETURNS TABLE(
    success boolean, 
    message text, 
    withdrawal_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    withdrawal_record RECORD;
    v_admin_notes TEXT := admin_notes;
BEGIN
    -- Get the withdrawal request from withdrawal_requests table
    SELECT * INTO withdrawal_record
    FROM withdrawal_requests
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Withdrawal request not found', NULL::uuid;
        RETURN;
    END IF;
    
    -- Check if already processed
    IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
        RETURN QUERY SELECT false, 'Withdrawal request already processed', NULL::uuid;
        RETURN;
    END IF;
    
    -- Process based on action
    IF action = 'approved' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'approved',
            admin_notes = COALESCE(v_admin_notes, 'Approved by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        -- Note: We don't need to update earnings here since they're already deducted
        -- when the withdrawal request was created
        
        RETURN QUERY SELECT true, 'Withdrawal request approved successfully', request_id;
        RETURN;
        
    ELSIF action = 'rejected' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'rejected',
            admin_notes = COALESCE(v_admin_notes, 'Rejected by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        -- Note: We don't need to restore earnings here since they were never deducted
        -- The withdrawal request just blocks new requests
        
        RETURN QUERY SELECT true, 'Withdrawal request rejected successfully', request_id;
        RETURN;
        
    ELSE
        RETURN QUERY SELECT false, 'Invalid action. Use "approved" or "rejected"', NULL::uuid;
        RETURN;
    END IF;
    
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_withdrawal_request_with_message(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request_with_message(uuid, uuid, text, text) TO anon;

-- Test the function with the existing withdrawal request
-- SELECT * FROM process_withdrawal_request_with_message(
--     'd59c8844-b0c1-43ba-baa3-cbfb44adc489'::uuid,
--     'aea4b9df-d1d6-4701-b33c-480a5d17ec87'::uuid,
--     'approved',
--     'Test approval'
-- );
