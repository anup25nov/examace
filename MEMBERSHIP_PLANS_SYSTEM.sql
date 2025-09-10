-- Membership Plans System
-- This script creates tables and functions for managing membership plans dynamically

-- Drop existing table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.membership_features CASCADE;
DROP TABLE IF EXISTS public.membership_plans CASCADE;

-- Create membership_plans table
CREATE TABLE public.membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    duration_months INTEGER NOT NULL, -- 1 for monthly, 12 for yearly, 999 for lifetime
    features JSONB DEFAULT '[]'::jsonb, -- Array of features
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create membership_features table for detailed feature management
CREATE TABLE public.membership_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_description TEXT,
    is_included BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default membership plans
INSERT INTO public.membership_plans (id, name, description, price, duration_months, features, display_order) VALUES
('free', 'Free Plan', 'Basic access to limited content', 0.00, 0, '["Limited Mock Tests", "Basic PYQ Access", "Community Support"]', 1),
('monthly', 'Monthly Premium', 'Full access for 1 month', 299.00, 1, '["Unlimited Mock Tests", "All PYQ Sets", "Detailed Analytics", "Priority Support"]', 2),
('yearly', 'Yearly Premium', 'Full access for 1 year (Save 25%)', 2699.00, 12, '["Unlimited Mock Tests", "All PYQ Sets", "Detailed Analytics", "Priority Support", "Early Access to New Content"]', 3),
('lifetime', 'Lifetime Access', 'One-time payment for lifetime access', 9999.00, 999, '["Unlimited Mock Tests", "All PYQ Sets", "Detailed Analytics", "Priority Support", "Early Access to New Content", "Personal Mentor Support"]', 4)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_months = EXCLUDED.duration_months,
    features = EXCLUDED.features,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Insert detailed features for each plan
INSERT INTO public.membership_features (plan_id, feature_name, feature_description, is_included, display_order) VALUES
-- Free Plan Features
('free', 'Limited Mock Tests', 'Access to 3 free mock tests', true, 1),
('free', 'Basic PYQ Access', 'Access to 2 years of PYQ', true, 2),
('free', 'Community Support', 'Basic community support', true, 3),
('free', 'Unlimited Mock Tests', 'Access to all mock tests', false, 4),
('free', 'Detailed Analytics', 'Advanced performance analytics', false, 5),
('free', 'Priority Support', 'Priority customer support', false, 6),

-- Monthly Plan Features
('monthly', 'Unlimited Mock Tests', 'Access to all mock tests', true, 1),
('monthly', 'All PYQ Sets', 'Access to 10+ years of PYQ', true, 2),
('monthly', 'Detailed Analytics', 'Advanced performance analytics', true, 3),
('monthly', 'Priority Support', 'Priority customer support', true, 4),
('monthly', 'Early Access', 'Early access to new content', false, 5),
('monthly', 'Personal Mentor', 'Personal mentor support', false, 6),

-- Yearly Plan Features
('yearly', 'Unlimited Mock Tests', 'Access to all mock tests', true, 1),
('yearly', 'All PYQ Sets', 'Access to 10+ years of PYQ', true, 2),
('yearly', 'Detailed Analytics', 'Advanced performance analytics', true, 3),
('yearly', 'Priority Support', 'Priority customer support', true, 4),
('yearly', 'Early Access', 'Early access to new content', true, 5),
('yearly', 'Personal Mentor', 'Personal mentor support', false, 6),

-- Lifetime Plan Features
('lifetime', 'Unlimited Mock Tests', 'Access to all mock tests', true, 1),
('lifetime', 'All PYQ Sets', 'Access to 10+ years of PYQ', true, 2),
('lifetime', 'Detailed Analytics', 'Advanced performance analytics', true, 3),
('lifetime', 'Priority Support', 'Priority customer support', true, 4),
('lifetime', 'Early Access', 'Early access to new content', true, 5),
('lifetime', 'Personal Mentor', 'Personal mentor support', true, 6)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_plans_active ON public.membership_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_membership_plans_display_order ON public.membership_plans(display_order);
CREATE INDEX IF NOT EXISTS idx_membership_features_plan_id ON public.membership_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_membership_features_display_order ON public.membership_features(display_order);

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for plans)
CREATE POLICY "Anyone can view active membership plans" ON public.membership_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view membership features" ON public.membership_features
    FOR SELECT USING (true);

-- Function to get all active membership plans
CREATE OR REPLACE FUNCTION public.get_membership_plans()
RETURNS TABLE(
    id TEXT,
    name TEXT,
    description TEXT,
    price DECIMAL,
    currency TEXT,
    duration_months INTEGER,
    features JSONB,
    display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.id,
        mp.name,
        mp.description,
        mp.price,
        mp.currency,
        mp.duration_months,
        mp.features,
        mp.display_order
    FROM public.membership_plans mp
    WHERE mp.is_active = true
    ORDER BY mp.display_order ASC;
END;
$$;

-- Function to get membership plan by ID
CREATE OR REPLACE FUNCTION public.get_membership_plan(plan_id TEXT)
RETURNS TABLE(
    id TEXT,
    name TEXT,
    description TEXT,
    price DECIMAL,
    currency TEXT,
    duration_months INTEGER,
    features JSONB,
    display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.id,
        mp.name,
        mp.description,
        mp.price,
        mp.currency,
        mp.duration_months,
        mp.features,
        mp.display_order
    FROM public.membership_plans mp
    WHERE mp.id = plan_id AND mp.is_active = true;
END;
$$;

-- Function to get detailed features for a plan
CREATE OR REPLACE FUNCTION public.get_plan_features(plan_id TEXT)
RETURNS TABLE(
    feature_name TEXT,
    feature_description TEXT,
    is_included BOOLEAN,
    display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mf.feature_name,
        mf.feature_description,
        mf.is_included,
        mf.display_order
    FROM public.membership_features mf
    WHERE mf.plan_id = plan_id
    ORDER BY mf.display_order ASC;
END;
$$;

-- Function to update membership plan pricing
CREATE OR REPLACE FUNCTION public.update_plan_pricing(
    plan_id TEXT,
    new_price DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_plan RECORD;
BEGIN
    UPDATE public.membership_plans
    SET price = new_price,
        updated_at = NOW()
    WHERE id = plan_id AND is_active = true
    RETURNING * INTO updated_plan;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Plan not found or inactive'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'plan_id', updated_plan.id,
        'new_price', updated_plan.price,
        'message', 'Plan pricing updated successfully'
    );
END;
$$;

-- Function to create a new membership plan
CREATE OR REPLACE FUNCTION public.create_membership_plan(
    p_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_price DECIMAL,
    p_duration_months INTEGER,
    p_features JSONB DEFAULT '[]'::jsonb,
    p_display_order INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_plan RECORD;
BEGIN
    INSERT INTO public.membership_plans (
        id, name, description, price, duration_months, features, display_order
    ) VALUES (
        p_id, p_name, p_description, p_price, p_duration_months, p_features, p_display_order
    ) RETURNING * INTO new_plan;
    
    RETURN jsonb_build_object(
        'success', true,
        'plan_id', new_plan.id,
        'name', new_plan.name,
        'price', new_plan.price,
        'message', 'Plan created successfully'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_membership_plans() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_membership_plan(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_plan_features(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_plan_pricing(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_membership_plan(TEXT, TEXT, TEXT, DECIMAL, INTEGER, JSONB, INTEGER) TO authenticated;

-- Create a view for easy plan comparison
CREATE OR REPLACE VIEW public.membership_plans_view AS
SELECT 
    mp.id,
    mp.name,
    mp.description,
    mp.price,
    mp.currency,
    mp.duration_months,
    mp.features,
    mp.display_order,
    CASE 
        WHEN mp.duration_months = 0 THEN 'Free'
        WHEN mp.duration_months = 1 THEN 'Monthly'
        WHEN mp.duration_months = 12 THEN 'Yearly'
        WHEN mp.duration_months = 999 THEN 'Lifetime'
        ELSE CONCAT(mp.duration_months, ' months')
    END as duration_display,
    CASE 
        WHEN mp.duration_months = 0 THEN 0
        WHEN mp.duration_months = 1 THEN mp.price
        WHEN mp.duration_months = 12 THEN ROUND(mp.price / 12, 2)
        WHEN mp.duration_months = 999 THEN ROUND(mp.price / 1200, 2) -- Assuming 100 years
        ELSE ROUND(mp.price / mp.duration_months, 2)
    END as monthly_equivalent
FROM public.membership_plans mp
WHERE mp.is_active = true
ORDER BY mp.display_order ASC;

-- Grant access to the view
GRANT SELECT ON public.membership_plans_view TO authenticated, anon;
