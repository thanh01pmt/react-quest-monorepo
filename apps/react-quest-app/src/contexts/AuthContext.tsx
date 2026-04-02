/**
 * AuthContext
 * 
 * React context for Supabase authentication.
 * Provides user state and auth methods to the entire app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Auth context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signInAnonymously: () => Promise<void>;  // Added
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial session check and listen to auth state changes
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign in with email/password
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err: any) {
            const errorMessage = getAuthErrorMessage(err.status, err.message);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign up with email/password
    const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: displayName,
                        display_name: displayName,
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            const errorMessage = getAuthErrorMessage(err.status, err.message);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign anonymously (Guest mode)
    const signInAnonymously = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign in as guest');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        setError(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
            throw err;
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAnonymously,
        signOut,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Helper to get user-friendly error messages from Supabase
function getAuthErrorMessage(status?: number, message?: string): string {
    if (!message) return 'Đã xảy ra lỗi. Vui lòng thử lại';

    // Supabase errors are often descriptive in message
    if (message.includes('Invalid login credentials')) {
        return 'Email hoặc mật khẩu không đúng';
    }
    if (message.includes('User already registered')) {
        return 'Email này đã được sử dụng';
    }
    if (message.includes('Signup disabled')) {
        return 'Tính năng đăng ký hiện đang bị khóa';
    }
    if (message.includes('Email not confirmed')) {
        return 'Vui lòng xác nhận email trước khi đăng nhập';
    }

    // Fallback to status codes if needed
    switch (status) {
        case 400:
            return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin';
        case 422:
            return 'Dữ liệu không hợp lệ (mật khẩu quá yếu hoặc email sai định dạng)';
        case 429:
            return 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
        default:
            return message || 'Đã xảy ra lỗi. Vui lòng thử lại';
    }
}

export default AuthContext;
