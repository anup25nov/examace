-- Test get_referral_network_detailed function
-- Run this in your Supabase SQL Editor

-- First, let's check if the function exists
SELECT 
  routine_name, 
  routine_type, 
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_referral_network_detailed' 
AND routine_schema = 'public';

-- Test the function directly
SELECT * FROM get_referral_network_detailed('fbc97816-07ed-4e21-bc45-219dbfdc4cec');

-- Check if there are any triggers on referral_transactions that might be calling the wrong function
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'referral_transactions';

-- Check if there are any triggers on referral_commissions that might be calling the wrong function
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'referral_commissions';
