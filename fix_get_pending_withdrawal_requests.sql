-- Fix get_pending_withdrawal_requests function to check the correct table
CREATE OR REPLACE FUNCTION get_pending_withdrawal_requests()
RETURNS TABLE(
    id uuid, 
    user_id uuid, 
    amount numeric, 
    status character varying, 
    payment_details jsonb, 
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if withdrawal_requests table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') THEN
    RETURN QUERY
    SELECT 
      wr.id,
      wr.user_id,
      wr.amount,
      wr.status,
      wr.payment_details,
      wr.created_at
    FROM withdrawal_requests wr
    WHERE wr.status = 'pending'
    ORDER BY wr.created_at DESC;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pending_withdrawal_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_withdrawal_requests() TO anon;

-- Test the function
SELECT * FROM get_pending_withdrawal_requests();
