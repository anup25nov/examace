--
-- PostgreSQL database dump
--

\restrict gmjExlzfo4J94AH42ZgFw6XhFauCrSJkKbLXujWOcLWYBIS4qX06fpzi2hpKeVm

-- Dumped from database version 17.4
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: activate_or_upgrade_membership(uuid, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone) RETURNS TABLE(plan text, start_date date, end_date date, mocks_used integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone) OWNER TO postgres;

--
-- Name: activate_or_upgrade_membership(uuid, character varying, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone) RETURNS TABLE(plan character varying, start_date timestamp with time zone, end_date timestamp with time zone, status character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone) OWNER TO postgres;

--
-- Name: add_admin_user(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying DEFAULT 'admin'::character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying) OWNER TO postgres;

--
-- Name: admin_verify_payment(character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_verify_payment(p_payment_id character varying, p_admin_notes text DEFAULT NULL::text) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.admin_verify_payment(p_payment_id character varying, p_admin_notes text) OWNER TO postgres;

--
-- Name: apply_referral_code(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code text) RETURNS TABLE(success boolean, message text, referrer_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    referrer_record record;
    referrer_id_val UUID;
BEGIN
    -- Check if referral code exists and is active
    SELECT user_id INTO referrer_id_val
    FROM public.referral_codes
    WHERE code = p_referral_code AND is_active = true AND user_id != p_user_id;
    
    IF referrer_id_val IS NULL THEN
        RETURN QUERY SELECT false, 'Referral code not found or inactive', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if user is already referred
    IF EXISTS (
        SELECT 1 FROM public.referral_transactions 
        WHERE referred_id = p_user_id
    ) THEN
        RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
        RETURN;
    END IF;
    
    -- Create referral transaction
    INSERT INTO public.referral_transactions (
        referrer_id,
        referred_id,
        referral_code,
        status,
        transaction_type,
        amount,
        commission_amount,
        commission_status,
        membership_purchased,
        first_membership_only
    ) VALUES (
        referrer_id_val,
        p_user_id,
        p_referral_code,
        'pending', -- Initial status
        'referral_signup', -- Type for initial signup
        0.00, -- No amount for signup
        0.00, -- No commission for signup
        'pending',
        false,
        true
    );
    
    -- Update referrer's referral count
    UPDATE public.referral_codes
    SET 
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE user_id = referrer_id_val;
    
    -- Update user profile with referral code
    UPDATE public.user_profiles
    SET 
        referred_by = p_referral_code,
        referral_code_applied = true,
        referral_code_used = p_referral_code,
        referral_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_id_val;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error applying referral code: ' || SQLERRM, NULL::UUID;
END;
$$;


ALTER FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code text) OWNER TO postgres;

--
-- Name: attempt_use_mock(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.attempt_use_mock(p_user uuid) RETURNS TABLE(allowed boolean, message text, plan text, mocks_used integer, plan_limit integer, end_date date)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.attempt_use_mock(p_user uuid) OWNER TO postgres;

--
-- Name: can_make_withdrawal_request(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.can_make_withdrawal_request(user_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if user has any pending withdrawal requests
  RETURN NOT EXISTS (
    SELECT 1 FROM withdrawal_requests 
    WHERE user_id = user_uuid 
    AND status IN ('pending', 'processing')
  );
END;
$$;


ALTER FUNCTION public.can_make_withdrawal_request(user_uuid uuid) OWNER TO postgres;

--
-- Name: cancel_user_membership(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_user_membership(p_user_id uuid, p_reason text DEFAULT 'User requested cancellation'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_membership_id UUID;
BEGIN
  -- Get active membership
  SELECT id INTO v_membership_id
  FROM user_memberships
  WHERE user_id = p_user_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active membership found'
    );
  END IF;
  
  -- Update membership status
  UPDATE user_memberships
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = v_membership_id;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    membership_plan = NULL,
    membership_expiry = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cancelled_at', NOW()
  );
END;
$$;


ALTER FUNCTION public.cancel_user_membership(p_user_id uuid, p_reason text) OWNER TO postgres;

--
-- Name: FUNCTION cancel_user_membership(p_user_id uuid, p_reason text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.cancel_user_membership(p_user_id uuid, p_reason text) IS 'Cancels user membership and updates profile';


--
-- Name: cancel_withdrawal_request(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_withdrawal_request(p_withdrawal_id uuid, p_admin_notes text DEFAULT 'Cancelled by user request'::text) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Update the withdrawal request status
    UPDATE withdrawal_requests 
    SET 
        status = 'cancelled',
        admin_notes = p_admin_notes,
        updated_at = NOW()
    WHERE id = p_withdrawal_id;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Withdrawal request cancelled successfully';
    ELSE
        RETURN QUERY SELECT false, 'Withdrawal request not found';
    END IF;
END;
$$;


ALTER FUNCTION public.cancel_withdrawal_request(p_withdrawal_id uuid, p_admin_notes text) OWNER TO postgres;

--
-- Name: check_commission_status(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_commission_status(p_user_id uuid) RETURNS TABLE(has_payment boolean, has_commission boolean, has_referral boolean, payment_id uuid, commission_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.check_commission_status(p_user_id uuid) OWNER TO postgres;

--
-- Name: check_existing_question_report(uuid, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_existing_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying) RETURNS TABLE(has_pending_report boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT EXISTS(
        SELECT 1 FROM question_reports 
        WHERE user_id = p_user_id
          AND exam_id = p_exam_id
          AND test_type = p_test_type
          AND test_id = p_test_id
          AND question_id = p_question_id
          AND status = 'pending'
    );
END;
$$;


ALTER FUNCTION public.check_existing_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying) OWNER TO postgres;

--
-- Name: check_phone_exists(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_phone_exists(phone_number text) RETURNS TABLE(phone_exists boolean, user_id uuid, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.check_phone_exists(phone_number text) OWNER TO postgres;

--
-- Name: check_premium_access(uuid, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_premium_access(user_id uuid, exam_id character varying, test_type character varying, test_id character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  is_premium BOOLEAN;
  has_membership BOOLEAN;
BEGIN
  -- Check if test is premium
  SELECT exam_test_data.is_premium INTO is_premium
  FROM exam_test_data
  WHERE exam_test_data.exam_id = check_premium_access.exam_id
    AND exam_test_data.test_type = check_premium_access.test_type
    AND exam_test_data.test_id = check_premium_access.test_id;
  
  -- If not premium, allow access
  IF NOT is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active membership
  SELECT EXISTS(
    SELECT 1 FROM user_memberships
    WHERE user_memberships.user_id = check_premium_access.user_id
      AND user_memberships.status = 'active'
  ) INTO has_membership;
  
  RETURN has_membership;
END;
$$;


ALTER FUNCTION public.check_premium_access(user_id uuid, exam_id character varying, test_type character varying, test_id character varying) OWNER TO postgres;

--
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_otps() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM otps WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_otps() OWNER TO postgres;

--
-- Name: cleanup_expired_test_shares(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_test_shares() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE public.test_shares 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_test_shares() OWNER TO postgres;

--
-- Name: complete_payment(character varying, character varying, character varying, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS TABLE(success boolean, message text, payment_id character varying, user_id uuid, plan_id character varying, commission_processed boolean, commission_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) OWNER TO postgres;

--
-- Name: create_all_default_exam_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_all_default_exam_stats(p_user_id uuid) RETURNS TABLE(success boolean, message text, stats_created integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    exam_id VARCHAR(50);
    stats_count INTEGER := 0;
    attempted_exams TEXT[] := ARRAY['ssc-cgl', 'ssc-mts', 'ssc-chsl', 'ssc-cpo', 'ssc-je', 'ssc-gd', 'ssc-constable', 'ssc-stenographer', 'ssc-multitasking', 'ssc-havaldar'];
BEGIN
    -- Loop through each exam
    FOR exam_id IN 
        SELECT DISTINCT exam_id FROM unnest(attempted_exams) AS exam_id
    LOOP
        -- Insert default exam stats for this exam
        INSERT INTO exam_stats (
            user_id,
            exam_id,
            total_tests,
            best_score,
            average_score,
            rank,
            last_test_date,
            total_tests_taken,
            total_score,
            total_time_taken,
            average_time_per_question,
            accuracy_percentage,
            percentile
        )
        VALUES (
            p_user_id,
            exam_id,
            0,
            0,
            0.00,
            NULL,
            NULL,
            0,
            0,
            0,
            0.00,
            0.00,
            0.00
        )
        ON CONFLICT (user_id, exam_id) DO NOTHING;
        
        stats_count := stats_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT true, 'Default exam stats created successfully', stats_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating exam stats: ' || SQLERRM, 0;
END;
$$;


ALTER FUNCTION public.create_all_default_exam_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: create_default_exam_stats(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Insert default exam stats for the specific exam
    INSERT INTO exam_stats (
        user_id,
        exam_id,
        total_tests,
        best_score,
        average_score,
        rank,
        last_test_date,
        total_tests_taken,
        total_score,
        total_time_taken,
        average_time_per_question,
        accuracy_percentage,
        percentile
    )
    VALUES (
        p_user_id,
        p_exam_id,
        0,
        0,
        0.00,
        NULL,
        NULL,
        0,
        0,
        0,
        0.00,
        0.00,
        0.00
    )
    ON CONFLICT (user_id, exam_id) DO NOTHING;
    
    RETURN QUERY SELECT true, 'Default exam stats created for ' || p_exam_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating exam stats: ' || SQLERRM;
END;
$$;


ALTER FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying) OWNER TO postgres;

--
-- Name: create_default_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_default_user_streak(p_user_id uuid) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.create_default_user_streak(p_user_id uuid) OWNER TO postgres;

--
-- Name: create_membership_transaction(uuid, uuid, uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_membership_transaction(p_user_id uuid, p_membership_id uuid, p_transaction_id uuid, p_amount numeric, p_currency text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.membership_transactions (
        user_id, membership_id, transaction_id, amount, currency, status, payment_method
    ) VALUES (
        p_user_id, p_membership_id, p_transaction_id, p_amount, p_currency, 'completed', 'razorpay'
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION public.create_membership_transaction(p_user_id uuid, p_membership_id uuid, p_transaction_id uuid, p_amount numeric, p_currency text) OWNER TO postgres;

--
-- Name: create_or_update_membership(uuid, text, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_or_update_membership(p_user_id uuid, p_plan_id text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_membership_id uuid;
BEGIN
    -- Check if membership exists
    SELECT id INTO v_membership_id
    FROM public.user_memberships
    WHERE user_id = p_user_id
    LIMIT 1;
    
    IF v_membership_id IS NOT NULL THEN
        -- Update existing membership
        UPDATE public.user_memberships
        SET 
            plan_id = p_plan_id,
            start_date = p_start_date,
            end_date = p_end_date,
            status = 'active',
            updated_at = NOW()
        WHERE id = v_membership_id;
    ELSE
        -- Create new membership
        INSERT INTO public.user_memberships (
            user_id, plan_id, start_date, end_date, status
        ) VALUES (
            p_user_id, p_plan_id, p_start_date, p_end_date, 'active'
        ) RETURNING id INTO v_membership_id;
    END IF;
    
    RETURN v_membership_id;
END;
$$;


ALTER FUNCTION public.create_or_update_membership(p_user_id uuid, p_plan_id text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) OWNER TO postgres;

--
-- Name: create_payment(uuid, character varying, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying DEFAULT 'razorpay'::character varying, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS TABLE(success boolean, message text, payment_id character varying, amount numeric, currency character varying, plan_name character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying, p_metadata jsonb) OWNER TO postgres;

--
-- Name: create_payment_record(text, uuid, text, text, numeric, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_payment_record(p_payment_id text, p_user_id uuid, p_plan_id text, p_plan_name text, p_amount numeric, p_razorpay_order_id text DEFAULT NULL::text, p_payment_method text DEFAULT 'razorpay'::text, p_status text DEFAULT 'pending'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_payment_id TEXT;
BEGIN
  -- Insert payment record
  INSERT INTO payments (
    payment_id,
    user_id,
    plan_id,
    plan_name,
    amount,
    razorpay_order_id,
    payment_method,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_payment_id,
    p_user_id,
    p_plan_id,
    p_plan_name,
    p_amount,
    p_razorpay_order_id,
    p_payment_method,
    p_status,
    NOW(),
    NOW()
  ) RETURNING id, payment_id INTO v_payment_id;

  -- Return success response
  v_result := json_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'id', v_payment_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
END;
$$;


ALTER FUNCTION public.create_payment_record(p_payment_id text, p_user_id uuid, p_plan_id text, p_plan_name text, p_amount numeric, p_razorpay_order_id text, p_payment_method text, p_status text) OWNER TO postgres;

--
-- Name: create_referral_transaction(uuid, uuid, text, numeric, text, boolean, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text DEFAULT 'membership'::text, p_membership_purchased boolean DEFAULT true, p_first_membership_only boolean DEFAULT true) RETURNS TABLE(success boolean, message text, transaction_id uuid)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text, p_membership_purchased boolean, p_first_membership_only boolean) OWNER TO postgres;

--
-- Name: create_referral_transaction_on_payment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_referral_transaction_on_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.create_referral_transaction_on_payment() OWNER TO postgres;

--
-- Name: create_referral_transaction_on_user_creation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_referral_transaction_on_user_creation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.create_referral_transaction_on_user_creation() OWNER TO postgres;

--
-- Name: create_user_profile_if_missing(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_user_profile_if_missing(user_uuid uuid, user_phone text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.create_user_profile_if_missing(user_uuid uuid, user_phone text) OWNER TO postgres;

--
-- Name: create_user_referral_code(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_user_referral_code(p_user_uuid uuid, p_custom_code text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_referral_code text;
    v_code_exists boolean := false;
    v_user_exists boolean := false;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_user_uuid) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found',
            'referral_code', NULL
        );
    END IF;
    
    -- Check if user already has a referral code
    IF EXISTS(SELECT 1 FROM public.referral_codes WHERE user_id = p_user_uuid) THEN
        SELECT code INTO v_referral_code FROM public.referral_codes WHERE user_id = p_user_uuid;
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User already has a referral code',
            'referral_code', v_referral_code
        );
    END IF;
    
    -- Generate referral code
    IF p_custom_code IS NOT NULL THEN
        v_referral_code := UPPER(p_custom_code);
    ELSE
        -- Generate alphanumeric referral code with guaranteed uniqueness
        v_referral_code := generate_alphanumeric_referral_code();
    END IF;
    
    -- Check if code already exists and regenerate if needed
    LOOP
        SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_referral_code) INTO v_code_exists;
        EXIT WHEN NOT v_code_exists;
        v_referral_code := generate_alphanumeric_referral_code();
    END LOOP;
    
    -- Insert referral code
    INSERT INTO public.referral_codes (
        user_id,
        code,
        created_at,
        updated_at
    ) VALUES (
        p_user_uuid,
        v_referral_code,
        NOW(),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Referral code created successfully',
        'referral_code', v_referral_code
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error creating referral code: ' || SQLERRM,
            'referral_code', NULL
        );
END;
$$;


ALTER FUNCTION public.create_user_referral_code(p_user_uuid uuid, p_custom_code text) OWNER TO postgres;

--
-- Name: debug_commission_status(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.debug_commission_status(p_user_id uuid) RETURNS TABLE(user_id uuid, has_referral boolean, referral_status text, membership_count integer, commission_count integer, total_commission numeric, referral_codes_earnings numeric, last_membership_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_user_id,
    EXISTS(SELECT 1 FROM referral_transactions WHERE referred_id = p_user_id) as has_referral,
    COALESCE(rt.status, 'none') as referral_status,
    (SELECT COUNT(*) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as membership_count,
    (SELECT COUNT(*) FROM referral_commissions WHERE referred_id = p_user_id) as commission_count,
    (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_commissions WHERE referred_id = p_user_id) as total_commission,
    (SELECT COALESCE(rc.total_earnings, 0) FROM referral_codes rc 
     JOIN referral_transactions rt ON rc.user_id = rt.referrer_id 
     WHERE rt.referred_id = p_user_id LIMIT 1) as referral_codes_earnings,
    (SELECT MAX(created_at) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as last_membership_date
  FROM referral_transactions rt
  WHERE rt.referred_id = p_user_id
  LIMIT 1;
  
  -- If no referral found, return basic info
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p_user_id,
      false as has_referral,
      'none' as referral_status,
      (SELECT COUNT(*) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as membership_count,
      (SELECT COUNT(*) FROM referral_commissions WHERE referred_id = p_user_id) as commission_count,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_commissions WHERE referred_id = p_user_id) as total_commission,
      0 as referral_codes_earnings,
      (SELECT MAX(created_at) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as last_membership_date;
  END IF;
END;
$$;


ALTER FUNCTION public.debug_commission_status(p_user_id uuid) OWNER TO postgres;

--
-- Name: diagnose_user_messages_schema(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.diagnose_user_messages_schema() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.diagnose_user_messages_schema() OWNER TO postgres;

--
-- Name: find_pending_payment(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_pending_payment(p_order_id text) RETURNS TABLE(id uuid, user_id uuid, plan_id text, plan_name text, amount numeric, currency text, status text, razorpay_order_id text, razorpay_payment_id text, paid_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.plan_id,
        p.plan_name,
        p.amount,
        p.currency,
        p.status,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.paid_at,
        p.created_at,
        p.updated_at
    FROM public.payments p
    WHERE p.razorpay_order_id = p_order_id 
    AND p.status = 'pending'
    ORDER BY p.created_at DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.find_pending_payment(p_order_id text) OWNER TO postgres;

--
-- Name: fix_all_pending_commissions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fix_all_pending_commissions() RETURNS TABLE(user_id uuid, success boolean, message text, commission_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.fix_all_pending_commissions() OWNER TO postgres;

--
-- Name: fix_existing_commissions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fix_existing_commissions() RETURNS TABLE(fixed_count integer, message text)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.fix_existing_commissions() OWNER TO postgres;

--
-- Name: fix_referral_transactions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fix_referral_transactions() RETURNS TABLE(fixed_count integer, message text)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.fix_referral_transactions() OWNER TO postgres;

--
-- Name: fix_user_referral_relationships(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fix_user_referral_relationships() RETURNS TABLE(fixed_count integer, message text)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.fix_user_referral_relationships() OWNER TO postgres;

--
-- Name: generate_alphanumeric_referral_code(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_alphanumeric_referral_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_code text;
    v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    v_length integer := 8; -- 8 characters after REF prefix
    v_i integer;
BEGIN
    v_code := 'REF';
    
    -- Generate random alphanumeric string
    FOR v_i IN 1..v_length LOOP
        v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
    END LOOP;
    
    RETURN v_code;
END;
$$;


ALTER FUNCTION public.generate_alphanumeric_referral_code() OWNER TO postgres;

--
-- Name: get_active_otp(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_active_otp(phone_number character varying) RETURNS TABLE(id uuid, otp_code character varying, provider character varying, message_id character varying, expires_at timestamp with time zone, attempts integer, max_attempts integer, is_verified boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.otp_code,
    o.provider,
    o.message_id,
    o.expires_at,
    o.attempts,
    o.max_attempts,
    o.is_verified,
    o.created_at
  FROM otps o
  WHERE o.phone = phone_number 
    AND o.expires_at > NOW() 
    AND o.is_verified = FALSE
  ORDER BY o.created_at DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_active_otp(phone_number character varying) OWNER TO postgres;

--
-- Name: get_all_payments(text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_all_payments(p_status text DEFAULT NULL::text, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, payment_id character varying, user_id uuid, plan_name character varying, amount numeric, status character varying, verification_status character varying, payment_reference character varying, created_at timestamp with time zone, paid_at timestamp with time zone, verified_at timestamp with time zone, expires_at timestamp with time zone, failed_reason text, dispute_reason text, admin_notes text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_all_payments(p_status text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_all_test_completions_for_exam(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying) RETURNS TABLE(test_type character varying, test_id character varying, topic_id character varying, is_completed boolean, completed_at timestamp with time zone, score numeric, rank integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying) OWNER TO postgres;

--
-- Name: get_all_user_exam_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_all_user_exam_stats(user_uuid uuid) RETURNS TABLE(exam_id character varying, total_tests integer, best_score integer, average_score numeric, rank integer, last_test_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_all_user_exam_stats(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_bulk_test_completions(uuid, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying) RETURNS TABLE(test_id character varying, is_completed boolean, completed_at timestamp with time zone, score numeric, rank integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying) OWNER TO postgres;

--
-- Name: get_commission_config(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_commission_config() RETURNS TABLE(commission_percentage numeric, minimum_withdrawal numeric, maximum_withdrawal numeric, processing_fee numeric, tax_deduction numeric, first_time_bonus numeric, max_daily_withdrawals integer, withdrawal_processing_days integer, referral_code_length integer, referral_code_prefix character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$BEGIN
  -- Return centralized commission configuration
  -- This should match the configuration in src/config/appConfig.ts
  RETURN QUERY SELECT 
    12.00::DECIMAL(5,2) as commission_percentage,
    0.00::DECIMAL(10,2) as minimum_withdrawal,
    10000.00::DECIMAL(10,2) as maximum_withdrawal,
    0.00::DECIMAL(5,2) as processing_fee,
    0.00::DECIMAL(5,2) as tax_deduction,
    0.00::DECIMAL(10,2) as first_time_bonus,
    5::INTEGER as max_daily_withdrawals,
    3::INTEGER as withdrawal_processing_days,
    8::INTEGER as referral_code_length,
    'S2S'::VARCHAR(10) as referral_code_prefix;
END;$$;


ALTER FUNCTION public.get_commission_config() OWNER TO postgres;

--
-- Name: get_commission_constants(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_commission_constants() RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  config_result RECORD;
BEGIN
  -- Get centralized commission configuration
  SELECT * INTO config_result FROM get_commission_config();
  
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


ALTER FUNCTION public.get_commission_constants() OWNER TO postgres;

--
-- Name: get_comprehensive_referral_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_comprehensive_referral_stats(user_uuid uuid) RETURNS TABLE(referral_code character varying, total_referrals integer, total_commissions_earned numeric, paid_commissions numeric, pending_commissions numeric, cancelled_commissions numeric, active_referrals integer, completed_referrals integer, pending_referrals integer, referral_link text, code_created_at timestamp with time zone, last_referral_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.code as referral_code,  -- Explicitly reference rc.code
        COALESCE(rc.total_referrals, 0)::INTEGER as total_referrals,
        COALESCE(rc.total_earnings, 0.00) as total_commissions_earned,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'paid' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as paid_commissions,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'pending' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as pending_commissions,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'refunded' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as cancelled_commissions,
        COUNT(CASE WHEN rt.status = 'pending' THEN 1 END)::INTEGER as active_referrals,
        COUNT(CASE WHEN rt.status = 'completed' THEN 1 END)::INTEGER as completed_referrals,
        -- Fixed: Remove reference to non-existent membership_purchased column
        -- Instead, count pending referrals that haven't completed a purchase
        COUNT(CASE WHEN rt.status = 'pending' AND NOT EXISTS (
            SELECT 1 FROM referral_commissions rc2 
            WHERE rc2.referred_id = rt.referred_id 
            AND rc2.status IN ('paid', 'pending')
        ) THEN 1 END)::INTEGER as pending_referrals,
        CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
        rc.created_at as code_created_at,
        MAX(rt.created_at) as last_referral_date
    FROM referral_codes rc
    LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
    LEFT JOIN referral_commissions rc_comm ON rt.referred_id = rc_comm.referred_id
    WHERE rc.user_id = user_uuid
    GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$;


ALTER FUNCTION public.get_comprehensive_referral_stats(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_exam_leaderboard(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_exam_leaderboard(exam_name character varying, limit_count integer DEFAULT 10) RETURNS TABLE(user_id uuid, phone text, best_score integer, total_tests integer, average_score numeric, rank integer, last_test_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_exam_leaderboard(exam_name character varying, limit_count integer) OWNER TO postgres;

--
-- Name: get_membership_plans(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_membership_plans() RETURNS TABLE(id character varying, name character varying, description text, price numeric, original_price numeric, duration_days integer, duration_months integer, mock_tests integer, features jsonb, is_active boolean, display_order integer, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_membership_plans() OWNER TO postgres;

--
-- Name: get_or_create_user_profile(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_or_create_user_profile(user_uuid uuid, user_phone text) RETURNS TABLE(id uuid, phone text, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_or_create_user_profile(user_uuid uuid, user_phone text) OWNER TO postgres;

--
-- Name: get_otp_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_otp_stats() RETURNS TABLE(total_otps_today bigint, active_otps bigint, verified_otps_today bigint, failed_attempts_today bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_otps_today,
    COUNT(CASE WHEN expires_at > NOW() AND is_verified = FALSE THEN 1 END) as active_otps,
    COUNT(CASE WHEN is_verified = TRUE AND created_at >= CURRENT_DATE THEN 1 END) as verified_otps_today,
    COUNT(CASE WHEN attempts >= max_attempts AND created_at >= CURRENT_DATE THEN 1 END) as failed_attempts_today
  FROM otps
  WHERE created_at >= CURRENT_DATE;
END;
$$;


ALTER FUNCTION public.get_otp_stats() OWNER TO postgres;

--
-- Name: get_payment_by_id(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_payment_by_id(p_payment_id character varying) RETURNS TABLE(id uuid, payment_id character varying, user_id uuid, plan_id character varying, plan_name character varying, amount numeric, currency character varying, payment_method character varying, status character varying, razorpay_payment_id character varying, razorpay_order_id character varying, metadata jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_payment_by_id(p_payment_id character varying) OWNER TO postgres;

--
-- Name: get_payment_statistics(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_payment_statistics(p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS TABLE(total_revenue numeric, total_transactions bigint, successful_transactions bigint, failed_transactions bigint, refunded_transactions bigint, average_transaction_value numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_transactions,
    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as average_transaction_value
  FROM membership_transactions
  WHERE 
    (p_start_date IS NULL OR DATE(created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(created_at) <= p_end_date);
END;
$$;


ALTER FUNCTION public.get_payment_statistics(p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: FUNCTION get_payment_statistics(p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_payment_statistics(p_start_date date, p_end_date date) IS 'Returns payment statistics for admin dashboard';


--
-- Name: get_pending_question_reports(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_pending_question_reports() RETURNS TABLE(id uuid, exam_id character varying, question_id character varying, question_number integer, issue_type character varying, issue_description text, user_id uuid, status character varying, created_at timestamp with time zone, user_phone character varying, test_type character varying, test_id character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_reports') THEN
    RETURN QUERY
    SELECT 
      qr.id,
      qr.exam_id,
      qr.question_id,
      COALESCE(
        CASE 
          WHEN qr.test_id ~ '^[0-9]+$' THEN qr.test_id::integer
          ELSE 0
        END,
        0
      ) as question_number,
      qr.report_type as issue_type,
      qr.description as issue_description,
      qr.user_id,
      qr.status,
      qr.created_at,
      up.phone as user_phone,
      qr.test_type,
      qr.test_id
    FROM question_reports qr
    LEFT JOIN user_profiles up ON qr.user_id = up.id
    WHERE qr.status = 'pending'
    ORDER BY qr.created_at DESC;
  ELSE
    RETURN;
  END IF;
END;
$_$;


ALTER FUNCTION public.get_pending_question_reports() OWNER TO postgres;

--
-- Name: get_pending_withdrawal_requests(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_pending_withdrawal_requests() RETURNS TABLE(id uuid, user_id uuid, amount numeric, status character varying, payment_details jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Check if withdrawal_requests table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') THEN
    RETURN QUERY
    SELECT 
      wr.id,
      wr.user_id,
      wr.amount,
      wr.status,
      wr.payment_details,
      wr.created_at
    FROM withdrawal_requests wr
    WHERE wr.status = 'pending'
    ORDER BY wr.created_at DESC;
  ELSE
    -- Return empty result set if table doesn't exist
    RETURN;
  END IF;
END;
$$;


ALTER FUNCTION public.get_pending_withdrawal_requests() OWNER TO postgres;

--
-- Name: get_plan_limit(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_plan_limit(p_plan text) RETURNS integer
    LANGUAGE sql
    AS $$
  select case p_plan when 'pro' then 3 when 'pro_plus' then 5 else 0 end;
$$;


ALTER FUNCTION public.get_plan_limit(p_plan text) OWNER TO postgres;

--
-- Name: get_referral_dashboard(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_referral_dashboard(user_uuid uuid) RETURNS TABLE(my_referral_code character varying, total_referrals integer, total_earnings numeric, pending_earnings numeric, paid_earnings numeric, referral_link text, recent_referrals jsonb, commission_breakdown jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_referral_dashboard(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_referral_leaderboard(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_referral_leaderboard(limit_count integer DEFAULT 10) RETURNS TABLE(rank integer, user_id uuid, phone text, total_referrals integer, total_earnings numeric, referral_code character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_referral_leaderboard(limit_count integer) OWNER TO postgres;

--
-- Name: get_referral_network_detailed(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_referral_network_detailed(user_uuid uuid) RETURNS TABLE(referred_user_id uuid, referred_phone_masked text, signup_date timestamp with time zone, referral_status text, commission_status text, commission_amount numeric, membership_plan text, membership_amount numeric, membership_date timestamp with time zone, is_first_membership boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
    -- Use up.membership_plan instead of rc.membership_plan (which doesn't exist)
    COALESCE(up.membership_plan, 'none')::TEXT as membership_plan,
    COALESCE(rc.membership_amount, 0.00) as membership_amount,
    COALESCE(rc.created_at, up.created_at) as membership_date,
    COALESCE(rt.first_membership_only, false) as is_first_membership
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_referral_network_detailed(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_referral_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_referral_stats(p_user_id uuid) RETURNS TABLE(total_referrals bigint, completed_referrals bigint, total_earnings numeric, pending_earnings numeric, paid_earnings numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
        COALESCE(SUM(commission_amount), 0) as total_earnings,
        COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0) as pending_earnings,
        COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0) as paid_earnings
    INTO v_stats
    FROM public.referral_transactions
    WHERE referrer_id = p_user_id;
    
    RETURN QUERY SELECT 
        v_stats.total_referrals,
        v_stats.completed_referrals,
        v_stats.total_earnings,
        v_stats.pending_earnings,
        v_stats.paid_earnings;
END;
$$;


ALTER FUNCTION public.get_referral_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_referral_stats(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_referral_stats(p_user_id uuid) IS 'Gets referral statistics with correct pending/paid amounts';


--
-- Name: get_refund_statistics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_refund_statistics() RETURNS TABLE(total_refunds bigint, pending_refunds bigint, completed_refunds bigint, failed_refunds bigint, total_refund_amount numeric, average_refund_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_refunds,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_refunds,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_refunds,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_refunds,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_refund_amount,
        COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_refund_amount
    FROM public.refund_requests;
END;
$$;


ALTER FUNCTION public.get_refund_statistics() OWNER TO postgres;

--
-- Name: get_secure_test_questions(character varying, character varying, character varying, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_secure_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) RETURNS TABLE(question_id uuid, question_en text, question_hi text, options jsonb, correct_answer integer, difficulty character varying, subject character varying, topic character varying, marks integer, negative_marks numeric, duration integer, explanation text, question_image text, options_images jsonb, explanation_image text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user has access to this test
  IF NOT check_premium_access(p_user_id, p_exam_id, p_test_type, p_test_id) THEN
    RAISE EXCEPTION 'Access denied: Premium membership required';
  END IF;
  
  -- Return questions
  RETURN QUERY
  SELECT 
    eq.id as question_id,
    eq.question_en,
    eq.question_hi,
    eq.options,
    eq.correct_answer,
    eq.difficulty,
    eq.subject,
    eq.topic,
    eq.marks,
    eq.negative_marks,
    eq.duration,
    eq.explanation,
    eq.question_image,
    eq.options_images,
    eq.explanation_image
  FROM exam_questions eq
  WHERE eq.exam_id = p_exam_id
    AND eq.test_type = p_test_type
    AND eq.test_id = p_test_id
  ORDER BY eq.question_order;
END;
$$;


ALTER FUNCTION public.get_secure_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) OWNER TO postgres;

--
-- Name: get_table_usage(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_table_usage() RETURNS TABLE(table_name text, row_count bigint, can_drop boolean, reason text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.n_live_tup,
        CASE 
            WHEN t.n_live_tup = 0 THEN true
            WHEN t.tablename IN ('question_images', 'admin_users') AND t.n_live_tup < 5 THEN true
            ELSE false
        END as can_drop,
        CASE 
            WHEN t.n_live_tup = 0 THEN 'Empty table'
            WHEN t.tablename = 'question_images' AND t.n_live_tup < 5 THEN 'Unused feature table'
            WHEN t.tablename = 'admin_users' AND t.n_live_tup < 5 THEN 'Unused admin table'
            ELSE 'Table in use'
        END::TEXT as reason
    FROM pg_stat_user_tables t
    ORDER BY t.n_live_tup;
END;
$$;


ALTER FUNCTION public.get_table_usage() OWNER TO postgres;

--
-- Name: get_test_attempt_by_id(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_test_attempt_by_id(attempt_id uuid) RETURNS TABLE(id uuid, user_id uuid, exam_id character varying, test_type character varying, test_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, answers jsonb, status character varying, started_at timestamp with time zone, completed_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.user_id,
    ta.exam_id,
    ta.test_type,
    ta.test_id,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.time_taken,
    ta.answers,
    ta.status,
    ta.started_at,
    ta.completed_at,
    ta.created_at,
    ta.updated_at
  FROM test_attempts ta
  WHERE ta.id = attempt_id;
END;
$$;


ALTER FUNCTION public.get_test_attempt_by_id(attempt_id uuid) OWNER TO postgres;

--
-- Name: get_test_completions_by_ids(uuid, character varying, character varying, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[]) RETURNS TABLE(test_id character varying, is_completed boolean, completed_at timestamp with time zone, score numeric, rank integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[]) OWNER TO postgres;

--
-- Name: get_test_leaderboard(character varying, character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_test_leaderboard(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_limit integer DEFAULT 10) RETURNS TABLE(rank integer, user_id uuid, score numeric, completed_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ta.score DESC, ta.completed_at ASC)::INTEGER as rank,
    ta.user_id,
    ta.score,
    ta.completed_at
  FROM test_attempts ta
  WHERE ta.exam_id = p_exam_id
    AND ta.test_type = p_test_type
    AND ta.test_id = p_test_id
    AND ta.completed_at IS NOT NULL
  ORDER BY ta.score DESC, ta.completed_at ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_test_leaderboard(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_limit integer) OWNER TO postgres;

--
-- Name: get_test_questions(character varying, character varying, character varying, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  exam_info JSON;
  questions JSON;
  test_data RECORD;
BEGIN
  -- Check if user has access to this test
  IF NOT check_premium_access(p_user_id, p_exam_id, p_test_type, p_test_id) THEN
    RETURN json_build_object(
      'error', 'Access denied: Premium membership required',
      'success', false
    );
  END IF;
  
  -- Get test metadata
  SELECT 
    name,
    description,
    duration,
    total_questions,
    subjects,
    correct_marks,
    incorrect_marks,
    is_premium
  INTO test_data
  FROM exam_test_data
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id;
  
  -- If no test data found, return error
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'Test not found',
      'success', false
    );
  END IF;
  
  -- Build exam info
  exam_info := json_build_object(
    'testName', test_data.name,
    'duration', test_data.duration,
    'totalQuestions', test_data.total_questions,
    'subjects', COALESCE(test_data.subjects, '["General"]'::json),
    'markingScheme', json_build_object(
      'correct', test_data.correct_marks,
      'incorrect', test_data.incorrect_marks,
      'unattempted', 0
    ),
    'defaultLanguage', 'english'
  );
  
  -- Get questions
  SELECT json_agg(
    json_build_object(
      'id', id,
      'questionEn', question_en,
      'questionHi', COALESCE(question_hi, ''),
      'options', options,
      'correct', correct_answer,
      'difficulty', difficulty,
      'subject', subject,
      'topic', topic,
      'marks', marks,
      'negativeMarks', negative_marks,
      'duration', duration,
      'explanation', COALESCE(explanation, ''),
      'questionImage', COALESCE(question_image, ''),
      'optionsImages', COALESCE(options_images, '[]'::json),
      'explanationImage', COALESCE(explanation_image, '')
    ) ORDER BY question_order
  ) INTO questions
  FROM exam_questions
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id;
  
  -- Build final result
  result := json_build_object(
    'success', true,
    'examInfo', exam_info,
    'questions', COALESCE(questions, '[]'::json)
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION public.get_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) OWNER TO postgres;

--
-- Name: get_test_rank_and_highest_score(character varying, character varying, character varying, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_test_rank_and_highest_score(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) RETURNS TABLE(user_rank integer, total_participants integer, highest_score integer, user_score integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_score_val INTEGER;
  total_participants_val INTEGER;
  user_rank_val INTEGER;
  highest_score_val INTEGER;
  score_source TEXT;
BEGIN
  -- First try to get user's score from individual_test_scores
  SELECT score INTO user_score_val
  FROM individual_test_scores
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id
  LIMIT 1;

  -- If not found in individual_test_scores, try test_attempts
  IF user_score_val IS NULL THEN
    SELECT score INTO user_score_val
    FROM test_attempts
    WHERE user_id = p_user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 1;
    
    score_source := 'test_attempts';
  ELSE
    score_source := 'individual_test_scores';
  END IF;

  -- If still no user score found, return null values
  IF user_score_val IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Get total participants and highest score for this test
  IF score_source = 'individual_test_scores' THEN
    SELECT 
      COUNT(*)::INTEGER,
      MAX(score)::INTEGER
    INTO total_participants_val, highest_score_val
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id;

    -- Calculate user's rank (1-based ranking)
    SELECT COUNT(*) + 1
    INTO user_rank_val
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND score > user_score_val;
  ELSE
    -- Use test_attempts data
    SELECT 
      COUNT(*)::INTEGER,
      MAX(score)::INTEGER
    INTO total_participants_val, highest_score_val
    FROM test_attempts
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND status = 'completed';

    -- Calculate user's rank (1-based ranking)
    SELECT COUNT(*) + 1
    INTO user_rank_val
    FROM test_attempts
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND status = 'completed'
      AND score > user_score_val;
  END IF;

  -- Update the individual_test_scores record with calculated rank and total_participants if it exists
  UPDATE individual_test_scores
  SET 
    rank = user_rank_val,
    total_participants = total_participants_val
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Return the calculated values
  RETURN QUERY SELECT 
    user_rank_val,
    total_participants_val,
    highest_score_val,
    user_score_val;
END;
$$;


ALTER FUNCTION public.get_test_rank_and_highest_score(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) OWNER TO postgres;

--
-- Name: get_test_share_statistics(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_test_share_statistics(user_uuid uuid) RETURNS TABLE(total_shares bigint, active_shares bigint, total_views bigint, popular_tests jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ts.*) as total_shares,
        COUNT(ts.*) FILTER (WHERE ts.is_active = TRUE AND ts.expires_at > NOW()) as active_shares,
        COALESCE(COUNT(tsa.*), 0) as total_views,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'test_name', ts.test_name,
                    'share_count', COUNT(ts.*)
                ) ORDER BY COUNT(ts.*) DESC
            ) FILTER (WHERE ts.test_name IS NOT NULL),
            '[]'::jsonb
        ) as popular_tests
    FROM public.test_shares ts
    LEFT JOIN public.test_share_access tsa ON ts.share_code = tsa.share_code
    WHERE ts.created_by = user_uuid
    GROUP BY ts.created_by;
END;
$$;


ALTER FUNCTION public.get_test_share_statistics(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_unread_message_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_unread_message_count(user_uuid uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER
    INTO unread_count
    FROM user_messages
    WHERE user_id = user_uuid AND is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;


ALTER FUNCTION public.get_unread_message_count(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_unread_notification_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_unread_notification_count(user_uuid uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.referral_notifications
        WHERE user_id = user_uuid AND is_read = FALSE
    );
END;
$$;


ALTER FUNCTION public.get_unread_notification_count(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_commission_history(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_commission_history(user_uuid uuid) RETURNS TABLE(commission_id uuid, referred_user_id uuid, referred_phone character varying, membership_plan character varying, membership_amount numeric, commission_amount numeric, commission_percentage numeric, status character varying, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_commission_history(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_comprehensive_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_comprehensive_stats(user_uuid uuid) RETURNS TABLE(exam_id character varying, total_tests integer, best_score integer, average_score numeric, rank integer, total_participants integer, percentile numeric, last_test_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_comprehensive_stats(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_dashboard_data(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_dashboard_data(user_uuid uuid) RETURNS TABLE(profile jsonb, membership jsonb, referral_stats jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    profile_data JSONB;
    membership_data JSONB;
    referral_stats_data JSONB;
BEGIN
    -- Get user profile
    SELECT to_jsonb(up.*) INTO profile_data
    FROM user_profiles up
    WHERE up.id = user_uuid;
    
    -- Get active membership
    SELECT to_jsonb(um.*) INTO membership_data
    FROM user_memberships um
    WHERE um.user_id = user_uuid 
    AND um.status = 'active' 
    AND um.end_date > NOW()
    ORDER BY um.created_at DESC
    LIMIT 1;
    
    -- Get referral stats
    SELECT to_jsonb(rs.*) INTO referral_stats_data
    FROM (
        SELECT 
            rc.code as referral_code,
            COALESCE(rc.total_referrals, 0) as total_referrals,
            COALESCE(rc.total_earnings, 0.00) as total_earnings,
            COUNT(rt.id) as active_referrals
        FROM referral_codes rc
        LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
        WHERE rc.user_id = user_uuid
        GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings
    ) rs;
    
    RETURN QUERY SELECT profile_data, membership_data, referral_stats_data;
END;
$$;


ALTER FUNCTION public.get_user_dashboard_data(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_exam_rank(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_exam_rank(user_uuid uuid, exam_name character varying) RETURNS TABLE(rank integer, total_participants integer, percentile numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_exam_rank(user_uuid uuid, exam_name character varying) OWNER TO postgres;

--
-- Name: get_user_exam_stats(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_exam_stats(user_uuid uuid, exam_name character varying) RETURNS TABLE(total_tests integer, best_score integer, average_score numeric, rank integer, last_test_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_exam_stats(user_uuid uuid, exam_name character varying) OWNER TO postgres;

--
-- Name: get_user_membership_status(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_membership_status(p_user_id uuid) RETURNS TABLE(membership_plan character varying, membership_expiry timestamp with time zone, is_active boolean, days_remaining integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.membership_plan,
    up.membership_expiry,
    CASE 
      WHEN up.membership_expiry IS NULL THEN false
      WHEN up.membership_expiry > NOW() THEN true
      ELSE false
    END as is_active,
    CASE 
      WHEN up.membership_expiry IS NULL THEN 0
      WHEN up.membership_expiry > NOW() THEN EXTRACT(DAYS FROM up.membership_expiry - NOW())::INTEGER
      ELSE 0
    END as days_remaining
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$;


ALTER FUNCTION public.get_user_membership_status(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_user_membership_status(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_membership_status(p_user_id uuid) IS 'Returns current user membership status and remaining days';


--
-- Name: get_user_messages(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_messages(user_uuid uuid, limit_count integer DEFAULT 50) RETURNS TABLE(id uuid, message_type character varying, title text, message text, is_read boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        COALESCE(um.message_type, 'info') as message_type,
        um.title,
        um.content as message,  -- Use 'content' column instead of 'message'
        um.is_read,
        um.created_at
    FROM user_messages um
    WHERE um.user_id = user_uuid
    ORDER BY um.created_at DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION public.get_user_messages(user_uuid uuid, limit_count integer) OWNER TO postgres;

--
-- Name: get_user_payments(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_payments(user_uuid uuid) RETURNS TABLE(id uuid, payment_id character varying, plan_id character varying, plan_name character varying, amount numeric, currency character varying, payment_method character varying, status character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_payments(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_performance_stats(character varying, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_performance_stats(exam_name character varying, user_uuid uuid) RETURNS TABLE(total_tests integer, total_score integer, average_score numeric, best_score integer, total_time_taken integer, average_time_per_question numeric, accuracy_percentage numeric, rank integer, percentile numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_performance_stats(exam_name character varying, user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_recent_completions(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_recent_completions(user_uuid uuid, limit_count integer DEFAULT 10) RETURNS TABLE(exam_id character varying, test_type character varying, test_id character varying, topic_id character varying, score integer, total_questions integer, completed_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_recent_completions(user_uuid uuid, limit_count integer) OWNER TO postgres;

--
-- Name: get_user_referral_earnings(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_referral_earnings(user_uuid uuid) RETURNS TABLE(total_earnings numeric, pending_earnings numeric, paid_earnings numeric, total_referrals integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(rc.commission_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN rc.status = 'pending' THEN rc.commission_amount ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN rc.status = 'paid' THEN rc.commission_amount ELSE 0 END), 0) as paid_earnings,
        COUNT(DISTINCT rc.referred_id)::INTEGER as total_referrals
    FROM referral_commissions rc
    WHERE rc.referrer_id = user_uuid;
END;
$$;


ALTER FUNCTION public.get_user_referral_earnings(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_referral_network(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_referral_network(user_uuid uuid) RETURNS TABLE(referred_user_id uuid, referred_phone text, signup_date timestamp with time zone, status character varying, commission_earned numeric, membership_plan character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_referral_network(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_referral_payouts(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_referral_payouts(user_uuid uuid, limit_count integer DEFAULT 20) RETURNS TABLE(id uuid, amount numeric, status character varying, payment_method character varying, payment_reference character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_referral_payouts(user_uuid uuid, limit_count integer) OWNER TO postgres;

--
-- Name: get_user_referral_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_referral_stats(user_uuid uuid) RETURNS TABLE(total_referrals integer, total_earnings numeric, pending_commission numeric, paid_commission numeric, referral_code character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_referral_stats(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_referral_transactions(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_referral_transactions(user_uuid uuid, limit_count integer DEFAULT 50) RETURNS TABLE(id uuid, referred_user_id uuid, referred_user_phone text, referral_code character varying, amount numeric, transaction_type character varying, status character varying, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_referral_transactions(user_uuid uuid, limit_count integer) OWNER TO postgres;

--
-- Name: get_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_streak(user_uuid uuid) RETURNS TABLE(current_streak integer, longest_streak integer, last_activity_date date, total_tests_taken integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_streak(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_test_attempts(uuid, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_test_attempts(p_user_id uuid, p_exam_id character varying DEFAULT NULL::character varying, p_limit integer DEFAULT 50) RETURNS TABLE(id uuid, exam_id character varying, test_type character varying, test_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, started_at timestamp with time zone, completed_at timestamp with time zone, answers jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_test_attempts(p_user_id uuid, p_exam_id character varying, p_limit integer) OWNER TO postgres;

--
-- Name: get_user_test_history(uuid, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_test_history(user_uuid uuid, exam_name character varying DEFAULT NULL::character varying, limit_count integer DEFAULT 50) RETURNS TABLE(test_id character varying, test_type character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, completed_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.get_user_test_history(user_uuid uuid, exam_name character varying, limit_count integer) OWNER TO postgres;

--
-- Name: get_user_test_score(uuid, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying) RETURNS TABLE(score integer, total_questions integer, correct_answers integer, time_taken integer, completed_at timestamp with time zone, rank integer, total_participants integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.total_questions,
    its.correct_answers,
    its.time_taken,
    its.completed_at,
    COALESCE(its.rank, 0) as rank,
    COALESCE(its.total_participants, 0) as total_participants
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying) OWNER TO postgres;

--
-- Name: get_user_withdrawal_requests(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_withdrawal_requests(p_user_id uuid) RETURNS TABLE(id uuid, amount numeric, payment_method character varying, payment_details jsonb, status character varying, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wr.id,
        wr.amount,
        wr.payment_method,
        wr.payment_details,
        wr.status,
        wr.created_at
    FROM withdrawal_requests wr
    WHERE wr.user_id = p_user_id
    ORDER BY wr.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_withdrawal_requests(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_withdrawal_eligibility(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_withdrawal_eligibility(p_user_id uuid) RETURNS TABLE(can_withdraw boolean, available_balance numeric, minimum_withdrawal numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_available_balance decimal(10,2) := 0;
    v_minimum_withdrawal decimal(10,2) := 0;
    v_can_withdraw boolean := false;
    v_config RECORD;
BEGIN
    -- Get total earnings (ignore commission_status - all are available)
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_available_balance
    FROM referral_transactions
    WHERE referrer_id = p_user_id;
    
    -- Get minimum withdrawal from config - use specific column reference
    SELECT * INTO v_config FROM get_commission_config() LIMIT 1;
    v_minimum_withdrawal := v_config.minimum_withdrawal;
    
    -- Check if user can withdraw
    v_can_withdraw := (v_available_balance >= v_minimum_withdrawal);
    
    RETURN QUERY SELECT 
        v_can_withdraw,
        v_available_balance,
        v_minimum_withdrawal;
END;
$$;


ALTER FUNCTION public.get_withdrawal_eligibility(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_withdrawal_eligibility(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_withdrawal_eligibility(p_user_id uuid) IS 'Fixed - resolves ambiguous column reference for minimum_withdrawal';


--
-- Name: handle_membership_refund(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_membership_refund(p_membership_transaction_id uuid) RETURNS TABLE(success boolean, message text, commission_revoked numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.handle_membership_refund(p_membership_transaction_id uuid) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: handle_referral_commission(numeric, character varying, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: increment_otp_attempts(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_otp_attempts(otp_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_attempts INTEGER;
BEGIN
  UPDATE otps 
  SET attempts = attempts + 1, updated_at = NOW()
  WHERE id = otp_id
  RETURNING attempts INTO current_attempts;
  
  RETURN current_attempts;
END;
$$;


ALTER FUNCTION public.increment_otp_attempts(otp_id uuid) OWNER TO postgres;

--
-- Name: initialize_new_user(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text) RETURNS TABLE(success boolean, message text, profile_created boolean, referral_code_created boolean, exam_stats_created boolean, streak_created boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text) OWNER TO postgres;

--
-- Name: initialize_user_exam_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.initialize_user_exam_stats(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Insert default exam stats for common exams if they don't exist
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date, total_tests_taken, total_score, total_time_taken, average_time_per_question, accuracy_percentage, percentile)
    VALUES 
        (p_user_id, 'ssc-cgl', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-mts', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-chsl', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-cpo', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-je', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id, exam_id) DO NOTHING;
END;
$$;


ALTER FUNCTION public.initialize_user_exam_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: insert_simple_test_attempt(uuid, character varying, integer, integer, integer, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) RETURNS TABLE(success boolean, message text, attempt_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) OWNER TO postgres;

--
-- Name: insert_simple_test_attempt(uuid, character varying, integer, integer, integer, integer, jsonb, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer DEFAULT NULL::integer, answers jsonb DEFAULT NULL::jsonb, test_type character varying DEFAULT 'practice'::character varying, test_id character varying DEFAULT NULL::character varying) RETURNS TABLE(success boolean, message text, attempt_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, answers jsonb, test_type character varying, test_id character varying) OWNER TO postgres;

--
-- Name: insert_test_attempt(uuid, character varying, character varying, integer, integer, integer, integer, jsonb, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer DEFAULT NULL::integer, p_answers jsonb DEFAULT NULL::jsonb, p_test_type character varying DEFAULT NULL::character varying) RETURNS TABLE(success boolean, message text, attempt_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_type character varying) OWNER TO postgres;

--
-- Name: insert_test_attempt_with_defaults(uuid, character varying, integer, integer, integer, integer, jsonb, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying DEFAULT NULL::character varying, p_test_type character varying DEFAULT 'practice'::character varying) RETURNS TABLE(success boolean, message text, attempt_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying, p_test_type character varying) OWNER TO postgres;

--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin(user_uuid uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  target_user_id UUID;
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
  
  -- Check is_admin column in user_profiles table
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = target_user_id 
    AND is_admin = true
  );
END;
$$;


ALTER FUNCTION public.is_admin(user_uuid uuid) OWNER TO postgres;

--
-- Name: is_test_completed(uuid, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying) OWNER TO postgres;

--
-- Name: is_user_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_user_admin(user_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.is_user_admin(user_uuid uuid) OWNER TO postgres;

--
-- Name: mark_message_as_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_message_as_read(message_id uuid, user_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_messages
    SET is_read = TRUE
    WHERE id = message_id AND user_id = user_uuid;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mark_message_as_read(message_id uuid, user_uuid uuid) OWNER TO postgres;

--
-- Name: mark_otp_verified(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_otp_verified(otp_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE otps 
  SET is_verified = TRUE, updated_at = NOW()
  WHERE id = otp_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mark_otp_verified(otp_id uuid) OWNER TO postgres;

--
-- Name: pay_commission(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_transaction RECORD;
    v_commission_amount decimal(10,2);
BEGIN
    -- Get referral transaction details
    SELECT * INTO v_transaction
    FROM referral_transactions
    WHERE id = p_referral_transaction_id
    AND commission_status = 'pending';
    
    IF v_transaction.id IS NULL THEN
        RETURN QUERY SELECT false, 'Referral transaction not found or already processed';
        RETURN;
    END IF;
    
    -- Update commission status to paid
    UPDATE referral_transactions
    SET 
        commission_status = 'paid',
        updated_at = NOW()
    WHERE id = p_referral_transaction_id;
    
    -- Update referral_commissions table
    UPDATE referral_commissions
    SET 
        status = 'paid',
        updated_at = NOW()
    WHERE referrer_id = v_transaction.referrer_id
    AND referred_id = v_transaction.referred_id
    AND payment_id = v_transaction.payment_id;
    
    RETURN QUERY SELECT true, 'Commission paid successfully';
END;
$$;


ALTER FUNCTION public.pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid) IS 'Admin function to manually pay commissions';


--
-- Name: payments_method_backfill(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.payments_method_backfill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.payment_method IS NULL THEN
    NEW.payment_method := 'upi';
  END IF;
  RETURN NEW;
END$$;


ALTER FUNCTION public.payments_method_backfill() OWNER TO postgres;

--
-- Name: payments_plan_backfill(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.payments_plan_backfill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.plan_id IS NULL AND NEW.plan IS NOT NULL THEN
      NEW.plan_id := NEW.plan;
    END IF;
  END IF;
  RETURN NEW;
END$$;


ALTER FUNCTION public.payments_plan_backfill() OWNER TO postgres;

--
-- Name: payments_plan_name_backfill(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.payments_plan_name_backfill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.plan_name IS NULL AND NEW.plan IS NOT NULL THEN
    NEW.plan_name := CASE NEW.plan WHEN 'pro' THEN 'Pro' WHEN 'pro_plus' THEN 'Pro+' ELSE NEW.plan END;
  END IF;
  RETURN NEW;
END$$;


ALTER FUNCTION public.payments_plan_name_backfill() OWNER TO postgres;

--
-- Name: process_existing_commission(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_existing_commission(p_user_id uuid) RETURNS TABLE(success boolean, message text, commission_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.process_existing_commission(p_user_id uuid) OWNER TO postgres;

--
-- Name: process_existing_user_commission(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_existing_user_commission(p_user_id uuid) RETURNS TABLE(success boolean, message text, commission_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.process_existing_user_commission(p_user_id uuid) OWNER TO postgres;

--
-- Name: process_membership_commission(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_membership_commission(p_payment_id uuid) RETURNS TABLE(success boolean, message text, commission_amount numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.process_membership_commission(p_payment_id uuid) OWNER TO postgres;

--
-- Name: process_membership_commission(uuid, uuid, character varying, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric) RETURNS TABLE(success boolean, message text, commission_amount numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric) OWNER TO postgres;

--
-- Name: process_missing_commissions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_missing_commissions() RETURNS TABLE(processed_count integer, total_commission numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count integer := 0;
  v_total_commission numeric := 0;
  v_record RECORD;
  v_referrer_id UUID;
  v_commission_amount DECIMAL(10,2);
  v_commission_rate DECIMAL(5,2) := 0.15;
BEGIN
  -- Find membership transactions that don't have corresponding commissions
  FOR v_record IN
    SELECT 
      mt.user_id,
      mt.id as membership_transaction_id,
      mt.plan_id,
      mt.amount,
      mt.created_at
    FROM membership_transactions mt
    WHERE mt.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM referral_commissions rc 
      WHERE rc.referred_id = mt.user_id 
      AND rc.payment_id = mt.id
    )
    AND EXISTS (
      SELECT 1 FROM referral_transactions rt 
      WHERE rt.referred_id = mt.user_id 
      AND rt.status = 'pending'
      AND rt.membership_purchased = false
    )
  LOOP
    -- Get referrer for this user
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions
    WHERE referred_id = v_record.user_id 
    AND status = 'pending'
    AND membership_purchased = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_referrer_id IS NOT NULL THEN
      -- Calculate commission
      v_commission_amount := v_record.amount * v_commission_rate;
      
      -- Update referral transaction
      UPDATE referral_transactions
      SET 
        amount = v_record.amount,
        commission_amount = v_commission_amount,
        commission_status = 'pending',
        membership_purchased = true,
        status = 'completed',
        updated_at = NOW()
      WHERE referred_id = v_record.user_id 
      AND referrer_id = v_referrer_id
      AND status = 'pending';
      
      -- Create commission record
      INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        payment_id,
        membership_plan,
        membership_amount,
        commission_amount,
        commission_rate,
        status,
        created_at
      ) VALUES (
        v_referrer_id,
        v_record.user_id,
        v_record.membership_transaction_id,
        v_record.plan_id,
        v_record.amount,
        v_commission_amount,
        v_commission_rate,
        'pending',
        NOW()
      );
      
      -- Update referrer's total earnings
      UPDATE referral_codes
      SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
      WHERE user_id = v_referrer_id;
      
      v_count := v_count + 1;
      v_total_commission := v_total_commission + v_commission_amount;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_count, v_total_commission;
END;
$$;


ALTER FUNCTION public.process_missing_commissions() OWNER TO postgres;

--
-- Name: process_payment_and_membership(uuid, character varying, uuid, character varying, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_plan RECORD;
  v_membership_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
  v_commission_result RECORD;
  v_referrer_id UUID;
  v_commission_amount DECIMAL(10,2) := 0;
  v_commission_rate DECIMAL(5,2) := 0.15; -- 15% commission rate
BEGIN
  -- Start transaction
  BEGIN
    -- Get plan details
    SELECT * INTO v_plan
    FROM membership_plans
    WHERE id = p_plan_id AND is_active = true;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Plan not found or inactive'
      );
    END IF;
    
    -- Calculate membership expiry
    v_expires_at := NOW() + INTERVAL '1 day' * v_plan.duration_days;
    
    -- Update payment status
    UPDATE membership_transactions
    SET 
      status = 'completed',
      gateway_payment_id = p_payment_gateway_id,
      completed_at = NOW()
    WHERE id = p_payment_id;
    
    -- Create or update user membership
    INSERT INTO user_memberships (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      created_at
    ) VALUES (
      p_user_id,
      p_plan_id,
      'active',
      NOW(),
      v_expires_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan_id = p_plan_id,
      status = 'active',
      starts_at = NOW(),
      expires_at = v_expires_at,
      updated_at = NOW();
    
    -- Update user profile with membership info
    UPDATE user_profiles
    SET 
      membership_plan = p_plan_id,
      membership_expiry = v_expires_at,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Process referral commission if user has a referrer
    -- Check if user has a pending referral transaction
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions
    WHERE referred_id = p_user_id 
    AND status = 'pending'
    AND membership_purchased = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_referrer_id IS NOT NULL THEN
      -- Calculate commission amount
      v_commission_amount := p_amount * v_commission_rate;
      
      -- Update referral transaction
      UPDATE referral_transactions
      SET 
        amount = p_amount,
        commission_amount = v_commission_amount,
        commission_status = 'pending',
        membership_purchased = true,
        status = 'completed',
        updated_at = NOW()
      WHERE referred_id = p_user_id 
      AND referrer_id = v_referrer_id
      AND status = 'pending';
      
      -- Create commission record
      INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        payment_id,
        membership_plan,
        membership_amount,
        commission_amount,
        commission_rate,
        status,
        created_at
      ) VALUES (
        v_referrer_id,
        p_user_id,
        p_payment_id,
        p_plan_id,
        p_amount,
        v_commission_amount,
        v_commission_rate,
        'pending',
        NOW()
      );
      
      -- Update referrer's total earnings in referral_codes table
      UPDATE referral_codes
      SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
      WHERE user_id = v_referrer_id;
      
      -- Log commission processing
      RAISE NOTICE 'Commission processed: referrer_id=%, amount=%, commission=%', 
        v_referrer_id, p_amount, v_commission_amount;
    END IF;
    
    -- Return success with commission info
    RETURN jsonb_build_object(
      'success', true,
      'membership_id', (SELECT id FROM user_memberships WHERE user_id = p_user_id),
      'expires_at', v_expires_at,
      'commission_processed', (v_referrer_id IS NOT NULL),
      'commission_amount', COALESCE(v_commission_amount, 0),
      'referrer_id', v_referrer_id
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on error
      RAISE NOTICE 'Error in process_payment_and_membership: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
      );
  END;
END;
$$;


ALTER FUNCTION public.process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric) OWNER TO postgres;

--
-- Name: FUNCTION process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric) IS 'Atomically processes payment completion and creates/updates user membership';


--
-- Name: process_payment_webhook(text, text, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text DEFAULT 'INR'::text) RETURNS TABLE(success boolean, message text, payment_id uuid, user_id uuid, membership_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_payment_record RECORD;
    v_membership_id uuid;
    v_start_date timestamptz;
    v_end_date timestamptz;
    v_success boolean := false;
    v_message text := '';
    v_payment_id uuid;
    v_user_id uuid;
    v_commission_result RECORD;
    v_referrer_id uuid;
    v_commission_amount decimal(10,2) := 0;
    v_commission_rate decimal(5,2) := 0.15; -- 15% commission rate
BEGIN
    -- Get payment record directly from payments table
    SELECT 
        p.id,
        p.user_id,
        p.plan_id,
        p.plan_name,
        p.amount,
        p.currency,
        p.status,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.paid_at,
        p.created_at,
        p.updated_at
    INTO v_payment_record
    FROM public.payments p
    WHERE p.razorpay_order_id = p_order_id 
    AND p.status = 'pending'
    ORDER BY p.created_at DESC
    LIMIT 1;
    
    IF v_payment_record.id IS NULL THEN
        v_success := false;
        v_message := 'No pending payment found for order: ' || p_order_id;
        RETURN QUERY SELECT v_success, v_message, NULL::uuid, NULL::uuid, NULL::uuid;
        RETURN;
    END IF;
    
    -- Check if already processed
    IF v_payment_record.status = 'completed' THEN
        v_success := false;
        v_message := 'Payment already processed';
        RETURN QUERY SELECT v_success, v_message, v_payment_record.id, v_payment_record.user_id, NULL::uuid;
        RETURN;
    END IF;
    
    -- Update payment status
    PERFORM update_payment_status(
        v_payment_record.id,
        'completed',
        p_razorpay_payment_id,
        NOW()
    );
    
    -- Calculate membership dates based on plan
    v_start_date := NOW();
    
    -- Set duration based on plan_id (use actual plan_id from payment record)
    IF v_payment_record.plan_id = 'pro_plus' THEN
        v_end_date := NOW() + INTERVAL '1 year'; -- 365 days
    ELSIF v_payment_record.plan_id = 'pro' THEN
        v_end_date := NOW() + INTERVAL '3 months'; -- 90 days
    ELSE
        v_end_date := NOW() + INTERVAL '1 month'; -- 30 days default
    END IF;
    
    -- Create or update membership
    v_membership_id := create_or_update_membership(
        v_payment_record.user_id,
        v_payment_record.plan_id, -- Use actual plan_id from payment
        v_start_date,
        v_end_date
    );
    
    -- Create membership transaction
    PERFORM create_membership_transaction(
        v_payment_record.user_id,
        v_membership_id,
        v_payment_record.id,
        v_payment_record.amount,
        v_payment_record.currency
    );
    
    -- Update user profile with correct plan_id (use actual plan_id from payment)
    PERFORM update_user_profile_membership(
        v_payment_record.user_id,
        'active', -- membership_status
        v_payment_record.plan_id, -- membership_plan (use actual plan_id from payment)
        v_end_date
    );
    
    -- Process referral commission if user has a referrer
    -- Check if user has a pending referral transaction
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions
    WHERE referred_id = v_payment_record.user_id 
    AND status = 'pending'
    AND membership_purchased = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_referrer_id IS NOT NULL THEN
        -- Calculate commission amount
        v_commission_amount := v_payment_record.amount * v_commission_rate;
        
        -- Update referral transaction
        UPDATE referral_transactions
        SET 
            amount = v_payment_record.amount,
            commission_amount = v_commission_amount,
            commission_status = 'pending', -- Keep as pending until actually paid
            membership_purchased = true,
            status = 'completed',
            updated_at = NOW()
        WHERE referred_id = v_payment_record.user_id 
        AND referrer_id = v_referrer_id
        AND status = 'pending';
        
        -- Create commission record
        INSERT INTO referral_commissions (
            referrer_id,
            referred_id,
            payment_id,
            membership_plan,
            membership_amount,
            commission_amount,
            commission_rate,
            status,
            created_at
        ) VALUES (
            v_referrer_id,
            v_payment_record.user_id,
            v_payment_record.id,
            v_payment_record.plan_id,
            v_payment_record.amount,
            v_commission_amount,
            v_commission_rate,
            'pending', -- Keep as pending until actually paid
            NOW()
        );
        
        -- Update referrer's total earnings in referral_codes table
        -- DO NOT increment total_referrals here - only on signup
        UPDATE referral_codes
        SET 
            total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
            -- total_referrals = COALESCE(total_referrals, 0) + 1, -- REMOVED: Only increment on signup
            updated_at = NOW()
        WHERE referral_codes.user_id = v_referrer_id;
        
        -- Log commission processing
        RAISE NOTICE 'Commission processed: referrer_id=%, amount=%, commission=%', 
            v_referrer_id, v_payment_record.amount, v_commission_amount;
    END IF;
    
    -- Set success result
    v_success := true;
    v_message := 'Payment processed successfully with plan: ' || v_payment_record.plan_id;
    v_payment_id := v_payment_record.id;
    v_user_id := v_payment_record.user_id;
    
    -- Return success result
    RETURN QUERY SELECT v_success, v_message, v_payment_id, v_user_id, v_membership_id;
    
EXCEPTION
    WHEN OTHERS THEN
        v_success := false;
        v_message := 'Error processing payment: ' || SQLERRM;
        RETURN QUERY SELECT v_success, v_message, NULL::uuid, NULL::uuid, NULL::uuid;
END;
$$;


ALTER FUNCTION public.process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text) OWNER TO postgres;

--
-- Name: FUNCTION process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text) IS 'Processes payment webhook - only increments earnings, not referral count';


--
-- Name: process_referral_commission(uuid, uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_referral_commission(p_payment_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_referral_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_referrer_id uuid;
    v_commission_amount numeric;
    v_existing_transaction_id uuid;
    v_new_transaction_id uuid;
    v_referrer_profile record;
BEGIN
    -- Get referrer ID from referral code
    SELECT user_id INTO v_referrer_id
    FROM public.referral_codes
    WHERE code = p_referral_code AND is_active = true;
    
    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Referrer not found for code: ' || p_referral_code
        );
    END IF;
    
    -- Calculate commission (15% of payment amount)
    v_commission_amount := p_payment_amount * 0.15;
    
    -- Check for existing transaction to prevent duplicates
    SELECT id INTO v_existing_transaction_id
    FROM public.referral_transactions
    WHERE referred_id = p_referred_user_id 
        AND referral_code = p_referral_code
        AND transaction_type = 'referral'
        AND payment_id = p_payment_id;
    
    IF v_existing_transaction_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Referral transaction already exists',
            'transaction_id', v_existing_transaction_id
        );
    END IF;
    
    -- Create referral transaction
    INSERT INTO public.referral_transactions (
        referrer_id,
        referred_id,
        referral_code,
        amount,
        transaction_type,
        status,
        commission_amount,
        commission_status,
        membership_purchased,
        payment_id,
        first_membership_only
    ) VALUES (
        v_referrer_id,
        p_referred_user_id,
        p_referral_code,
        p_payment_amount,
        'referral',
        'completed',
        v_commission_amount,
        'pending',
        true,
        p_payment_id,
        true
    ) RETURNING id INTO v_new_transaction_id;
    
    -- Update referrer's total earnings
    SELECT * INTO v_referrer_profile
    FROM public.user_profiles
    WHERE id = v_referrer_id;
    
    IF v_referrer_profile.id IS NOT NULL THEN
        UPDATE public.user_profiles
        SET 
            total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount,
            updated_at = NOW()
        WHERE id = v_referrer_id;
    END IF;
    
    -- Update referral code stats
    UPDATE public.referral_codes
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_new_transaction_id,
        'referrer_id', v_referrer_id,
        'commission_amount', v_commission_amount,
        'message', 'Referral commission processed successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Error processing referral commission: ' || SQLERRM
        );
END;
$$;


ALTER FUNCTION public.process_referral_commission(p_payment_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_referral_code text) OWNER TO postgres;

--
-- Name: process_referral_commission_v2(numeric, character varying, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) RETURNS TABLE(success boolean, message text, commission_amount numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: process_withdrawal_request(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action text, admin_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    withdrawal_record RECORD;
    v_admin_notes TEXT := admin_notes;
BEGIN
    -- Get the withdrawal request from withdrawal_requests table
    SELECT * INTO withdrawal_record
    FROM withdrawal_requests
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
        UPDATE withdrawal_requests
        SET 
            status = 'approved',
            admin_notes = COALESCE(v_admin_notes, 'Approved by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        RETURN true;
        
    ELSIF action = 'rejected' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'rejected',
            admin_notes = COALESCE(v_admin_notes, 'Rejected by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        RETURN true;
        
    ELSE
        RETURN false;
    END IF;
    
END;
$$;


ALTER FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action text, admin_notes text) OWNER TO postgres;

--
-- Name: process_withdrawal_request(uuid, uuid, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text) OWNER TO postgres;

--
-- Name: process_withdrawal_request_with_message(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text DEFAULT NULL::text) RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    withdrawal_record RECORD;
    v_admin_notes TEXT := admin_notes;
    notification_sent boolean := false;
BEGIN
    -- Get the withdrawal request from withdrawal_requests table
    SELECT * INTO withdrawal_record
    FROM withdrawal_requests
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Withdrawal request not found', NULL::uuid;
        RETURN;
    END IF;
    
    -- Check if already processed
    IF withdrawal_record.status IN ('approved', 'rejected', 'completed') THEN
        RETURN QUERY SELECT false, 'Withdrawal request already processed', NULL::uuid;
        RETURN;
    END IF;
    
    -- Process based on action
    IF action = 'approved' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'approved',
            admin_notes = COALESCE(v_admin_notes, 'Approved by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        -- Send notification to user
        SELECT send_withdrawal_status_message(
            withdrawal_record.user_id,
            request_id,
            'approved',
            withdrawal_record.amount,
            v_admin_notes
        ) INTO notification_sent;
        
        RETURN QUERY SELECT true, 'Withdrawal request approved successfully', request_id;
        RETURN;
        
    ELSIF action = 'rejected' THEN
        -- Update withdrawal status
        UPDATE withdrawal_requests
        SET 
            status = 'rejected',
            admin_notes = COALESCE(v_admin_notes, 'Rejected by admin'),
            processed_by = admin_user_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = request_id;
        
        -- Send notification to user
        SELECT send_withdrawal_status_message(
            withdrawal_record.user_id,
            request_id,
            'rejected',
            withdrawal_record.amount,
            v_admin_notes
        ) INTO notification_sent;
        
        RETURN QUERY SELECT true, 'Withdrawal request rejected successfully', request_id;
        RETURN;
        
    ELSE
        RETURN QUERY SELECT false, 'Invalid action. Use "approved" or "rejected"', NULL::uuid;
        RETURN;
    END IF;
    
END;
$$;


ALTER FUNCTION public.process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text) OWNER TO postgres;

--
-- Name: remove_admin_user(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_admin_user(admin_user_id uuid, target_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.remove_admin_user(admin_user_id uuid, target_user_id uuid) OWNER TO postgres;

--
-- Name: request_commission_withdrawal(uuid, numeric, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying DEFAULT 'bank_transfer'::character varying) RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying) OWNER TO postgres;

--
-- Name: request_commission_withdrawal(text, numeric, character varying, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.request_commission_withdrawal(p_account_details text, p_amount numeric, p_payment_method character varying, p_user_id uuid) RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    available_balance DECIMAL(10,2);
    new_withdrawal_id UUID;
    minimum_withdrawal DECIMAL(10,2);
BEGIN
    -- Get available balance from referral stats
    SELECT COALESCE(SUM(commission_amount), 0.00) INTO available_balance
    FROM referral_transactions
    WHERE referrer_id = p_user_id;
    
    -- Get minimum withdrawal from config
    SELECT config.minimum_withdrawal INTO minimum_withdrawal
    FROM get_commission_config() AS config;
    
    -- Check if user has any pending withdrawal requests
    IF EXISTS (
        SELECT 1 FROM withdrawal_requests 
        WHERE user_id = p_user_id 
        AND status IN ('pending', 'approved')
    ) THEN
        RETURN QUERY SELECT false, 'You already have a pending withdrawal request', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if withdrawal amount is valid
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT false, 'Withdrawal amount must be greater than 0', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check minimum withdrawal
    IF p_amount < minimum_withdrawal THEN
        RETURN QUERY SELECT false, 
            'Minimum withdrawal amount is ₹' || minimum_withdrawal, 
            NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if user has sufficient balance
    IF p_amount > available_balance THEN
        RETURN QUERY SELECT false, 
            'Insufficient balance. Available: ₹' || available_balance || ', Requested: ₹' || p_amount, 
            NULL::UUID;
        RETURN;
    END IF;
    
    -- Create withdrawal request
    INSERT INTO withdrawal_requests (
        user_id,
        amount,
        payment_method,
        payment_details,
        status,
        created_at
    ) VALUES (
        p_user_id,
        p_amount,
        p_payment_method,
        p_account_details::jsonb,
        'pending',
        NOW()
    ) RETURNING id INTO new_withdrawal_id;
    
    RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', new_withdrawal_id;
    
END;
$$;


ALTER FUNCTION public.request_commission_withdrawal(p_account_details text, p_amount numeric, p_payment_method character varying, p_user_id uuid) OWNER TO postgres;

--
-- Name: request_commission_withdrawal(uuid, numeric, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text) RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text) OWNER TO postgres;

--
-- Name: request_withdrawal(uuid, numeric, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text) RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text) OWNER TO postgres;

--
-- Name: resolve_question_report(uuid, uuid, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text) OWNER TO postgres;

--
-- Name: rollback_payment_transaction(character varying, uuid, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_rollback_id UUID;
  v_restored_data JSONB;
  v_payment_record RECORD;
  v_membership_record RECORD;
  v_commission_record RECORD;
  v_commission_count INTEGER := 0;
BEGIN
  -- Start transaction
  BEGIN
    -- Get payment record
    SELECT * INTO v_payment_record
    FROM payments
    WHERE payment_id = p_payment_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
    END IF;
    
    -- Create rollback record
    INSERT INTO payment_rollbacks (payment_id, user_id, plan_id, original_amount, rollback_reason)
    VALUES (p_payment_id, p_user_id, p_plan_id, v_payment_record.amount, p_reason)
    RETURNING id INTO v_rollback_id;
    
    -- Get membership record
    SELECT * INTO v_membership_record
    FROM user_memberships
    WHERE user_id = p_user_id AND plan_id = p_plan_id
    ORDER BY created_at DESC LIMIT 1;
    
    -- Restore user profile to free plan
    UPDATE user_profiles
    SET 
      membership_plan = 'free',
      membership_status = 'inactive',
      membership_expiry = NULL,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Update membership status to cancelled
    IF v_membership_record.id IS NOT NULL THEN
      UPDATE user_memberships
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = v_membership_record.id;
    END IF;
    
    -- Get and reverse referral commissions
    FOR v_commission_record IN 
      SELECT * FROM referral_commissions 
      WHERE payment_id = p_payment_id
    LOOP
      v_commission_count := v_commission_count + 1;
      
      -- Update referrer earnings
      UPDATE referral_earnings
      SET 
        total_earnings = total_earnings - v_commission_record.amount,
        available_earnings = available_earnings - v_commission_record.amount,
        updated_at = NOW()
      WHERE user_id = v_commission_record.referrer_id;
      
      -- Mark commission as reversed
      UPDATE referral_commissions
      SET 
        status = 'reversed',
        updated_at = NOW()
      WHERE id = v_commission_record.id;
    END LOOP;
    
    -- Update payment status
    UPDATE payments
    SET 
      status = 'refunded',
      updated_at = NOW()
    WHERE payment_id = p_payment_id;
    
    -- Mark rollback as completed
    UPDATE payment_rollbacks
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = v_rollback_id;
    
    -- Build restored data
    v_restored_data := jsonb_build_object(
      'rollback_id', v_rollback_id,
      'user_profile_restored', true,
      'membership_cancelled', v_membership_record.id IS NOT NULL,
      'commissions_reversed', v_commission_count,
      'payment_refunded', true
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'rollback_id', v_rollback_id,
      'restored_data', v_restored_data
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Mark rollback as failed
    UPDATE payment_rollbacks
    SET 
      status = 'failed',
      completed_at = NOW()
    WHERE id = v_rollback_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;


ALTER FUNCTION public.rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text) OWNER TO postgres;

--
-- Name: FUNCTION rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text) IS 'Atomically rolls back a payment and all associated data';


--
-- Name: send_question_report_status_message(uuid, uuid, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
  v_exam_id VARCHAR(50);
  v_test_type VARCHAR(50);
  v_report_type VARCHAR(50);
  v_question_id VARCHAR(100);
  v_test_id VARCHAR(100);
BEGIN
  -- Get report details
  SELECT exam_id, test_type, report_type, question_id, test_id 
  INTO v_exam_id, v_test_type, v_report_type, v_question_id, v_test_id
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
        'Your report for ', UPPER(v_exam_id), ' ', v_test_type, 
        ' Test ', v_test_id, ' Question ', v_question_id,
        ' (', v_report_type, ') has been resolved. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Note: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Thank you for helping improve our content.';
      END IF;
    WHEN 'rejected' THEN
      v_title := 'Question Report Rejected';
      v_message := CONCAT(
        'Your report for ', UPPER(v_exam_id), ' ', v_test_type, 
        ' Test ', v_test_id, ' Question ', v_question_id,
        ' (', v_report_type, ') was not accepted. '
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || 'Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || 'Contact support if you believe this is an error.';
      END IF;
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message using 'content' column (not 'message')
  INSERT INTO user_messages (user_id, message_type, title, content)
  VALUES (p_user_id, 'question_report_' || p_status, v_title, v_message);
  
  RETURN true;
END;
$$;


ALTER FUNCTION public.send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text) OWNER TO postgres;

--
-- Name: send_withdrawal_status_message(uuid, uuid, character varying, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_withdrawal_status_message(p_user_id uuid, p_withdrawal_id uuid, p_status character varying, p_amount numeric, p_admin_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_title VARCHAR(200);
  v_message TEXT;
BEGIN
  -- Create appropriate message based on status
  CASE p_status
    WHEN 'approved' THEN
      v_title := 'Withdrawal Request Approved';
      v_message := CONCAT(
        'Your withdrawal request of ₹', p_amount, ' has been approved and will be processed within 2-3 business days.'
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || ' Admin Notes: ' || p_admin_notes;
      END IF;
    WHEN 'rejected' THEN
      v_title := 'Withdrawal Request Rejected';
      v_message := CONCAT(
        'Your withdrawal request of ₹', p_amount, ' has been rejected.'
      );
      IF p_admin_notes IS NOT NULL THEN
        v_message := v_message || ' Reason: ' || p_admin_notes;
      ELSE
        v_message := v_message || ' Please contact support for more information.';
      END IF;
    ELSE
      RETURN false;
  END CASE;
  
  -- Insert the message using 'content' column
  INSERT INTO user_messages (user_id, message_type, title, content)
  VALUES (p_user_id, 'withdrawal_' || p_status, v_title, v_message);
  
  RETURN true;
END;
$$;


ALTER FUNCTION public.send_withdrawal_status_message(p_user_id uuid, p_withdrawal_id uuid, p_status character varying, p_amount numeric, p_admin_notes text) OWNER TO postgres;

--
-- Name: set_membership_tx_completed_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_membership_tx_completed_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  ELSIF NEW.status <> 'completed' THEN
    -- keep completed_at as-is, or null it if you prefer resetting:
    -- NEW.completed_at := NULL;
    NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_membership_tx_completed_at() OWNER TO postgres;

--
-- Name: set_plan_name_from_plan_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_plan_name_from_plan_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.set_plan_name_from_plan_id() OWNER TO postgres;

--
-- Name: submit_question_report(uuid, character varying, character varying, character varying, character varying, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying, p_report_type character varying, p_description text DEFAULT NULL::text) RETURNS TABLE(id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_report_id uuid;
BEGIN
    -- Validate that user exists in user_profiles
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    -- Insert the question report
    INSERT INTO question_reports (
        user_id,
        exam_id,
        test_type,
        test_id,
        question_id,
        report_type,
        description,
        status
    ) VALUES (
        p_user_id,
        p_exam_id,
        p_test_type,
        p_test_id,
        p_question_id,
        p_report_type,
        p_description,
        'pending'
    ) RETURNING id INTO v_report_id;
    
    -- Return the report ID
    RETURN QUERY SELECT v_report_id;
END;
$$;


ALTER FUNCTION public.submit_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying, p_report_type character varying, p_description text) OWNER TO postgres;

--
-- Name: submit_test_complete(uuid, character varying, character varying, character varying, integer, integer, integer, integer, jsonb, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer DEFAULT NULL::integer, p_answers jsonb DEFAULT NULL::jsonb, p_topic_id character varying DEFAULT NULL::character varying) RETURNS TABLE(success boolean, message text, new_best_score integer, new_average_score numeric, new_rank integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_topic_id character varying) OWNER TO postgres;

--
-- Name: submitindividualtestscore(uuid, character varying, character varying, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer) OWNER TO postgres;

--
-- Name: sync_membership_to_profile(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_membership_to_profile(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.sync_membership_to_profile(p_user_id uuid) OWNER TO postgres;

--
-- Name: track_referral_signup(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying) RETURNS TABLE(success boolean, message text, transaction_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying) OWNER TO postgres;

--
-- Name: trigger_sync_membership_to_profile(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_sync_membership_to_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Sync membership data to user profile when membership is created/updated
  PERFORM sync_membership_to_profile(NEW.user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_sync_membership_to_profile() OWNER TO postgres;

--
-- Name: update_all_test_ranks(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_all_test_ranks(p_exam_id character varying, p_test_type character varying, p_test_id character varying) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  test_record RECORD;
  current_rank INTEGER;
  total_participants_count INTEGER; -- Renamed variable to avoid ambiguity
BEGIN
  -- Get total participants for this test
  SELECT COUNT(*) INTO total_participants_count
  FROM individual_test_scores
  WHERE exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Update ranks for all participants in this test
  current_rank := 1;
  FOR test_record IN
    SELECT user_id, score
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
    ORDER BY score DESC, completed_at ASC
  LOOP
    UPDATE individual_test_scores
    SET 
      rank = current_rank,
      total_participants = total_participants_count -- Use the renamed variable
    WHERE user_id = test_record.user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id;
    
    current_rank := current_rank + 1;
  END LOOP;
END;
$$;


ALTER FUNCTION public.update_all_test_ranks(p_exam_id character varying, p_test_type character varying, p_test_id character varying) OWNER TO postgres;

--
-- Name: update_daily_visit(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_daily_visit(user_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_activity_date DATE;
  v_today DATE;
  v_days_diff INTEGER;
BEGIN
  -- Use UTC date for consistency
  v_today := CURRENT_DATE AT TIME ZONE 'UTC';
  
  -- Get current streak data
  SELECT 
    us.current_streak,
    us.longest_streak,
    us.last_activity_date
  INTO v_current_streak, v_longest_streak, v_last_activity_date
  FROM user_streaks us
  WHERE us.user_id = user_uuid;

  -- If no existing record, create new one
  IF v_current_streak IS NULL THEN
    v_current_streak := 1;
    v_longest_streak := 1;
    v_last_activity_date := v_today;
  ELSE
    -- Calculate days difference
    v_days_diff := v_today - COALESCE(v_last_activity_date, v_today - 1);
    
    -- Update streak based on days difference
    IF v_days_diff = 0 THEN
      -- Same day, no change to streak
      NULL;
    ELSIF v_days_diff = 1 THEN
      -- Consecutive day, increment streak
      v_current_streak := v_current_streak + 1;
      v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
      v_last_activity_date := v_today;
    ELSE
      -- More than 1 day gap, reset streak
      v_current_streak := 1;
      v_longest_streak := GREATEST(v_longest_streak, 1);
      v_last_activity_date := v_today;
    END IF;
  END IF;

  -- Insert or update user streak
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, total_tests_taken, last_activity_date, created_at, updated_at
  )
  VALUES (
    user_uuid, v_current_streak, v_longest_streak, 1, v_last_activity_date, now(), now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_tests_taken = user_streaks.total_tests_taken + 1,
    last_activity_date = EXCLUDED.last_activity_date,
    updated_at = now();

  -- Return the updated streak data
  SELECT 
    json_build_object(
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak,
      'last_activity_date', v_last_activity_date,
      'days_diff', v_days_diff
    )
  INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION public.update_daily_visit(user_uuid uuid) OWNER TO postgres;

--
-- Name: update_exam_stats_properly(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name text, new_score integer DEFAULT 0) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    total_tests INTEGER;
    best_score INTEGER;
    average_score DECIMAL;
    last_test_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate stats from test_completions
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(MAX(score), 0)::INTEGER,
        COALESCE(AVG(score), 0)::DECIMAL,
        MAX(completed_at)
    INTO total_tests, best_score, average_score, last_test_date
    FROM test_completions
    WHERE user_id = user_uuid AND exam_id = exam_name;

    -- Upsert exam stats
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date, created_at, updated_at)
    VALUES (user_uuid, exam_name, total_tests, best_score, average_score, last_test_date, NOW(), NOW())
    ON CONFLICT (user_id, exam_id)
    DO UPDATE SET
        total_tests = EXCLUDED.total_tests,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score,
        last_test_date = EXCLUDED.last_test_date,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name text, new_score integer) OWNER TO postgres;

--
-- Name: update_exam_stats_properly(uuid, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer) OWNER TO postgres;

--
-- Name: update_membership_status(uuid, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE user_memberships
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE user_id = p_user_id AND plan_id = p_plan_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying) OWNER TO postgres;

--
-- Name: FUNCTION update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying) IS 'Updates user membership status';


--
-- Name: update_payment_failures_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payment_failures_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_payment_failures_updated_at() OWNER TO postgres;

--
-- Name: update_payment_status(uuid, text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payment_status(p_payment_id uuid, p_status text, p_razorpay_payment_id text DEFAULT NULL::text, p_paid_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.payments 
    SET 
        status = p_status,
        razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
        paid_at = COALESCE(p_paid_at, paid_at),
        updated_at = NOW()
    WHERE id = p_payment_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_payment_status(p_payment_id uuid, p_status text, p_razorpay_payment_id text, p_paid_at timestamp with time zone) OWNER TO postgres;

--
-- Name: update_payment_status(character varying, character varying, character varying, character varying, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying DEFAULT NULL::character varying, p_razorpay_order_id character varying DEFAULT NULL::character varying, p_razorpay_signature character varying DEFAULT NULL::character varying, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS TABLE(success boolean, message text, payment_id character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) OWNER TO postgres;

--
-- Name: update_referral_codes_earnings(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_referral_codes_earnings() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.update_referral_codes_earnings() OWNER TO postgres;

--
-- Name: update_referral_earnings(uuid, numeric, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF p_operation = 'add' THEN
    INSERT INTO referral_earnings (user_id, total_earnings, available_earnings, created_at, updated_at)
    VALUES (p_user_id, p_amount, p_amount, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_earnings = referral_earnings.total_earnings + p_amount,
      available_earnings = referral_earnings.available_earnings + p_amount,
      updated_at = NOW();
  ELSIF p_operation = 'subtract' THEN
    UPDATE referral_earnings
    SET 
      total_earnings = GREATEST(0, total_earnings - p_amount),
      available_earnings = GREATEST(0, available_earnings - p_amount),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying) OWNER TO postgres;

--
-- Name: FUNCTION update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying) IS 'Updates user referral earnings with add/subtract operations';


--
-- Name: update_referrer_earnings(uuid, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_referrer_earnings(p_user_id uuid, p_commission_amount numeric) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update the referrer's total earnings
  UPDATE user_profiles 
  SET 
    total_referral_earnings = COALESCE(total_referral_earnings, 0) + p_commission_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_referrer_earnings(p_user_id uuid, p_commission_amount numeric) OWNER TO postgres;

--
-- Name: update_refund_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_refund_requests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_refund_requests_updated_at() OWNER TO postgres;

--
-- Name: update_test_attempt_type(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_test_attempt_type(p_attempt_id uuid, p_test_type character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE test_attempts
  SET test_type = p_test_type
  WHERE id = p_attempt_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_test_attempt_type(p_attempt_id uuid, p_test_type character varying) OWNER TO postgres;

--
-- Name: update_test_attempts_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_test_attempts_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_test_attempts_updated_at() OWNER TO postgres;

--
-- Name: update_test_shares_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_test_shares_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_test_shares_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: update_user_profile_membership(uuid, text, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_profile_membership(p_user_id uuid, p_membership_status text, p_membership_plan text, p_membership_expiry timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        membership_status = p_membership_status,
        membership_plan = p_membership_plan,
        membership_expiry = p_membership_expiry,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_user_profile_membership(p_user_id uuid, p_membership_status text, p_membership_plan text, p_membership_expiry timestamp with time zone) OWNER TO postgres;

--
-- Name: update_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_streak(user_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    current_streak INTEGER;
    longest_streak INTEGER;
    last_activity_date DATE;
    total_tests INTEGER;
BEGIN
    -- Get current streak data
    SELECT 
        COALESCE(us.current_streak, 0),
        COALESCE(us.longest_streak, 0),
        COALESCE(us.last_activity_date, CURRENT_DATE - INTERVAL '1 day'),
        COALESCE(us.total_tests_taken, 0)
    INTO current_streak, longest_streak, last_activity_date, total_tests
    FROM user_streaks us
    WHERE us.user_id = user_uuid;

    -- Check if user took a test today
    IF EXISTS (
        SELECT 1 FROM test_completions tc
        WHERE tc.user_id = user_uuid 
        AND DATE(tc.completed_at) = CURRENT_DATE
    ) THEN
        -- If last activity was yesterday, increment streak
        IF last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
            current_streak := current_streak + 1;
        -- If last activity was today, keep current streak
        ELSIF last_activity_date = CURRENT_DATE THEN
            current_streak := current_streak;
        -- If gap more than 1 day, reset streak
        ELSE
            current_streak := 1;
        END IF;
        
        -- Update longest streak if needed
        IF current_streak > longest_streak THEN
            longest_streak := current_streak;
        END IF;
        
        -- Update total tests
        total_tests := total_tests + 1;
    END IF;

    -- Upsert streak data
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken, created_at, updated_at)
    VALUES (user_uuid, current_streak, longest_streak, CURRENT_DATE, total_tests, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_activity_date = EXCLUDED.last_activity_date,
        total_tests_taken = EXCLUDED.total_tests_taken,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION public.update_user_streak(user_uuid uuid) OWNER TO postgres;

--
-- Name: upsert_exam_stats(uuid, character varying, integer, integer, numeric, integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer DEFAULT NULL::integer, p_last_test_date timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer, p_last_test_date timestamp with time zone) OWNER TO postgres;

--
-- Name: upsert_test_attempt(uuid, character varying, character varying, character varying, integer, integer, integer, integer, jsonb, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_status character varying) RETURNS TABLE(success boolean, message text, attempt_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_attempt_id UUID;
  existing_attempt_id UUID;
BEGIN
  -- Check if attempt already exists
  SELECT id INTO existing_attempt_id
  FROM test_attempts
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id
  LIMIT 1;

  IF existing_attempt_id IS NOT NULL THEN
    -- Update existing attempt
    UPDATE test_attempts
    SET 
      score = p_score,
      total_questions = p_total_questions,
      correct_answers = p_correct_answers,
      time_taken = p_time_taken,
      answers = p_answers,
      status = p_status,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = existing_attempt_id;
    
    new_attempt_id := existing_attempt_id;
  ELSE
    -- Insert new attempt
    INSERT INTO test_attempts (
      user_id, exam_id, test_type, test_id, score, total_questions,
      correct_answers, time_taken, answers, status, completed_at
    )
    VALUES (
      p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
      p_correct_answers, p_time_taken, p_answers, p_status, NOW()
    )
    RETURNING id INTO new_attempt_id;
  END IF;

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

  -- Insert/update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, score, total_questions,
    correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_score, p_total_questions,
    p_correct_answers, p_time_taken, p_answers, NOW()
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = EXCLUDED.completed_at;

  -- Return success
  RETURN QUERY SELECT true, 'Test attempt saved successfully', new_attempt_id;
END;
$$;


ALTER FUNCTION public.upsert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_status character varying) OWNER TO postgres;

--
-- Name: upsert_test_completion_simple(uuid, text, text, text, text, integer, integer, integer, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id text, p_test_type text, p_test_id text, p_topic_id text DEFAULT NULL::text, p_score integer DEFAULT 0, p_total_questions integer DEFAULT 0, p_correct_answers integer DEFAULT 0, p_time_taken integer DEFAULT 0, p_answers jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO test_completions (
        user_id, exam_id, test_type, test_id, topic_id, score, 
        total_questions, correct_answers, time_taken, answers, 
        completed_at, created_at, updated_at
    )
    VALUES (
        p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id, p_score,
        p_total_questions, p_correct_answers, p_time_taken, p_answers,
        NOW(), NOW(), NOW()
    )
    ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        total_questions = EXCLUDED.total_questions,
        correct_answers = EXCLUDED.correct_answers,
        time_taken = EXCLUDED.time_taken,
        answers = EXCLUDED.answers,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id text, p_test_type text, p_test_id text, p_topic_id text, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) OWNER TO postgres;

--
-- Name: upsert_test_completion_simple(uuid, character varying, character varying, character varying, integer, integer, integer, character varying, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying DEFAULT NULL::character varying, p_time_taken integer DEFAULT NULL::integer, p_answers jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert or update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, 
    score, total_questions, correct_answers, time_taken, answers, completed_at
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id,
    p_score, p_total_questions, p_correct_answers, p_time_taken, p_answers, NOW()
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
$$;


ALTER FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying, p_time_taken integer, p_answers jsonb) OWNER TO postgres;

--
-- Name: validate_and_apply_referral_code(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying) RETURNS TABLE(success boolean, message text, referrer_id uuid, referrer_phone text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


ALTER FUNCTION public.validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying) OWNER TO postgres;

--
-- Name: validate_referral_code(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_referral_code(p_referral_code character varying) RETURNS TABLE(is_valid boolean, message text, referrer_id uuid, referrer_phone text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.validate_referral_code(p_referral_code character varying) OWNER TO postgres;

--
-- Name: validate_referral_code_for_signup(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_referral_code_for_signup(p_referral_code character varying) RETURNS TABLE(valid boolean, message text, referrer_id uuid, referrer_phone character varying)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


ALTER FUNCTION public.validate_referral_code_for_signup(p_referral_code character varying) OWNER TO postgres;

--
-- Name: verify_payment_webhook(character varying, character varying, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_signature TEXT;
  v_payload TEXT;
BEGIN
  -- Create payload for signature verification
  v_payload := p_razorpay_order_id || '|' || p_razorpay_payment_id;
  
  -- Generate expected signature
  v_signature := encode(hmac(v_payload, p_webhook_secret, 'sha256'), 'hex');
  
  -- Compare signatures
  RETURN v_signature = p_razorpay_signature;
END;
$$;


ALTER FUNCTION public.verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text) OWNER TO postgres;

--
-- Name: FUNCTION verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text) IS 'Verifies Razorpay webhook signature for security';


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_id text NOT NULL,
    client_secret_hash text NOT NULL,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: exam_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id character varying(50) NOT NULL,
    test_type character varying(20) NOT NULL,
    test_id character varying(100) NOT NULL,
    question_order integer NOT NULL,
    question_en text NOT NULL,
    question_hi text,
    options jsonb NOT NULL,
    correct_answer integer NOT NULL,
    difficulty character varying(10) DEFAULT 'medium'::character varying,
    subject character varying(50),
    topic character varying(50),
    marks integer DEFAULT 1,
    negative_marks numeric(3,2) DEFAULT 0.25,
    duration integer DEFAULT 60,
    explanation text,
    question_image text,
    options_images jsonb,
    explanation_image text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.exam_questions OWNER TO postgres;

--
-- Name: exam_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id character varying(50) NOT NULL,
    total_tests integer DEFAULT 0,
    best_score integer DEFAULT 0,
    average_score numeric(5,2) DEFAULT 0.00,
    rank integer,
    last_test_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_tests_taken integer DEFAULT 0,
    total_score integer DEFAULT 0,
    total_time_taken integer DEFAULT 0,
    average_time_per_question numeric(5,2) DEFAULT 0.00,
    accuracy_percentage numeric(5,2) DEFAULT 0.00,
    percentile numeric(5,2) DEFAULT 0.00,
    CONSTRAINT exam_stats_average_score_check CHECK ((average_score >= (0)::numeric)),
    CONSTRAINT exam_stats_best_score_check CHECK ((best_score >= 0)),
    CONSTRAINT exam_stats_rank_check CHECK (((rank IS NULL) OR (rank > 0))),
    CONSTRAINT exam_stats_total_tests_check CHECK ((total_tests >= 0))
);


ALTER TABLE public.exam_stats OWNER TO postgres;

--
-- Name: exam_test_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_test_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id character varying(50) NOT NULL,
    test_type character varying(20) NOT NULL,
    test_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    duration integer NOT NULL,
    total_questions integer NOT NULL,
    subjects jsonb,
    correct_marks integer DEFAULT 1,
    incorrect_marks numeric(3,2) DEFAULT 0.25,
    is_premium boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.exam_test_data OWNER TO postgres;

--
-- Name: individual_test_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.individual_test_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id character varying(50) NOT NULL,
    test_type character varying(20) NOT NULL,
    test_id character varying(100) NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL,
    time_taken integer,
    rank integer,
    completed_at timestamp with time zone DEFAULT now(),
    total_participants integer DEFAULT 0,
    CONSTRAINT check_individual_test_scores_exam_id_valid CHECK (((exam_id)::text = ANY ((ARRAY['ssc-cgl'::character varying, 'ssc-chsl'::character varying, 'ssc-mts'::character varying, 'ssc-cpo'::character varying, 'airforce'::character varying, 'navy'::character varying, 'army'::character varying])::text[])))
);


ALTER TABLE public.individual_test_scores OWNER TO postgres;

--
-- Name: membership_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.membership_plans (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    duration_days integer NOT NULL,
    duration_months integer DEFAULT 1 NOT NULL,
    mock_tests integer DEFAULT 0 NOT NULL,
    features jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    display_order integer DEFAULT 0,
    currency character varying(3) DEFAULT 'INR'::character varying
);


ALTER TABLE public.membership_plans OWNER TO postgres;

--
-- Name: user_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id character varying(50),
    start_date timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    plan character varying(50),
    CONSTRAINT check_expires_after_starts CHECK ((end_date > start_date)),
    CONSTRAINT check_status_valid CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.user_memberships OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    phone character varying(15) NOT NULL,
    membership_status character varying(20) DEFAULT 'free'::character varying,
    membership_plan character varying(50),
    membership_expiry timestamp with time zone,
    referral_code character varying(20),
    referred_by character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    referral_code_applied boolean DEFAULT false,
    referral_code_used character varying(20),
    referral_applied_at timestamp with time zone,
    email text,
    name text,
    phone_verified boolean DEFAULT false,
    upi_id text,
    referral_earnings numeric(10,2) DEFAULT 0,
    total_referrals integer DEFAULT 0,
    is_admin boolean DEFAULT false,
    pin text,
    total_referral_earnings numeric(10,2) DEFAULT 0
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: TABLE user_profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_profiles IS 'User profiles with phone-based authentication';


--
-- Name: COLUMN user_profiles.phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.phone IS 'Phone number in international format (e.g., +919876543210)';


--
-- Name: COLUMN user_profiles.referral_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.referral_code IS 'Unique referral code for this user';


--
-- Name: COLUMN user_profiles.referred_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.referred_by IS 'Referral code used by this user';


--
-- Name: COLUMN user_profiles.referral_code_applied; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.referral_code_applied IS 'Whether user has applied a referral code';


--
-- Name: COLUMN user_profiles.referral_code_used; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.referral_code_used IS 'The referral code this user used';


--
-- Name: COLUMN user_profiles.referral_applied_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.referral_applied_at IS 'When the referral code was applied';


--
-- Name: COLUMN user_profiles.total_referral_earnings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.total_referral_earnings IS 'Total earnings from referrals';


--
-- Name: membership_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.membership_summary AS
 SELECT up.id,
    up.phone,
    up.membership_status AS profile_status,
    up.membership_plan AS profile_plan,
    um.plan_id AS actual_plan,
    um.status AS actual_status,
    um.end_date AS expiry_date,
        CASE
            WHEN (((um.status)::text = 'active'::text) AND (um.end_date > now())) THEN 'Active'::text
            WHEN (((um.status)::text = 'expired'::text) OR (um.end_date <= now())) THEN 'Expired'::text
            ELSE 'Free'::text
        END AS computed_status
   FROM (public.user_profiles up
     LEFT JOIN public.user_memberships um ON ((up.id = um.user_id)));


ALTER VIEW public.membership_summary OWNER TO postgres;

--
-- Name: membership_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.membership_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    transaction_id character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gateway_response jsonb,
    completed_at timestamp with time zone,
    CONSTRAINT check_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT check_status_valid CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.membership_transactions OWNER TO postgres;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    mocks_used integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT memberships_plan_check CHECK ((plan = ANY (ARRAY['pro'::text, 'pro_plus'::text])))
);


ALTER TABLE public.memberships OWNER TO postgres;

--
-- Name: otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone character varying(20) NOT NULL,
    otp_code character varying(10) NOT NULL,
    provider character varying(50) DEFAULT 'custom'::character varying NOT NULL,
    message_id character varying(100),
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.otps OWNER TO postgres;

--
-- Name: payment_failures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_failures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_id text NOT NULL,
    failure_reason text NOT NULL,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    last_retry_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payment_failures_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'retrying'::text, 'failed'::text, 'resolved'::text])))
);


ALTER TABLE public.payment_failures OWNER TO postgres;

--
-- Name: payment_rollbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_rollbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id character varying(100) NOT NULL,
    user_id uuid NOT NULL,
    plan_id character varying(50) NOT NULL,
    original_amount numeric(10,2) NOT NULL,
    rollback_reason text NOT NULL,
    rollback_data jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_by uuid,
    CONSTRAINT payment_rollbacks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.payment_rollbacks OWNER TO postgres;

--
-- Name: TABLE payment_rollbacks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payment_rollbacks IS 'Tracks payment rollback operations and their status';


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id character varying(100),
    user_id uuid NOT NULL,
    plan_id character varying(50),
    plan_name character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    payment_method character varying(50) DEFAULT 'upi'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    razorpay_payment_id character varying(100),
    razorpay_order_id character varying(100),
    razorpay_signature character varying(255),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    plan character varying(50),
    paid_at timestamp with time zone,
    failed_reason text
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_type character varying(50) NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_value numeric(10,4) NOT NULL,
    metric_unit character varying(20),
    context jsonb,
    user_id uuid,
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.performance_metrics OWNER TO postgres;

--
-- Name: TABLE performance_metrics; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.performance_metrics IS 'Stores application performance monitoring data';


--
-- Name: question_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id character varying(50) NOT NULL,
    test_type character varying(20) NOT NULL,
    test_id character varying(100) NOT NULL,
    question_id character varying(100) NOT NULL,
    report_type character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.question_reports OWNER TO postgres;

--
-- Name: referral_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    total_referrals integer DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.referral_codes OWNER TO postgres;

--
-- Name: TABLE referral_codes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.referral_codes IS 'Referral codes table - RLS disabled for custom authentication compatibility';


--
-- Name: referral_commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    commission_amount numeric(10,2) DEFAULT 0 NOT NULL,
    commission_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    membership_amount numeric(10,2) DEFAULT 0,
    membership_plan character varying(50) DEFAULT 'none'::character varying,
    membership_purchased_date timestamp with time zone,
    payment_id uuid,
    commission_rate numeric(5,2) DEFAULT 0
);


ALTER TABLE public.referral_commissions OWNER TO postgres;

--
-- Name: referral_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT referral_notifications_type_check CHECK ((type = ANY (ARRAY['referral_signup'::text, 'referral_purchase'::text, 'commission_earned'::text, 'referral_milestone'::text])))
);


ALTER TABLE public.referral_notifications OWNER TO postgres;

--
-- Name: referral_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    transaction_type character varying(20) NOT NULL,
    amount numeric(10,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    referral_code character varying(20),
    commission_amount numeric(10,2) DEFAULT 0,
    commission_status character varying(20) DEFAULT 'pending'::character varying,
    first_membership_only boolean DEFAULT true,
    membership_purchased boolean DEFAULT false,
    payment_id uuid,
    CONSTRAINT check_commission_status_valid CHECK (((commission_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.referral_transactions OWNER TO postgres;

--
-- Name: COLUMN referral_transactions.referral_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referral_transactions.referral_code IS 'The referral code used for this transaction';


--
-- Name: COLUMN referral_transactions.commission_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referral_transactions.commission_amount IS 'Commission amount earned by referrer';


--
-- Name: COLUMN referral_transactions.commission_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referral_transactions.commission_status IS 'Status of commission payment (pending, paid, cancelled, refunded)';


--
-- Name: COLUMN referral_transactions.first_membership_only; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referral_transactions.first_membership_only IS 'Whether commission is only for first membership purchase';


--
-- Name: COLUMN referral_transactions.membership_purchased; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referral_transactions.membership_purchased IS 'Whether a membership was purchased in this transaction';


--
-- Name: COLUMN referral_transactions.payment_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.referral_transactions.payment_id IS 'Reference to the payment that triggered this referral';


--
-- Name: refund_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    payment_id text NOT NULL,
    order_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text,
    requested_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    refund_id text,
    admin_notes text,
    created_by text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT refund_requests_created_by_check CHECK ((created_by = ANY (ARRAY['user'::text, 'admin'::text, 'system'::text]))),
    CONSTRAINT refund_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT refund_requests_type_check CHECK ((type = ANY (ARRAY['user_requested'::text, 'payment_failed'::text, 'duplicate_payment'::text, 'service_unavailable'::text, 'fraud_detected'::text])))
);


ALTER TABLE public.refund_requests OWNER TO postgres;

--
-- Name: security_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    resource text NOT NULL,
    ip_address inet,
    user_agent text,
    success boolean NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.security_audit_log OWNER TO postgres;

--
-- Name: test_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id character varying(50) NOT NULL,
    test_type character varying(20) DEFAULT 'practice'::character varying,
    test_id character varying(100) DEFAULT 'default_test'::character varying,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL,
    time_taken integer,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    answers jsonb,
    status character varying(50) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_test_attempts_exam_id_valid CHECK (((exam_id)::text = ANY ((ARRAY['ssc-cgl'::character varying, 'ssc-chsl'::character varying, 'ssc-mts'::character varying, 'ssc-cpo'::character varying, 'airforce'::character varying, 'navy'::character varying, 'army'::character varying])::text[])))
);


ALTER TABLE public.test_attempts OWNER TO postgres;

--
-- Name: test_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id character varying(50) NOT NULL,
    test_type character varying(20) NOT NULL,
    test_id character varying(100) NOT NULL,
    topic_id character varying(100),
    score integer NOT NULL,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL,
    time_taken integer,
    completed_at timestamp with time zone DEFAULT now(),
    answers jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_test_completions_exam_id_valid CHECK (((exam_id)::text = ANY ((ARRAY['ssc-cgl'::character varying, 'ssc-chsl'::character varying, 'ssc-mts'::character varying, 'ssc-cpo'::character varying, 'airforce'::character varying, 'navy'::character varying, 'army'::character varying])::text[])))
);


ALTER TABLE public.test_completions OWNER TO postgres;

--
-- Name: user_streaks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    total_tests_taken integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_visit_date date
);


ALTER TABLE public.user_streaks OWNER TO postgres;

--
-- Name: test_data_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.test_data_summary AS
 SELECT up.id AS user_id,
    up.phone,
    up.membership_status,
    up.membership_plan,
    up.referral_code,
    up.referred_by,
    us.current_streak,
    us.total_tests_taken,
    um.plan_id AS actual_plan,
    um.status AS membership_status_actual,
    um.end_date AS membership_expiry,
    count(tc.id) AS test_completions_count,
    count(its.id) AS individual_scores_count,
    count(ta.id) AS test_attempts_count
   FROM (((((public.user_profiles up
     LEFT JOIN public.user_streaks us ON ((up.id = us.user_id)))
     LEFT JOIN public.user_memberships um ON ((up.id = um.user_id)))
     LEFT JOIN public.test_completions tc ON ((up.id = tc.user_id)))
     LEFT JOIN public.individual_test_scores its ON ((up.id = its.user_id)))
     LEFT JOIN public.test_attempts ta ON ((up.id = ta.user_id)))
  GROUP BY up.id, up.phone, up.membership_status, up.membership_plan, up.referral_code, up.referred_by, us.current_streak, us.total_tests_taken, um.plan_id, um.status, um.end_date;


ALTER VIEW public.test_data_summary OWNER TO postgres;

--
-- Name: test_share_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_share_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    share_code text NOT NULL,
    user_id uuid,
    ip_address text,
    accessed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.test_share_access OWNER TO postgres;

--
-- Name: test_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id text NOT NULL,
    exam_id text NOT NULL,
    section_id text NOT NULL,
    test_type text NOT NULL,
    test_name text NOT NULL,
    is_premium boolean DEFAULT false,
    share_code text NOT NULL,
    share_url text,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.test_shares OWNER TO postgres;

--
-- Name: test_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_states (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id character varying(50) NOT NULL,
    section_id character varying(50),
    test_type character varying(20) NOT NULL,
    test_id character varying(100) NOT NULL,
    state_data jsonb NOT NULL,
    last_saved_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.test_states OWNER TO postgres;

--
-- Name: TABLE test_states; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_states IS 'Stores user test progress for recovery and persistence';


--
-- Name: user_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    message_type character varying(50) DEFAULT 'info'::character varying
);


ALTER TABLE public.user_messages OWNER TO postgres;

--
-- Name: TABLE user_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_messages IS 'Stores user notifications and messages';


--
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawal_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_details jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    processed_by uuid,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.withdrawal_requests OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_client_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_client_id_key UNIQUE (client_id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: exam_questions exam_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_pkey PRIMARY KEY (id);


--
-- Name: exam_stats exam_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_stats
    ADD CONSTRAINT exam_stats_pkey PRIMARY KEY (id);


--
-- Name: exam_stats exam_stats_user_exam_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_stats
    ADD CONSTRAINT exam_stats_user_exam_unique UNIQUE (user_id, exam_id);


--
-- Name: exam_test_data exam_test_data_exam_id_test_type_test_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_test_data
    ADD CONSTRAINT exam_test_data_exam_id_test_type_test_id_key UNIQUE (exam_id, test_type, test_id);


--
-- Name: exam_test_data exam_test_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_test_data
    ADD CONSTRAINT exam_test_data_pkey PRIMARY KEY (id);


--
-- Name: individual_test_scores individual_test_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.individual_test_scores
    ADD CONSTRAINT individual_test_scores_pkey PRIMARY KEY (id);


--
-- Name: individual_test_scores individual_test_scores_user_id_exam_id_test_type_test_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.individual_test_scores
    ADD CONSTRAINT individual_test_scores_user_id_exam_id_test_type_test_id_key UNIQUE (user_id, exam_id, test_type, test_id);


--
-- Name: membership_plans membership_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


--
-- Name: membership_transactions membership_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_transactions
    ADD CONSTRAINT membership_transactions_pkey PRIMARY KEY (id);


--
-- Name: membership_transactions membership_transactions_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_transactions
    ADD CONSTRAINT membership_transactions_transaction_id_key UNIQUE (transaction_id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_key UNIQUE (user_id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: payment_failures payment_failures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_failures
    ADD CONSTRAINT payment_failures_pkey PRIMARY KEY (id);


--
-- Name: payment_rollbacks payment_rollbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_rollbacks
    ADD CONSTRAINT payment_rollbacks_pkey PRIMARY KEY (id);


--
-- Name: payments payments_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_id_key UNIQUE (payment_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: question_reports question_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_reports
    ADD CONSTRAINT question_reports_pkey PRIMARY KEY (id);


--
-- Name: referral_codes referral_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_code_key UNIQUE (code);


--
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- Name: referral_commissions referral_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_commissions
    ADD CONSTRAINT referral_commissions_pkey PRIMARY KEY (id);


--
-- Name: referral_notifications referral_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_notifications
    ADD CONSTRAINT referral_notifications_pkey PRIMARY KEY (id);


--
-- Name: referral_transactions referral_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_transactions
    ADD CONSTRAINT referral_transactions_pkey PRIMARY KEY (id);


--
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);


--
-- Name: security_audit_log security_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit_log
    ADD CONSTRAINT security_audit_log_pkey PRIMARY KEY (id);


--
-- Name: test_attempts test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);


--
-- Name: test_completions test_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_completions
    ADD CONSTRAINT test_completions_pkey PRIMARY KEY (id);


--
-- Name: test_completions test_completions_user_id_exam_id_test_type_test_id_topic_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_completions
    ADD CONSTRAINT test_completions_user_id_exam_id_test_type_test_id_topic_id_key UNIQUE (user_id, exam_id, test_type, test_id, topic_id);


--
-- Name: test_share_access test_share_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_share_access
    ADD CONSTRAINT test_share_access_pkey PRIMARY KEY (id);


--
-- Name: test_shares test_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_shares
    ADD CONSTRAINT test_shares_pkey PRIMARY KEY (id);


--
-- Name: test_shares test_shares_share_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_shares
    ADD CONSTRAINT test_shares_share_code_key UNIQUE (share_code);


--
-- Name: test_states test_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_states
    ADD CONSTRAINT test_states_pkey PRIMARY KEY (id);


--
-- Name: test_states test_states_user_id_exam_id_section_id_test_type_test_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_states
    ADD CONSTRAINT test_states_user_id_exam_id_section_id_test_type_test_id_key UNIQUE (user_id, exam_id, section_id, test_type, test_id);


--
-- Name: user_memberships user_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_memberships
    ADD CONSTRAINT user_memberships_pkey PRIMARY KEY (id);


--
-- Name: user_messages user_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_messages
    ADD CONSTRAINT user_messages_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);


--
-- Name: user_profiles user_profiles_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_phone_unique UNIQUE (phone);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: user_streaks user_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);


--
-- Name: user_streaks user_streaks_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_key UNIQUE (user_id);


--
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_clients_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_client_id_idx ON auth.oauth_clients USING btree (client_id);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_exam_questions_exam_test; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_questions_exam_test ON public.exam_questions USING btree (exam_id, test_type, test_id);


--
-- Name: idx_exam_questions_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_questions_order ON public.exam_questions USING btree (exam_id, test_type, test_id, question_order);


--
-- Name: idx_exam_stats_best_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_stats_best_score ON public.exam_stats USING btree (exam_id, best_score DESC);


--
-- Name: idx_exam_stats_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_stats_exam_id ON public.exam_stats USING btree (exam_id);


--
-- Name: idx_exam_stats_rank; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_stats_rank ON public.exam_stats USING btree (exam_id, rank) WHERE (rank IS NOT NULL);


--
-- Name: idx_exam_stats_user_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_stats_user_exam ON public.exam_stats USING btree (user_id, exam_id);


--
-- Name: idx_exam_stats_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_stats_user_id ON public.exam_stats USING btree (user_id);


--
-- Name: idx_exam_test_data_exam_test; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exam_test_data_exam_test ON public.exam_test_data USING btree (exam_id, test_type, test_id);


--
-- Name: idx_individual_test_scores_user_id_exam_id_test_type_test_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_individual_test_scores_user_id_exam_id_test_type_test_id ON public.individual_test_scores USING btree (user_id, exam_id, test_type, test_id);


--
-- Name: idx_membership_transactions_completed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_transactions_completed_at ON public.membership_transactions USING btree (completed_at);


--
-- Name: idx_membership_transactions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_transactions_created_at ON public.membership_transactions USING btree (created_at);


--
-- Name: idx_membership_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_transactions_status ON public.membership_transactions USING btree (status);


--
-- Name: idx_membership_transactions_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_transactions_transaction_id ON public.membership_transactions USING btree (transaction_id);


--
-- Name: idx_membership_transactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_transactions_user_id ON public.membership_transactions USING btree (user_id);


--
-- Name: idx_otps_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_created_at ON public.otps USING btree (created_at);


--
-- Name: idx_otps_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_expires_at ON public.otps USING btree (expires_at);


--
-- Name: idx_otps_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_phone ON public.otps USING btree (phone);


--
-- Name: idx_otps_phone_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_phone_verified ON public.otps USING btree (phone, is_verified);


--
-- Name: idx_otps_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otps_provider ON public.otps USING btree (provider);


--
-- Name: idx_payment_failures_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_failures_created_at ON public.payment_failures USING btree (created_at);


--
-- Name: idx_payment_failures_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_failures_status ON public.payment_failures USING btree (status);


--
-- Name: idx_payment_failures_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_failures_user_id ON public.payment_failures USING btree (user_id);


--
-- Name: idx_payment_rollbacks_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_rollbacks_payment_id ON public.payment_rollbacks USING btree (payment_id);


--
-- Name: idx_payment_rollbacks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_rollbacks_status ON public.payment_rollbacks USING btree (status);


--
-- Name: idx_payment_rollbacks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_rollbacks_user_id ON public.payment_rollbacks USING btree (user_id);


--
-- Name: idx_payments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_created_at ON public.payments USING btree (created_at);


--
-- Name: idx_payments_paid_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_paid_at ON public.payments USING btree (paid_at);


--
-- Name: idx_payments_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_payment_id ON public.payments USING btree (payment_id);


--
-- Name: idx_payments_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_plan ON public.payments USING btree (plan);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_payments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);


--
-- Name: idx_payments_user_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_id_status ON public.payments USING btree (user_id, status);


--
-- Name: idx_performance_metrics_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics USING btree (created_at);


--
-- Name: idx_performance_metrics_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_performance_metrics_name ON public.performance_metrics USING btree (metric_name);


--
-- Name: idx_performance_metrics_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_performance_metrics_type ON public.performance_metrics USING btree (metric_type);


--
-- Name: idx_performance_metrics_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics USING btree (user_id);


--
-- Name: idx_question_reports_exam_test; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_reports_exam_test ON public.question_reports USING btree (exam_id, test_type, test_id);


--
-- Name: idx_question_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_reports_status ON public.question_reports USING btree (status);


--
-- Name: idx_question_reports_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_reports_user_id ON public.question_reports USING btree (user_id);


--
-- Name: idx_referral_codes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_codes_code ON public.referral_codes USING btree (code);


--
-- Name: idx_referral_codes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_codes_user_id ON public.referral_codes USING btree (user_id);


--
-- Name: idx_referral_commissions_membership_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_commissions_membership_amount ON public.referral_commissions USING btree (membership_amount);


--
-- Name: idx_referral_commissions_membership_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_commissions_membership_plan ON public.referral_commissions USING btree (membership_plan);


--
-- Name: idx_referral_commissions_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_commissions_payment_id ON public.referral_commissions USING btree (payment_id);


--
-- Name: idx_referral_commissions_referred_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_commissions_referred_id ON public.referral_commissions USING btree (referred_id);


--
-- Name: idx_referral_commissions_referrer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_commissions_referrer_id ON public.referral_commissions USING btree (referrer_id);


--
-- Name: idx_referral_commissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_commissions_status ON public.referral_commissions USING btree (status);


--
-- Name: idx_referral_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_notifications_created_at ON public.referral_notifications USING btree (created_at);


--
-- Name: idx_referral_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_notifications_is_read ON public.referral_notifications USING btree (is_read);


--
-- Name: idx_referral_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_notifications_type ON public.referral_notifications USING btree (type);


--
-- Name: idx_referral_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_notifications_user_id ON public.referral_notifications USING btree (user_id);


--
-- Name: idx_referral_transactions_commission_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_transactions_commission_status ON public.referral_transactions USING btree (commission_status);


--
-- Name: idx_referral_transactions_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_transactions_payment_id ON public.referral_transactions USING btree (payment_id);


--
-- Name: idx_referral_transactions_referral_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_transactions_referral_code ON public.referral_transactions USING btree (referral_code);


--
-- Name: idx_referral_transactions_referred_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_transactions_referred_id ON public.referral_transactions USING btree (referred_id);


--
-- Name: idx_referral_transactions_referrer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_transactions_referrer_id ON public.referral_transactions USING btree (referrer_id);


--
-- Name: idx_referral_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_transactions_status ON public.referral_transactions USING btree (status);


--
-- Name: idx_refund_requests_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_requests_payment_id ON public.refund_requests USING btree (payment_id);


--
-- Name: idx_refund_requests_requested_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_requests_requested_at ON public.refund_requests USING btree (requested_at);


--
-- Name: idx_refund_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_requests_status ON public.refund_requests USING btree (status);


--
-- Name: idx_refund_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_requests_user_id ON public.refund_requests USING btree (user_id);


--
-- Name: idx_security_audit_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log USING btree (created_at);


--
-- Name: idx_security_audit_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log USING btree (user_id);


--
-- Name: idx_test_attempts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_created_at ON public.test_attempts USING btree (created_at);


--
-- Name: idx_test_attempts_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_exam_id ON public.test_attempts USING btree (exam_id);


--
-- Name: idx_test_attempts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_status ON public.test_attempts USING btree (status);


--
-- Name: idx_test_attempts_test_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_test_id ON public.test_attempts USING btree (test_id);


--
-- Name: idx_test_attempts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_user_id ON public.test_attempts USING btree (user_id);


--
-- Name: idx_test_attempts_user_id_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_user_id_exam_id ON public.test_attempts USING btree (user_id, exam_id);


--
-- Name: idx_test_attempts_user_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_user_id_status ON public.test_attempts USING btree (user_id, status);


--
-- Name: idx_test_attempts_user_id_test_id_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_user_id_test_id_type ON public.test_attempts USING btree (user_id, test_id, test_type);


--
-- Name: idx_test_attempts_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_attempts_user_status ON public.test_attempts USING btree (user_id, status);


--
-- Name: idx_test_completions_user_exam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_completions_user_exam ON public.test_completions USING btree (user_id, exam_id);


--
-- Name: idx_test_completions_user_id_exam_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_completions_user_id_exam_id ON public.test_completions USING btree (user_id, exam_id);


--
-- Name: idx_test_completions_user_id_exam_id_test_type_test_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_completions_user_id_exam_id_test_type_test_id ON public.test_completions USING btree (user_id, exam_id, test_type, test_id);


--
-- Name: idx_test_share_access_accessed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_share_access_accessed_at ON public.test_share_access USING btree (accessed_at);


--
-- Name: idx_test_share_access_share_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_share_access_share_code ON public.test_share_access USING btree (share_code);


--
-- Name: idx_test_share_access_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_share_access_user_id ON public.test_share_access USING btree (user_id);


--
-- Name: idx_test_shares_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_shares_created_by ON public.test_shares USING btree (created_by);


--
-- Name: idx_test_shares_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_shares_expires_at ON public.test_shares USING btree (expires_at);


--
-- Name: idx_test_shares_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_shares_is_active ON public.test_shares USING btree (is_active);


--
-- Name: idx_test_shares_share_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_shares_share_code ON public.test_shares USING btree (share_code);


--
-- Name: idx_test_states_exam_test; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_states_exam_test ON public.test_states USING btree (exam_id, test_type, test_id);


--
-- Name: idx_test_states_last_saved; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_states_last_saved ON public.test_states USING btree (last_saved_at);


--
-- Name: idx_test_states_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_states_user_id ON public.test_states USING btree (user_id);


--
-- Name: idx_user_memberships_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_memberships_end_date ON public.user_memberships USING btree (end_date);


--
-- Name: idx_user_memberships_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_memberships_plan ON public.user_memberships USING btree (plan);


--
-- Name: idx_user_memberships_plan_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_memberships_plan_id ON public.user_memberships USING btree (plan_id);


--
-- Name: idx_user_memberships_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_memberships_status ON public.user_memberships USING btree (status);


--
-- Name: idx_user_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_memberships_user_id ON public.user_memberships USING btree (user_id);


--
-- Name: idx_user_memberships_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_memberships_user_status ON public.user_memberships USING btree (user_id, status);


--
-- Name: idx_user_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_messages_created_at ON public.user_messages USING btree (created_at);


--
-- Name: idx_user_messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_messages_is_read ON public.user_messages USING btree (is_read);


--
-- Name: idx_user_messages_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_messages_type ON public.user_messages USING btree (message_type);


--
-- Name: idx_user_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_messages_user_id ON public.user_messages USING btree (user_id);


--
-- Name: idx_user_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);


--
-- Name: idx_user_profiles_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_phone ON public.user_profiles USING btree (phone);


--
-- Name: idx_user_profiles_referral_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_referral_code ON public.user_profiles USING btree (referral_code);


--
-- Name: idx_user_profiles_referral_code_used; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_referral_code_used ON public.user_profiles USING btree (referral_code_used);


--
-- Name: idx_user_streaks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_streaks_user_id ON public.user_streaks USING btree (user_id);


--
-- Name: idx_withdrawal_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status);


--
-- Name: idx_withdrawal_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: payments set_plan_name_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_plan_name_trigger BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_plan_name_from_plan_id();


--
-- Name: user_memberships sync_membership_to_profile_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER sync_membership_to_profile_trigger AFTER INSERT OR UPDATE ON public.user_memberships FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_membership_to_profile();


--
-- Name: payments trg_payments_method_backfill; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_method_backfill BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payments_method_backfill();


--
-- Name: payments trg_payments_plan_backfill; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_plan_backfill BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payments_plan_backfill();


--
-- Name: payments trg_payments_plan_name_backfill; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_plan_name_backfill BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payments_plan_name_backfill();


--
-- Name: membership_transactions trg_set_membership_tx_completed_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_set_membership_tx_completed_at BEFORE UPDATE ON public.membership_transactions FOR EACH ROW EXECUTE FUNCTION public.set_membership_tx_completed_at();


--
-- Name: payments trigger_create_referral_transaction_on_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_create_referral_transaction_on_payment AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.create_referral_transaction_on_payment();


--
-- Name: test_attempts trigger_update_test_attempts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_test_attempts_updated_at BEFORE UPDATE ON public.test_attempts FOR EACH ROW EXECUTE FUNCTION public.update_test_attempts_updated_at();


--
-- Name: exam_stats update_exam_stats_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_exam_stats_updated_at BEFORE UPDATE ON public.exam_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payment_failures update_payment_failures_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_payment_failures_updated_at BEFORE UPDATE ON public.payment_failures FOR EACH ROW EXECUTE FUNCTION public.update_payment_failures_updated_at();


--
-- Name: refund_requests update_refund_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.update_refund_requests_updated_at();


--
-- Name: test_shares update_test_shares_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_test_shares_updated_at BEFORE UPDATE ON public.test_shares FOR EACH ROW EXECUTE FUNCTION public.update_test_shares_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: exam_stats exam_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_stats
    ADD CONSTRAINT exam_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_transactions fk_referral_transactions_payment_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_transactions
    ADD CONSTRAINT fk_referral_transactions_payment_id FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: individual_test_scores individual_test_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.individual_test_scores
    ADD CONSTRAINT individual_test_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: membership_transactions membership_transactions_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_transactions
    ADD CONSTRAINT membership_transactions_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.user_memberships(id) ON DELETE CASCADE;


--
-- Name: membership_transactions membership_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_transactions
    ADD CONSTRAINT membership_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: memberships memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payment_rollbacks payment_rollbacks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_rollbacks
    ADD CONSTRAINT payment_rollbacks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: payment_rollbacks payment_rollbacks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_rollbacks
    ADD CONSTRAINT payment_rollbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: performance_metrics performance_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: question_reports question_reports_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_reports
    ADD CONSTRAINT question_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.user_profiles(id);


--
-- Name: question_reports question_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_reports
    ADD CONSTRAINT question_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: referral_codes referral_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: referral_commissions referral_commissions_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_commissions
    ADD CONSTRAINT referral_commissions_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.user_profiles(id);


--
-- Name: referral_commissions referral_commissions_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_commissions
    ADD CONSTRAINT referral_commissions_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.user_profiles(id);


--
-- Name: referral_transactions referral_transactions_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_transactions
    ADD CONSTRAINT referral_transactions_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.user_profiles(id);


--
-- Name: referral_transactions referral_transactions_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_transactions
    ADD CONSTRAINT referral_transactions_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.user_profiles(id);


--
-- Name: security_audit_log security_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit_log
    ADD CONSTRAINT security_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: test_attempts test_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: test_completions test_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_completions
    ADD CONSTRAINT test_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: test_states test_states_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_states
    ADD CONSTRAINT test_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_memberships user_memberships_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_memberships
    ADD CONSTRAINT user_memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);


--
-- Name: user_memberships user_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_memberships
    ADD CONSTRAINT user_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: user_messages user_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_messages
    ADD CONSTRAINT user_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: user_streaks user_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: withdrawal_requests withdrawal_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.user_profiles(id);


--
-- Name: withdrawal_requests withdrawal_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: refund_requests Admins can update refund requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update refund requests" ON public.refund_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: payment_failures Admins can view all payment failures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all payment failures" ON public.payment_failures FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: refund_requests Admins can view all refund requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all refund requests" ON public.refund_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: test_share_access Anyone can insert test share access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can insert test share access" ON public.test_share_access FOR INSERT WITH CHECK (true);


--
-- Name: test_shares Anyone can view active test shares by code; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view active test shares by code" ON public.test_shares FOR SELECT USING (((is_active = true) AND (expires_at > now())));


--
-- Name: membership_plans Anyone can view membership plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view membership plans" ON public.membership_plans FOR SELECT USING (true);


--
-- Name: user_profiles Custom auth can manage user profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Custom auth can manage user profiles" ON public.user_profiles USING (true);


--
-- Name: otps Service role can manage OTPs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can manage OTPs" ON public.otps USING (true);


--
-- Name: referral_notifications System can insert notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert notifications" ON public.referral_notifications FOR INSERT WITH CHECK (true);


--
-- Name: test_shares Users can create test shares; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create test shares" ON public.test_shares FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: refund_requests Users can create their own refund requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own refund requests" ON public.refund_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: exam_stats Users can delete their own exam stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own exam stats" ON public.exam_stats FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_memberships Users can insert own memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own memberships" ON public.user_memberships FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: question_reports Users can insert own question reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own question reports" ON public.question_reports FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: referral_codes Users can insert own referral codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own referral codes" ON public.referral_codes FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_streaks Users can insert own streaks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own streaks" ON public.user_streaks FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: test_completions Users can insert own test completions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own test completions" ON public.test_completions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: individual_test_scores Users can insert own test scores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own test scores" ON public.individual_test_scores FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: membership_transactions Users can insert own transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own transactions" ON public.membership_transactions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: withdrawal_requests Users can insert own withdrawal requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: exam_stats Users can insert their own exam stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own exam stats" ON public.exam_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_profiles Users can insert their own profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own profiles" ON public.user_profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_messages Users can manage their own messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own messages" ON public.user_messages USING ((auth.uid() = user_id));


--
-- Name: test_states Users can manage their own test states; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own test states" ON public.test_states USING ((auth.uid() = user_id));


--
-- Name: exam_questions Users can read exam questions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read exam questions" ON public.exam_questions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: exam_test_data Users can read exam test data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read exam test data" ON public.exam_test_data FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: referral_codes Users can update own referral codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own referral codes" ON public.referral_codes FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: user_streaks Users can update own streaks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: test_completions Users can update own test completions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own test completions" ON public.test_completions FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: individual_test_scores Users can update own test scores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own test scores" ON public.individual_test_scores FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: exam_stats Users can update their own exam stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own exam stats" ON public.exam_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: referral_notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON public.referral_notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update their own profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profiles" ON public.user_profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: test_shares Users can update their own test shares; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own test shares" ON public.test_shares FOR UPDATE USING ((auth.uid() = created_by));


--
-- Name: user_memberships Users can view own memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own memberships" ON public.user_memberships FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: question_reports Users can view own question reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own question reports" ON public.question_reports FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: referral_codes Users can view own referral codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own referral codes" ON public.referral_codes FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_streaks Users can view own streaks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: test_completions Users can view own test completions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own test completions" ON public.test_completions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: individual_test_scores Users can view own test scores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own test scores" ON public.individual_test_scores FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: membership_transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own transactions" ON public.membership_transactions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: withdrawal_requests Users can view own withdrawal requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: exam_stats Users can view their own exam stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own exam stats" ON public.exam_stats FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referral_notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notifications" ON public.referral_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payment_failures Users can view their own payment failures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own payment failures" ON public.payment_failures FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payment_rollbacks Users can view their own payment rollbacks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own payment rollbacks" ON public.payment_rollbacks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: performance_metrics Users can view their own performance metrics; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics FOR SELECT USING (((auth.uid() = user_id) OR (user_id IS NULL)));


--
-- Name: user_profiles Users can view their own profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own profiles" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: refund_requests Users can view their own refund requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own refund requests" ON public.refund_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: test_share_access Users can view their own test share access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own test share access" ON public.test_share_access FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: test_shares Users can view their own test shares; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own test shares" ON public.test_shares FOR SELECT USING ((auth.uid() = created_by));


--
-- Name: exam_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.exam_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_test_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.exam_test_data ENABLE ROW LEVEL SECURITY;

--
-- Name: individual_test_scores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.individual_test_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: membership_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: memberships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: memberships memberships_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY memberships_owner ON public.memberships FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: memberships memberships_owner_mod; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY memberships_owner_mod ON public.memberships FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: otps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_failures; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_rollbacks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_rollbacks ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments_anon_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_anon_access ON public.payments TO anon USING (true) WITH CHECK (true);


--
-- Name: payments payments_authenticated_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_authenticated_access ON public.payments TO authenticated USING (true) WITH CHECK (true);


--
-- Name: payments payments_authenticated_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_authenticated_insert ON public.payments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: payments payments_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_insert_own ON public.payments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: payments payments_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_select_own ON public.payments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payments payments_service_role_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_service_role_all ON public.payments TO service_role USING (true) WITH CHECK (true);


--
-- Name: payments payments_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payments_update_own ON public.payments FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: performance_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.referral_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: refund_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: test_attempts test_attempts_anon_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY test_attempts_anon_access ON public.test_attempts TO anon USING (true) WITH CHECK (true);


--
-- Name: test_attempts test_attempts_authenticated_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY test_attempts_authenticated_access ON public.test_attempts TO authenticated USING (true) WITH CHECK (true);


--
-- Name: test_completions test_completions_anon_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY test_completions_anon_access ON public.test_completions TO anon USING (true) WITH CHECK (true);


--
-- Name: test_completions test_completions_authenticated_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY test_completions_authenticated_access ON public.test_completions TO authenticated USING (true) WITH CHECK (true);


--
-- Name: test_share_access; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.test_share_access ENABLE ROW LEVEL SECURITY;

--
-- Name: test_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.test_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: test_states; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.test_states ENABLE ROW LEVEL SECURITY;

--
-- Name: user_streaks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawal_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.activate_or_upgrade_membership(p_user uuid, p_plan character varying, p_upgrade_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying) TO anon;
GRANT ALL ON FUNCTION public.add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying) TO authenticated;
GRANT ALL ON FUNCTION public.add_admin_user(admin_user_id uuid, target_user_id uuid, admin_role character varying) TO service_role;


--
-- Name: FUNCTION admin_verify_payment(p_payment_id character varying, p_admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.admin_verify_payment(p_payment_id character varying, p_admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.admin_verify_payment(p_payment_id character varying, p_admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.admin_verify_payment(p_payment_id character varying, p_admin_notes text) TO service_role;


--
-- Name: FUNCTION apply_referral_code(p_user_id uuid, p_referral_code text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code text) TO anon;
GRANT ALL ON FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code text) TO authenticated;
GRANT ALL ON FUNCTION public.apply_referral_code(p_user_id uuid, p_referral_code text) TO service_role;


--
-- Name: FUNCTION attempt_use_mock(p_user uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.attempt_use_mock(p_user uuid) TO anon;
GRANT ALL ON FUNCTION public.attempt_use_mock(p_user uuid) TO authenticated;
GRANT ALL ON FUNCTION public.attempt_use_mock(p_user uuid) TO service_role;


--
-- Name: FUNCTION can_make_withdrawal_request(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.can_make_withdrawal_request(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.can_make_withdrawal_request(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_make_withdrawal_request(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION cancel_user_membership(p_user_id uuid, p_reason text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cancel_user_membership(p_user_id uuid, p_reason text) TO anon;
GRANT ALL ON FUNCTION public.cancel_user_membership(p_user_id uuid, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.cancel_user_membership(p_user_id uuid, p_reason text) TO service_role;


--
-- Name: FUNCTION cancel_withdrawal_request(p_withdrawal_id uuid, p_admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cancel_withdrawal_request(p_withdrawal_id uuid, p_admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.cancel_withdrawal_request(p_withdrawal_id uuid, p_admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.cancel_withdrawal_request(p_withdrawal_id uuid, p_admin_notes text) TO service_role;


--
-- Name: FUNCTION check_commission_status(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_commission_status(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.check_commission_status(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.check_commission_status(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION check_existing_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_existing_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying) TO anon;
GRANT ALL ON FUNCTION public.check_existing_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.check_existing_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying) TO service_role;


--
-- Name: FUNCTION check_phone_exists(phone_number text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_phone_exists(phone_number text) TO anon;
GRANT ALL ON FUNCTION public.check_phone_exists(phone_number text) TO authenticated;
GRANT ALL ON FUNCTION public.check_phone_exists(phone_number text) TO service_role;


--
-- Name: FUNCTION check_premium_access(user_id uuid, exam_id character varying, test_type character varying, test_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_premium_access(user_id uuid, exam_id character varying, test_type character varying, test_id character varying) TO anon;
GRANT ALL ON FUNCTION public.check_premium_access(user_id uuid, exam_id character varying, test_type character varying, test_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.check_premium_access(user_id uuid, exam_id character varying, test_type character varying, test_id character varying) TO service_role;


--
-- Name: FUNCTION cleanup_expired_otps(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_otps() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_otps() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_otps() TO service_role;


--
-- Name: FUNCTION cleanup_expired_test_shares(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_test_shares() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_test_shares() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_test_shares() TO service_role;


--
-- Name: FUNCTION complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.complete_payment(p_payment_id character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) TO service_role;


--
-- Name: FUNCTION create_all_default_exam_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_all_default_exam_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.create_all_default_exam_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_all_default_exam_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION create_default_exam_stats(p_user_id uuid, p_exam_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying) TO anon;
GRANT ALL ON FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying) TO service_role;


--
-- Name: FUNCTION create_default_user_streak(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_default_user_streak(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.create_default_user_streak(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_default_user_streak(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION create_membership_transaction(p_user_id uuid, p_membership_id uuid, p_transaction_id uuid, p_amount numeric, p_currency text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_membership_transaction(p_user_id uuid, p_membership_id uuid, p_transaction_id uuid, p_amount numeric, p_currency text) TO anon;
GRANT ALL ON FUNCTION public.create_membership_transaction(p_user_id uuid, p_membership_id uuid, p_transaction_id uuid, p_amount numeric, p_currency text) TO authenticated;
GRANT ALL ON FUNCTION public.create_membership_transaction(p_user_id uuid, p_membership_id uuid, p_transaction_id uuid, p_amount numeric, p_currency text) TO service_role;


--
-- Name: FUNCTION create_or_update_membership(p_user_id uuid, p_plan_id text, p_start_date timestamp with time zone, p_end_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_or_update_membership(p_user_id uuid, p_plan_id text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.create_or_update_membership(p_user_id uuid, p_plan_id text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.create_or_update_membership(p_user_id uuid, p_plan_id text, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO service_role;


--
-- Name: FUNCTION create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying, p_metadata jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying, p_metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_payment(p_user_id uuid, p_plan_id character varying, p_payment_method character varying, p_metadata jsonb) TO service_role;


--
-- Name: FUNCTION create_payment_record(p_payment_id text, p_user_id uuid, p_plan_id text, p_plan_name text, p_amount numeric, p_razorpay_order_id text, p_payment_method text, p_status text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_payment_record(p_payment_id text, p_user_id uuid, p_plan_id text, p_plan_name text, p_amount numeric, p_razorpay_order_id text, p_payment_method text, p_status text) TO anon;
GRANT ALL ON FUNCTION public.create_payment_record(p_payment_id text, p_user_id uuid, p_plan_id text, p_plan_name text, p_amount numeric, p_razorpay_order_id text, p_payment_method text, p_status text) TO authenticated;
GRANT ALL ON FUNCTION public.create_payment_record(p_payment_id text, p_user_id uuid, p_plan_id text, p_plan_name text, p_amount numeric, p_razorpay_order_id text, p_payment_method text, p_status text) TO service_role;


--
-- Name: FUNCTION create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text, p_membership_purchased boolean, p_first_membership_only boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text, p_membership_purchased boolean, p_first_membership_only boolean) TO anon;
GRANT ALL ON FUNCTION public.create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text, p_membership_purchased boolean, p_first_membership_only boolean) TO authenticated;
GRANT ALL ON FUNCTION public.create_referral_transaction(p_referrer_id uuid, p_referred_id uuid, p_referral_code text, p_amount numeric, p_transaction_type text, p_membership_purchased boolean, p_first_membership_only boolean) TO service_role;


--
-- Name: FUNCTION create_referral_transaction_on_payment(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_referral_transaction_on_payment() TO anon;
GRANT ALL ON FUNCTION public.create_referral_transaction_on_payment() TO authenticated;
GRANT ALL ON FUNCTION public.create_referral_transaction_on_payment() TO service_role;


--
-- Name: FUNCTION create_referral_transaction_on_user_creation(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_referral_transaction_on_user_creation() TO anon;
GRANT ALL ON FUNCTION public.create_referral_transaction_on_user_creation() TO authenticated;
GRANT ALL ON FUNCTION public.create_referral_transaction_on_user_creation() TO service_role;


--
-- Name: FUNCTION create_user_profile_if_missing(user_uuid uuid, user_phone text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_user_profile_if_missing(user_uuid uuid, user_phone text) TO anon;
GRANT ALL ON FUNCTION public.create_user_profile_if_missing(user_uuid uuid, user_phone text) TO authenticated;
GRANT ALL ON FUNCTION public.create_user_profile_if_missing(user_uuid uuid, user_phone text) TO service_role;


--
-- Name: FUNCTION create_user_referral_code(p_user_uuid uuid, p_custom_code text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_user_referral_code(p_user_uuid uuid, p_custom_code text) TO anon;
GRANT ALL ON FUNCTION public.create_user_referral_code(p_user_uuid uuid, p_custom_code text) TO authenticated;
GRANT ALL ON FUNCTION public.create_user_referral_code(p_user_uuid uuid, p_custom_code text) TO service_role;


--
-- Name: FUNCTION debug_commission_status(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.debug_commission_status(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.debug_commission_status(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.debug_commission_status(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION diagnose_user_messages_schema(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.diagnose_user_messages_schema() TO anon;
GRANT ALL ON FUNCTION public.diagnose_user_messages_schema() TO authenticated;
GRANT ALL ON FUNCTION public.diagnose_user_messages_schema() TO service_role;


--
-- Name: FUNCTION find_pending_payment(p_order_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.find_pending_payment(p_order_id text) TO anon;
GRANT ALL ON FUNCTION public.find_pending_payment(p_order_id text) TO authenticated;
GRANT ALL ON FUNCTION public.find_pending_payment(p_order_id text) TO service_role;


--
-- Name: FUNCTION fix_all_pending_commissions(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fix_all_pending_commissions() TO anon;
GRANT ALL ON FUNCTION public.fix_all_pending_commissions() TO authenticated;
GRANT ALL ON FUNCTION public.fix_all_pending_commissions() TO service_role;


--
-- Name: FUNCTION fix_existing_commissions(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fix_existing_commissions() TO anon;
GRANT ALL ON FUNCTION public.fix_existing_commissions() TO authenticated;
GRANT ALL ON FUNCTION public.fix_existing_commissions() TO service_role;


--
-- Name: FUNCTION fix_referral_transactions(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fix_referral_transactions() TO anon;
GRANT ALL ON FUNCTION public.fix_referral_transactions() TO authenticated;
GRANT ALL ON FUNCTION public.fix_referral_transactions() TO service_role;


--
-- Name: FUNCTION fix_user_referral_relationships(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fix_user_referral_relationships() TO anon;
GRANT ALL ON FUNCTION public.fix_user_referral_relationships() TO authenticated;
GRANT ALL ON FUNCTION public.fix_user_referral_relationships() TO service_role;


--
-- Name: FUNCTION generate_alphanumeric_referral_code(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_alphanumeric_referral_code() TO anon;
GRANT ALL ON FUNCTION public.generate_alphanumeric_referral_code() TO authenticated;
GRANT ALL ON FUNCTION public.generate_alphanumeric_referral_code() TO service_role;


--
-- Name: FUNCTION get_active_otp(phone_number character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_active_otp(phone_number character varying) TO anon;
GRANT ALL ON FUNCTION public.get_active_otp(phone_number character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_active_otp(phone_number character varying) TO service_role;


--
-- Name: FUNCTION get_all_payments(p_status text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_all_payments(p_status text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_all_payments(p_status text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_all_payments(p_status text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying) TO anon;
GRANT ALL ON FUNCTION public.get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_all_test_completions_for_exam(user_uuid uuid, exam_name character varying) TO service_role;


--
-- Name: FUNCTION get_all_user_exam_stats(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_all_user_exam_stats(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_all_user_exam_stats(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_all_user_exam_stats(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying) TO anon;
GRANT ALL ON FUNCTION public.get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_bulk_test_completions(user_uuid uuid, exam_name character varying, test_type_name character varying) TO service_role;


--
-- Name: FUNCTION get_commission_config(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_commission_config() TO anon;
GRANT ALL ON FUNCTION public.get_commission_config() TO authenticated;
GRANT ALL ON FUNCTION public.get_commission_config() TO service_role;


--
-- Name: FUNCTION get_commission_constants(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_commission_constants() TO anon;
GRANT ALL ON FUNCTION public.get_commission_constants() TO authenticated;
GRANT ALL ON FUNCTION public.get_commission_constants() TO service_role;


--
-- Name: FUNCTION get_comprehensive_referral_stats(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_comprehensive_referral_stats(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_comprehensive_referral_stats(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_comprehensive_referral_stats(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_exam_leaderboard(exam_name character varying, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_exam_leaderboard(exam_name character varying, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_exam_leaderboard(exam_name character varying, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_exam_leaderboard(exam_name character varying, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_membership_plans(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_membership_plans() TO anon;
GRANT ALL ON FUNCTION public.get_membership_plans() TO authenticated;
GRANT ALL ON FUNCTION public.get_membership_plans() TO service_role;


--
-- Name: FUNCTION get_or_create_user_profile(user_uuid uuid, user_phone text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_or_create_user_profile(user_uuid uuid, user_phone text) TO anon;
GRANT ALL ON FUNCTION public.get_or_create_user_profile(user_uuid uuid, user_phone text) TO authenticated;
GRANT ALL ON FUNCTION public.get_or_create_user_profile(user_uuid uuid, user_phone text) TO service_role;


--
-- Name: FUNCTION get_otp_stats(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_otp_stats() TO anon;
GRANT ALL ON FUNCTION public.get_otp_stats() TO authenticated;
GRANT ALL ON FUNCTION public.get_otp_stats() TO service_role;


--
-- Name: FUNCTION get_payment_by_id(p_payment_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_payment_by_id(p_payment_id character varying) TO anon;
GRANT ALL ON FUNCTION public.get_payment_by_id(p_payment_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_payment_by_id(p_payment_id character varying) TO service_role;


--
-- Name: FUNCTION get_payment_statistics(p_start_date date, p_end_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_payment_statistics(p_start_date date, p_end_date date) TO anon;
GRANT ALL ON FUNCTION public.get_payment_statistics(p_start_date date, p_end_date date) TO authenticated;
GRANT ALL ON FUNCTION public.get_payment_statistics(p_start_date date, p_end_date date) TO service_role;


--
-- Name: FUNCTION get_pending_question_reports(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_pending_question_reports() TO anon;
GRANT ALL ON FUNCTION public.get_pending_question_reports() TO authenticated;
GRANT ALL ON FUNCTION public.get_pending_question_reports() TO service_role;


--
-- Name: FUNCTION get_pending_withdrawal_requests(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_pending_withdrawal_requests() TO anon;
GRANT ALL ON FUNCTION public.get_pending_withdrawal_requests() TO authenticated;
GRANT ALL ON FUNCTION public.get_pending_withdrawal_requests() TO service_role;


--
-- Name: FUNCTION get_plan_limit(p_plan text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_plan_limit(p_plan text) TO anon;
GRANT ALL ON FUNCTION public.get_plan_limit(p_plan text) TO authenticated;
GRANT ALL ON FUNCTION public.get_plan_limit(p_plan text) TO service_role;


--
-- Name: FUNCTION get_referral_dashboard(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_referral_dashboard(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_referral_dashboard(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_referral_dashboard(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_referral_leaderboard(limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_referral_leaderboard(limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_referral_leaderboard(limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_referral_leaderboard(limit_count integer) TO service_role;


--
-- Name: FUNCTION get_referral_network_detailed(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_referral_network_detailed(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_referral_network_detailed(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_referral_network_detailed(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_referral_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_referral_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_referral_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_referral_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_refund_statistics(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_refund_statistics() TO anon;
GRANT ALL ON FUNCTION public.get_refund_statistics() TO authenticated;
GRANT ALL ON FUNCTION public.get_refund_statistics() TO service_role;


--
-- Name: FUNCTION get_secure_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_secure_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_secure_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_secure_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_table_usage(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_table_usage() TO anon;
GRANT ALL ON FUNCTION public.get_table_usage() TO authenticated;
GRANT ALL ON FUNCTION public.get_table_usage() TO service_role;


--
-- Name: FUNCTION get_test_attempt_by_id(attempt_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_test_attempt_by_id(attempt_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_test_attempt_by_id(attempt_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_test_attempt_by_id(attempt_id uuid) TO service_role;


--
-- Name: FUNCTION get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[]) TO anon;
GRANT ALL ON FUNCTION public.get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_test_completions_by_ids(user_uuid uuid, exam_name character varying, test_type_name character varying, test_ids text[]) TO service_role;


--
-- Name: FUNCTION get_test_leaderboard(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_test_leaderboard(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_test_leaderboard(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_test_leaderboard(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_limit integer) TO service_role;


--
-- Name: FUNCTION get_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_test_questions(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_test_rank_and_highest_score(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_test_rank_and_highest_score(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_test_rank_and_highest_score(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_test_rank_and_highest_score(p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_test_share_statistics(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_test_share_statistics(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_test_share_statistics(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_test_share_statistics(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_unread_message_count(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_unread_message_count(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_unread_message_count(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_unread_message_count(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_unread_notification_count(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_unread_notification_count(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_unread_notification_count(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_unread_notification_count(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_commission_history(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_commission_history(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_commission_history(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_commission_history(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_comprehensive_stats(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_comprehensive_stats(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_comprehensive_stats(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_comprehensive_stats(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_dashboard_data(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_dashboard_data(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_dashboard_data(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_dashboard_data(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_exam_rank(user_uuid uuid, exam_name character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_exam_rank(user_uuid uuid, exam_name character varying) TO anon;
GRANT ALL ON FUNCTION public.get_user_exam_rank(user_uuid uuid, exam_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_exam_rank(user_uuid uuid, exam_name character varying) TO service_role;


--
-- Name: FUNCTION get_user_exam_stats(user_uuid uuid, exam_name character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_exam_stats(user_uuid uuid, exam_name character varying) TO anon;
GRANT ALL ON FUNCTION public.get_user_exam_stats(user_uuid uuid, exam_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_exam_stats(user_uuid uuid, exam_name character varying) TO service_role;


--
-- Name: FUNCTION get_user_membership_status(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_membership_status(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_membership_status(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_membership_status(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_messages(user_uuid uuid, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_messages(user_uuid uuid, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_messages(user_uuid uuid, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_messages(user_uuid uuid, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_user_payments(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_payments(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_payments(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_payments(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_performance_stats(exam_name character varying, user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_performance_stats(exam_name character varying, user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_performance_stats(exam_name character varying, user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_performance_stats(exam_name character varying, user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_recent_completions(user_uuid uuid, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_recent_completions(user_uuid uuid, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_recent_completions(user_uuid uuid, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_recent_completions(user_uuid uuid, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_user_referral_earnings(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_referral_earnings(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_referral_earnings(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_referral_earnings(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_referral_network(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_referral_network(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_referral_network(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_referral_network(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_referral_payouts(user_uuid uuid, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_referral_payouts(user_uuid uuid, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_referral_payouts(user_uuid uuid, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_referral_payouts(user_uuid uuid, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_user_referral_stats(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_referral_stats(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_referral_stats(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_referral_stats(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_referral_transactions(user_uuid uuid, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_referral_transactions(user_uuid uuid, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_referral_transactions(user_uuid uuid, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_referral_transactions(user_uuid uuid, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_user_streak(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_streak(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_streak(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_streak(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_test_attempts(p_user_id uuid, p_exam_id character varying, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_test_attempts(p_user_id uuid, p_exam_id character varying, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_test_attempts(p_user_id uuid, p_exam_id character varying, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_test_attempts(p_user_id uuid, p_exam_id character varying, p_limit integer) TO service_role;


--
-- Name: FUNCTION get_user_test_history(user_uuid uuid, exam_name character varying, limit_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_test_history(user_uuid uuid, exam_name character varying, limit_count integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_test_history(user_uuid uuid, exam_name character varying, limit_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_test_history(user_uuid uuid, exam_name character varying, limit_count integer) TO service_role;


--
-- Name: FUNCTION get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying) TO anon;
GRANT ALL ON FUNCTION public.get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_test_score(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying) TO service_role;


--
-- Name: FUNCTION get_user_withdrawal_requests(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_withdrawal_requests(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_withdrawal_requests(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_withdrawal_requests(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_withdrawal_eligibility(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_withdrawal_eligibility(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_withdrawal_eligibility(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_withdrawal_eligibility(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION handle_membership_refund(p_membership_transaction_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_membership_refund(p_membership_transaction_id uuid) TO anon;
GRANT ALL ON FUNCTION public.handle_membership_refund(p_membership_transaction_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.handle_membership_refund(p_membership_transaction_id uuid) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.handle_referral_commission(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION increment_otp_attempts(otp_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_otp_attempts(otp_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_otp_attempts(otp_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_otp_attempts(otp_id uuid) TO service_role;


--
-- Name: FUNCTION initialize_new_user(p_user_id uuid, p_phone text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text) TO anon;
GRANT ALL ON FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text) TO authenticated;
GRANT ALL ON FUNCTION public.initialize_new_user(p_user_id uuid, p_phone text) TO service_role;


--
-- Name: FUNCTION initialize_user_exam_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.initialize_user_exam_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.initialize_user_exam_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.initialize_user_exam_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) TO anon;
GRANT ALL ON FUNCTION public.insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.insert_simple_test_attempt(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) TO service_role;


--
-- Name: FUNCTION insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, answers jsonb, test_type character varying, test_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, answers jsonb, test_type character varying, test_id character varying) TO anon;
GRANT ALL ON FUNCTION public.insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, answers jsonb, test_type character varying, test_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.insert_simple_test_attempt(user_id uuid, exam_id character varying, score integer, total_questions integer, correct_answers integer, time_taken integer, answers jsonb, test_type character varying, test_id character varying) TO service_role;


--
-- Name: FUNCTION insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_type character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_type character varying) TO anon;
GRANT ALL ON FUNCTION public.insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_type character varying) TO authenticated;
GRANT ALL ON FUNCTION public.insert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_type character varying) TO service_role;


--
-- Name: FUNCTION insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying, p_test_type character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying, p_test_type character varying) TO anon;
GRANT ALL ON FUNCTION public.insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying, p_test_type character varying) TO authenticated;
GRANT ALL ON FUNCTION public.insert_test_attempt_with_defaults(p_user_id uuid, p_exam_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_test_id character varying, p_test_type character varying) TO service_role;


--
-- Name: FUNCTION is_admin(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.is_admin(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_admin(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying) TO anon;
GRANT ALL ON FUNCTION public.is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying) TO authenticated;
GRANT ALL ON FUNCTION public.is_test_completed(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, topic_name character varying) TO service_role;


--
-- Name: FUNCTION is_user_admin(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_user_admin(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.is_user_admin(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_user_admin(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION mark_message_as_read(message_id uuid, user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_message_as_read(message_id uuid, user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.mark_message_as_read(message_id uuid, user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.mark_message_as_read(message_id uuid, user_uuid uuid) TO service_role;


--
-- Name: FUNCTION mark_otp_verified(otp_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_otp_verified(otp_id uuid) TO anon;
GRANT ALL ON FUNCTION public.mark_otp_verified(otp_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.mark_otp_verified(otp_id uuid) TO service_role;


--
-- Name: FUNCTION pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.pay_commission(p_referral_transaction_id uuid, p_admin_user_id uuid) TO service_role;


--
-- Name: FUNCTION payments_method_backfill(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.payments_method_backfill() TO anon;
GRANT ALL ON FUNCTION public.payments_method_backfill() TO authenticated;
GRANT ALL ON FUNCTION public.payments_method_backfill() TO service_role;


--
-- Name: FUNCTION payments_plan_backfill(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.payments_plan_backfill() TO anon;
GRANT ALL ON FUNCTION public.payments_plan_backfill() TO authenticated;
GRANT ALL ON FUNCTION public.payments_plan_backfill() TO service_role;


--
-- Name: FUNCTION payments_plan_name_backfill(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.payments_plan_name_backfill() TO anon;
GRANT ALL ON FUNCTION public.payments_plan_name_backfill() TO authenticated;
GRANT ALL ON FUNCTION public.payments_plan_name_backfill() TO service_role;


--
-- Name: FUNCTION process_existing_commission(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_existing_commission(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.process_existing_commission(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_existing_commission(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION process_existing_user_commission(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_existing_user_commission(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.process_existing_user_commission(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_existing_user_commission(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION process_membership_commission(p_payment_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_membership_commission(p_payment_id uuid) TO anon;
GRANT ALL ON FUNCTION public.process_membership_commission(p_payment_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_membership_commission(p_payment_id uuid) TO service_role;


--
-- Name: FUNCTION process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric) TO anon;
GRANT ALL ON FUNCTION public.process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric) TO authenticated;
GRANT ALL ON FUNCTION public.process_membership_commission(p_user_id uuid, p_payment_id uuid, p_membership_plan character varying, p_membership_amount numeric) TO service_role;


--
-- Name: FUNCTION process_missing_commissions(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_missing_commissions() TO anon;
GRANT ALL ON FUNCTION public.process_missing_commissions() TO authenticated;
GRANT ALL ON FUNCTION public.process_missing_commissions() TO service_role;


--
-- Name: FUNCTION process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric) TO anon;
GRANT ALL ON FUNCTION public.process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric) TO authenticated;
GRANT ALL ON FUNCTION public.process_payment_and_membership(p_payment_id uuid, p_payment_gateway_id character varying, p_user_id uuid, p_plan_id character varying, p_amount numeric) TO service_role;


--
-- Name: FUNCTION process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text) TO anon;
GRANT ALL ON FUNCTION public.process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text) TO authenticated;
GRANT ALL ON FUNCTION public.process_payment_webhook(p_order_id text, p_razorpay_payment_id text, p_amount numeric, p_currency text) TO service_role;


--
-- Name: FUNCTION process_referral_commission(p_payment_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_referral_code text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_referral_commission(p_payment_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_referral_code text) TO anon;
GRANT ALL ON FUNCTION public.process_referral_commission(p_payment_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_referral_code text) TO authenticated;
GRANT ALL ON FUNCTION public.process_referral_commission(p_payment_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_referral_code text) TO service_role;


--
-- Name: FUNCTION process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_referral_commission_v2(p_membership_amount numeric, p_membership_plan character varying, p_payment_id uuid, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION process_withdrawal_request(request_id uuid, admin_user_id uuid, action text, admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action text, admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action text, admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action text, admin_notes text) TO service_role;


--
-- Name: FUNCTION process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.process_withdrawal_request(request_id uuid, admin_user_id uuid, action character varying, admin_notes text) TO service_role;


--
-- Name: FUNCTION process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.process_withdrawal_request_with_message(request_id uuid, admin_user_id uuid, action text, admin_notes text) TO service_role;


--
-- Name: FUNCTION remove_admin_user(admin_user_id uuid, target_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_admin_user(admin_user_id uuid, target_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.remove_admin_user(admin_user_id uuid, target_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.remove_admin_user(admin_user_id uuid, target_user_id uuid) TO service_role;


--
-- Name: FUNCTION request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying) TO anon;
GRANT ALL ON FUNCTION public.request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying) TO authenticated;
GRANT ALL ON FUNCTION public.request_commission_withdrawal(p_user_id uuid, p_amount numeric, p_payment_method character varying) TO service_role;


--
-- Name: FUNCTION request_commission_withdrawal(p_account_details text, p_amount numeric, p_payment_method character varying, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.request_commission_withdrawal(p_account_details text, p_amount numeric, p_payment_method character varying, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.request_commission_withdrawal(p_account_details text, p_amount numeric, p_payment_method character varying, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.request_commission_withdrawal(p_account_details text, p_amount numeric, p_payment_method character varying, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text) TO anon;
GRANT ALL ON FUNCTION public.request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text) TO authenticated;
GRANT ALL ON FUNCTION public.request_commission_withdrawal(user_uuid uuid, withdrawal_amount numeric, payment_method character varying, account_details text) TO service_role;


--
-- Name: FUNCTION request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text) TO anon;
GRANT ALL ON FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text) TO authenticated;
GRANT ALL ON FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_withdrawal_method character varying, p_account_details text) TO service_role;


--
-- Name: FUNCTION resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.resolve_question_report(report_id uuid, admin_user_id uuid, resolution character varying, admin_notes text) TO service_role;


--
-- Name: FUNCTION rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text) TO anon;
GRANT ALL ON FUNCTION public.rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.rollback_payment_transaction(p_payment_id character varying, p_user_id uuid, p_plan_id character varying, p_reason text) TO service_role;


--
-- Name: FUNCTION send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.send_question_report_status_message(p_user_id uuid, p_report_id uuid, p_status character varying, p_admin_notes text) TO service_role;


--
-- Name: FUNCTION send_withdrawal_status_message(p_user_id uuid, p_withdrawal_id uuid, p_status character varying, p_amount numeric, p_admin_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.send_withdrawal_status_message(p_user_id uuid, p_withdrawal_id uuid, p_status character varying, p_amount numeric, p_admin_notes text) TO anon;
GRANT ALL ON FUNCTION public.send_withdrawal_status_message(p_user_id uuid, p_withdrawal_id uuid, p_status character varying, p_amount numeric, p_admin_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.send_withdrawal_status_message(p_user_id uuid, p_withdrawal_id uuid, p_status character varying, p_amount numeric, p_admin_notes text) TO service_role;


--
-- Name: FUNCTION set_membership_tx_completed_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_membership_tx_completed_at() TO anon;
GRANT ALL ON FUNCTION public.set_membership_tx_completed_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_membership_tx_completed_at() TO service_role;


--
-- Name: FUNCTION set_plan_name_from_plan_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_plan_name_from_plan_id() TO anon;
GRANT ALL ON FUNCTION public.set_plan_name_from_plan_id() TO authenticated;
GRANT ALL ON FUNCTION public.set_plan_name_from_plan_id() TO service_role;


--
-- Name: FUNCTION submit_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying, p_report_type character varying, p_description text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.submit_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying, p_report_type character varying, p_description text) TO anon;
GRANT ALL ON FUNCTION public.submit_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying, p_report_type character varying, p_description text) TO authenticated;
GRANT ALL ON FUNCTION public.submit_question_report(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_question_id character varying, p_report_type character varying, p_description text) TO service_role;


--
-- Name: FUNCTION submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_topic_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_topic_id character varying) TO anon;
GRANT ALL ON FUNCTION public.submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_topic_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.submit_test_complete(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_topic_id character varying) TO service_role;


--
-- Name: FUNCTION submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer) TO anon;
GRANT ALL ON FUNCTION public.submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer) TO authenticated;
GRANT ALL ON FUNCTION public.submitindividualtestscore(user_uuid uuid, exam_name character varying, test_type_name character varying, test_name character varying, score_value integer) TO service_role;


--
-- Name: FUNCTION sync_membership_to_profile(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_membership_to_profile(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sync_membership_to_profile(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sync_membership_to_profile(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying) TO anon;
GRANT ALL ON FUNCTION public.track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying) TO authenticated;
GRANT ALL ON FUNCTION public.track_referral_signup(referrer_uuid uuid, referred_uuid uuid, referral_code_used character varying) TO service_role;


--
-- Name: FUNCTION trigger_sync_membership_to_profile(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trigger_sync_membership_to_profile() TO anon;
GRANT ALL ON FUNCTION public.trigger_sync_membership_to_profile() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_sync_membership_to_profile() TO service_role;


--
-- Name: FUNCTION update_all_test_ranks(p_exam_id character varying, p_test_type character varying, p_test_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_all_test_ranks(p_exam_id character varying, p_test_type character varying, p_test_id character varying) TO anon;
GRANT ALL ON FUNCTION public.update_all_test_ranks(p_exam_id character varying, p_test_type character varying, p_test_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.update_all_test_ranks(p_exam_id character varying, p_test_type character varying, p_test_id character varying) TO service_role;


--
-- Name: FUNCTION update_daily_visit(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_daily_visit(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.update_daily_visit(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.update_daily_visit(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION update_exam_stats_properly(user_uuid uuid, exam_name text, new_score integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name text, new_score integer) TO anon;
GRANT ALL ON FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name text, new_score integer) TO authenticated;
GRANT ALL ON FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name text, new_score integer) TO service_role;


--
-- Name: FUNCTION update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer) TO anon;
GRANT ALL ON FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer) TO authenticated;
GRANT ALL ON FUNCTION public.update_exam_stats_properly(user_uuid uuid, exam_name character varying, new_score integer) TO service_role;


--
-- Name: FUNCTION update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying) TO anon;
GRANT ALL ON FUNCTION public.update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying) TO authenticated;
GRANT ALL ON FUNCTION public.update_membership_status(p_user_id uuid, p_plan_id character varying, p_status character varying) TO service_role;


--
-- Name: FUNCTION update_payment_failures_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_payment_failures_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_payment_failures_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_payment_failures_updated_at() TO service_role;


--
-- Name: FUNCTION update_payment_status(p_payment_id uuid, p_status text, p_razorpay_payment_id text, p_paid_at timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_payment_status(p_payment_id uuid, p_status text, p_razorpay_payment_id text, p_paid_at timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.update_payment_status(p_payment_id uuid, p_status text, p_razorpay_payment_id text, p_paid_at timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.update_payment_status(p_payment_id uuid, p_status text, p_razorpay_payment_id text, p_paid_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.update_payment_status(p_payment_id character varying, p_status character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_razorpay_signature character varying, p_metadata jsonb) TO service_role;


--
-- Name: FUNCTION update_referral_codes_earnings(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_referral_codes_earnings() TO anon;
GRANT ALL ON FUNCTION public.update_referral_codes_earnings() TO authenticated;
GRANT ALL ON FUNCTION public.update_referral_codes_earnings() TO service_role;


--
-- Name: FUNCTION update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying) TO anon;
GRANT ALL ON FUNCTION public.update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying) TO authenticated;
GRANT ALL ON FUNCTION public.update_referral_earnings(p_user_id uuid, p_amount numeric, p_operation character varying) TO service_role;


--
-- Name: FUNCTION update_referrer_earnings(p_user_id uuid, p_commission_amount numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_referrer_earnings(p_user_id uuid, p_commission_amount numeric) TO anon;
GRANT ALL ON FUNCTION public.update_referrer_earnings(p_user_id uuid, p_commission_amount numeric) TO authenticated;
GRANT ALL ON FUNCTION public.update_referrer_earnings(p_user_id uuid, p_commission_amount numeric) TO service_role;


--
-- Name: FUNCTION update_refund_requests_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_refund_requests_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_refund_requests_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_refund_requests_updated_at() TO service_role;


--
-- Name: FUNCTION update_test_attempt_type(p_attempt_id uuid, p_test_type character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_test_attempt_type(p_attempt_id uuid, p_test_type character varying) TO anon;
GRANT ALL ON FUNCTION public.update_test_attempt_type(p_attempt_id uuid, p_test_type character varying) TO authenticated;
GRANT ALL ON FUNCTION public.update_test_attempt_type(p_attempt_id uuid, p_test_type character varying) TO service_role;


--
-- Name: FUNCTION update_test_attempts_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_test_attempts_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_test_attempts_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_test_attempts_updated_at() TO service_role;


--
-- Name: FUNCTION update_test_shares_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_test_shares_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_test_shares_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_test_shares_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION update_user_profile_membership(p_user_id uuid, p_membership_status text, p_membership_plan text, p_membership_expiry timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_user_profile_membership(p_user_id uuid, p_membership_status text, p_membership_plan text, p_membership_expiry timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.update_user_profile_membership(p_user_id uuid, p_membership_status text, p_membership_plan text, p_membership_expiry timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.update_user_profile_membership(p_user_id uuid, p_membership_status text, p_membership_plan text, p_membership_expiry timestamp with time zone) TO service_role;


--
-- Name: FUNCTION update_user_streak(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_user_streak(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.update_user_streak(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.update_user_streak(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer, p_last_test_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer, p_last_test_date timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer, p_last_test_date timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_exam_stats(p_user_id uuid, p_exam_id character varying, p_total_tests integer, p_best_score integer, p_average_score numeric, p_rank integer, p_last_test_date timestamp with time zone) TO service_role;


--
-- Name: FUNCTION upsert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_status character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_status character varying) TO anon;
GRANT ALL ON FUNCTION public.upsert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_status character varying) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_test_attempt(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb, p_status character varying) TO service_role;


--
-- Name: FUNCTION upsert_test_completion_simple(p_user_id uuid, p_exam_id text, p_test_type text, p_test_id text, p_topic_id text, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id text, p_test_type text, p_test_id text, p_topic_id text, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) TO anon;
GRANT ALL ON FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id text, p_test_type text, p_test_id text, p_topic_id text, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id text, p_test_type text, p_test_id text, p_topic_id text, p_score integer, p_total_questions integer, p_correct_answers integer, p_time_taken integer, p_answers jsonb) TO service_role;


--
-- Name: FUNCTION upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying, p_time_taken integer, p_answers jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying, p_time_taken integer, p_answers jsonb) TO anon;
GRANT ALL ON FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying, p_time_taken integer, p_answers jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_test_completion_simple(p_user_id uuid, p_exam_id character varying, p_test_type character varying, p_test_id character varying, p_score integer, p_total_questions integer, p_correct_answers integer, p_topic_id character varying, p_time_taken integer, p_answers jsonb) TO service_role;


--
-- Name: FUNCTION validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying) TO anon;
GRANT ALL ON FUNCTION public.validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying) TO authenticated;
GRANT ALL ON FUNCTION public.validate_and_apply_referral_code(p_user_id uuid, p_referral_code character varying) TO service_role;


--
-- Name: FUNCTION validate_referral_code(p_referral_code character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_referral_code(p_referral_code character varying) TO anon;
GRANT ALL ON FUNCTION public.validate_referral_code(p_referral_code character varying) TO authenticated;
GRANT ALL ON FUNCTION public.validate_referral_code(p_referral_code character varying) TO service_role;


--
-- Name: FUNCTION validate_referral_code_for_signup(p_referral_code character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_referral_code_for_signup(p_referral_code character varying) TO anon;
GRANT ALL ON FUNCTION public.validate_referral_code_for_signup(p_referral_code character varying) TO authenticated;
GRANT ALL ON FUNCTION public.validate_referral_code_for_signup(p_referral_code character varying) TO service_role;


--
-- Name: FUNCTION verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text) TO anon;
GRANT ALL ON FUNCTION public.verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text) TO authenticated;
GRANT ALL ON FUNCTION public.verify_payment_webhook(p_razorpay_signature character varying, p_razorpay_payment_id character varying, p_razorpay_order_id character varying, p_webhook_secret text) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE exam_questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exam_questions TO anon;
GRANT ALL ON TABLE public.exam_questions TO authenticated;
GRANT ALL ON TABLE public.exam_questions TO service_role;


--
-- Name: TABLE exam_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exam_stats TO anon;
GRANT ALL ON TABLE public.exam_stats TO authenticated;
GRANT ALL ON TABLE public.exam_stats TO service_role;


--
-- Name: TABLE exam_test_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exam_test_data TO anon;
GRANT ALL ON TABLE public.exam_test_data TO authenticated;
GRANT ALL ON TABLE public.exam_test_data TO service_role;


--
-- Name: TABLE individual_test_scores; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.individual_test_scores TO anon;
GRANT ALL ON TABLE public.individual_test_scores TO authenticated;
GRANT ALL ON TABLE public.individual_test_scores TO service_role;


--
-- Name: TABLE membership_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.membership_plans TO anon;
GRANT ALL ON TABLE public.membership_plans TO authenticated;
GRANT ALL ON TABLE public.membership_plans TO service_role;


--
-- Name: TABLE user_memberships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_memberships TO anon;
GRANT ALL ON TABLE public.user_memberships TO authenticated;
GRANT ALL ON TABLE public.user_memberships TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE membership_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.membership_summary TO anon;
GRANT ALL ON TABLE public.membership_summary TO authenticated;
GRANT ALL ON TABLE public.membership_summary TO service_role;


--
-- Name: TABLE membership_transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.membership_transactions TO anon;
GRANT ALL ON TABLE public.membership_transactions TO authenticated;
GRANT ALL ON TABLE public.membership_transactions TO service_role;


--
-- Name: TABLE memberships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.memberships TO anon;
GRANT ALL ON TABLE public.memberships TO authenticated;
GRANT ALL ON TABLE public.memberships TO service_role;


--
-- Name: TABLE otps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.otps TO anon;
GRANT ALL ON TABLE public.otps TO authenticated;
GRANT ALL ON TABLE public.otps TO service_role;


--
-- Name: TABLE payment_failures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_failures TO anon;
GRANT ALL ON TABLE public.payment_failures TO authenticated;
GRANT ALL ON TABLE public.payment_failures TO service_role;


--
-- Name: TABLE payment_rollbacks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_rollbacks TO anon;
GRANT ALL ON TABLE public.payment_rollbacks TO authenticated;
GRANT ALL ON TABLE public.payment_rollbacks TO service_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- Name: TABLE performance_metrics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.performance_metrics TO anon;
GRANT ALL ON TABLE public.performance_metrics TO authenticated;
GRANT ALL ON TABLE public.performance_metrics TO service_role;


--
-- Name: TABLE question_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.question_reports TO anon;
GRANT ALL ON TABLE public.question_reports TO authenticated;
GRANT ALL ON TABLE public.question_reports TO service_role;


--
-- Name: TABLE referral_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_codes TO anon;
GRANT ALL ON TABLE public.referral_codes TO authenticated;
GRANT ALL ON TABLE public.referral_codes TO service_role;


--
-- Name: TABLE referral_commissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_commissions TO anon;
GRANT ALL ON TABLE public.referral_commissions TO authenticated;
GRANT ALL ON TABLE public.referral_commissions TO service_role;


--
-- Name: TABLE referral_notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_notifications TO anon;
GRANT ALL ON TABLE public.referral_notifications TO authenticated;
GRANT ALL ON TABLE public.referral_notifications TO service_role;


--
-- Name: TABLE referral_transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referral_transactions TO anon;
GRANT ALL ON TABLE public.referral_transactions TO authenticated;
GRANT ALL ON TABLE public.referral_transactions TO service_role;


--
-- Name: TABLE refund_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refund_requests TO anon;
GRANT ALL ON TABLE public.refund_requests TO authenticated;
GRANT ALL ON TABLE public.refund_requests TO service_role;


--
-- Name: TABLE security_audit_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.security_audit_log TO anon;
GRANT ALL ON TABLE public.security_audit_log TO authenticated;
GRANT ALL ON TABLE public.security_audit_log TO service_role;


--
-- Name: TABLE test_attempts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_attempts TO anon;
GRANT ALL ON TABLE public.test_attempts TO authenticated;
GRANT ALL ON TABLE public.test_attempts TO service_role;


--
-- Name: TABLE test_completions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_completions TO anon;
GRANT ALL ON TABLE public.test_completions TO authenticated;
GRANT ALL ON TABLE public.test_completions TO service_role;


--
-- Name: TABLE user_streaks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_streaks TO anon;
GRANT ALL ON TABLE public.user_streaks TO authenticated;
GRANT ALL ON TABLE public.user_streaks TO service_role;


--
-- Name: TABLE test_data_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_data_summary TO anon;
GRANT ALL ON TABLE public.test_data_summary TO authenticated;
GRANT ALL ON TABLE public.test_data_summary TO service_role;


--
-- Name: TABLE test_share_access; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_share_access TO anon;
GRANT ALL ON TABLE public.test_share_access TO authenticated;
GRANT ALL ON TABLE public.test_share_access TO service_role;


--
-- Name: TABLE test_shares; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_shares TO anon;
GRANT ALL ON TABLE public.test_shares TO authenticated;
GRANT ALL ON TABLE public.test_shares TO service_role;


--
-- Name: TABLE test_states; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test_states TO anon;
GRANT ALL ON TABLE public.test_states TO authenticated;
GRANT ALL ON TABLE public.test_states TO service_role;


--
-- Name: TABLE user_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_messages TO anon;
GRANT ALL ON TABLE public.user_messages TO authenticated;
GRANT ALL ON TABLE public.user_messages TO service_role;


--
-- Name: TABLE withdrawal_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.withdrawal_requests TO anon;
GRANT ALL ON TABLE public.withdrawal_requests TO authenticated;
GRANT ALL ON TABLE public.withdrawal_requests TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict gmjExlzfo4J94AH42ZgFw6XhFauCrSJkKbLXujWOcLWYBIS4qX06fpzi2hpKeVm

