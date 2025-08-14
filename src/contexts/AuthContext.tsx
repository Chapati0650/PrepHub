import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  is_premium?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string; requiresConfirmation?: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (authUser: User) => {
  console.log('📥 Fetching profile for user:', authUser.id, authUser.email);

  try {
    // Try fetching the profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('name, picture, is_premium')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error("❌ Failed to fetch profile:", error.message);
      // Return basic info immediately so login can proceed
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || '',
        picture: authUser.user_metadata?.picture || '',
        is_premium: false
      };
    }

    if (profile) {
      console.log("✅ Fetched user profile:", profile);
      return {
        id: authUser.id,
        email: authUser.email!,
        name: profile.name || authUser.user_metadata?.name || '',
        picture: profile.picture || authUser.user_metadata?.picture || '',
        is_premium: profile.is_premium || false
      };
    }

    // No profile found — create it asynchronously without blocking redirect
    console.log('👤 No profile found, creating new profile in background...');
    supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || '',
        picture: authUser.user_metadata?.picture || '',
        provider: 'email',
        is_premium: false
      })
      .select('name, picture, is_premium')
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Error upserting user profile:', error);
        } else {
          console.log('✅ User profile upserted successfully:', data);
        }
      });

    // Still return basic info immediately
    return {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name || '',
      picture: authUser.user_metadata?.picture || '',
      is_premium: false
    };

  } catch (error) {
    console.error('❌ Unexpected error fetching profile:', error);
    return {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name || '',
      picture: authUser.user_metadata?.picture || '',
      is_premium: false
    };
  }
};


  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      console.log('👤 Auth user found, fetching profile...');
      const userProfile = await fetchUserProfile(authUser);
      console.log('👤 Updated user profile:', userProfile);
      setUser(userProfile);
    } else {
      console.log('❌ No auth user found during refresh');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("🧪 Session returned:", session);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else {
          console.log('ℹ️ No valid session found at startup');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Check for payment success and refresh user data
    const checkPaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        console.log('💳 Payment success detected, refreshing user data...');
        // Wait a moment for webhook to process
        setTimeout(async () => {
          await refreshUser();
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        }, 2000);
      }
    };

    checkPaymentSuccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  console.log('📣 Auth state changed:', event);

  if (event === 'SIGNED_IN' && session?.user) {
    // Only navigate to dashboard if we're currently on login/register pages
    const currentPath = window.location.pathname;
    const shouldRedirect = currentPath === '/login' || currentPath === '/register' || currentPath === '/';
    
    if (shouldRedirect) {
      navigate('/dashboard');
    }

    // Fetch profile in background
    fetchUserProfile(session.user).then((profile) => {
      setUser(profile);
    });
  }

  if (event === 'SIGNED_OUT') {
    setUser(null);
    navigate('/login');
  }
    });


    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 Starting login process...');
    console.log('📧 Email:', email);
    console.log('🔒 Password provided:', !!password);
    
    try {
      console.log('📡 Calling Supabase auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📡 Supabase auth response:', { 
        user: data.user ? 'User object received' : 'No user', 
        session: data.session ? 'Session received' : 'No session',
        error: error ? error.message : 'No error'
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        console.error('❌ Error code:', error?.code);
        console.error('❌ Error message:', error.message);
        return { error: error.message };
      }

      if (data.session?.user) {
        console.log('👤 User authenticated successfully:', data.user.email);
        console.log('🔄 Fetching user profile...');
        const userProfile = await fetchUserProfile(data.session.user);
        console.log('👤 User profile fetched:', userProfile);
        setUser(userProfile);
        
        console.log('✅ Login successful, user state set');
        console.log('🚀 Attempting navigation to dashboard...');
        
        // Try React Router navigation first
        try {
          navigate('/dashboard');
          console.log('✅ React Router navigation attempted');
        } catch (navError) {
          console.error('❌ React Router navigation failed:', navError);
        }
        
        // Fallback to window.location after a short delay
        setTimeout(() => {
          console.log('🔄 Checking if still on login page...');
          if (window.location.pathname === '/login') {
            console.log('🚀 Using window.location fallback...');
            window.location.href = '/dashboard';
          } else {
            console.log('✅ Navigation successful, now on:', window.location.pathname);
          }
        }, 500);
      } else {
        console.warn("⚠️ No session returned after login");
        return { error: 'Login failed - no session created' };
      }

      return {};
    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      console.log('📝 Starting registration process...');
      console.log('📧 Email:', email);
      console.log('🔒 Password length:', password.length);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: name || '',
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered') || error.code === 'user_already_exists') {
          console.log('ℹ️ Registration attempt with existing email:', error.message);
        } else {
          console.error('❌ Registration error:', error);
          console.error('❌ Error code:', error.code);
        }
        
        if (error.message.includes('User already registered') || error.code === 'user_already_exists') {
          return { error: 'This email is already registered. Please try logging in instead.' };
        } else if (error.message.includes('Password should be at least') || error.code === 'weak_password') {
          return { error: 'Password is too weak. Please use at least 6 characters.' };
        } else if (error.message.includes('Unable to validate email address') || error.code === 'invalid_email') {
          return { error: 'Please enter a valid email address.' };
        }
        return { error: error.message };
      }

      console.log('✅ Registration successful');

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required');
        return { 
          requiresConfirmation: true,
          message: 'Please check your email for a confirmation link. You will also receive a welcome message from Prithviraj, the founder of PrepHub!'
        };
      }

      if (data.user) {
        console.log('👤 Creating user profile...');
        // Create user profile
        const { error: insertError } = await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email!,
          name: name || '',
          provider: 'email',
          is_premium: false
        });

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError);
          // Don't fail registration if profile creation fails
        }

        console.log('👤 User profile created, fetching...');
        const userProfile = await fetchUserProfile(data.user);
        console.log('👤 User profile fetched:', userProfile);
        setUser(userProfile);
        
        console.log('🚀 Navigating to dashboard...');
        // Use multiple navigation strategies
        try {
          navigate('/dashboard');
          console.log('✅ React Router navigation attempted');
        } catch (navError) {
          console.error('❌ React Router navigation failed:', navError);
        }
        
        // Fallback navigation
        setTimeout(() => {
          if (window.location.pathname === '/register') {
            console.log('🔄 React Router failed, using window.location...');
            window.location.href = '/dashboard';
          }
        }, 500);
      }

      return {};
    } catch (error) {
      console.error('❌ Unexpected registration error:', error);
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout error (session may have already expired):', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};