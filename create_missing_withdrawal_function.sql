-- Create missing process_withdrawal_request_with_message function
-- Run this in your Supabase SQL Editor

DROP FUNCTION IF EXISTS process_withdrawal_request_with_message(UUID, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION process_withdrawal_request_with_message(
  request_id UUID,
  admin_user_id UUID,
  action TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  withdrawal_id UUID
) AS $$
DECLARE
  withdrawal_record RECORD;
  updated_amount DECIMAL(10,2);
BEGIN
  -- Get the withdrawal request
  SELECT * INTO withdrawal_record
  FROM referral_payouts
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Withdrawal request not found', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if already processed
  IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
    RETURN QUERY SELECT false, 'Withdrawal request already processed', request_id;
    RETURN;
  END IF;
  
  -- Process based on action
  IF action = 'approved' THEN
    -- Update withdrawal status
    UPDATE referral_payouts
    SET 
      status = 'approved',
      admin_notes = COALESCE(admin_notes, 'Approved by admin'),
      approved_at = NOW(),
      approved_by = admin_user_id,
      updated_at = NOW()
    WHERE id = request_id;
    
    -- Update referrer's earnings (deduct from pending)
    UPDATE referral_codes
    SET 
      total_earnings = GREATEST(0, total_earnings - withdrawal_record.amount),
      updated_at = NOW()
    WHERE user_id = withdrawal_record.user_id;
    
    RETURN QUERY SELECT true, 'Withdrawal approved successfully', request_id;
    
  ELSIF action = 'rejected' THEN
    -- Update withdrawal status
    UPDATE referral_payouts
    SET 
      status = 'rejected',
      admin_notes = COALESCE(admin_notes, 'Rejected by admin'),
      rejected_at = NOW(),
      rejected_by = admin_user_id,
      updated_at = NOW()
    WHERE id = request_id;
    
    RETURN QUERY SELECT true, 'Withdrawal rejected successfully', request_id;
    
  ELSE
    RETURN QUERY SELECT false, 'Invalid action. Use "approved" or "rejected"', NULL::UUID;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_withdrawal_request_with_message(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Test the function
SELECT * FROM process_withdrawal_request_with_message(
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'approved',
  'Test approval'
);
