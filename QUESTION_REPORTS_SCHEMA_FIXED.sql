-- Question Reports Database Schema (Fixed)
-- This schema handles user reports about issues with questions, options, or explanations
-- Fixed to work with existing user_profiles table structure

-- Create question_reports table
CREATE TABLE IF NOT EXISTS public.question_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    exam_type TEXT NOT NULL, -- 'mock', 'pyq', 'practice'
    test_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('question_text', 'options', 'explanation', 'answer', 'image', 'other')),
    issue_description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON public.question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_exam ON public.question_reports(exam_id, exam_type, test_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_question ON public.question_reports(question_id, question_number);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON public.question_reports(created_at);

-- Create RLS policies
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON public.question_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert their own reports" ON public.question_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reports
CREATE POLICY "Users can update their own pending reports" ON public.question_reports
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- For now, allow all authenticated users to view all reports
-- TODO: Implement proper admin role system later
CREATE POLICY "Authenticated users can view all reports" ON public.question_reports
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- For now, allow all authenticated users to update all reports
-- TODO: Implement proper admin role system later
CREATE POLICY "Authenticated users can update all reports" ON public.question_reports
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_question_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_question_reports_updated_at
    BEFORE UPDATE ON public.question_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_question_reports_updated_at();

-- Create function to get report statistics
CREATE OR REPLACE FUNCTION public.get_question_report_stats()
RETURNS TABLE(
    total_reports BIGINT,
    pending_reports BIGINT,
    resolved_reports BIGINT,
    rejected_reports BIGINT,
    reports_by_issue_type JSONB,
    reports_by_exam JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reports,
        (
            SELECT jsonb_object_agg(issue_type, count)
            FROM (
                SELECT issue_type, COUNT(*) as count
                FROM question_reports
                GROUP BY issue_type
            ) issue_stats
        ) as reports_by_issue_type,
        (
            SELECT jsonb_object_agg(exam_id, count)
            FROM (
                SELECT exam_id, COUNT(*) as count
                FROM question_reports
                GROUP BY exam_id
            ) exam_stats
        ) as reports_by_exam;
END;
$$;

-- Create function to get reports for admin
CREATE OR REPLACE FUNCTION public.get_admin_question_reports(
    p_status TEXT DEFAULT NULL,
    p_exam_id TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    exam_id TEXT,
    exam_type TEXT,
    test_id TEXT,
    question_id TEXT,
    question_number INTEGER,
    issue_type TEXT,
    issue_description TEXT,
    status TEXT,
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_email TEXT
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qr.id,
        qr.user_id,
        qr.exam_id,
        qr.exam_type,
        qr.test_id,
        qr.question_id,
        qr.question_number,
        qr.issue_type,
        qr.issue_description,
        qr.status,
        qr.admin_notes,
        qr.resolved_at,
        qr.created_at,
        qr.updated_at,
        up.email as user_email
    FROM question_reports qr
    LEFT JOIN user_profiles up ON qr.user_id = up.id
    WHERE 
        (p_status IS NULL OR qr.status = p_status)
        AND (p_exam_id IS NULL OR qr.exam_id = p_exam_id)
    ORDER BY qr.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create function to update report status
CREATE OR REPLACE FUNCTION public.update_question_report_status(
    p_report_id UUID,
    p_status TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- For now, allow any authenticated user to update report status
    -- TODO: Implement proper admin role system later
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Update the report
    UPDATE question_reports 
    SET 
        status = p_status,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        resolved_at = CASE 
            WHEN p_status = 'resolved' THEN NOW()
            ELSE resolved_at
        END,
        updated_at = NOW()
    WHERE id = p_report_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'message', 'Report status updated successfully');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Report not found');
    END IF;
END;
$$;

-- Create function to get user's reports
CREATE OR REPLACE FUNCTION public.get_user_question_reports(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
    id UUID,
    exam_id TEXT,
    exam_type TEXT,
    test_id TEXT,
    question_id TEXT,
    question_number INTEGER,
    issue_type TEXT,
    issue_description TEXT,
    status TEXT,
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qr.id,
        qr.exam_id,
        qr.exam_type,
        qr.test_id,
        qr.question_id,
        qr.question_number,
        qr.issue_type,
        qr.issue_description,
        qr.status,
        qr.admin_notes,
        qr.resolved_at,
        qr.created_at
    FROM question_reports qr
    WHERE qr.user_id = p_user_id
    ORDER BY qr.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.question_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_report_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_question_reports(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_question_report_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_question_reports(UUID) TO authenticated;

-- Insert sample data for testing (optional)
-- INSERT INTO public.question_reports (user_id, exam_id, exam_type, test_id, question_id, question_number, issue_type, issue_description)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000000', 'ssc-cgl', 'mock', 'mock-test-1', '1', 1, 'question_text', 'The question text is unclear'),
--     ('00000000-0000-0000-0000-000000000000', 'ssc-cgl', 'mock', 'mock-test-1', '2', 2, 'options', 'Option C seems to be incorrect');
