-- Base tables migration - creates the fundamental user_profiles table
-- This must run before any other migrations that reference user_profiles

-- Create user_profiles table (base table for all user data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  membership_status VARCHAR(20) DEFAULT 'free',
  membership_plan VARCHAR(50),
  membership_expiry TIMESTAMP WITH TIME ZONE,
  referral_code VARCHAR(20) UNIQUE,
  referred_by VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for phone
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_phone_unique UNIQUE (phone);

-- Create exam_stats table
CREATE TABLE IF NOT EXISTS exam_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  total_tests INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  rank INTEGER,
  last_test_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

-- Create test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB
);

-- Create individual_test_scores table
CREATE TABLE IF NOT EXISTS individual_test_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER,
  rank INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id, test_type, test_id)
);

-- Create membership_plans table
CREATE TABLE IF NOT EXISTS membership_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  duration_days INTEGER NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  mock_tests INTEGER NOT NULL DEFAULT 0,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_memberships table
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(50) REFERENCES membership_plans(id) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create membership_transactions table
CREATE TABLE IF NOT EXISTS membership_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  membership_id UUID REFERENCES user_memberships(id) ON DELETE CASCADE NOT NULL,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_transactions table
CREATE TABLE IF NOT EXISTS referral_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_payouts table
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Create RLS policies for exam_stats
CREATE POLICY "Users can view own exam stats" ON exam_stats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own exam stats" ON exam_stats
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exam stats" ON exam_stats
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for test_attempts
CREATE POLICY "Users can view own test attempts" ON test_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own test attempts" ON test_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for individual_test_scores
CREATE POLICY "Users can view own test scores" ON individual_test_scores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own test scores" ON individual_test_scores
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own test scores" ON individual_test_scores
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for membership_plans (public read)
CREATE POLICY "Anyone can view membership plans" ON membership_plans
  FOR SELECT USING (true);

-- Create RLS policies for user_memberships
CREATE POLICY "Users can view own memberships" ON user_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships" ON user_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for membership_transactions
CREATE POLICY "Users can view own transactions" ON membership_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON membership_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for referral_codes
CREATE POLICY "Users can view own referral codes" ON referral_codes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own referral codes" ON referral_codes
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for referral_transactions
CREATE POLICY "Users can view own referral transactions" ON referral_transactions
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Users can insert own referral transactions" ON referral_transactions
  FOR INSERT WITH CHECK (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Create RLS policies for referral_payouts
CREATE POLICY "Users can view own referral payouts" ON referral_payouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own referral payouts" ON referral_payouts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create trigger function for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if the user doesn't already exist in user_profiles
  INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
  VALUES (new.id, new.phone, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert default membership plans
INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active) VALUES
('free', 'Free Plan', 'Basic access to practice tests', 0, 12, 365, 10, '["Basic Practice Tests", "Limited Analytics"]', true),
('basic', 'Basic Plan', 'Access to PYQ sets and mock tests', 299, 1, 30, 500, '["500+ PYQ Sets", "100+ Mock Tests", "Detailed Solutions", "Performance Analytics"]', true),
('premium', 'Premium Plan', 'Full access to all features', 599, 2, 60, 1000, '["1000+ PYQ Sets", "200+ Mock Tests", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true),
('pro', 'Pro Plan', 'Complete exam preparation package', 999, 3, 90, 2000, '["2000+ PYQ Sets", "500+ Mock Tests", "Detailed Solutions", "Performance Analytics", "24/7 Support", "Personal Mentor"]', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON exam_stats TO authenticated;
GRANT ALL ON test_attempts TO authenticated;
GRANT ALL ON individual_test_scores TO authenticated;
GRANT ALL ON membership_plans TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON membership_transactions TO authenticated;
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referral_transactions TO authenticated;
GRANT ALL ON referral_payouts TO authenticated;
