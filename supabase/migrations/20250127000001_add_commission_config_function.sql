-- Add centralized commission configuration function
-- This function returns the current commission configuration from a single source

CREATE OR REPLACE FUNCTION "public"."get_commission_config"()
RETURNS TABLE(
  "commission_percentage" DECIMAL(5,2),
  "minimum_withdrawal" DECIMAL(10,2),
  "maximum_withdrawal" DECIMAL(10,2),
  "processing_fee" DECIMAL(5,2),
  "tax_deduction" DECIMAL(5,2),
  "first_time_bonus" DECIMAL(10,2),
  "max_daily_withdrawals" INTEGER,
  "withdrawal_processing_days" INTEGER,
  "referral_code_length" INTEGER,
  "referral_code_prefix" VARCHAR(10)
)
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  -- Return centralized commission configuration
  -- This should match the configuration in src/config/appConfig.ts
  RETURN QUERY SELECT 
    12.00::DECIMAL(5,2) as commission_percentage,
    100.00::DECIMAL(10,2) as minimum_withdrawal,
    10000.00::DECIMAL(10,2) as maximum_withdrawal,
    0.00::DECIMAL(5,2) as processing_fee,
    0.00::DECIMAL(5,2) as tax_deduction,
    0.00::DECIMAL(10,2) as first_time_bonus,
    5::INTEGER as max_daily_withdrawals,
    3::INTEGER as withdrawal_processing_days,
    8::INTEGER as referral_code_length,
    'S2S'::VARCHAR(10) as referral_code_prefix;
END;
$$;

-- Grant permissions
GRANT ALL ON FUNCTION "public"."get_commission_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_commission_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_commission_config"() TO "service_role";

-- Update existing functions to use centralized configuration
CREATE OR REPLACE FUNCTION "public"."get_referral_config"()
RETURNS "jsonb"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  config_result RECORD;
BEGIN
  -- Get commission configuration
  SELECT * INTO config_result FROM get_commission_config();
  
  -- Return as JSON
  RETURN json_build_object(
    'commission_percentage', config_result.commission_percentage,
    'minimum_withdrawal', config_result.minimum_withdrawal,
    'maximum_withdrawal', config_result.maximum_withdrawal,
    'processing_fee', config_result.processing_fee,
    'tax_deduction', config_result.tax_deduction,
    'first_time_bonus', config_result.first_time_bonus,
    'max_daily_withdrawals', config_result.max_daily_withdrawals,
    'withdrawal_processing_days', config_result.withdrawal_processing_days,
    'referral_code_length', config_result.referral_code_length,
    'referral_code_prefix', config_result.referral_code_prefix
  );
END;
$$;

-- Grant permissions
GRANT ALL ON FUNCTION "public"."get_referral_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_referral_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_referral_config"() TO "service_role";
