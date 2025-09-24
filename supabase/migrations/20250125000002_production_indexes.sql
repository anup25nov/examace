-- Production Database Indexes
-- Critical indexes for performance optimization

-- Test completions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_completions_user_exam 
ON test_completions(user_id, exam_id, completed_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_completions_user_test_type 
ON test_completions(user_id, test_type, completed_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_completions_exam_type 
ON test_completions(exam_id, test_type, completed_at);

-- Payments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_status 
ON payments(user_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_id 
ON payments(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at 
ON payments(created_at) WHERE status = 'completed';

-- User memberships indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_memberships_active 
ON user_memberships(user_id, status, end_date) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_memberships_user_plan 
ON user_memberships(user_id, plan_id, end_date);

-- User profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_phone 
ON user_profiles(phone) WHERE phone IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email) WHERE email IS NOT NULL;

-- Referral system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_code 
ON referral_codes(code) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_user 
ON referral_codes(user_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_transactions_referrer 
ON referral_transactions(referrer_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_transactions_referred 
ON referral_transactions(referred_id, created_at);

-- Individual test scores indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_individual_test_scores_user_test 
ON individual_test_scores(user_id, exam_id, test_type, test_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_individual_test_scores_rank 
ON individual_test_scores(exam_id, test_type, test_id, score DESC);

-- Exam stats indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_stats_user_exam 
ON exam_stats(user_id, exam_id);

-- User streaks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_streaks_user_date 
ON user_streaks(user_id, streak_date);

-- Question reports indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_reports_status 
ON question_reports(status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_reports_exam_test 
ON question_reports(exam_id, test_type, test_id);

-- User messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_messages_user_unread 
ON user_messages(user_id, is_read, created_at);

-- Withdrawal requests indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawal_requests_user_status 
ON withdrawal_requests(user_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawal_requests_status 
ON withdrawal_requests(status, created_at);

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_log_user_action 
ON security_audit_log(user_id, action, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_log_created_at 
ON security_audit_log(created_at);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_completions_complex 
ON test_completions(exam_id, test_type, test_id, user_id, completed_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_complex 
ON payments(user_id, status, plan_id, created_at);

-- Partial indexes for active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_memberships 
ON user_memberships(user_id, end_date) WHERE status = 'active' AND end_date > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_payments 
ON payments(user_id, created_at) WHERE status = 'pending';

-- Text search indexes (if using text search)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_name_search 
-- ON user_profiles USING gin(to_tsvector('english', name));

-- Update table statistics
ANALYZE test_completions;
ANALYZE payments;
ANALYZE user_memberships;
ANALYZE user_profiles;
ANALYZE referral_codes;
ANALYZE referral_transactions;
ANALYZE individual_test_scores;
ANALYZE exam_stats;
ANALYZE user_streaks;
ANALYZE question_reports;
ANALYZE user_messages;
ANALYZE withdrawal_requests;
ANALYZE security_audit_log;
