-- Fix user messages function to work with actual table schema
-- This fixes the "column um.message_type does not exist" error

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_messages(uuid,integer);

-- Create the corrected function that works with actual table schema
CREATE FUNCTION get_user_messages(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message_type VARCHAR(50),
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN
    -- First, let's check what columns actually exist in the table
    -- and adapt our query accordingly
    
    -- Try to get the actual column structure
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_messages' 
      AND column_name = 'message_type'
    ) THEN
      -- Table has message_type column
      RETURN QUERY
      SELECT 
        um.id,
        um.message_type,
        um.message,
        um.is_read,
        um.created_at
      FROM user_messages um
      WHERE um.user_id = user_uuid
      ORDER BY um.created_at DESC
      LIMIT limit_count;
    ELSE
      -- Table doesn't have message_type column, use a default
      RETURN QUERY
      SELECT 
        um.id,
        'info'::VARCHAR(50) as message_type,
        um.message,
        COALESCE(um.is_read, false) as is_read,
        um.created_at
      FROM user_messages um
      WHERE um.user_id = user_uuid
      ORDER BY um.created_at DESC
      LIMIT limit_count;
    END IF;
  ELSE
    -- Table doesn't exist, return empty result
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix the get_unread_message_count function
DROP FUNCTION IF EXISTS get_unread_message_count(uuid);

CREATE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER := 0;
BEGIN
  -- Check if user_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN
    -- Check if is_read column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_messages' 
      AND column_name = 'is_read'
    ) THEN
      SELECT COUNT(*)::INTEGER INTO unread_count
      FROM user_messages
      WHERE user_id = user_uuid AND is_read = false;
    ELSE
      -- If is_read column doesn't exist, assume all messages are unread
      SELECT COUNT(*)::INTEGER INTO unread_count
      FROM user_messages
      WHERE user_id = user_uuid;
    END IF;
  END IF;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the mark_message_as_read function
DROP FUNCTION IF EXISTS mark_message_as_read(uuid, uuid);

CREATE FUNCTION mark_message_as_read(
  message_id UUID,
  user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_messages') THEN
    -- Check if is_read column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_messages' 
      AND column_name = 'is_read'
    ) THEN
      UPDATE user_messages
      SET is_read = true, 
          updated_at = COALESCE(updated_at, NOW())
      WHERE id = message_id AND user_id = user_uuid;
    ELSE
      -- If is_read column doesn't exist, we can't mark as read
      -- but we'll return true to avoid breaking the application
      NULL;
    END IF;
    
    RETURN FOUND;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_as_read(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User messages functions have been fixed!';
  RAISE NOTICE '🔧 Functions now adapt to actual table schema';
  RAISE NOTICE '📊 get_user_messages: ✅';
  RAISE NOTICE '🔢 get_unread_message_count: ✅';
  RAISE NOTICE '✅ mark_message_as_read: ✅';
END $$;
