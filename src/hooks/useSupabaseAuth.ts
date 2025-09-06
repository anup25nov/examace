import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseStatsService } from '@/lib/supabaseStats';
import type { User, Session } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    // Create user profile if signup successful and phone provided
    if (!error && data.user && phone) {
      try {
        await supabaseStatsService.createUserProfile(phone);
      } catch (profileError) {
        console.error('Failed to create user profile:', profileError);
      }
    }

    return { data, error };
  };

  const signInWithPhone = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
      options: {
        channel: 'sms'
      }
    });
    return { data, error };
  };

  const verifyPhoneOtp = async (phone: string, otp: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type: 'sms'
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const isAuthenticated = !!user;
  const getUserId = () => user?.id;

  return {
    user,
    session,
    loading,
    isAuthenticated,
    getUserId,
    signUp,
    signIn,
    signInWithPhone,
    verifyPhoneOtp,
    signOut
  };
};