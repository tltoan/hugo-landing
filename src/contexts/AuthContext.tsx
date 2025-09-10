import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isMockMode } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📱 Initial session:', session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    if (isMockMode) {
      console.log('Mock sign up:', { email, userData });
      return { error: null };
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
      errorDetails: error 
    });
    
    if (error) {
      console.error('❌ Supabase signup error details:', error);
    }
    
    return { error };
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