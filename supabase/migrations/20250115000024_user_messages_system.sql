-- User Messages System for Withdrawal Status Updates

-- 1. Create user_messages table
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'withdrawal_approved', 'withdrawal_rejected', 'withdrawal_processed', 'general'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID, -- Can reference withdrawal_request_id or other related entities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);

-- 3. Create function to send withdrawal status message
CREATE OR REPLACE FUNCTION send_withdrawal_status_message(
  p_user_id UUID,
  p_withdrawal_id UUID,
  p_status VARCHAR(20), -- 'approved', 'rejected', 'processed'
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
  v_amount DECIMAL(10,2);
  v_payment_method VARCHAR(50);
BEGIN
  -- Get withdrawal details
  SELECT amount, payment_method INTO v_amount, v_payment_method
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create appropriate message based on status
  CASE p_status
    WHEN 'approved' THEN
      v_title := 'Withdrawal Request Approved';
      v_message := CONCAT(
        'Great news! Your withdrawal request of ₹', v_amount, 
        ' via ', v_payment_method, ' has been approved and is being processed. ',
        'You should receive the amount within 2-3 business days.'
      );
    WHEN 'rejected' THEN
      v_title := 'Withdrawal Request Rejected';
      v_message := CONCAT(
        'Your withdrawal request of ₹', v_amount, 
        ' via ', v_payment_method, ' has been rejected. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Please contact support for more information.';
      END IF;
    WHEN 'processed' THEN
      v_title := 'Withdrawal Processed';
      v_message := CONCAT(
        'Your withdrawal of ₹', v_amount, 
        ' via ', v_payment_method, ' has been successfully processed and sent to your account.'
      );
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message
  INSERT INTO user_messages (user_id, message_type, title, message, related_id)
  VALUES (p_user_id, 'withdrawal_' || p_status, v_title, v_message, p_withdrawal_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create function to get user messages
CREATE OR REPLACE FUNCTION get_user_messages(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  message_type VARCHAR(50),
  title VARCHAR(200),
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id,
    um.message_type,
    um.title,
    um.message,
    um.is_read,
    um.created_at
  FROM user_messages um
  WHERE um.user_id = user_uuid
  ORDER BY um.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_messages
  SET is_read = true, updated_at = NOW()
  WHERE id = message_id AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_messages
    WHERE user_id = user_uuid AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Update withdrawal processing function to send messages
CREATE OR REPLACE FUNCTION process_withdrawal_request_with_message(
  request_id UUID,
  admin_user_id UUID,
  action VARCHAR(20), -- 'approved' or 'rejected'
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_success BOOLEAN;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Get user_id from withdrawal request
  SELECT user_id INTO v_user_id
  FROM withdrawal_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the withdrawal request
  UPDATE withdrawal_requests
  SET 
    status = action,
    admin_notes = admin_notes,
    processed_by = admin_user_id,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Send status message to user
  v_success := send_withdrawal_status_message(v_user_id, request_id, action, admin_notes);
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Enable RLS
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
CREATE POLICY "Users can view own messages" ON user_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own messages" ON user_messages
  FOR UPDATE USING (user_id = auth.uid());

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION send_withdrawal_status_message(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request_with_message(UUID, UUID, VARCHAR(20), TEXT) TO authenticated;
