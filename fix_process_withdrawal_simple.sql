    -- Create a simpler process_withdrawal_request function
    CREATE OR REPLACE FUNCTION process_withdrawal_request(
        request_id uuid, 
        admin_user_id uuid, 
        action text, 
        admin_notes text DEFAULT NULL
    )
    RETURNS boolean
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
            RETURN false;
        END IF;
        
        -- Check if already processed
        IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
            RETURN false;
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
            
            RETURN true;
            
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
            
            RETURN true;
            
        ELSE
            RETURN false;
        END IF;
        
    END;
    $$;

    -- Grant permissions
    GRANT EXECUTE ON FUNCTION process_withdrawal_request(uuid, uuid, text, text) TO authenticated;
    GRANT EXECUTE ON FUNCTION process_withdrawal_request(uuid, uuid, text, text) TO anon;
