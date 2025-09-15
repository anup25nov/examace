-- Fix return type mismatch in validate_and_apply_referral_code (cast phone to TEXT)
drop function if exists validate_and_apply_referral_code(uuid, varchar);

create or replace function validate_and_apply_referral_code(
  p_user_id uuid,
  p_referral_code varchar(20)
)
returns table (
  success boolean,
  message text,
  referrer_id uuid,
  referrer_phone text
) language plpgsql security definer set search_path = public as $$
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
$$;

grant execute on function validate_and_apply_referral_code(uuid, varchar) to authenticated;

