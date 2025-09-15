-- Ensure referral network shows membership info from memberships or profile snapshot
drop function if exists get_referral_network_detailed(uuid);

create or replace function get_referral_network_detailed(user_uuid uuid)
returns table (
  referred_user_id uuid,
  referred_phone_masked text,
  signup_date timestamptz,
  referral_status text,
  commission_status text,
  commission_amount numeric,
  membership_plan text,
  membership_amount numeric,
  membership_date timestamptz,
  is_first_membership boolean
) language plpgsql security definer set search_path = public as $$
begin
  return query
  select 
    rt.referred_id,
    case when length(up.phone) >= 10 then substring(up.phone, 1, 3) || '****' || substring(up.phone, length(up.phone) - 2) else up.phone end as referred_phone_masked,
    up.created_at,
    rt.status as referral_status,
    coalesce(rc.status, 'pending') as commission_status,
    coalesce(rc.commission_amount, 0.00) as commission_amount,
    -- Prefer live memberships table; fallback to profile snapshot
    coalesce(m.plan, up.membership_plan, 'none') as membership_plan,
    coalesce(rc.membership_amount, 0.00) as membership_amount,
    coalesce(rc.created_at, m.start_date, up.created_at) as membership_date,
    coalesce(rc.is_first_membership, false) as is_first_membership
  from referral_transactions rt
  left join user_profiles up on rt.referred_id = up.id
  left join referral_commissions rc on rt.referred_id = rc.referred_id
  left join memberships m on m.user_id = rt.referred_id
  where rt.referrer_id = user_uuid
  order by up.created_at desc;
end;$$;

grant execute on function get_referral_network_detailed(uuid) to authenticated;

