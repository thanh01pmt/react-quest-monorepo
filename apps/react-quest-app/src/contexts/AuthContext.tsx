/**
 * AuthContext
 * 
 * React context for Firebase authentication.
 * Provides user state and auth methods to the entire app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Auth context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
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

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
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
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            const errorMessage = getAuthErrorMessage(err.code);
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
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update display name
            if (result.user) {
                await updateProfile(result.user, { displayName });
            }
        } catch (err: any) {
            const errorMessage = getAuthErrorMessage(err.code);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        setError(null);
        try {
            await firebaseSignOut(auth);
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
        signOut,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Helper to get user-friendly error messages
function getAuthErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Email này đã được sử dụng';
        case 'auth/invalid-email':
            return 'Email không hợp lệ';
        case 'auth/weak-password':
            return 'Mật khẩu quá yếu (cần ít nhất 6 ký tự)';
        case 'auth/user-not-found':
            return 'Không tìm thấy tài khoản với email này';
        case 'auth/wrong-password':
            return 'Mật khẩu không đúng';
        case 'auth/too-many-requests':
            return 'Quá nhiều lần thử. Vui lòng thử lại sau';
        case 'auth/popup-closed-by-user':
            return 'Cửa sổ đăng nhập đã bị đóng';
        default:
            return 'Đã xảy ra lỗi. Vui lòng thử lại';
    }
}

export default AuthContext;
