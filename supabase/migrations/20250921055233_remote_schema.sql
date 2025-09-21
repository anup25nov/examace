drop extension if exists "pg_net";

drop policy "Users can view own referral commissions" on "public"."referral_commissions";

drop policy "Users can insert own referral payouts" on "public"."referral_payouts";

drop policy "Users can view own referral payouts" on "public"."referral_payouts";

revoke delete on table "public"."admin_users" from "anon";

revoke insert on table "public"."admin_users" from "anon";

revoke references on table "public"."admin_users" from "anon";

revoke select on table "public"."admin_users" from "anon";

revoke trigger on table "public"."admin_users" from "anon";

revoke truncate on table "public"."admin_users" from "anon";

revoke update on table "public"."admin_users" from "anon";

revoke delete on table "public"."admin_users" from "authenticated";

revoke insert on table "public"."admin_users" from "authenticated";

revoke references on table "public"."admin_users" from "authenticated";

revoke select on table "public"."admin_users" from "authenticated";

revoke trigger on table "public"."admin_users" from "authenticated";

revoke truncate on table "public"."admin_users" from "authenticated";

revoke update on table "public"."admin_users" from "authenticated";

revoke delete on table "public"."admin_users" from "service_role";

revoke insert on table "public"."admin_users" from "service_role";

revoke references on table "public"."admin_users" from "service_role";

revoke select on table "public"."admin_users" from "service_role";

revoke trigger on table "public"."admin_users" from "service_role";

revoke truncate on table "public"."admin_users" from "service_role";

revoke update on table "public"."admin_users" from "service_role";

revoke delete on table "public"."exam_stats" from "anon";

revoke insert on table "public"."exam_stats" from "anon";

revoke references on table "public"."exam_stats" from "anon";

revoke select on table "public"."exam_stats" from "anon";

revoke trigger on table "public"."exam_stats" from "anon";

revoke truncate on table "public"."exam_stats" from "anon";

revoke update on table "public"."exam_stats" from "anon";

revoke delete on table "public"."exam_stats" from "authenticated";

revoke insert on table "public"."exam_stats" from "authenticated";

revoke references on table "public"."exam_stats" from "authenticated";

revoke select on table "public"."exam_stats" from "authenticated";

revoke trigger on table "public"."exam_stats" from "authenticated";

revoke truncate on table "public"."exam_stats" from "authenticated";

revoke update on table "public"."exam_stats" from "authenticated";

revoke delete on table "public"."exam_stats" from "service_role";

revoke insert on table "public"."exam_stats" from "service_role";

revoke references on table "public"."exam_stats" from "service_role";

revoke select on table "public"."exam_stats" from "service_role";

revoke trigger on table "public"."exam_stats" from "service_role";

revoke truncate on table "public"."exam_stats" from "service_role";

revoke update on table "public"."exam_stats" from "service_role";

revoke delete on table "public"."individual_test_scores" from "anon";

revoke insert on table "public"."individual_test_scores" from "anon";

revoke references on table "public"."individual_test_scores" from "anon";

revoke select on table "public"."individual_test_scores" from "anon";

revoke trigger on table "public"."individual_test_scores" from "anon";

revoke truncate on table "public"."individual_test_scores" from "anon";

revoke update on table "public"."individual_test_scores" from "anon";

revoke delete on table "public"."individual_test_scores" from "authenticated";

revoke insert on table "public"."individual_test_scores" from "authenticated";

revoke references on table "public"."individual_test_scores" from "authenticated";

revoke select on table "public"."individual_test_scores" from "authenticated";

revoke trigger on table "public"."individual_test_scores" from "authenticated";

revoke truncate on table "public"."individual_test_scores" from "authenticated";

revoke update on table "public"."individual_test_scores" from "authenticated";

revoke delete on table "public"."individual_test_scores" from "service_role";

revoke insert on table "public"."individual_test_scores" from "service_role";

revoke references on table "public"."individual_test_scores" from "service_role";

revoke select on table "public"."individual_test_scores" from "service_role";

revoke trigger on table "public"."individual_test_scores" from "service_role";

revoke truncate on table "public"."individual_test_scores" from "service_role";

revoke update on table "public"."individual_test_scores" from "service_role";

revoke delete on table "public"."membership_plans" from "anon";

revoke insert on table "public"."membership_plans" from "anon";

revoke references on table "public"."membership_plans" from "anon";

revoke select on table "public"."membership_plans" from "anon";

revoke trigger on table "public"."membership_plans" from "anon";

revoke truncate on table "public"."membership_plans" from "anon";

revoke update on table "public"."membership_plans" from "anon";

revoke delete on table "public"."membership_plans" from "authenticated";

revoke insert on table "public"."membership_plans" from "authenticated";

revoke references on table "public"."membership_plans" from "authenticated";

revoke select on table "public"."membership_plans" from "authenticated";

revoke trigger on table "public"."membership_plans" from "authenticated";

revoke truncate on table "public"."membership_plans" from "authenticated";

revoke update on table "public"."membership_plans" from "authenticated";

revoke delete on table "public"."membership_plans" from "service_role";

revoke insert on table "public"."membership_plans" from "service_role";

revoke references on table "public"."membership_plans" from "service_role";

revoke select on table "public"."membership_plans" from "service_role";

revoke trigger on table "public"."membership_plans" from "service_role";

revoke truncate on table "public"."membership_plans" from "service_role";

revoke update on table "public"."membership_plans" from "service_role";

revoke delete on table "public"."membership_transactions" from "anon";

revoke insert on table "public"."membership_transactions" from "anon";

revoke references on table "public"."membership_transactions" from "anon";

revoke select on table "public"."membership_transactions" from "anon";

revoke trigger on table "public"."membership_transactions" from "anon";

revoke truncate on table "public"."membership_transactions" from "anon";

revoke update on table "public"."membership_transactions" from "anon";

revoke delete on table "public"."membership_transactions" from "authenticated";

revoke insert on table "public"."membership_transactions" from "authenticated";

revoke references on table "public"."membership_transactions" from "authenticated";

revoke select on table "public"."membership_transactions" from "authenticated";

revoke trigger on table "public"."membership_transactions" from "authenticated";

revoke truncate on table "public"."membership_transactions" from "authenticated";

revoke update on table "public"."membership_transactions" from "authenticated";

revoke delete on table "public"."membership_transactions" from "service_role";

revoke insert on table "public"."membership_transactions" from "service_role";

revoke references on table "public"."membership_transactions" from "service_role";

revoke select on table "public"."membership_transactions" from "service_role";

revoke trigger on table "public"."membership_transactions" from "service_role";

revoke truncate on table "public"."membership_transactions" from "service_role";

revoke update on table "public"."membership_transactions" from "service_role";

revoke delete on table "public"."memberships" from "anon";

revoke insert on table "public"."memberships" from "anon";

revoke references on table "public"."memberships" from "anon";

revoke select on table "public"."memberships" from "anon";

revoke trigger on table "public"."memberships" from "anon";

revoke truncate on table "public"."memberships" from "anon";

revoke update on table "public"."memberships" from "anon";

revoke delete on table "public"."memberships" from "authenticated";

revoke insert on table "public"."memberships" from "authenticated";

revoke references on table "public"."memberships" from "authenticated";

revoke select on table "public"."memberships" from "authenticated";

revoke trigger on table "public"."memberships" from "authenticated";

revoke truncate on table "public"."memberships" from "authenticated";

revoke update on table "public"."memberships" from "authenticated";

revoke delete on table "public"."memberships" from "service_role";

revoke insert on table "public"."memberships" from "service_role";

revoke references on table "public"."memberships" from "service_role";

revoke select on table "public"."memberships" from "service_role";

revoke trigger on table "public"."memberships" from "service_role";

revoke truncate on table "public"."memberships" from "service_role";

revoke update on table "public"."memberships" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke truncate on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke references on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke trigger on table "public"."payments" from "authenticated";

revoke truncate on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke references on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke trigger on table "public"."payments" from "service_role";

revoke truncate on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."question_images" from "anon";

revoke insert on table "public"."question_images" from "anon";

revoke references on table "public"."question_images" from "anon";

revoke select on table "public"."question_images" from "anon";

revoke trigger on table "public"."question_images" from "anon";

revoke truncate on table "public"."question_images" from "anon";

revoke update on table "public"."question_images" from "anon";

revoke delete on table "public"."question_images" from "authenticated";

revoke insert on table "public"."question_images" from "authenticated";

revoke references on table "public"."question_images" from "authenticated";

revoke select on table "public"."question_images" from "authenticated";

revoke trigger on table "public"."question_images" from "authenticated";

revoke truncate on table "public"."question_images" from "authenticated";

revoke update on table "public"."question_images" from "authenticated";

revoke delete on table "public"."question_images" from "service_role";

revoke insert on table "public"."question_images" from "service_role";

revoke references on table "public"."question_images" from "service_role";

revoke select on table "public"."question_images" from "service_role";

revoke trigger on table "public"."question_images" from "service_role";

revoke truncate on table "public"."question_images" from "service_role";

revoke update on table "public"."question_images" from "service_role";

revoke delete on table "public"."question_reports" from "anon";

revoke insert on table "public"."question_reports" from "anon";

revoke references on table "public"."question_reports" from "anon";

revoke select on table "public"."question_reports" from "anon";

revoke trigger on table "public"."question_reports" from "anon";

revoke truncate on table "public"."question_reports" from "anon";

revoke update on table "public"."question_reports" from "anon";

revoke delete on table "public"."question_reports" from "authenticated";

revoke insert on table "public"."question_reports" from "authenticated";

revoke references on table "public"."question_reports" from "authenticated";

revoke select on table "public"."question_reports" from "authenticated";

revoke trigger on table "public"."question_reports" from "authenticated";

revoke truncate on table "public"."question_reports" from "authenticated";

revoke update on table "public"."question_reports" from "authenticated";

revoke delete on table "public"."question_reports" from "service_role";

revoke insert on table "public"."question_reports" from "service_role";

revoke references on table "public"."question_reports" from "service_role";

revoke select on table "public"."question_reports" from "service_role";

revoke trigger on table "public"."question_reports" from "service_role";

revoke truncate on table "public"."question_reports" from "service_role";

revoke update on table "public"."question_reports" from "service_role";

revoke delete on table "public"."referral_codes" from "anon";

revoke insert on table "public"."referral_codes" from "anon";

revoke references on table "public"."referral_codes" from "anon";

revoke select on table "public"."referral_codes" from "anon";

revoke trigger on table "public"."referral_codes" from "anon";

revoke truncate on table "public"."referral_codes" from "anon";

revoke update on table "public"."referral_codes" from "anon";

revoke delete on table "public"."referral_codes" from "authenticated";

revoke insert on table "public"."referral_codes" from "authenticated";

revoke references on table "public"."referral_codes" from "authenticated";

revoke select on table "public"."referral_codes" from "authenticated";

revoke trigger on table "public"."referral_codes" from "authenticated";

revoke truncate on table "public"."referral_codes" from "authenticated";

revoke update on table "public"."referral_codes" from "authenticated";

revoke delete on table "public"."referral_codes" from "service_role";

revoke insert on table "public"."referral_codes" from "service_role";

revoke references on table "public"."referral_codes" from "service_role";

revoke select on table "public"."referral_codes" from "service_role";

revoke trigger on table "public"."referral_codes" from "service_role";

revoke truncate on table "public"."referral_codes" from "service_role";

revoke update on table "public"."referral_codes" from "service_role";

revoke delete on table "public"."referral_commissions" from "anon";

revoke insert on table "public"."referral_commissions" from "anon";

revoke references on table "public"."referral_commissions" from "anon";

revoke select on table "public"."referral_commissions" from "anon";

revoke trigger on table "public"."referral_commissions" from "anon";

revoke truncate on table "public"."referral_commissions" from "anon";

revoke update on table "public"."referral_commissions" from "anon";

revoke delete on table "public"."referral_commissions" from "authenticated";

revoke insert on table "public"."referral_commissions" from "authenticated";

revoke references on table "public"."referral_commissions" from "authenticated";

revoke select on table "public"."referral_commissions" from "authenticated";

revoke trigger on table "public"."referral_commissions" from "authenticated";

revoke truncate on table "public"."referral_commissions" from "authenticated";

revoke update on table "public"."referral_commissions" from "authenticated";

revoke delete on table "public"."referral_commissions" from "service_role";

revoke insert on table "public"."referral_commissions" from "service_role";

revoke references on table "public"."referral_commissions" from "service_role";

revoke select on table "public"."referral_commissions" from "service_role";

revoke trigger on table "public"."referral_commissions" from "service_role";

revoke truncate on table "public"."referral_commissions" from "service_role";

revoke update on table "public"."referral_commissions" from "service_role";

revoke delete on table "public"."referral_config" from "anon";

revoke insert on table "public"."referral_config" from "anon";

revoke references on table "public"."referral_config" from "anon";

revoke select on table "public"."referral_config" from "anon";

revoke trigger on table "public"."referral_config" from "anon";

revoke truncate on table "public"."referral_config" from "anon";

revoke update on table "public"."referral_config" from "anon";

revoke delete on table "public"."referral_config" from "authenticated";

revoke insert on table "public"."referral_config" from "authenticated";

revoke references on table "public"."referral_config" from "authenticated";

revoke select on table "public"."referral_config" from "authenticated";

revoke trigger on table "public"."referral_config" from "authenticated";

revoke truncate on table "public"."referral_config" from "authenticated";

revoke update on table "public"."referral_config" from "authenticated";

revoke delete on table "public"."referral_config" from "service_role";

revoke insert on table "public"."referral_config" from "service_role";

revoke references on table "public"."referral_config" from "service_role";

revoke select on table "public"."referral_config" from "service_role";

revoke trigger on table "public"."referral_config" from "service_role";

revoke truncate on table "public"."referral_config" from "service_role";

revoke update on table "public"."referral_config" from "service_role";

revoke delete on table "public"."referral_payouts" from "anon";

revoke insert on table "public"."referral_payouts" from "anon";

revoke references on table "public"."referral_payouts" from "anon";

revoke select on table "public"."referral_payouts" from "anon";

revoke trigger on table "public"."referral_payouts" from "anon";

revoke truncate on table "public"."referral_payouts" from "anon";

revoke update on table "public"."referral_payouts" from "anon";

revoke delete on table "public"."referral_payouts" from "authenticated";

revoke insert on table "public"."referral_payouts" from "authenticated";

revoke references on table "public"."referral_payouts" from "authenticated";

revoke select on table "public"."referral_payouts" from "authenticated";

revoke trigger on table "public"."referral_payouts" from "authenticated";

revoke truncate on table "public"."referral_payouts" from "authenticated";

revoke update on table "public"."referral_payouts" from "authenticated";

revoke delete on table "public"."referral_payouts" from "service_role";

revoke insert on table "public"."referral_payouts" from "service_role";

revoke references on table "public"."referral_payouts" from "service_role";

revoke select on table "public"."referral_payouts" from "service_role";

revoke trigger on table "public"."referral_payouts" from "service_role";

revoke truncate on table "public"."referral_payouts" from "service_role";

revoke update on table "public"."referral_payouts" from "service_role";

revoke delete on table "public"."referral_transactions" from "anon";

revoke insert on table "public"."referral_transactions" from "anon";

revoke references on table "public"."referral_transactions" from "anon";

revoke select on table "public"."referral_transactions" from "anon";

revoke trigger on table "public"."referral_transactions" from "anon";

revoke truncate on table "public"."referral_transactions" from "anon";

revoke update on table "public"."referral_transactions" from "anon";

revoke delete on table "public"."referral_transactions" from "authenticated";

revoke insert on table "public"."referral_transactions" from "authenticated";

revoke references on table "public"."referral_transactions" from "authenticated";

revoke select on table "public"."referral_transactions" from "authenticated";

revoke trigger on table "public"."referral_transactions" from "authenticated";

revoke truncate on table "public"."referral_transactions" from "authenticated";

revoke update on table "public"."referral_transactions" from "authenticated";

revoke delete on table "public"."referral_transactions" from "service_role";

revoke insert on table "public"."referral_transactions" from "service_role";

revoke references on table "public"."referral_transactions" from "service_role";

revoke select on table "public"."referral_transactions" from "service_role";

revoke trigger on table "public"."referral_transactions" from "service_role";

revoke truncate on table "public"."referral_transactions" from "service_role";

revoke update on table "public"."referral_transactions" from "service_role";

revoke delete on table "public"."test_attempts" from "anon";

revoke insert on table "public"."test_attempts" from "anon";

revoke references on table "public"."test_attempts" from "anon";

revoke select on table "public"."test_attempts" from "anon";

revoke trigger on table "public"."test_attempts" from "anon";

revoke truncate on table "public"."test_attempts" from "anon";

revoke update on table "public"."test_attempts" from "anon";

revoke delete on table "public"."test_attempts" from "authenticated";

revoke insert on table "public"."test_attempts" from "authenticated";

revoke references on table "public"."test_attempts" from "authenticated";

revoke select on table "public"."test_attempts" from "authenticated";

revoke trigger on table "public"."test_attempts" from "authenticated";

revoke truncate on table "public"."test_attempts" from "authenticated";

revoke update on table "public"."test_attempts" from "authenticated";

revoke delete on table "public"."test_attempts" from "service_role";

revoke insert on table "public"."test_attempts" from "service_role";

revoke references on table "public"."test_attempts" from "service_role";

revoke select on table "public"."test_attempts" from "service_role";

revoke trigger on table "public"."test_attempts" from "service_role";

revoke truncate on table "public"."test_attempts" from "service_role";

revoke update on table "public"."test_attempts" from "service_role";

revoke delete on table "public"."test_completions" from "anon";

revoke insert on table "public"."test_completions" from "anon";

revoke references on table "public"."test_completions" from "anon";

revoke select on table "public"."test_completions" from "anon";

revoke trigger on table "public"."test_completions" from "anon";

revoke truncate on table "public"."test_completions" from "anon";

revoke update on table "public"."test_completions" from "anon";

revoke delete on table "public"."test_completions" from "authenticated";

revoke insert on table "public"."test_completions" from "authenticated";

revoke references on table "public"."test_completions" from "authenticated";

revoke select on table "public"."test_completions" from "authenticated";

revoke trigger on table "public"."test_completions" from "authenticated";

revoke truncate on table "public"."test_completions" from "authenticated";

revoke update on table "public"."test_completions" from "authenticated";

revoke delete on table "public"."test_completions" from "service_role";

revoke insert on table "public"."test_completions" from "service_role";

revoke references on table "public"."test_completions" from "service_role";

revoke select on table "public"."test_completions" from "service_role";

revoke trigger on table "public"."test_completions" from "service_role";

revoke truncate on table "public"."test_completions" from "service_role";

revoke update on table "public"."test_completions" from "service_role";

revoke delete on table "public"."user_memberships" from "anon";

revoke insert on table "public"."user_memberships" from "anon";

revoke references on table "public"."user_memberships" from "anon";

revoke select on table "public"."user_memberships" from "anon";

revoke trigger on table "public"."user_memberships" from "anon";

revoke truncate on table "public"."user_memberships" from "anon";

revoke update on table "public"."user_memberships" from "anon";

revoke delete on table "public"."user_memberships" from "authenticated";

revoke insert on table "public"."user_memberships" from "authenticated";

revoke references on table "public"."user_memberships" from "authenticated";

revoke select on table "public"."user_memberships" from "authenticated";

revoke trigger on table "public"."user_memberships" from "authenticated";

revoke truncate on table "public"."user_memberships" from "authenticated";

revoke update on table "public"."user_memberships" from "authenticated";

revoke delete on table "public"."user_memberships" from "service_role";

revoke insert on table "public"."user_memberships" from "service_role";

revoke references on table "public"."user_memberships" from "service_role";

revoke select on table "public"."user_memberships" from "service_role";

revoke trigger on table "public"."user_memberships" from "service_role";

revoke truncate on table "public"."user_memberships" from "service_role";

revoke update on table "public"."user_memberships" from "service_role";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

revoke delete on table "public"."user_streaks" from "anon";

revoke insert on table "public"."user_streaks" from "anon";

revoke references on table "public"."user_streaks" from "anon";

revoke select on table "public"."user_streaks" from "anon";

revoke trigger on table "public"."user_streaks" from "anon";

revoke truncate on table "public"."user_streaks" from "anon";

revoke update on table "public"."user_streaks" from "anon";

revoke delete on table "public"."user_streaks" from "authenticated";

revoke insert on table "public"."user_streaks" from "authenticated";

revoke references on table "public"."user_streaks" from "authenticated";

revoke select on table "public"."user_streaks" from "authenticated";

revoke trigger on table "public"."user_streaks" from "authenticated";

revoke truncate on table "public"."user_streaks" from "authenticated";

revoke update on table "public"."user_streaks" from "authenticated";

revoke delete on table "public"."user_streaks" from "service_role";

revoke insert on table "public"."user_streaks" from "service_role";

revoke references on table "public"."user_streaks" from "service_role";

revoke select on table "public"."user_streaks" from "service_role";

revoke trigger on table "public"."user_streaks" from "service_role";

revoke truncate on table "public"."user_streaks" from "service_role";

revoke update on table "public"."user_streaks" from "service_role";

revoke delete on table "public"."withdrawal_requests" from "anon";

revoke insert on table "public"."withdrawal_requests" from "anon";

revoke references on table "public"."withdrawal_requests" from "anon";

revoke select on table "public"."withdrawal_requests" from "anon";

revoke trigger on table "public"."withdrawal_requests" from "anon";

revoke truncate on table "public"."withdrawal_requests" from "anon";

revoke update on table "public"."withdrawal_requests" from "anon";

revoke delete on table "public"."withdrawal_requests" from "authenticated";

revoke insert on table "public"."withdrawal_requests" from "authenticated";

revoke references on table "public"."withdrawal_requests" from "authenticated";

revoke select on table "public"."withdrawal_requests" from "authenticated";

revoke trigger on table "public"."withdrawal_requests" from "authenticated";

revoke truncate on table "public"."withdrawal_requests" from "authenticated";

revoke update on table "public"."withdrawal_requests" from "authenticated";

revoke delete on table "public"."withdrawal_requests" from "service_role";

revoke insert on table "public"."withdrawal_requests" from "service_role";

revoke references on table "public"."withdrawal_requests" from "service_role";

revoke select on table "public"."withdrawal_requests" from "service_role";

revoke trigger on table "public"."withdrawal_requests" from "service_role";

revoke truncate on table "public"."withdrawal_requests" from "service_role";

revoke update on table "public"."withdrawal_requests" from "service_role";

alter table "public"."payments" drop constraint "payments_plan_check";

alter table "public"."referral_commissions" drop constraint "referral_commissions_payment_id_fkey";

alter table "public"."referral_commissions" drop constraint "referral_commissions_referred_id_fkey";

alter table "public"."referral_commissions" drop constraint "referral_commissions_referrer_id_fkey";

drop function if exists "public"."process_referral_commission"(p_user_id uuid, p_plan_id character varying, p_amount numeric);

drop view if exists "public"."user_referral_summary";

drop function if exists "public"."apply_referral_code"(p_user_id uuid, p_referral_code character varying);

drop function if exists "public"."get_pending_question_reports"();

drop function if exists "public"."get_pending_withdrawal_requests"();


  create table "public"."user_messages" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "content" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."payments" alter column "plan" set data type character varying(50) using "plan"::character varying(50);

alter table "public"."payments" alter column "plan_name" set not null;

alter table "public"."referral_commissions" drop column "commission_percentage";

alter table "public"."referral_commissions" drop column "is_first_membership";

alter table "public"."referral_commissions" add column "amount" numeric(10,2) not null default 0.00;

alter table "public"."referral_commissions" add column "commission_rate" numeric(5,4) not null default 0.10;

alter table "public"."referral_commissions" alter column "commission_amount" set default 0.00;

alter table "public"."referral_commissions" alter column "membership_amount" drop not null;

alter table "public"."referral_commissions" alter column "membership_plan" drop not null;

alter table "public"."referral_commissions" alter column "status" set not null;

alter table "public"."referral_payouts" drop column "payment_reference";

alter table "public"."referral_payouts" add column "account_details" text not null;

alter table "public"."referral_payouts" add column "admin_notes" text;

alter table "public"."referral_payouts" add column "approved_at" timestamp with time zone;

alter table "public"."referral_payouts" add column "approved_by" uuid;

alter table "public"."referral_payouts" add column "completed_at" timestamp with time zone;

alter table "public"."referral_payouts" add column "rejected_at" timestamp with time zone;

alter table "public"."referral_payouts" add column "rejected_by" uuid;

alter table "public"."referral_payouts" alter column "payment_method" set not null;

alter table "public"."referral_payouts" alter column "status" set not null;

alter table "public"."user_memberships" add column "plan" character varying(50);

CREATE INDEX idx_payments_paid_at ON public.payments USING btree (paid_at);

CREATE INDEX idx_payments_plan ON public.payments USING btree (plan);

CREATE INDEX idx_payments_user_id_status ON public.payments USING btree (user_id, status);

CREATE INDEX idx_referral_commissions_created_at ON public.referral_commissions USING btree (created_at);

CREATE INDEX idx_referral_payouts_created_at ON public.referral_payouts USING btree (created_at);

CREATE INDEX idx_referral_payouts_status ON public.referral_payouts USING btree (status);

CREATE INDEX idx_referral_payouts_user_id ON public.referral_payouts USING btree (user_id);

CREATE INDEX idx_test_completions_user_exam ON public.test_completions USING btree (user_id, exam_id);

CREATE INDEX idx_user_memberships_end_date ON public.user_memberships USING btree (end_date);

CREATE INDEX idx_user_memberships_plan ON public.user_memberships USING btree (plan);

CREATE INDEX idx_user_memberships_plan_id ON public.user_memberships USING btree (plan_id);

CREATE INDEX idx_user_memberships_status ON public.user_memberships USING btree (status);

CREATE INDEX idx_user_memberships_user_id ON public.user_memberships USING btree (user_id);

CREATE INDEX idx_user_messages_created_at ON public.user_messages USING btree (created_at);

CREATE INDEX idx_user_messages_is_read ON public.user_messages USING btree (is_read);

CREATE INDEX idx_user_messages_user_id ON public.user_messages USING btree (user_id);

CREATE UNIQUE INDEX user_messages_pkey ON public.user_messages USING btree (id);

alter table "public"."user_messages" add constraint "user_messages_pkey" PRIMARY KEY using index "user_messages_pkey";

alter table "public"."referral_payouts" add constraint "referral_payouts_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."referral_payouts" validate constraint "referral_payouts_amount_check";

alter table "public"."referral_payouts" add constraint "referral_payouts_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES user_profiles(id) not valid;

alter table "public"."referral_payouts" validate constraint "referral_payouts_approved_by_fkey";

alter table "public"."referral_payouts" add constraint "referral_payouts_rejected_by_fkey" FOREIGN KEY (rejected_by) REFERENCES user_profiles(id) not valid;

alter table "public"."referral_payouts" validate constraint "referral_payouts_rejected_by_fkey";

alter table "public"."referral_payouts" add constraint "referral_payouts_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]))) not valid;

alter table "public"."referral_payouts" validate constraint "referral_payouts_status_check";

alter table "public"."user_messages" add constraint "user_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_messages" validate constraint "user_messages_user_id_fkey";

alter table "public"."referral_commissions" add constraint "referral_commissions_referred_id_fkey" FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."referral_commissions" validate constraint "referral_commissions_referred_id_fkey";

alter table "public"."referral_commissions" add constraint "referral_commissions_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."referral_commissions" validate constraint "referral_commissions_referrer_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone)
 RETURNS TABLE(plan character varying, start_date timestamp with time zone, end_date timestamp with time zone, status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_id_value UUID;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get plan_id for the given plan name
  SELECT id INTO plan_id_value
  FROM membership_plans
  WHERE name = p_plan
  LIMIT 1;
  
  -- If plan not found, use pro plan
  IF plan_id_value IS NULL THEN
    SELECT id INTO plan_id_value
    FROM membership_plans
    WHERE name = 'pro'
    LIMIT 1;
  END IF;
  
  -- Set dates
  start_date := p_upgrade_at;
  end_date := start_date + CASE 
    WHEN p_plan = 'pro_plus' THEN INTERVAL '1 year'
    ELSE INTERVAL '1 month'
  END;
  
  -- Insert or update membership (using upsert approach)
  INSERT INTO user_memberships (
    user_id,
    plan_id,
    plan,
    status,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES (
    p_user,
    plan_id_value,
    p_plan,
    'active',
    start_date,
    end_date,
    NOW(),
    NOW()
  );
  
  -- Update if record already exists
  UPDATE user_memberships 
  SET 
    plan_id = plan_id_value,
    plan = p_plan,
    status = 'active',
    start_date = p_upgrade_at,
    end_date = p_upgrade_at + CASE 
      WHEN p_plan = 'pro_plus' THEN INTERVAL '1 year'
      ELSE INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE user_id = p_user;
  
  RETURN QUERY SELECT p_plan, start_date, end_date, 'active'::VARCHAR(20);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_verify_payment(p_payment_id character varying, p_admin_notes text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payment_record RECORD;
BEGIN
  -- Get payment record
  SELECT * INTO payment_record
  FROM payments
  WHERE payment_id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found';
    RETURN;
  END IF;
  
  -- Update payment status
  UPDATE payments
  SET 
    status = 'verified',
    verification_status = 'verified',
    verified_at = NOW(),
    updated_at = NOW()
  WHERE payment_id = p_payment_id;
  
  -- Activate membership
  UPDATE user_profiles
  SET 
    membership_plan = payment_record.plan_id,
    membership_expiry = CASE 
      WHEN payment_record.plan_id = 'yearly' THEN NOW() + INTERVAL '1 year'
      WHEN payment_record.plan_id = 'lifetime' THEN NOW() + INTERVAL '100 years'
      ELSE NOW() + INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE id = payment_record.user_id;
  
  RETURN QUERY SELECT true, 'Payment verified and membership activated';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.diagnose_user_messages_schema()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  table_exists BOOLEAN := false;
  columns_info TEXT := '';
  result_text TEXT := '';
BEGIN
  -- Check if user_messages table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_messages'
  ) INTO table_exists;
  
  IF table_exists THEN
    result_text := 'user_messages table EXISTS. Columns: ';
    
    -- Get all columns in the table
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ')
    INTO columns_info
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_messages'
    ORDER BY ordinal_position;
    
    result_text := result_text || COALESCE(columns_info, 'No columns found');
  ELSE
    result_text := 'user_messages table does NOT exist';
  END IF;
  
  RETURN result_text;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_payments(p_status text DEFAULT NULL::text, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, payment_id character varying, user_id uuid, plan_name character varying, amount numeric, status character varying, verification_status character varying, payment_reference character varying, created_at timestamp with time zone, paid_at timestamp with time zone, verified_at timestamp with time zone, expires_at timestamp with time zone, failed_reason text, dispute_reason text, admin_notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.payment_id,
    p.user_id,
    p.plan_name,
    p.amount,
    p.status,
    COALESCE(p.verification_status, p.status) as verification_status,
    COALESCE(p.razorpay_payment_id, p.payment_id) as payment_reference,
    p.created_at,
    p.paid_at,
    p.verified_at,
    (p.created_at + INTERVAL '1 hour') as expires_at,
    p.failed_reason,
    NULL::TEXT as dispute_reason,
    NULL::TEXT as admin_notes
  FROM payments p
  WHERE (p_status IS NULL OR p.status = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  unread_count INTEGER := 0;
  table_exists BOOLEAN := false;
  has_user_id_column BOOLEAN := false;
  has_read_column BOOLEAN := false;
  user_column_name TEXT := 'user_id';
  read_column_name TEXT := 'is_read';
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_messages'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN 0;
  END IF;
  
  -- Check what columns exist
  SELECT 
    bool_or(column_name IN ('user_id', 'userid', 'user')) as has_user_id,
    bool_or(column_name IN ('is_read', 'read', 'read_status')) as has_read
  INTO has_user_id_column, has_read_column
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages';
  
  IF NOT has_user_id_column THEN
    RETURN 0;
  END IF;
  
  -- Get actual column names
  SELECT column_name INTO user_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('user_id', 'userid', 'user')
  LIMIT 1;
  
  IF has_read_column THEN
    SELECT column_name INTO read_column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_messages'
    AND column_name IN ('is_read', 'read', 'read_status')
    LIMIT 1;
    
    EXECUTE format('SELECT COUNT(*)::INTEGER FROM user_messages WHERE %I = $1 AND %I = false', 
                   user_column_name, read_column_name)
    INTO unread_count
    USING user_uuid;
  ELSE
    -- If no read column, consider all messages as unread
    EXECUTE format('SELECT COUNT(*)::INTEGER FROM user_messages WHERE %I = $1', user_column_name)
    INTO unread_count
    USING user_uuid;
  END IF;
  
  RETURN unread_count;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_messages(user_uuid uuid, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, message_type character varying, message text, is_read boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  table_exists BOOLEAN := false;
  has_id_column BOOLEAN := false;
  has_user_id_column BOOLEAN := false;
  has_message_column BOOLEAN := false;
  has_content_column BOOLEAN := false;
  has_text_column BOOLEAN := false;
  has_body_column BOOLEAN := false;
  has_is_read_column BOOLEAN := false;
  has_read_column BOOLEAN := false;
  has_created_at_column BOOLEAN := false;
  has_created_column BOOLEAN := false;
  has_timestamp_column BOOLEAN := false;
  message_column_name TEXT := 'message';
  user_column_name TEXT := 'user_id';
  read_column_name TEXT := 'is_read';
  timestamp_column_name TEXT := 'created_at';
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_messages'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    -- Return empty result if table doesn't exist
    RETURN;
  END IF;
  
  -- Check what columns exist
  SELECT 
    bool_or(column_name = 'id') as has_id,
    bool_or(column_name IN ('user_id', 'userid', 'user')) as has_user_id,
    bool_or(column_name IN ('message', 'content', 'text', 'body')) as has_message,
    bool_or(column_name IN ('is_read', 'read', 'read_status')) as has_read,
    bool_or(column_name IN ('created_at', 'created', 'timestamp', 'date_created')) as has_timestamp
  INTO has_id_column, has_user_id_column, has_message_column, has_is_read_column, has_created_at_column
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages';
  
  -- Determine actual column names
  SELECT column_name INTO user_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('user_id', 'userid', 'user')
  LIMIT 1;
  
  SELECT column_name INTO message_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('message', 'content', 'text', 'body')
  LIMIT 1;
  
  SELECT column_name INTO read_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('is_read', 'read', 'read_status')
  LIMIT 1;
  
  SELECT column_name INTO timestamp_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('created_at', 'created', 'timestamp', 'date_created')
  LIMIT 1;
  
  -- If we don't have the minimum required columns, return empty
  IF NOT (has_id_column AND has_user_id_column AND has_message_column) THEN
    RETURN;
  END IF;
  
  -- Build and execute dynamic query
  RETURN QUERY EXECUTE format('
    SELECT 
      %I as id,
      ''info''::VARCHAR(50) as message_type,
      %I::TEXT as message,
      COALESCE(%s, false) as is_read,
      COALESCE(%s, NOW()) as created_at
    FROM user_messages
    WHERE %I = $1
    ORDER BY %s DESC
    LIMIT $2',
    'id',
    message_column_name,
    CASE WHEN has_is_read_column THEN read_column_name ELSE 'false' END,
    CASE WHEN has_created_at_column THEN timestamp_column_name ELSE 'NOW()' END,
    user_column_name,
    CASE WHEN has_created_at_column THEN timestamp_column_name ELSE 'id' END
  ) USING user_uuid, limit_count;
  
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, return empty result
    RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_referrer_id uuid;
    v_commission_rate numeric := 0.15;
    v_commission_amount numeric;
    result json;
BEGIN
    -- Get the referrer for this user
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions 
    WHERE referred_id = p_user_id 
    AND status = 'pending'
    AND membership_purchased = false
    LIMIT 1;
    
    -- If no referrer found, return early
    IF v_referrer_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'No referrer found for user',
            'commission_amount', 0.00
        );
        RETURN result;
    END IF;
    
    -- Set commission rate based on plan
    v_commission_rate := CASE 
        WHEN p_membership_plan = 'pro_plus' THEN 0.15
        ELSE 0.10
    END;
    
    -- Calculate commission amount
    v_commission_amount := p_membership_amount * v_commission_rate;
    
    -- Insert commission record
    INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        payment_id,
        membership_plan,
        membership_amount,
        commission_rate,
        commission_amount,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_referrer_id,
        p_user_id,
        p_payment_id,
        p_membership_plan,
        p_membership_amount,
        v_commission_rate,
        v_commission_amount,
        'pending',
        NOW(),
        NOW()
    );
    
    -- Update referral transaction to mark membership as purchased
    UPDATE referral_transactions 
    SET 
        membership_purchased = true,
        amount = p_membership_amount,
        commission_amount = v_commission_amount,
        status = 'completed',
        commission_status = 'pending',
        updated_at = NOW()
    WHERE referred_id = p_user_id 
    AND referrer_id = v_referrer_id
    AND status = 'pending';
    
    -- Update referrer's total earnings
    UPDATE referral_codes 
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    -- Set success response
    result := json_build_object(
        'success', true,
        'message', 'Commission processed successfully',
        'commission_amount', v_commission_amount
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Error processing commission: ' || SQLERRM,
            'commission_amount', 0.00
        );
        RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  table_exists BOOLEAN := false;
  has_id_column BOOLEAN := false;
  has_user_id_column BOOLEAN := false;
  has_read_column BOOLEAN := false;
  user_column_name TEXT := 'user_id';
  read_column_name TEXT := 'is_read';
  rows_affected INTEGER := 0;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_messages'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN false;
  END IF;
  
  -- Check what columns exist
  SELECT 
    bool_or(column_name = 'id') as has_id,
    bool_or(column_name IN ('user_id', 'userid', 'user')) as has_user_id,
    bool_or(column_name IN ('is_read', 'read', 'read_status')) as has_read
  INTO has_id_column, has_user_id_column, has_read_column
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages';
  
  IF NOT (has_id_column AND has_user_id_column AND has_read_column) THEN
    RETURN false;
  END IF;
  
  -- Get actual column names
  SELECT column_name INTO user_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('user_id', 'userid', 'user')
  LIMIT 1;
  
  SELECT column_name INTO read_column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_messages'
  AND column_name IN ('is_read', 'read', 'read_status')
  LIMIT 1;
  
  EXECUTE format('UPDATE user_messages SET %I = true WHERE id = $1 AND %I = $2', 
                 read_column_name, user_column_name)
  USING message_id, user_uuid;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected > 0;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_referrer_id UUID;
    v_commission_rate DECIMAL(5,4);
    v_commission_amount DECIMAL(10,2);
    v_referral_code_value VARCHAR(20);
BEGIN
    -- Get referrer_id from referral_transactions
    SELECT rt.referrer_id, rt.referral_code
    INTO v_referrer_id, v_referral_code_value
    FROM referral_transactions rt
    WHERE rt.referred_id = p_user_id
    AND rt.membership_purchased = false
    ORDER BY rt.created_at DESC
    LIMIT 1;

    -- If no referrer found, return success but no commission
    IF v_referrer_id IS NULL THEN
        RETURN QUERY SELECT false, 'No referrer found for user', 0.00;
        RETURN;
    END IF;

    -- Set commission rate (10% for pro, 15% for pro_plus)
    v_commission_rate := CASE 
        WHEN p_membership_plan = 'pro_plus' THEN 0.15
        ELSE 0.10
    END;

    -- Calculate commission amount
    v_commission_amount := p_membership_amount * v_commission_rate;

    -- Update referral_transaction to mark membership as purchased
    UPDATE referral_transactions
    SET 
        amount = p_membership_amount,
        commission_amount = v_commission_amount,
        commission_status = 'pending',
        membership_purchased = true,
        updated_at = NOW()
    WHERE referred_id = p_user_id
    AND referrer_id = v_referrer_id
    AND membership_purchased = false;

    -- Insert commission record
    INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        amount,
        commission_amount,
        commission_rate,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_referrer_id,
        p_user_id,
        p_membership_amount,
        v_commission_amount,
        v_commission_rate,
        'pending',
        NOW(),
        NOW()
    );

    -- Update referral_codes total_earnings
    UPDATE referral_codes
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;

    RETURN QUERY SELECT true, 'Commission processed successfully', v_commission_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_referrer_id uuid;
    v_commission_rate numeric := 0.15; -- 15% commission
    v_commission_amount numeric;
    v_referral_code_id uuid;
BEGIN
    -- Initialize return values
    success := false;
    message := 'No referrer found for user';
    commission_amount := 0.00;
    
    -- Get the referrer for this user
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions 
    WHERE referred_id = p_user_id 
    AND status = 'pending'
    AND membership_purchased = false
    LIMIT 1;
    
    -- If no referrer found, return early
    IF v_referrer_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Set commission rate based on plan
    v_commission_rate := CASE 
        WHEN p_membership_plan = 'pro_plus' THEN 0.15
        ELSE 0.10
    END;
    
    -- Calculate commission amount
    v_commission_amount := p_membership_amount * v_commission_rate;
    
    -- Get the referral code ID for the referrer
    SELECT id INTO v_referral_code_id
    FROM referral_codes 
    WHERE user_id = v_referrer_id 
    AND is_active = true
    LIMIT 1;
    
    -- Insert commission record (using correct column names)
    INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        payment_id,
        membership_plan,
        membership_amount,
        commission_rate,
        commission_amount,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_referrer_id,
        p_user_id,
        p_payment_id,
        p_membership_plan,
        p_membership_amount,
        v_commission_rate,
        v_commission_amount,
        'pending',
        NOW(),
        NOW()
    );
    
    -- Update referral transaction to mark membership as purchased
    UPDATE referral_transactions 
    SET 
        membership_purchased = true,
        amount = p_membership_amount,
        commission_amount = v_commission_amount,
        status = 'completed',
        commission_status = 'pending',
        updated_at = NOW()
    WHERE referred_id = p_user_id 
    AND referrer_id = v_referrer_id
    AND status = 'pending';
    
    -- Update referrer's total earnings
    UPDATE referral_codes 
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    -- Set success response
    success := true;
    message := 'Commission processed successfully';
    commission_amount := v_commission_amount;
    
    RETURN;
    
EXCEPTION
    WHEN OTHERS THEN
        success := false;
        message := 'Error processing commission: ' || SQLERRM;
        commission_amount := 0.00;
        RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  withdrawal_record RECORD;
  v_admin_notes TEXT := admin_notes; -- Rename parameter to avoid ambiguity
BEGIN
  -- Get the withdrawal request from referral_payouts table
  SELECT * INTO withdrawal_record
  FROM referral_payouts
  WHERE id = request_id;
  
  -- If not found, return error with more details
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 
      'Withdrawal request not found. Request ID: ' || request_id || 
      '. Check if the request exists in referral_payouts table.', 
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if already processed
  IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
    RETURN QUERY SELECT false, 
      'Withdrawal request already processed. Current status: ' || withdrawal_record.status, 
      request_id;
    RETURN;
  END IF;
  
  -- Process based on action
  IF action = 'approved' THEN
    -- Update withdrawal status
    UPDATE referral_payouts
    SET 
      status = 'approved',
      admin_notes = COALESCE(v_admin_notes, 'Approved by admin'),
      approved_at = NOW(),
      approved_by = admin_user_id,
      updated_at = NOW()
    WHERE id = request_id;
    
    -- Update referrer's earnings (deduct from pending)
    UPDATE referral_codes
    SET 
      total_earnings = GREATEST(0, total_earnings - withdrawal_record.amount),
      updated_at = NOW()
    WHERE user_id = withdrawal_record.user_id;
    
    RETURN QUERY SELECT true, 'Withdrawal approved successfully', request_id;
    
  ELSIF action = 'rejected' THEN
    -- Update withdrawal status
    UPDATE referral_payouts
    SET 
      status = 'rejected',
      admin_notes = COALESCE(v_admin_notes, 'Rejected by admin'),
      rejected_at = NOW(),
      rejected_by = admin_user_id,
      updated_at = NOW()
    WHERE id = request_id;
    
    RETURN QUERY SELECT true, 'Withdrawal rejected successfully', request_id;
    
  ELSE
    RETURN QUERY SELECT false, 'Invalid action. Use "approved" or "rejected"', NULL::UUID;
  END IF;
  
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text)
 RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  available_balance DECIMAL(10,2);
  new_withdrawal_id UUID;
BEGIN
  -- Check if user has sufficient balance
  SELECT COALESCE(SUM(commission_amount), 0.00) INTO available_balance
  FROM referral_commissions
  WHERE referrer_id = user_uuid 
  AND status IN ('pending', 'completed');
  
  -- Check if user has any pending withdrawal requests
  IF EXISTS (
    SELECT 1 FROM referral_payouts 
    WHERE user_id = user_uuid 
    AND status IN ('pending', 'approved')
  ) THEN
    RETURN QUERY SELECT false, 'You already have a pending withdrawal request', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if withdrawal amount is valid
  IF withdrawal_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Withdrawal amount must be greater than 0', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user has sufficient balance
  IF withdrawal_amount > available_balance THEN
    RETURN QUERY SELECT false, 
      'Insufficient balance. Available: ₹' || available_balance || ', Requested: ₹' || withdrawal_amount, 
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Create withdrawal request
  INSERT INTO referral_payouts (
    user_id,
    amount,
    payment_method,
    account_details,
    status
  ) VALUES (
    user_uuid,
    withdrawal_amount,
    payment_method,
    account_details,
    'pending'
  ) RETURNING id INTO new_withdrawal_id;
  
  RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', new_withdrawal_id;
  
END;
$function$
;

CREATE OR REPLACE FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone)
 RETURNS TABLE(plan text, start_date date, end_date date, mocks_used integer)
 LANGUAGE plpgsql
AS $function$
declare
  v_now date := (p_upgrade_at at time zone 'IST')::date;
  v_existing memberships;
  v_new_start date;
  v_new_end date;
begin
  select * into v_existing from memberships where user_id = p_user;

  if v_existing is null then
    v_new_start := v_now;
    v_new_end := v_now + interval '1 year';
    insert into memberships(user_id, plan, start_date, end_date, mocks_used)
    values (p_user, p_plan, v_new_start, v_new_end, 0)
    returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
    return next;
    return;
  end if;

  -- Upgrade flow: if upgrading from pro to pro_plus, extend validity 1 year from upgrade date, keep mocks_used
  if v_existing.plan = 'pro' and p_plan = 'pro_plus' then
    v_new_start := v_now;
    v_new_end := v_now + interval '1 year';
    update memberships
      set plan = 'pro_plus', start_date = v_new_start, end_date = v_new_end, updated_at = now()
      where user_id = p_user
      returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
    return next; return;
  end if;

  -- Same plan purchase or pro_plus renewal: set 1 year from now
  if p_plan = v_existing.plan then
    v_new_start := v_now;
    v_new_end := v_now + interval '1 year';
    update memberships
      set start_date = v_new_start, end_date = v_new_end, updated_at = now()
      where user_id = p_user
      returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
    return next; return;
  end if;

  -- If trying to downgrade or other transitions, just set to requested plan for 1 year, keep mocks_used
  v_new_start := v_now;
  v_new_end := v_now + interval '1 year';
  update memberships
    set plan = p_plan, start_date = v_new_start, end_date = v_new_end, updated_at = now()
    where user_id = p_user
    returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
  return next;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying DEFAULT 'admin'::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the person adding is already an admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Insert the new admin user
  INSERT INTO admin_users (user_id, role, created_by)
  VALUES (target_user_id, admin_role, admin_user_id)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = true,
    updated_at = NOW();
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code character varying)
 RETURNS TABLE(success boolean, message text, referrer_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Check if referral code exists and is active
  SELECT * INTO referrer_record
  FROM referral_codes
  WHERE code = p_referral_code 
  AND is_active = true
  AND user_id != p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or inactive referral code', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user is already referred
  IF EXISTS (
    SELECT 1 FROM referral_transactions 
    WHERE referred_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id,
    referred_id,
    referral_code,
    status,
    transaction_type,
    amount,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    p_referral_code,
    'pending',
    'referral',
    0.00,
    0.00,
    'pending',
    false,
    true,
    NOW(),
    NOW()
  );
  
  -- Update referrer's referral count
  UPDATE referral_codes
  SET 
    total_referrals = COALESCE(total_referrals, 0) + 1,
    updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code text)
 RETURNS TABLE(success boolean, message text, referrer_id uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE
  referrer_id_val UUID;
  referral_code_exists BOOLEAN;
BEGIN
  -- Check if referral code exists
  SELECT 
    user_id,
    true
  INTO 
    referrer_id_val,
    referral_code_exists
  FROM referral_codes
  WHERE code = p_referral_code
    AND is_active = true
  LIMIT 1;
  
  -- If referral code not found
  IF NOT referral_code_exists THEN
    RETURN QUERY SELECT false, 'Referral code not found', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user is trying to use their own referral code
  IF referrer_id_val = p_user_id THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code', NULL::UUID;
    RETURN;
  END IF;
  
  -- Update user profile with referral code
  UPDATE user_profiles
  SET 
    referred_by = p_referral_code,
    referral_code_applied = true,
    referral_code_used = p_referral_code,
    referral_applied_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_id_val;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.attempt_use_mock(p_user uuid)
 RETURNS TABLE(allowed boolean, message text, plan text, mocks_used integer, plan_limit integer, end_date date)
 LANGUAGE plpgsql
AS $function$
declare
  v_m memberships;
  v_limit integer;
  v_today date := (now() at time zone 'IST')::date;
begin
  select * into v_m from memberships where user_id = p_user;
  if v_m is null then
    allowed := false; message := 'No active membership.'; plan := null; mocks_used := 0; plan_limit := 0; end_date := null; return next; return;
  end if;
  v_limit := get_plan_limit(v_m.plan);
  if v_today > v_m.end_date then
    allowed := false; message := 'Plan expired, please renew.'; plan := v_m.plan; mocks_used := v_m.mocks_used; plan_limit := v_limit; end_date := v_m.end_date; return next; return;
  end if;
  if v_m.mocks_used < v_limit then
    update memberships set mocks_used = v_m.mocks_used + 1, updated_at = now() where user_id = p_user returning memberships.mocks_used into mocks_used;
    allowed := true; message := 'Allowed'; plan := v_m.plan; plan_limit := v_limit; end_date := v_m.end_date; return next; return;
  else
    allowed := false; message := case when v_m.plan = 'pro' then 'Pro limit reached, please upgrade to Pro+' else 'Plan expired, please renew.' end; plan := v_m.plan; mocks_used := v_m.mocks_used; plan_limit := v_limit; end_date := v_m.end_date; return next; return;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_make_withdrawal_request(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has any pending withdrawal requests
  RETURN NOT EXISTS (
    SELECT 1 FROM withdrawal_requests 
    WHERE user_id = user_uuid 
    AND status IN ('pending', 'processing')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_commission_status(p_user_id uuid)
 RETURNS TABLE(has_payment boolean, has_commission boolean, has_referral boolean, payment_id uuid, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payment_count INTEGER;
  commission_count INTEGER;
  referral_count INTEGER;
  latest_payment_id UUID;
  total_commission DECIMAL(10,2);
BEGIN
  -- Check if user has verified payments
  SELECT COUNT(*), MAX(id) INTO payment_count, latest_payment_id
  FROM payments
  WHERE user_id = p_user_id
  AND status IN ('verified', 'paid', 'completed');
  
  -- Check if user has commissions
  SELECT COUNT(*), COALESCE(SUM(commission_amount), 0) INTO commission_count, total_commission
  FROM referral_commissions
  WHERE referred_id = p_user_id;
  
  -- Check if user has referral transaction
  SELECT COUNT(*) INTO referral_count
  FROM referral_transactions
  WHERE referred_id = p_user_id;
  
  RETURN QUERY
  SELECT 
    (payment_count > 0) as has_payment,
    (commission_count > 0) as has_commission,
    (referral_count > 0) as has_referral,
    latest_payment_id as payment_id,
    total_commission as commission_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_number text)
 RETURNS TABLE(phone_exists boolean, user_id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN up.id IS NOT NULL THEN true ELSE false END as phone_exists,
    up.id as user_id,
    up.created_at
  FROM user_profiles up
  WHERE up.phone = phone_number
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(success boolean, message text, payment_id character varying, user_id uuid, plan_id character varying, commission_processed boolean, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payment_record RECORD;
  membership_id UUID;
  commission_result RECORD;
BEGIN
  -- Get the payment record
  SELECT * INTO payment_record 
  FROM payments 
  WHERE payments.payment_id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', p_payment_id, NULL::UUID, NULL::VARCHAR(50), false, 0.00::DECIMAL(10,2);
    RETURN;
  END IF;
  
  -- Update payment status
  UPDATE payments 
  SET 
    status = 'completed',
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_order_id = p_razorpay_order_id,
    razorpay_signature = p_razorpay_signature,
    metadata = p_metadata,
    updated_at = NOW()
  WHERE payments.payment_id = p_payment_id;
  
  -- Create user membership
  INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status)
  VALUES (
    payment_record.user_id,
    payment_record.plan_id,
    NOW(),
    NOW() + INTERVAL '1 month' * (
      SELECT duration_months FROM membership_plans WHERE id = payment_record.plan_id
    ),
    'active'
  )
  RETURNING id INTO membership_id;
  
  -- Create membership transaction
  INSERT INTO membership_transactions (
    user_id, 
    membership_id, 
    transaction_id, 
    amount, 
    currency, 
    status, 
    payment_method
  )
  VALUES (
    payment_record.user_id,
    membership_id,
    p_payment_id,
    payment_record.amount,
    payment_record.currency,
    'completed',
    payment_record.payment_method
  );
  
  -- Process referral commission
  SELECT * INTO commission_result
  FROM process_referral_commission(
    payment_record.user_id,
    payment_record.plan_id,
    payment_record.amount
  );
  
  RETURN QUERY SELECT 
    true, 
    'Payment completed successfully', 
    p_payment_id, 
    payment_record.user_id, 
    payment_record.plan_id,
    commission_result.success,
    COALESCE(commission_result.commission_amount, 0.00);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_all_default_exam_stats(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, stats_created integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  exam_record RECORD;
  stats_count INTEGER := 0;
BEGIN
  -- Loop through all available exams and create default stats
  FOR exam_record IN 
    SELECT DISTINCT exam_id FROM (
      VALUES 
        ('ssc-cgl'),
        ('ssc-mts'),
        ('bank-po'),
        ('railway'),
        ('airforce')
    ) AS exams(exam_id)
  LOOP
    -- Insert default exam stats for this exam
    INSERT INTO exam_stats (
      user_id,
      exam_id,
      total_tests_taken,
      total_score,
      average_score,
      best_score,
      total_time_taken,
      average_time_per_question,
      accuracy_percentage,
      rank,
      percentile,
      last_test_date,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      exam_record.exam_id,
      0, -- total_tests_taken
      0, -- total_score
      0.00, -- average_score
      0, -- best_score
      0, -- total_time_taken
      0.00, -- average_time_per_question
      0.00, -- accuracy_percentage
      0, -- rank
      0.00, -- percentile
      NULL, -- last_test_date
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, exam_id) DO NOTHING;
    
    stats_count := stats_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT true, 'Default exam stats created successfully', stats_count;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default exam stats: ' || SQLERRM, 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert default exam stats for the specific exam
  INSERT INTO exam_stats (
    user_id,
    exam_id,
    total_tests_taken,
    total_score,
    average_score,
    best_score,
    total_time_taken,
    average_time_per_question,
    accuracy_percentage,
    rank,
    percentile,
    last_test_date,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_exam_id,
    0, -- total_tests_taken
    0, -- total_score
    0.00, -- average_score
    0, -- best_score
    0, -- total_time_taken
    0.00, -- average_time_per_question
    0.00, -- accuracy_percentage
    0, -- rank
    0.00, -- percentile
    NULL, -- last_test_date
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, exam_id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Default exam stats created for ' || p_exam_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default exam stats: ' || SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_user_streak(p_user_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert default user streak
  INSERT INTO user_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_activity_date,
    last_visit_date,
    total_tests_taken,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    0, -- current_streak
    0, -- longest_streak
    NULL, -- last_activity_date
    NULL, -- last_visit_date
    0, -- total_tests_taken
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Default user streak created';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default user streak: ' || SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying DEFAULT 'razorpay'::character varying, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(success boolean, message text, payment_id character varying, amount numeric, currency character varying, plan_name character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_record RECORD;
  new_payment_id VARCHAR(100);
BEGIN
  -- Get plan details
  SELECT * INTO plan_record 
  FROM membership_plans 
  WHERE id = p_plan_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Plan not found or inactive', NULL::VARCHAR(100), NULL::DECIMAL(10,2), NULL::VARCHAR(3), NULL::VARCHAR(100);
    RETURN;
  END IF;
  
  -- Generate unique payment ID
  new_payment_id := 'PAY_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
  
  -- Create payment record
  INSERT INTO payments (
    payment_id,
    user_id,
    plan_id,
    plan_name,
    amount,
    currency,
    payment_method,
    status,
    metadata
  )
  VALUES (
    new_payment_id,
    p_user_id,
    p_plan_id,
    plan_record.name,
    plan_record.price,
    'INR',
    p_payment_method,
    'pending',
    p_metadata
  );
  
  RETURN QUERY SELECT true, 'Payment created successfully', new_payment_id, plan_record.price, 'INR', plan_record.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text DEFAULT 'membership'::text, p_membership_purchased boolean DEFAULT true, p_first_membership_only boolean DEFAULT true)
 RETURNS TABLE(success boolean, message text, transaction_id uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE
  transaction_id_val UUID;
  commission_amount_val DECIMAL(10,2);
BEGIN
  -- Calculate commission amount (50% of membership amount)
  commission_amount_val := p_amount * 0.50;
  
  -- Generate transaction ID
  transaction_id_val := gen_random_uuid();
  
  -- Insert referral transaction
  INSERT INTO referral_transactions (
    id,
    referrer_id,
    referred_id,
    referral_code,
    amount,
    transaction_type,
    status,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    transaction_id_val,
    p_referrer_id,
    p_referred_id,
    p_referral_code,
    p_amount,
    p_transaction_type,
    'completed',
    commission_amount_val,
    'pending',
    p_membership_purchased,
    p_first_membership_only,
    NOW(),
    NOW()
  );
  
  RETURN QUERY SELECT true, 'Referral transaction created successfully', transaction_id_val;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_referral_transaction_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  referrer_id_val UUID;
  referral_code_val TEXT;
  plan_amount_val DECIMAL(10,2);
BEGIN
  -- Only process completed payments
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Find referrer through user_profiles
  SELECT 
    up.referred_by,
    rc.code
  INTO 
    referral_code_val,
    referral_code_val
  FROM user_profiles up
  LEFT JOIN referral_codes rc ON up.referred_by = rc.code
  WHERE up.id = NEW.user_id
    AND up.referred_by IS NOT NULL;
  
  -- If no referral found, return
  IF referral_code_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get referrer_id
  SELECT user_id INTO referrer_id_val
  FROM referral_codes
  WHERE code = referral_code_val
  LIMIT 1;
  
  -- If referrer not found, return
  IF referrer_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate plan amount
  plan_amount_val := NEW.amount;
  
  -- Create referral transaction
  PERFORM create_referral_transaction(
    referrer_id_val,
    NEW.user_id,
    referral_code_val,
    plan_amount_val,
    'membership',
    true,
    true
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_referral_transaction_on_user_creation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  referrer_id_val UUID;
  referral_code_val TEXT;
BEGIN
  -- Only process if referral code is used
  IF NEW.referral_code_used IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get referrer_id from referral code
  SELECT user_id INTO referrer_id_val
  FROM referral_codes
  WHERE code = NEW.referral_code_used
  LIMIT 1;
  
  -- If referrer not found, return
  IF referrer_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create referral transaction for signup
  INSERT INTO referral_transactions (
    id,
    referrer_id,
    referred_id,
    referral_code,
    amount,
    transaction_type,
    status,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    referrer_id_val,
    NEW.id,
    NEW.referral_code_used,
    0.00,
    'referral_signup',
    'completed',
    0.00,
    'pending',
    false,
    true,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profile_if_missing(user_uuid uuid, user_phone text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user profile exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_uuid) THEN
    -- Create user profile
    INSERT INTO user_profiles (id, phone, created_at, updated_at)
    VALUES (user_uuid, user_phone, now(), now());
    
    -- Create referral code
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
    VALUES (
      user_uuid, 
      UPPER(SUBSTRING(MD5(user_uuid::TEXT) FROM 1 FOR 8)), 
      0, 
      0.00
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_referral_code(user_uuid uuid, custom_code character varying DEFAULT NULL::character varying)
 RETURNS TABLE(success boolean, message text, referral_code character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  generated_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  -- Generate or use custom code
  IF custom_code IS NOT NULL THEN
    -- Check if custom code is available
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = custom_code) INTO code_exists;
    IF code_exists THEN
      RETURN QUERY
      SELECT 
        false as success,
        'Referral code already exists' as message,
        NULL::VARCHAR as referral_code;
      RETURN;
    END IF;
    generated_code := custom_code;
  ELSE
    -- Generate random code
    generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Ensure uniqueness
    WHILE EXISTS(SELECT 1 FROM referral_codes WHERE code = generated_code) LOOP
      generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    END LOOP;
  END IF;
  
  -- Insert referral code
  INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings, is_active)
  VALUES (user_uuid, generated_code, 0, 0, true)
  ON CONFLICT (user_id) DO UPDATE SET
    code = EXCLUDED.code,
    is_active = true,
    updated_at = NOW();
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Referral code created successfully' as message,
    generated_code;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error creating referral code: ' || SQLERRM as message,
      NULL::VARCHAR as referral_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fix_all_pending_commissions()
 RETURNS TABLE(user_id uuid, success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  commission_result RECORD;
BEGIN
  -- Find all users who have payments but no commissions
  FOR user_record IN
    SELECT DISTINCT p.user_id
    FROM payments p
    WHERE p.status IN ('verified', 'paid', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM referral_commissions rc 
      WHERE rc.referred_id = p.user_id
    )
    AND EXISTS (
      SELECT 1 FROM referral_transactions rt 
      WHERE rt.referred_id = p.user_id 
      AND rt.status = 'pending'
    )
  LOOP
    -- Process commission for this user
    SELECT * INTO commission_result
    FROM process_existing_user_commission(user_record.user_id);
    
    RETURN QUERY
    SELECT 
      user_record.user_id,
      commission_result.success,
      commission_result.message,
      commission_result.commission_amount;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fix_existing_commissions()
 RETURNS TABLE(fixed_count integer, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  fixed_count_val INTEGER := 0;
  commission_record RECORD;
BEGIN
  -- Fix commissions with NULL referrer_id
  FOR commission_record IN
    SELECT 
      rc.id,
      rc.referred_id,
      rt.referrer_id,
      rt.referral_code,
      rt.amount,
      rt.commission_amount
    FROM referral_commissions rc
    LEFT JOIN referral_transactions rt ON rc.referred_id = rt.referred_id
    WHERE rc.referrer_id IS NULL
      AND rt.referrer_id IS NOT NULL
      AND rt.transaction_type = 'membership'
      AND rt.status = 'completed'
  LOOP
    -- Update commission with correct referrer_id
    UPDATE referral_commissions
    SET 
      referrer_id = commission_record.referrer_id,
      updated_at = NOW()
    WHERE id = commission_record.id;
    
    fixed_count_val := fixed_count_val + 1;
  END LOOP;
  
  -- Update all referral_codes tables
  UPDATE referral_codes
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0.00)
      FROM referral_commissions 
      WHERE referrer_id = referral_codes.user_id
    ),
    updated_at = NOW();
  
  RETURN QUERY SELECT fixed_count_val, 'Fixed ' || fixed_count_val || ' commissions';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fix_referral_transactions()
 RETURNS TABLE(fixed_count integer, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  fixed_count_val INTEGER := 0;
  transaction_record RECORD;
  referrer_id_val UUID;
BEGIN
  -- Fix referral transactions with missing referrer_id
  FOR transaction_record IN
    SELECT 
      rt.id,
      rt.referred_id,
      rt.referral_code,
      rt.amount,
      rt.commission_amount
    FROM referral_transactions rt
    WHERE rt.referrer_id IS NULL
      AND rt.referral_code IS NOT NULL
  LOOP
    -- Find referrer by referral code
    SELECT user_id INTO referrer_id_val
    FROM referral_codes
    WHERE code = transaction_record.referral_code
    LIMIT 1;
    
    -- Update transaction with correct referrer_id
    IF referrer_id_val IS NOT NULL THEN
      UPDATE referral_transactions
      SET 
        referrer_id = referrer_id_val,
        updated_at = NOW()
      WHERE id = transaction_record.id;
      
      fixed_count_val := fixed_count_val + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT fixed_count_val, 'Fixed ' || fixed_count_val || ' referral transactions';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fix_user_referral_relationships()
 RETURNS TABLE(fixed_count integer, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  fixed_count_val INTEGER := 0;
  user_record RECORD;
  referrer_id_val UUID;
BEGIN
  -- Fix user profiles with referral codes but missing referred_by
  FOR user_record IN
    SELECT 
      up.id,
      up.referral_code_used,
      rt.referrer_id
    FROM user_profiles up
    LEFT JOIN referral_transactions rt ON up.id = rt.referred_id
    WHERE up.referral_code_used IS NOT NULL
      AND up.referred_by IS NULL
      AND rt.referrer_id IS NOT NULL
  LOOP
    -- Update user profile with referral code
    UPDATE user_profiles
    SET 
      referred_by = user_record.referral_code_used,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    fixed_count_val := fixed_count_val + 1;
  END LOOP;
  
  RETURN QUERY SELECT fixed_count_val, 'Fixed ' || fixed_count_val || ' user referral relationships';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying)
 RETURNS TABLE(test_type character varying, test_id character varying, topic_id character varying, is_completed boolean, completed_at timestamp with time zone, score numeric, rank integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tc.test_type,
    tc.test_id,
    tc.topic_id,
    (tc.completed_at IS NOT NULL) as is_completed,
    tc.completed_at,
    COALESCE(tc.score, 0)::DECIMAL(5,2) as score,
    COALESCE(its.rank, 0)::INTEGER as rank
  FROM test_completions tc
  LEFT JOIN individual_test_scores its ON (
    its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = tc.test_type
    AND its.test_id = tc.test_id
  )
  WHERE tc.user_id = user_uuid 
    AND tc.exam_id = exam_name
  ORDER BY tc.test_type, tc.test_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_user_exam_stats(user_uuid uuid)
 RETURNS TABLE(exam_id character varying, total_tests integer, best_score integer, average_score numeric, rank integer, last_test_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    es.exam_id,
    es.total_tests,
    es.best_score,
    es.average_score,
    es.rank,
    es.last_test_date
  FROM exam_stats es
  WHERE es.user_id = user_uuid
  ORDER BY es.exam_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying)
 RETURNS TABLE(test_id character varying, is_completed boolean, completed_at timestamp with time zone, score numeric, rank integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tc.test_id,
    (tc.completed_at IS NOT NULL) as is_completed,
    tc.completed_at,
    COALESCE(tc.score, 0)::DECIMAL(5,2) as score,
    COALESCE(its.rank, 0)::INTEGER as rank
  FROM test_completions tc
  LEFT JOIN individual_test_scores its ON (
    its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = tc.test_id
  )
  WHERE tc.user_id = user_uuid 
    AND tc.exam_id = exam_name 
    AND tc.test_type = test_type_name
  ORDER BY tc.test_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_commission_constants()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN json_build_object(
    'commission_percentage', 50.00,
    'minimum_withdrawal', 100.00,
    'maximum_withdrawal', 10000.00,
    'processing_fee', 0.00,
    'tax_deduction', 0.00,
    'first_time_bonus', 0.00,
    'max_daily_withdrawals', 5,
    'withdrawal_processing_days', 3,
    'referral_code_length', 8,
    'referral_code_prefix', 'S2S'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_comprehensive_referral_stats(user_uuid uuid)
 RETURNS TABLE(referral_code character varying, total_referrals integer, total_commissions_earned numeric, paid_commissions numeric, pending_commissions numeric, cancelled_commissions numeric, active_referrals integer, completed_referrals integer, pending_referrals integer, referral_link text, code_created_at timestamp with time zone, last_referral_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rc.code as referral_code,
    COALESCE(rc.total_referrals, 0)::INTEGER as total_referrals,
    COALESCE(rc.total_earnings, 0.00) as total_commissions_earned,
    COALESCE(SUM(CASE WHEN rc_comm.status = 'paid' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as paid_commissions,
    COALESCE(SUM(CASE WHEN rc_comm.status = 'pending' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as pending_commissions,
    COALESCE(SUM(CASE WHEN rc_comm.status = 'refunded' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as cancelled_commissions,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END)::INTEGER as active_referrals,
    COUNT(CASE WHEN rt.status = 'completed' THEN 1 END)::INTEGER as completed_referrals,
    COUNT(CASE WHEN rt.status = 'pending' AND rt.membership_purchased = false THEN 1 END)::INTEGER as pending_referrals,
    CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
    rc.created_at as code_created_at,
    MAX(rt.created_at) as last_referral_date
  FROM referral_codes rc
  LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
  LEFT JOIN referral_commissions rc_comm ON rt.referred_id = rc_comm.referred_id
  WHERE rc.user_id = user_uuid
  GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_exam_leaderboard(exam_name character varying, limit_count integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, phone text, best_score integer, total_tests integer, average_score numeric, rank integer, last_test_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.phone,
    es.best_score,
    es.total_tests,
    es.average_score,
    es.rank,
    es.last_test_date
  FROM exam_stats es
  JOIN user_profiles up ON es.user_id = up.id
  WHERE es.exam_id = exam_name
  ORDER BY es.best_score DESC, es.last_test_date ASC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_membership_plans()
 RETURNS TABLE(id character varying, name character varying, description text, price numeric, original_price numeric, duration_days integer, duration_months integer, mock_tests integer, features jsonb, is_active boolean, display_order integer, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id,
    mp.name,
    mp.description,
    mp.price,
    mp.original_price,
    mp.duration_days,
    mp.duration_months,
    mp.mock_tests,
    mp.features,
    mp.is_active,
    mp.display_order,
    mp.created_at,
    mp.updated_at
  FROM membership_plans mp
  WHERE mp.is_active = true
  ORDER BY mp.display_order ASC, mp.price ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_uuid uuid, user_phone text)
 RETURNS TABLE(id uuid, phone text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Try to insert, ignore if exists
  INSERT INTO user_profiles (id, phone, created_at, updated_at)
  VALUES (user_uuid, user_phone, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  -- Return the user profile
  RETURN QUERY
  SELECT up.id, up.phone, up.created_at, up.updated_at
  FROM user_profiles up
  WHERE up.id = user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_payment_by_id(p_payment_id character varying)
 RETURNS TABLE(id uuid, payment_id character varying, user_id uuid, plan_id character varying, plan_name character varying, amount numeric, currency character varying, payment_method character varying, status character varying, razorpay_payment_id character varying, razorpay_order_id character varying, metadata jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.payment_id,
    p.user_id,
    p.plan_id,
    p.plan_name,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.razorpay_payment_id,
    p.razorpay_order_id,
    p.metadata,
    p.created_at,
    p.updated_at
  FROM payments p
  WHERE p.payment_id = p_payment_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_question_reports()
 RETURNS TABLE(id uuid, exam_id character varying, question_id character varying, question_number integer, issue_type character varying, issue_description text, user_id uuid, status character varying, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if question_reports table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_reports') THEN
    RETURN QUERY
    SELECT 
      qr.id,
      qr.exam_id,
      qr.question_id,
      qr.question_number,
      qr.issue_type,
      qr.issue_description,
      qr.user_id,
      qr.status,
      qr.created_at
    FROM question_reports qr
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_withdrawal_requests()
 RETURNS TABLE(id uuid, user_id uuid, amount numeric, status character varying, payment_details jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if referral_payouts table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_payouts') THEN
    RETURN QUERY
    SELECT 
      rp.id,
      rp.user_id,
      rp.amount,
      rp.status,
      jsonb_build_object(
        'method', rp.payment_method,
        'details', rp.account_details
      ) as payment_details,
      rp.created_at
    FROM referral_payouts rp
    WHERE rp.status = 'pending'
    ORDER BY rp.created_at DESC;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_plan_limit(p_plan text)
 RETURNS integer
 LANGUAGE sql
AS $function$
  select case p_plan when 'pro' then 3 when 'pro_plus' then 5 else 0 end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_referral_dashboard(user_uuid uuid)
 RETURNS TABLE(my_referral_code character varying, total_referrals integer, total_earnings numeric, pending_earnings numeric, paid_earnings numeric, referral_link text, recent_referrals jsonb, commission_breakdown jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH referral_stats AS (
    SELECT 
      rc.code,
      rc.total_referrals,
      rc.total_earnings,
      COALESCE(rc.total_earnings - COALESCE(SUM(rp.amount), 0), 0) as pending,
      COALESCE(SUM(rp.amount), 0) as paid
    FROM referral_codes rc
    LEFT JOIN referral_payouts rp ON rc.user_id = rp.user_id AND rp.status = 'completed'
    WHERE rc.user_id = user_uuid
    GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings
  ),
  recent_refs AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', rt.referred_id,
        'phone', up.phone,
        'signup_date', up.created_at,
        'status', rt.status,
        'commission', rt.commission_amount,
        'plan', um.plan_id
      ) ORDER BY up.created_at DESC
    ) as referrals
    FROM referral_transactions rt
    LEFT JOIN user_profiles up ON rt.referred_id = up.id
    LEFT JOIN user_memberships um ON rt.referred_id = um.user_id AND um.status = 'active'
    WHERE rt.referrer_id = user_uuid
  ),
  commission_breakdown AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'plan_id', rc.plan_id,
        'commission_percentage', rc.commission_percentage,
        'commission_amount', rc.commission_amount
      )
    ) as breakdown
    FROM referral_config rc
    WHERE rc.is_active = true
  )
  SELECT 
    rs.code,
    rs.total_referrals,
    rs.total_earnings,
    rs.pending,
    rs.paid,
    CONCAT('https://examace-smoky.vercel.app/auth?ref=', rs.code) as referral_link,
    COALESCE(rr.referrals, '[]'::jsonb) as recent_referrals,
    COALESCE(cb.breakdown, '[]'::jsonb) as commission_breakdown
  FROM referral_stats rs, recent_refs rr, commission_breakdown cb;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(limit_count integer DEFAULT 10)
 RETURNS TABLE(rank integer, user_id uuid, phone text, total_referrals integer, total_earnings numeric, referral_code character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY rc.total_referrals DESC, rc.total_earnings DESC)::INTEGER as rank,
    rc.user_id,
    up.phone,
    rc.total_referrals,
    rc.total_earnings,
    rc.code
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.total_referrals > 0
  ORDER BY rc.total_referrals DESC, rc.total_earnings DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_referral_network_detailed(user_uuid uuid)
 RETURNS TABLE(referred_user_id uuid, referred_phone_masked text, signup_date timestamp with time zone, referral_status text, commission_status text, commission_amount numeric, membership_plan text, membership_amount numeric, membership_date timestamp with time zone, is_first_membership boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rt.referred_id,
    CASE 
      WHEN LENGTH(up.phone) >= 10 THEN 
        (SUBSTRING(up.phone, 1, 3) || '****' || SUBSTRING(up.phone, LENGTH(up.phone) - 2))::TEXT
      ELSE up.phone::TEXT
    END as referred_phone_masked,
    up.created_at,
    rt.status::TEXT as referral_status,
    COALESCE(rc.status, 'pending')::TEXT as commission_status,
    COALESCE(rc.commission_amount, 0.00) as commission_amount,
    COALESCE(rc.membership_plan, 'none')::TEXT as membership_plan,
    COALESCE(rc.membership_amount, 0.00) as membership_amount,
    COALESCE(rc.created_at, up.created_at) as membership_date,
    COALESCE(rt.first_membership_only, false) as is_first_membership
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[])
 RETURNS TABLE(test_id character varying, is_completed boolean, completed_at timestamp with time zone, score numeric, rank integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tc.test_id,
    (tc.completed_at IS NOT NULL) as is_completed,
    tc.completed_at,
    COALESCE(tc.score, 0)::DECIMAL(5,2) as score,
    COALESCE(its.rank, 0)::INTEGER as rank
  FROM test_completions tc
  LEFT JOIN individual_test_scores its ON (
    its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = tc.test_id
  )
  WHERE tc.user_id = user_uuid 
    AND tc.exam_id = exam_name 
    AND tc.test_type = test_type_name
    AND tc.test_id = ANY(test_ids)
  ORDER BY tc.test_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_commission_history(user_uuid uuid)
 RETURNS TABLE(commission_id uuid, referred_user_id uuid, referred_phone character varying, membership_plan character varying, membership_amount numeric, commission_amount numeric, commission_percentage numeric, status character varying, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rc.id as commission_id,
    rc.referred_id as referred_user_id,
    up.phone as referred_phone,
    rc.membership_plan,
    rc.membership_amount,
    rc.commission_amount,
    rc.commission_percentage,
    rc.status,
    rc.created_at
  FROM referral_commissions rc
  LEFT JOIN user_profiles up ON rc.referred_id = up.id
  WHERE rc.referrer_id = user_uuid
  ORDER BY rc.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_comprehensive_stats(user_uuid uuid)
 RETURNS TABLE(exam_id character varying, total_tests integer, best_score integer, average_score numeric, rank integer, total_participants integer, percentile numeric, last_test_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    es.exam_id,
    es.total_tests,
    es.best_score,
    es.average_score,
    es.rank,
    COUNT(*) OVER(PARTITION BY es.exam_id) as total_participants,
    CASE 
      WHEN COUNT(*) OVER(PARTITION BY es.exam_id) > 0 
      THEN ((COUNT(*) OVER(PARTITION BY es.exam_id) - es.rank + 1) * 100.0) / COUNT(*) OVER(PARTITION BY es.exam_id)
      ELSE 0 
    END as percentile,
    es.last_test_date
  FROM exam_stats es
  WHERE es.user_id = user_uuid
  ORDER BY es.exam_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_exam_rank(user_uuid uuid, exam_name character varying)
 RETURNS TABLE(rank integer, total_participants integer, percentile numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_rank INTEGER;
  total_users INTEGER;
  percentile_score DECIMAL(5,2);
BEGIN
  -- Get user's rank and total participants
  SELECT 
    es.rank,
    COUNT(*) OVER() as total_count
  INTO user_rank, total_users
  FROM exam_stats es
  WHERE es.user_id = user_uuid AND es.exam_id = exam_name;
  
  -- Calculate percentile
  IF total_users > 0 THEN
    percentile_score := ((total_users - user_rank + 1) * 100.0) / total_users;
  ELSE
    percentile_score := 0;
  END IF;
  
  RETURN QUERY
  SELECT 
    user_rank,
    total_users,
    percentile_score;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_exam_stats(user_uuid uuid, exam_name character varying)
 RETURNS TABLE(total_tests integer, best_score integer, average_score numeric, rank integer, last_test_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    es.total_tests,
    es.best_score,
    es.average_score,
    es.rank,
    es.last_test_date
  FROM exam_stats es
  WHERE es.user_id = user_uuid AND es.exam_id = exam_name
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_membership_status(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSONB;
    v_old_membership RECORD;
    v_new_membership RECORD;
    v_plan_name TEXT;
    v_mock_tests INTEGER;
BEGIN
    -- Check old system (user_memberships + membership_plans)
    SELECT 
        um.plan_id,
        um.end_date,
        um.status,
        mp.name as plan_name,
        mp.mock_tests
    INTO v_old_membership
    FROM user_profiles up
    LEFT JOIN user_memberships um ON up.id = um.user_id AND um.status = 'active'
    LEFT JOIN membership_plans mp ON um.plan_id = mp.id
    WHERE up.id = user_uuid;

    -- Check new system (memberships table)
    SELECT 
        m.plan,
        m.end_date,
        m.mocks_used,
        CASE 
            WHEN m.plan = 'pro' THEN 'Pro Plan'
            WHEN m.plan = 'pro_plus' THEN 'Pro Plus Plan'
            ELSE 'Unknown Plan'
        END as plan_name,
        CASE 
            WHEN m.plan = 'pro' THEN 3
            WHEN m.plan = 'pro_plus' THEN 5
            ELSE 0
        END as mock_tests
    INTO v_new_membership
    FROM memberships m
    WHERE m.user_id = user_uuid;

    -- Determine which membership is active and more recent
    IF v_old_membership.plan_id IS NOT NULL AND v_old_membership.end_date > NOW() THEN
        -- Old system membership is active
        v_plan_name := v_old_membership.plan_name;
        v_mock_tests := v_old_membership.mock_tests;
        
        SELECT json_build_object(
            'has_active_membership', true,
            'current_plan', v_old_membership.plan_id,
            'expires_at', v_old_membership.end_date,
            'days_remaining', EXTRACT(DAY FROM (v_old_membership.end_date - NOW()))::INTEGER,
            'tests_available', v_mock_tests,
            'plan_name', v_plan_name,
            'system', 'old'
        ) INTO v_result;
        
    ELSIF v_new_membership.plan IS NOT NULL AND v_new_membership.end_date > NOW() THEN
        -- New system membership is active
        v_plan_name := v_new_membership.plan_name;
        v_mock_tests := v_new_membership.mock_tests;
        
        SELECT json_build_object(
            'has_active_membership', true,
            'current_plan', v_new_membership.plan,
            'expires_at', v_new_membership.end_date,
            'days_remaining', EXTRACT(DAY FROM (v_new_membership.end_date - NOW()))::INTEGER,
            'tests_available', v_mock_tests,
            'plan_name', v_plan_name,
            'system', 'new'
        ) INTO v_result;
        
    ELSE
        -- No active membership
        SELECT json_build_object(
            'has_active_membership', false,
            'current_plan', 'free',
            'expires_at', null,
            'days_remaining', 0,
            'tests_available', 0,
            'plan_name', 'Free Plan',
            'system', 'none'
        ) INTO v_result;
    END IF;

    RETURN COALESCE(v_result, json_build_object(
        'has_active_membership', false,
        'current_plan', 'free',
        'expires_at', null,
        'days_remaining', 0,
        'tests_available', 0,
        'plan_name', 'Free Plan',
        'system', 'none'
    ));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_payments(user_uuid uuid)
 RETURNS TABLE(id uuid, payment_id character varying, plan_id character varying, plan_name character varying, amount numeric, currency character varying, payment_method character varying, status character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.payment_id,
    p.plan_id,
    p.plan_name,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.created_at,
    p.updated_at
  FROM payments p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_performance_stats(exam_name character varying, user_uuid uuid)
 RETURNS TABLE(total_tests integer, total_score integer, average_score numeric, best_score integer, total_time_taken integer, average_time_per_question numeric, accuracy_percentage numeric, rank integer, percentile numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*) as test_count,
      SUM(score) as user_total_score,
      AVG(score) as avg_score,
      MAX(score) as best_score,
      SUM(time_taken) as total_time,
      AVG(time_taken::DECIMAL / NULLIF(total_questions, 0)) as avg_time_per_q,
      AVG((correct_answers::DECIMAL / NULLIF(total_questions, 0)) * 100) as accuracy
    FROM test_completions tc
    WHERE tc.user_id = user_uuid AND tc.exam_id = exam_name
  ),
  rank_stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE user_total_score > (SELECT user_total_score FROM user_stats)) as users_below
    FROM (
      SELECT user_id, SUM(score) as user_total_score
      FROM test_completions 
      WHERE exam_id = exam_name
      GROUP BY user_id
    ) all_users
  )
  SELECT 
    COALESCE(us.test_count, 0)::INTEGER as total_tests,
    COALESCE(us.user_total_score, 0)::INTEGER as total_score,
    COALESCE(us.avg_score, 0)::DECIMAL(5,2) as average_score,
    COALESCE(us.best_score, 0)::INTEGER as best_score,
    COALESCE(us.total_time, 0)::INTEGER as total_time_taken,
    COALESCE(us.avg_time_per_q, 0)::DECIMAL(5,2) as average_time_per_question,
    COALESCE(us.accuracy, 0)::DECIMAL(5,2) as accuracy_percentage,
    COALESCE(rs.users_below + 1, 1)::INTEGER as rank,
    COALESCE((rs.users_below::DECIMAL / NULLIF(rs.total_users, 0)) * 100, 0)::DECIMAL(5,2) as percentile
  FROM user_stats us, rank_stats rs;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_recent_completions(user_uuid uuid, limit_count integer DEFAULT 10)
 RETURNS TABLE(exam_id character varying, test_type character varying, test_id character varying, topic_id character varying, score integer, total_questions integer, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tc.exam_id,
    tc.test_type,
    tc.test_id,
    tc.topic_id,
    tc.score,
    tc.total_questions,
    tc.completed_at
  FROM test_completions tc
  WHERE tc.user_id = user_uuid
  ORDER BY tc.completed_at DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_referral_earnings(user_uuid uuid)
 RETURNS TABLE(total_earnings numeric, pending_earnings numeric, paid_earnings numeric, available_for_withdrawal numeric, min_withdrawal_amount numeric, can_withdraw boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(rc.total_earnings, 0.00) as total_earnings,
    COALESCE(SUM(rc_comm.commission_amount), 0.00) as pending_earnings,
    COALESCE(SUM(rp.amount), 0.00) as paid_earnings,
    GREATEST(0.00, COALESCE(SUM(rc_comm.commission_amount), 0.00) - COALESCE(SUM(rp.amount), 0.00)) as available_for_withdrawal,
    100.00 as min_withdrawal_amount,
    (COALESCE(SUM(rc_comm.commission_amount), 0.00) - COALESCE(SUM(rp.amount), 0.00)) >= 100.00 as can_withdraw
  FROM referral_codes rc
  LEFT JOIN referral_commissions rc_comm ON rc.user_id = rc_comm.referrer_id AND rc_comm.status = 'pending'
  LEFT JOIN referral_payouts rp ON rc.user_id = rp.user_id AND rp.status = 'completed'
  WHERE rc.user_id = user_uuid
  GROUP BY rc.total_earnings;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_referral_network(user_uuid uuid)
 RETURNS TABLE(referred_user_id uuid, referred_phone text, signup_date timestamp with time zone, status character varying, commission_earned numeric, membership_plan character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rt.referred_id,
    up.phone,
    up.created_at,
    rt.status,
    rt.commission_amount,
    um.plan_id
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN user_memberships um ON rt.referred_id = um.user_id AND um.status = 'active'
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_referral_payouts(user_uuid uuid, limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, amount numeric, status character varying, payment_method character varying, payment_reference character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.amount,
    rp.status,
    rp.payment_method,
    rp.payment_reference,
    rp.created_at,
    rp.updated_at
  FROM referral_payouts rp
  WHERE rp.user_id = user_uuid
  ORDER BY rp.created_at DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_referral_stats(user_uuid uuid)
 RETURNS TABLE(total_referrals integer, total_earnings numeric, pending_commission numeric, paid_commission numeric, referral_code character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(rc.total_referrals, 0) as total_referrals,
    COALESCE(rc.total_earnings, 0.00) as total_earnings,
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status = 'pending'), 
      0.00
    ) as pending_commission,
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status = 'paid'), 
      0.00
    ) as paid_commission,
    rc.code as referral_code
  FROM referral_codes rc
  WHERE rc.user_id = user_uuid AND rc.is_active = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_referral_transactions(user_uuid uuid, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, referred_user_id uuid, referred_user_phone text, referral_code character varying, amount numeric, transaction_type character varying, status character varying, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.referred_id as referred_user_id,
    up.phone as referred_user_phone,
    rt.referral_code,
    rt.amount,
    rt.transaction_type,
    rt.status,
    rt.created_at
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  WHERE rt.referrer_id = user_uuid
  ORDER BY rt.created_at DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_streak(user_uuid uuid)
 RETURNS TABLE(current_streak integer, longest_streak integer, last_activity_date date, total_tests_taken integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    us.current_streak,
    us.longest_streak,
    us.last_activity_date,
    us.total_tests_taken
  FROM user_streaks us
  WHERE us.user_id = user_uuid
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_test_attempts(p_user_id uuid, p_exam_id character varying DEFAULT NULL::character varying, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, exam_id character varying, test_type character varying, test_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, started_at timestamp with time zone, completed_at timestamp with time zone, answers jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.exam_id,
    ta.test_type,
    ta.test_id,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.time_taken,
    ta.started_at,
    ta.completed_at,
    ta.answers
  FROM test_attempts ta
  WHERE ta.user_id = p_user_id
    AND (p_exam_id IS NULL OR ta.exam_id = p_exam_id)
  ORDER BY ta.completed_at DESC NULLS LAST, ta.started_at DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_test_history(user_uuid uuid, exam_name character varying DEFAULT NULL::character varying, limit_count integer DEFAULT 50)
 RETURNS TABLE(test_id character varying, test_type character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ta.test_id,
    ta.test_type,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.time_taken,
    ta.completed_at
  FROM test_attempts ta
  WHERE ta.user_id = user_uuid
    AND (exam_name IS NULL OR ta.exam_id = exam_name)
  ORDER BY ta.completed_at DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying)
 RETURNS TABLE(score integer, total_questions integer, correct_answers integer, time_taken integer, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.total_questions,
    its.correct_answers,
    its.time_taken,
    its.completed_at
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_membership_refund(p_membership_transaction_id uuid)
 RETURNS TABLE(success boolean, message text, commission_revoked numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  commission_record RECORD;
  revoked_amount DECIMAL(10,2) := 0.00;
BEGIN
  -- Find the commission record
  SELECT * INTO commission_record
  FROM referral_commissions
  WHERE membership_transaction_id = p_membership_transaction_id
  AND status IN ('pending', 'paid');
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No commission found to revoke', 0.00;
    RETURN;
  END IF;
  
  revoked_amount := commission_record.commission_amount;
  
  -- Update commission status to refunded
  UPDATE referral_commissions
  SET 
    status = 'refunded',
    updated_at = NOW()
  WHERE id = commission_record.id;
  
  -- Update referral transaction
  UPDATE referral_transactions
  SET 
    commission_status = 'refunded',
    updated_at = NOW()
  WHERE referred_id = commission_record.referred_id
  AND commission_amount = commission_record.commission_amount;
  
  -- Deduct from referrer's total earnings
  UPDATE referral_codes
  SET 
    total_earnings = GREATEST(0, total_earnings - revoked_amount),
    updated_at = NOW()
  WHERE user_id = commission_record.referrer_id;
  
  RETURN QUERY SELECT true, 'Commission revoked successfully', revoked_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert user profile with proper error handling
  BEGIN
    INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
    VALUES (new.id, new.phone, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      updated_at = now();
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the auth user creation
      RAISE WARNING 'Failed to create user profile for %: %', new.id, SQLERRM;
      RETURN new;
  END;
  
  -- Create referral code with error handling
  BEGIN
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
    VALUES (
      new.id, 
      UPPER(SUBSTRING(MD5(new.id::TEXT) FROM 1 FOR 8)), 
      0, 
      0.00
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the auth user creation
      RAISE WARNING 'Failed to create referral code for %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text)
 RETURNS TABLE(success boolean, message text, profile_created boolean, referral_code_created boolean, exam_stats_created boolean, streak_created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_result BOOLEAN := false;
  referral_result BOOLEAN := false;
  stats_result BOOLEAN := false;
  streak_result BOOLEAN := false;
  error_message TEXT := '';
BEGIN
  -- 1. Create user profile
  BEGIN
    INSERT INTO user_profiles (id, phone, created_at, updated_at)
    VALUES (p_user_id, p_phone, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      updated_at = NOW();
    profile_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Profile error: ' || SQLERRM || '; ';
  END;
  
  -- 2. Create referral code
  BEGIN
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
    VALUES (
      p_user_id, 
      UPPER(SUBSTRING(MD5(p_user_id::TEXT) FROM 1 FOR 8)), 
      0, 
      0.00
    )
    ON CONFLICT (user_id) DO NOTHING;
    referral_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Referral error: ' || SQLERRM || '; ';
  END;
  
  -- 3. Create default exam stats
  BEGIN
    PERFORM create_all_default_exam_stats(p_user_id);
    stats_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Stats error: ' || SQLERRM || '; ';
  END;
  
  -- 4. Create user streak
  BEGIN
    PERFORM create_default_user_streak(p_user_id);
    streak_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Streak error: ' || SQLERRM || '; ';
  END;
  
  -- Return results
  IF profile_result AND referral_result AND stats_result AND streak_result THEN
    RETURN QUERY SELECT true, 'User initialized successfully', profile_result, referral_result, stats_result, streak_result;
  ELSE
    RETURN QUERY SELECT false, 'Partial initialization: ' || error_message, profile_result, referral_result, stats_result, streak_result;
  END IF;
  
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_user_exam_stats(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert default exam stats for common exams if they don't exist
  INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date)
  VALUES 
    (p_user_id, 'ssc-cgl', 0, 0, 0, NULL, NULL),
    (p_user_id, 'ssc-mts', 0, 0, 0, NULL, NULL),
    (p_user_id, 'railway', 0, 0, 0, NULL, NULL),
    (p_user_id, 'bank-po', 0, 0, 0, NULL, NULL),
    (p_user_id, 'airforce', 0, 0, 0, NULL, NULL)
  ON CONFLICT (user_id, exam_id) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb)
 RETURNS TABLE(success boolean, message text, attempt_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  generated_test_id VARCHAR(100);
  new_attempt_id UUID;
BEGIN
  -- Generate a unique test_id
  generated_test_id := 'test_' || p_exam_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  
  -- Insert the test attempt with all required fields
  INSERT INTO test_attempts (
    user_id,
    exam_id,
    test_id,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken,
    answers,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_exam_id,
    generated_test_id,
    'practice', -- default test type
    p_score,
    p_total_questions,
    p_correct_answers,
    p_time_taken,
    p_answers,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  RETURN QUERY SELECT true, 'Test attempt created successfully', new_attempt_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating test attempt: ' || SQLERRM, NULL::UUID;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer DEFAULT NULL::integer, answers jsonb DEFAULT NULL::jsonb, test_type character varying DEFAULT 'practice'::character varying, test_id character varying DEFAULT NULL::character varying)
 RETURNS TABLE(success boolean, message text, attempt_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_attempt_id UUID;
  generated_test_id VARCHAR(100);
BEGIN
  -- Generate test_id if not provided
  IF test_id IS NULL THEN
    generated_test_id := exam_id || '-' || test_type || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
  ELSE
    generated_test_id := test_id;
  END IF;
  
  -- Insert the test attempt
  INSERT INTO test_attempts (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    user_id, exam_id, test_type, generated_test_id, score, total_questions,
    correct_answers, time_taken, answers, NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Test attempt recorded successfully' as message,
    new_attempt_id;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error recording test attempt: ' || SQLERRM as message,
      NULL::UUID as attempt_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer DEFAULT NULL::integer, p_answers jsonb DEFAULT NULL::jsonb, p_test_type character varying DEFAULT NULL::character varying)
 RETURNS TABLE(success boolean, message text, attempt_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  detected_test_type VARCHAR(20);
  new_attempt_id UUID;
BEGIN
  -- Auto-detect test_type if not provided
  IF p_test_type IS NULL THEN
    -- Try to detect test type from test_id
    IF p_test_id LIKE '%mock%' THEN
      detected_test_type := 'mock';
    ELSIF p_test_id LIKE '%pyq%' OR p_test_id LIKE '%previous%' THEN
      detected_test_type := 'pyq';
    ELSIF p_test_id LIKE '%practice%' THEN
      detected_test_type := 'practice';
    ELSE
      detected_test_type := 'practice'; -- Default fallback
    END IF;
  ELSE
    detected_test_type := p_test_type;
  END IF;
  
  -- Insert the test attempt
  INSERT INTO test_attempts (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, detected_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers, NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Test attempt recorded successfully' as message,
    new_attempt_id;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error recording test attempt: ' || SQLERRM as message,
      NULL::UUID as attempt_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying DEFAULT NULL::character varying, p_test_type character varying DEFAULT 'practice'::character varying)
 RETURNS TABLE(success boolean, message text, attempt_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  generated_test_id VARCHAR(100);
  new_attempt_id UUID;
BEGIN
  -- Generate test_id if not provided
  IF p_test_id IS NULL OR p_test_id = '' THEN
    generated_test_id := 'test_' || p_exam_id || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  ELSE
    generated_test_id := p_test_id;
  END IF;
  
  -- Insert the test attempt
  INSERT INTO test_attempts (
    user_id,
    exam_id,
    test_id,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken,
    answers,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_exam_id,
    generated_test_id,
    p_test_type,
    p_score,
    p_total_questions,
    p_correct_answers,
    p_time_taken,
    p_answers,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_attempt_id;
  
  RETURN QUERY SELECT true, 'Test attempt created successfully', new_attempt_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating test attempt: ' || SQLERRM, NULL::UUID;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id UUID;
  admin_emails TEXT[] := ARRAY['admin@step2sarkari.com', 'support@step2sarkari.com'];
  user_email TEXT;
BEGIN
  -- If no user_id provided, get current user
  IF user_uuid IS NULL THEN
    target_user_id := auth.uid();
  ELSE
    target_user_id := user_uuid;
  END IF;
  
  -- If no user found, return false
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = target_user_id;
  
  -- If no email found, return false
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email is in admin list
  RETURN user_email = ANY(admin_emails);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying DEFAULT NULL::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  completion_exists BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM test_completions 
    WHERE user_id = user_uuid 
      AND exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name 
      AND (topic_id = topic_name OR (topic_id IS NULL AND topic_name IS NULL))
  ) INTO completion_exists;
  
  RETURN completion_exists;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user has admin role in user_profiles
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = user_uuid 
      AND (membership_plan = 'admin' OR membership_status = 'admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.payments_method_backfill()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.payment_method IS NULL THEN
    NEW.payment_method := 'upi';
  END IF;
  RETURN NEW;
END$function$
;

CREATE OR REPLACE FUNCTION public.payments_plan_backfill()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.plan_id IS NULL AND NEW.plan IS NOT NULL THEN
      NEW.plan_id := NEW.plan;
    END IF;
  END IF;
  RETURN NEW;
END$function$
;

CREATE OR REPLACE FUNCTION public.payments_plan_name_backfill()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.plan_name IS NULL AND NEW.plan IS NOT NULL THEN
    NEW.plan_name := CASE NEW.plan WHEN 'pro' THEN 'Pro' WHEN 'pro_plus' THEN 'Pro+' ELSE NEW.plan END;
  END IF;
  RETURN NEW;
END$function$
;

CREATE OR REPLACE FUNCTION public.process_existing_commission(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payment_record RECORD;
  commission_result RECORD;
BEGIN
  -- Find the latest payment for this user
  SELECT * INTO payment_record
  FROM payments
  WHERE user_id = p_user_id
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No verified payment found for user', 0.00;
    RETURN;
  END IF;
  
  -- Process commission
  RETURN QUERY
  SELECT * FROM process_membership_commission(
    p_user_id,
    payment_record.id,
    payment_record.plan,
    payment_record.amount::DECIMAL(10,2)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_existing_user_commission(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payment_record RECORD;
  commission_result RECORD;
BEGIN
  -- Find the latest verified payment for this user
  SELECT * INTO payment_record
  FROM payments
  WHERE user_id = p_user_id
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No verified payment found for user', 0.00;
    RETURN;
  END IF;
  
  -- Process commission
  RETURN QUERY
  SELECT * FROM process_membership_commission(
    p_user_id,
    payment_record.id,
    payment_record.plan,
    payment_record.amount::DECIMAL(10,2)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_membership_commission(p_payment_id uuid)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  payment_record RECORD;
  referrer_id_val UUID;
  referral_code_val TEXT;
  commission_amount_val DECIMAL(10,2);
  commission_percentage_val DECIMAL(5,2);
  membership_plan_val TEXT;
  membership_amount_val DECIMAL(10,2);
  is_first_membership_val BOOLEAN;
  commission_id UUID;
BEGIN
  -- Get payment details
  SELECT 
    p.user_id,
    p.plan,
    p.amount,
    p.currency,
    p.status
  INTO payment_record
  FROM payments p
  WHERE p.id = p_payment_id;
  
  -- Check if payment exists and is successful
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', 0.00;
    RETURN;
  END IF;
  
  IF payment_record.status != 'completed' THEN
    RETURN QUERY SELECT false, 'Payment not completed', 0.00;
    RETURN;
  END IF;
  
  -- Find referrer through referral_transactions
  SELECT 
    rt.referrer_id,
    rt.referral_code,
    rt.amount,
    rt.commission_amount,
    rt.first_membership_only
  INTO 
    referrer_id_val,
    referral_code_val,
    membership_amount_val,
    commission_amount_val,
    is_first_membership_val
  FROM referral_transactions rt
  WHERE rt.referred_id = payment_record.user_id
    AND rt.transaction_type = 'membership'
    AND rt.status = 'completed'
  ORDER BY rt.created_at DESC
  LIMIT 1;
  
  -- Check if referral exists
  IF referrer_id_val IS NULL THEN
    RETURN QUERY SELECT false, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  -- Check if commission already exists
  IF EXISTS (
    SELECT 1 FROM referral_commissions 
    WHERE referred_id = payment_record.user_id 
      AND referrer_id = referrer_id_val
  ) THEN
    RETURN QUERY SELECT false, 'Commission already exists', 0.00;
    RETURN;
  END IF;
  
  -- Set commission details
  membership_plan_val := payment_record.plan;
  commission_percentage_val := 50.00; -- 50% commission rate
  
  -- Create commission record
  commission_id := gen_random_uuid();
  
  INSERT INTO referral_commissions (
    id,
    referrer_id,
    referred_id,
    payment_id,
    commission_amount,
    commission_percentage,
    membership_plan,
    membership_amount,
    status,
    is_first_membership,
    created_at,
    updated_at
  ) VALUES (
    commission_id,
    referrer_id_val,
    payment_record.user_id,
    p_payment_id,
    commission_amount_val,
    commission_percentage_val,
    membership_plan_val,
    membership_amount_val,
    'pending',
    is_first_membership_val,
    NOW(),
    NOW()
  );
  
  -- Update referral_codes table with new earnings
  UPDATE referral_codes
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0.00)
      FROM referral_commissions 
      WHERE referrer_id = referrer_id_val
    ),
    updated_at = NOW()
  WHERE user_id = referrer_id_val;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount_val;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referral_record RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 50.00; -- 50% commission as specified
BEGIN
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  -- Check if this is the first membership (if first_membership_only is true)
  IF referral_record.first_membership_only THEN
    -- Check if user already has a completed membership
    IF EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = p_user_id 
      AND m.end_date > NOW()
    ) THEN
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate commission (50% of membership amount)
  commission_amount := (p_membership_amount * commission_percentage / 100);
  
  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    payment_id,
    commission_amount,
    commission_percentage,
    membership_plan,
    membership_amount,
    status,
    is_first_membership
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_payment_id,
    commission_amount,
    commission_percentage,
    p_membership_plan,
    p_membership_amount,
    'pending',
    referral_record.first_membership_only
  );
  
  -- Update referral transaction
  UPDATE referral_transactions
  SET 
    amount = p_membership_amount,
    transaction_type = 'membership',
    status = 'completed',
    commission_amount = commission_amount,
    commission_status = 'pending',
    membership_purchased = TRUE,
    updated_at = NOW()
  WHERE id = referral_record.id;
  
  -- Update referrer's total earnings
  UPDATE referral_codes
  SET 
    total_earnings = total_earnings + commission_amount,
    updated_at = NOW()
  WHERE user_id = referral_record.referrer_id;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_referral_commission(p_user_id uuid, p_payment_id character varying, p_membership_plan character varying, p_membership_amount numeric)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  referral_record RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 50.00; -- 50% commission constant
  minimum_withdrawal DECIMAL(10,2) := 100.00; -- Minimum withdrawal constant
BEGIN
  -- Debug: Log the input parameters
  RAISE NOTICE 'Processing commission for user: %, payment: %, plan: %, amount: %', 
    p_user_id, p_payment_id, p_membership_plan, p_membership_amount;
  
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No pending referral found for user: %', p_user_id;
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found referral record: %, referrer: %', referral_record.id, referral_record.referrer_id;
  
  -- Calculate commission amount
  commission_amount := (p_membership_amount * commission_percentage) / 100;
  
  -- Check if commission meets minimum withdrawal requirement
  IF commission_amount < minimum_withdrawal THEN
    RAISE NOTICE 'Commission amount % is below minimum withdrawal %', commission_amount, minimum_withdrawal;
    RETURN QUERY SELECT true, 'Commission amount below minimum withdrawal threshold', 0.00;
    RETURN;
  END IF;
  
  -- Update referral transaction status
  UPDATE referral_transactions
  SET status = 'completed',
      commission_amount = commission_amount,
      completed_at = NOW()
  WHERE id = referral_record.id;
  
  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    payment_id,
    membership_plan,
    membership_amount,
    commission_amount,
    commission_percentage,
    status,
    created_at
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_payment_id,
    p_membership_plan,
    p_membership_amount,
    commission_amount,
    commission_percentage,
    'pending',
    NOW()
  );
  
  RAISE NOTICE 'Commission processed successfully: %', commission_amount;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_referral_commission(p_user_id uuid, p_plan_id character varying, p_amount numeric, p_membership_transaction_id uuid)
 RETURNS TABLE(success boolean, message text, commission_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referral_record RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 50.00; -- 50% commission
BEGIN
  -- Find the referral relationship for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No pending referral found, no commission to process', 0.00;
    RETURN;
  END IF;

  -- Check if this is the first membership purchase for the referred user
  IF referral_record.first_membership_only THEN
    IF EXISTS (
      SELECT 1 FROM user_memberships um
      WHERE um.user_id = p_user_id
      AND um.status = 'active'
      AND um.end_date > NOW()
      AND um.id != p_membership_transaction_id
    ) THEN
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;

  -- Calculate commission
  commission_amount := (p_amount * commission_percentage / 100);

  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    membership_transaction_id,
    commission_amount,
    commission_percentage,
    membership_plan,
    membership_amount,
    status,
    is_first_membership
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_membership_transaction_id,
    commission_amount,
    commission_percentage,
    p_plan_id,
    p_amount,
    'pending',
    referral_record.first_membership_only
  );

  -- Update referral transaction
  UPDATE referral_transactions
  SET
    status = 'completed',
    amount = p_amount,
    commission_amount = commission_amount,
    commission_status = 'pending',
    membership_purchased = TRUE,
    updated_at = NOW()
  WHERE id = referral_record.id;

  -- Update referrer's total earnings
  UPDATE referral_codes
  SET
    total_earnings = total_earnings + commission_amount,
    updated_at = NOW()
  WHERE user_id = referral_record.referrer_id;

  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  withdrawal_record RECORD;
BEGIN
  -- Get the withdrawal request from referral_payouts table
  SELECT * INTO withdrawal_record
  FROM referral_payouts
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if already processed
  IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
    RETURN false;
  END IF;
  
  -- Process based on action
  IF action = 'approved' THEN
    -- Update withdrawal status
    UPDATE referral_payouts
    SET 
      status = 'approved',
      admin_notes = COALESCE(admin_notes, 'Approved by admin'),
      approved_at = NOW(),
      approved_by = admin_user_id,
      updated_at = NOW()
    WHERE id = request_id;
    
    -- Update referrer's earnings (deduct from pending)
    UPDATE referral_codes
    SET 
      total_earnings = GREATEST(0, total_earnings - withdrawal_record.amount),
      updated_at = NOW()
    WHERE user_id = withdrawal_record.user_id;
    
    RETURN true;
    
  ELSIF action = 'rejected' THEN
    -- Update withdrawal status
    UPDATE referral_payouts
    SET 
      status = 'rejected',
      admin_notes = COALESCE(admin_notes, 'Rejected by admin'),
      rejected_at = NOW(),
      rejected_by = admin_user_id,
      updated_at = NOW()
    WHERE id = request_id;
    
    RETURN true;
    
  ELSE
    RETURN false;
  END IF;
  
END;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_admin_user(admin_user_id uuid, target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the person removing is already an admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Deactivate the admin user
  UPDATE admin_users
  SET is_active = false, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying DEFAULT 'bank_transfer'::character varying)
 RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  available_balance DECIMAL(10,2);
  withdrawal_record_id UUID;
BEGIN
  -- Check available balance
  SELECT COALESCE(
    (SELECT SUM(commission_amount) 
     FROM referral_commissions 
     WHERE referrer_id = p_user_id AND status = 'pending'), 
    0.00
  ) INTO available_balance;
  
  IF available_balance < p_amount THEN
    RETURN QUERY SELECT false, 'Insufficient balance for withdrawal', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create withdrawal request
  INSERT INTO referral_payouts (
    user_id,
    amount,
    status,
    payment_method
  ) VALUES (
    p_user_id,
    p_amount,
    'pending',
    p_payment_method
  ) RETURNING id INTO withdrawal_record_id;
  
  -- Mark commissions as processing
  UPDATE referral_commissions
  SET status = 'processing'
  WHERE referrer_id = p_user_id 
  AND status = 'pending'
  AND id IN (
    SELECT id FROM referral_commissions 
    WHERE referrer_id = p_user_id AND status = 'pending'
    ORDER BY created_at ASC
    LIMIT (SELECT COUNT(*) FROM referral_commissions WHERE referrer_id = p_user_id AND status = 'pending')
  );
  
  RETURN QUERY SELECT true, 'Withdrawal request created successfully', withdrawal_record_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text)
 RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  earnings_info RECORD;
  withdrawal_id UUID;
BEGIN
  -- Get user's earnings info
  SELECT * INTO earnings_info
  FROM get_user_referral_earnings(p_user_id);

  -- Check if user can withdraw
  IF NOT earnings_info.can_withdraw THEN
    RETURN QUERY SELECT false, 'Insufficient balance for withdrawal. Minimum required: ₹100', NULL::UUID;
    RETURN;
  END IF;

  -- Check if amount is valid
  IF p_amount < 100.00 THEN
    RETURN QUERY SELECT false, 'Minimum withdrawal amount is ₹100', NULL::UUID;
    RETURN;
  END IF;

  IF p_amount > earnings_info.available_for_withdrawal THEN
    RETURN QUERY SELECT false, 'Amount exceeds available balance', NULL::UUID;
    RETURN;
  END IF;

  -- Create withdrawal request
  withdrawal_id := gen_random_uuid();

  INSERT INTO referral_payouts (
    id,
    user_id,
    amount,
    status,
    withdrawal_method,
    account_details,
    description
  ) VALUES (
    withdrawal_id,
    p_user_id,
    p_amount,
    'pending',
    p_withdrawal_method,
    p_account_details,
    'Withdrawal request for referral earnings'
  );

  RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', withdrawal_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_success BOOLEAN;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Get user_id from question report
  SELECT user_id INTO v_user_id
  FROM question_reports
  WHERE id = report_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the report with proper column qualification
  UPDATE question_reports
  SET 
    status = resolution,
    admin_notes = resolve_question_report.admin_notes, -- Use function parameter
    resolved_by = admin_user_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = report_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Send status message to user
  v_success := send_question_report_status_message(v_user_id, report_id, resolution, admin_notes);
  
  RETURN v_success;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
  v_exam_id VARCHAR(50);
  v_test_type VARCHAR(50);
  v_report_type VARCHAR(50);
BEGIN
  -- Get report details
  SELECT exam_id, test_type, report_type INTO v_exam_id, v_test_type, v_report_type
  FROM question_reports
  WHERE id = p_report_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create appropriate message based on status
  CASE p_status
    WHEN 'resolved' THEN
      v_title := 'Question Report Resolved';
      v_message := CONCAT(
        'Your question report for ', v_exam_id, ' - ', v_test_type, 
        ' (Issue: ', v_report_type, ') has been reviewed and resolved. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Admin notes: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Thank you for helping us improve our content quality.';
      END IF;
    WHEN 'rejected' THEN
      v_title := 'Question Report Rejected';
      v_message := CONCAT(
        'Your question report for ', v_exam_id, ' - ', v_test_type, 
        ' (Issue: ', v_report_type, ') has been reviewed but was not accepted. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Please contact support if you believe this is an error.';
      END IF;
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message
  INSERT INTO user_messages (user_id, message_type, title, message, related_id)
  VALUES (p_user_id, 'question_report_' || p_status, v_title, v_message, p_report_id);
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_plan_name_from_plan_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.plan_name IS NULL THEN
    NEW.plan_name := CASE 
      WHEN NEW.plan_id = 'pro' THEN 'Pro Plan'
      WHEN NEW.plan_id = 'pro_plus' THEN 'Pro Plus Plan'
      WHEN NEW.plan_id = 'free' THEN 'Free Plan'
      ELSE NEW.plan_id
    END;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer DEFAULT NULL::integer, p_answers jsonb DEFAULT NULL::jsonb, p_topic_id character varying DEFAULT NULL::character varying)
 RETURNS TABLE(success boolean, message text, new_best_score integer, new_average_score numeric, new_rank integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_stats RECORD;
  new_total_tests INTEGER;
  new_best_score INTEGER;
  new_average_score DECIMAL(5,2);
  new_rank INTEGER;
BEGIN
  -- Insert test attempt
  INSERT INTO test_attempts (
    user_id, exam_id, test_type, test_id, score, total_questions, 
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers, NOW()
  );
  
  -- Insert test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, score, total_questions,
    correct_answers, time_taken, answers
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = NOW();
  
  -- Insert/update individual test score
  INSERT INTO individual_test_scores (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    completed_at = EXCLUDED.completed_at;
  
  -- Get current exam stats
  SELECT total_tests, best_score, average_score, rank
  INTO current_stats
  FROM exam_stats
  WHERE user_id = p_user_id AND exam_id = p_exam_id;
  
  -- Calculate new stats
  IF NOT FOUND THEN
    -- Create new exam stats
    new_total_tests := 1;
    new_best_score := p_score;
    new_average_score := p_score;
    new_rank := NULL;
    
    INSERT INTO exam_stats (
      user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
    )
    VALUES (
      p_user_id, p_exam_id, new_total_tests, new_best_score, new_average_score, new_rank, NOW()
    );
  ELSE
    -- Update existing stats
    new_total_tests := current_stats.total_tests + 1;
    new_best_score := GREATEST(current_stats.best_score, p_score);
    new_average_score := (
      (current_stats.average_score * current_stats.total_tests + p_score) / new_total_tests
    );
    
    UPDATE exam_stats
    SET 
      total_tests = new_total_tests,
      best_score = new_best_score,
      average_score = new_average_score,
      last_test_date = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id AND exam_id = p_exam_id;
    
    -- Get updated rank
    SELECT rank INTO new_rank
    FROM exam_stats
    WHERE user_id = p_user_id AND exam_id = p_exam_id;
  END IF;
  
  -- Update user streak
  PERFORM update_user_streak(p_user_id);
  
  -- Return success with stats
  RETURN QUERY
  SELECT 
    true as success,
    'Test submitted successfully' as message,
    new_best_score,
    new_average_score,
    new_rank;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error submitting test: ' || SQLERRM as message,
      NULL::INTEGER as new_best_score,
      NULL::DECIMAL as new_average_score,
      NULL::INTEGER as new_rank;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_questions INTEGER := 1; -- Default, can be adjusted based on your logic
  correct_answers INTEGER;
  result JSONB;
BEGIN
  -- Calculate correct answers based on score percentage
  correct_answers := ROUND((score_value * total_questions) / 100.0);
  
  -- Insert or update individual test score
  INSERT INTO individual_test_scores (
    user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, completed_at
  )
  VALUES (
    user_uuid, exam_name, test_type_name, test_name, score_value, total_questions, correct_answers, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    completed_at = EXCLUDED.completed_at;
    
  -- Update user streak
  PERFORM update_user_streak(user_uuid);
  
  -- Return the inserted/updated record
  SELECT to_jsonb(its.*) INTO result
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_membership_to_profile(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  membership_record RECORD;
  profile_record RECORD;
BEGIN
  -- Get the latest active membership
  SELECT * INTO membership_record
  FROM user_memberships
  WHERE user_id = p_user_id AND end_date > NOW()
  ORDER BY start_date DESC
  LIMIT 1;
  
  -- Get current profile
  SELECT * INTO profile_record
  FROM user_profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update profile with membership info
  IF membership_record.plan_id IS NOT NULL THEN
    UPDATE user_profiles
    SET 
      membership_plan = membership_record.plan_id,
      membership_status = 'active',
      membership_expiry = membership_record.end_date,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying)
 RETURNS TABLE(success boolean, message text, transaction_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_transaction_id UUID;
  referrer_exists BOOLEAN;
  referred_exists BOOLEAN;
BEGIN
  -- Check if both users exist
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = referrer_uuid) INTO referrer_exists;
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = referred_uuid) INTO referred_exists;
  
  IF NOT referrer_exists THEN
    RETURN QUERY
    SELECT 
      false as success,
      'Referrer user not found' as message,
      NULL::UUID as transaction_id;
    RETURN;
  END IF;
  
  IF NOT referred_exists THEN
    RETURN QUERY
    SELECT 
      false as success,
      'Referred user not found' as message,
      NULL::UUID as transaction_id;
    RETURN;
  END IF;
  
  -- Insert referral transaction
  INSERT INTO referral_transactions (
    referrer_id, referred_id, referral_code, amount, transaction_type, status
  )
  VALUES (
    referrer_uuid, referred_uuid, referral_code_used, 10.00, 'signup', 'pending'
  )
  RETURNING id INTO new_transaction_id;
  
  -- Update referral code stats
  UPDATE referral_codes
  SET 
    total_referrals = total_referrals + 1,
    total_earnings = total_earnings + 10.00,
    updated_at = NOW()
  WHERE user_id = referrer_uuid AND code = referral_code_used;
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Referral tracked successfully' as message,
    new_transaction_id;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error tracking referral: ' || SQLERRM as message,
      NULL::UUID as transaction_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_sync_membership_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Sync membership data to user profile when membership is created/updated
  PERFORM sync_membership_to_profile(NEW.user_id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_daily_visit(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update user streak for daily visit
  INSERT INTO user_streaks (user_id, last_visit_date, current_streak, longest_streak)
  VALUES (user_uuid, CURRENT_DATE, 1, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_visit_date = CURRENT_DATE,
    current_streak = CASE 
      WHEN user_streaks.last_visit_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_visit_date = CURRENT_DATE 
      THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_visit_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_visit_date = CURRENT_DATE 
        THEN user_streaks.current_streak
        ELSE 1
      END
    ),
    updated_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_stats RECORD;
  new_total_tests INTEGER;
  new_best_score INTEGER;
  new_average_score DECIMAL(5,2);
  new_rank INTEGER;
  result JSONB;
BEGIN
  -- Get current stats
  SELECT total_tests, best_score, average_score, rank
  INTO current_stats
  FROM exam_stats
  WHERE user_id = user_uuid AND exam_id = exam_name;
  
  -- Calculate new values
  IF current_stats IS NULL THEN
    -- First test for this exam
    new_total_tests := 1;
    new_best_score := new_score;
    new_average_score := new_score;
    new_rank := 1;
  ELSE
    -- Update existing stats
    new_total_tests := current_stats.total_tests + 1;
    new_best_score := GREATEST(current_stats.best_score, new_score);
    new_average_score := ((current_stats.average_score * current_stats.total_tests) + new_score) / new_total_tests;
    new_rank := 1; -- Will be calculated by rank function later
  END IF;
  
  -- Insert or update exam stats
  INSERT INTO exam_stats (
    user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
  )
  VALUES (
    user_uuid, exam_name, new_total_tests, new_best_score, new_average_score, new_rank, NOW()
  )
  ON CONFLICT (user_id, exam_id)
  DO UPDATE SET
    total_tests = EXCLUDED.total_tests,
    best_score = EXCLUDED.best_score,
    average_score = EXCLUDED.average_score,
    rank = EXCLUDED.rank,
    last_test_date = EXCLUDED.last_test_date,
    updated_at = NOW();
  
  -- Return the updated stats
  SELECT to_jsonb(es.*) INTO result
  FROM exam_stats es
  WHERE es.user_id = user_uuid AND es.exam_id = exam_name;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying DEFAULT NULL::character varying, p_razorpay_order_id character varying DEFAULT NULL::character varying, p_razorpay_signature character varying DEFAULT NULL::character varying, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(success boolean, message text, payment_id character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update payment status
  UPDATE payments 
  SET 
    status = p_status,
    razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
    razorpay_order_id = COALESCE(p_razorpay_order_id, razorpay_order_id),
    razorpay_signature = COALESCE(p_razorpay_signature, razorpay_signature),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = NOW()
  WHERE payments.payment_id = p_payment_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Payment status updated successfully', p_payment_id;
  ELSE
    RETURN QUERY SELECT false, 'Payment not found', p_payment_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_referral_codes_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update referral_codes table when a new commission is created
  UPDATE referral_codes
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0.00)
      FROM referral_commissions 
      WHERE referrer_id = NEW.referrer_id
    ),
    updated_at = NOW()
  WHERE user_id = NEW.referrer_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_test_attempt_type(p_attempt_id uuid, p_test_type character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE test_attempts
  SET test_type = p_test_type
  WHERE id = p_attempt_id;
  
  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_test_attempts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  existing_streak RECORD;
  new_streak INTEGER := 1;
  new_longest_streak INTEGER;
  new_total_tests INTEGER;
BEGIN
  -- Get existing streak data
  SELECT current_streak, longest_streak, last_activity_date, total_tests_taken
  INTO existing_streak
  FROM user_streaks
  WHERE user_id = user_uuid;
  
  -- If no streak record exists, create one
  IF existing_streak IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken)
    VALUES (user_uuid, 1, 1, today_date, 1);
    RETURN;
  END IF;
  
  -- Calculate new streak
  IF existing_streak.last_activity_date = today_date THEN
    -- Already updated today, just increment total tests
    new_streak := existing_streak.current_streak;
    new_total_tests := existing_streak.total_tests_taken + 1;
  ELSIF existing_streak.last_activity_date = yesterday_date THEN
    -- Consecutive day, increment streak
    new_streak := existing_streak.current_streak + 1;
    new_total_tests := existing_streak.total_tests_taken + 1;
  ELSE
    -- Streak broken, reset to 1
    new_streak := 1;
    new_total_tests := existing_streak.total_tests_taken + 1;
  END IF;
  
  -- Calculate new longest streak
  new_longest_streak := GREATEST(existing_streak.longest_streak, new_streak);
  
  -- Update streak record
  UPDATE user_streaks
  SET 
    current_streak = new_streak,
    longest_streak = new_longest_streak,
    last_activity_date = today_date,
    total_tests_taken = new_total_tests,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken)
    VALUES (user_uuid, new_streak, new_longest_streak, today_date, new_total_tests);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer DEFAULT NULL::integer, p_last_test_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO exam_stats (
    user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date
  )
  VALUES (
    p_user_id, p_exam_id, p_total_tests, p_best_score, p_average_score, p_rank, p_last_test_date
  )
  ON CONFLICT (user_id, exam_id)
  DO UPDATE SET
    total_tests = EXCLUDED.total_tests,
    best_score = EXCLUDED.best_score,
    average_score = EXCLUDED.average_score,
    rank = EXCLUDED.rank,
    last_test_date = EXCLUDED.last_test_date,
    updated_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying DEFAULT NULL::character varying, p_time_taken integer DEFAULT NULL::integer, p_answers jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert or update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, 
    score, total_questions, correct_answers, time_taken, answers
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id,
    p_score, p_total_questions, p_correct_answers, p_time_taken, p_answers
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = NOW();
  
  -- Return the result
  SELECT to_jsonb(tc.*) INTO v_result
  FROM test_completions tc
  WHERE tc.user_id = p_user_id 
    AND tc.exam_id = p_exam_id 
    AND tc.test_type = p_test_type 
    AND tc.test_id = p_test_id 
    AND (tc.topic_id = p_topic_id OR (tc.topic_id IS NULL AND p_topic_id IS NULL));
  
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying)
 RETURNS TABLE(success boolean, message text, referrer_id uuid, referrer_phone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  referrer_record record;
  user_record record;
  existing_referral record;
begin
  select * into user_record from user_profiles where id = p_user_id;
  if user_record.referral_code_applied then
    return query select false, 'Referral code already applied', null::uuid, null::text;
    return;
  end if;

  select rc.user_id into referrer_record
  from referral_codes rc
  where rc.code = upper(p_referral_code) and rc.user_id = p_user_id;
  if found then
    return query select false, 'Cannot use your own referral code', null::uuid, null::text;
    return;
  end if;

  select rc.user_id, up.phone into referrer_record
  from referral_codes rc
  left join user_profiles up on rc.user_id = up.id
  where rc.code = upper(p_referral_code) and rc.is_active = true;
  if not found then
    return query select false, 'Invalid referral code', null::uuid, null::text;
    return;
  end if;

  select * into existing_referral from referral_transactions where referred_id = p_user_id;
  if found then
    return query select false, 'Referral code already applied', null::uuid, null::text;
    return;
  end if;

  update user_profiles
  set referral_code_applied = true,
      referral_code_used = upper(p_referral_code),
      referral_applied_at = now(),
      updated_at = now()
  where id = p_user_id;

  insert into referral_transactions (
    referrer_id, referred_id, referral_code, amount, transaction_type, status,
    commission_amount, commission_status, first_membership_only
  ) values (
    referrer_record.user_id,
    p_user_id,
    upper(p_referral_code),
    0.00,
    'signup',
    'pending',
    0.00,
    'pending',
    true
  );

  update referral_codes
  set total_referrals = total_referrals + 1,
      updated_at = now()
  where user_id = referrer_record.user_id;

  return query select true, 'Referral code applied successfully', referrer_record.user_id, (referrer_record.phone)::text;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code character varying)
 RETURNS TABLE(is_valid boolean, message text, referrer_id uuid, referrer_phone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Find the referrer by code
  SELECT rc.user_id, up.phone INTO referrer_record
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.code = UPPER(p_referral_code);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Valid referral code', referrer_record.user_id, referrer_record.phone;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_referral_code_for_signup(p_referral_code character varying)
 RETURNS TABLE(valid boolean, message text, referrer_id uuid, referrer_phone character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Check if referral code exists and is active
  SELECT rc.user_id, up.phone INTO referrer_record
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.code = UPPER(p_referral_code) AND rc.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::VARCHAR(15);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Valid referral code', referrer_record.user_id, referrer_record.phone;
END;
$function$
;


  create policy "Service role can manage all commissions"
  on "public"."referral_commissions"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Users can view their own commissions"
  on "public"."referral_commissions"
  as permissive
  for select
  to public
using (((auth.uid() = referrer_id) OR (auth.uid() = referred_id)));



  create policy "Users can create their own payout requests"
  on "public"."referral_payouts"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own payouts"
  on "public"."referral_payouts"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



