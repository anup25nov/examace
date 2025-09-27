-- Create referral_notifications table for managing referral notifications
CREATE TABLE IF NOT EXISTS public.referral_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('referral_signup', 'referral_purchase', 'commission_earned', 'referral_milestone')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_referral_notifications_user_id ON public.referral_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_notifications_type ON public.referral_notifications(type);
CREATE INDEX IF NOT EXISTS idx_referral_notifications_is_read ON public.referral_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_referral_notifications_created_at ON public.referral_notifications(created_at);

-- Enable RLS
ALTER TABLE public.referral_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.referral_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.referral_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.referral_notifications
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.referral_notifications TO authenticated;
GRANT ALL ON public.referral_notifications TO anon;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.referral_notifications
        WHERE user_id = user_uuid AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO anon;
