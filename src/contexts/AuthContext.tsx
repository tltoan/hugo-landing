import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isMockMode } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('🔧 AuthContext initializing, isMockMode:', isMockMode);
    
    if (isMockMode) {
      // In mock mode, skip auth and immediately resolve loading
      console.log('Running in mock mode - skipping authentication');
      setUser(null);
      setLoading(false);
      return;
    }

    console.log('🔗 Connecting to real Supabase...');

    // Check if user is logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('📱 Initial session:', session);
      setUser(session?.user ?? null);

      // Set loading to false immediately so the app loads quickly
      setLoading(false);

      // Check admin status in the background (non-blocking)
      if (session?.user?.email) {
        // Use a timeout to prevent hanging
        const adminCheckPromise = supabase
          .rpc('get_admin_status', { user_email: session.user.email });

        // Set a 2-second timeout for the admin check
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: false, error: 'timeout' }), 2000)
        );

        try {
          const result = await Promise.race([adminCheckPromise, timeoutPromise]) as any;

          if (result.error === 'timeout') {
            console.log('⏱️ Admin check timed out (continuing without admin status)');
            setIsAdmin(false);
          } else if (result.error) {
            console.log('⚠️ Admin check failed (function may not exist yet):', result.error);
            setIsAdmin(false);
          } else {
            setIsAdmin(result.data || false);
            console.log('👑 Admin status:', result.data);
          }
        } catch (err) {
          console.log('⚠️ Admin check error:', err);
          setIsAdmin(false);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, session);
      setUser(session?.user ?? null);

      // Set loading to false immediately
      setLoading(false);

      // Check admin status when auth changes (non-blocking with timeout)
      if (session?.user?.email) {
        const adminCheckPromise = supabase
          .rpc('get_admin_status', { user_email: session.user.email });

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: false, error: 'timeout' }), 2000)
        );

        try {
          const result = await Promise.race([adminCheckPromise, timeoutPromise]) as any;

          if (result.error === 'timeout') {
            console.log('⏱️ Admin check timed out on auth change');
            setIsAdmin(false);
          } else if (result.error) {
            console.log('⚠️ Admin check failed on auth change:', result.error);
            setIsAdmin(false);
          } else {
            setIsAdmin(result.data || false);
            console.log('👑 Admin status updated:', result.data);
          }
        } catch (err) {
          console.log('⚠️ Admin check error:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    if (isMockMode) {
      console.log('Mock sign up:', { email, userData });
      return { error: null, needsEmailConfirmation: false };
    }

    console.log('🚀 Attempting Supabase sign up:', { email, userData });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    console.log('📊 Supabase sign up result:', {
      data,
      error,
      errorMessage: error?.message,
      errorDetails: error,
      session: data?.session,
      user: data?.user
    });

    if (error) {
      console.error('❌ Supabase signup error details:', error);
      return { error, needsEmailConfirmation: false };
    }

    // Check if email confirmation is needed
    // If there's a user but no session, email confirmation is required
    const needsEmailConfirmation = !!(data?.user && !data?.session);

    console.log('📧 Email confirmation needed:', needsEmailConfirmation);

    return { error, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    if (isMockMode) {
      console.log('Mock sign in:', { email });
      return { error: null };
    }
    
    console.log('🔑 Attempting Supabase sign in:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('📊 Supabase sign in result:', { 
      data, 
      error,
      errorMessage: error?.message,
      errorDetails: error 
    });
    
    if (error) {
      console.error('❌ Supabase signin error details:', error);
    }
    
    return { error };
  };

  const signOut = async () => {
    if (isMockMode) {
      console.log('Mock sign out');
      return;
    }
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};