/**
 * AuthButton Component
 * 
 * Displays login button when unauthenticated,
 * or user profile when authenticated.
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthButton.css';

interface AuthButtonProps {
    compact?: boolean; // For collapsed sidebar
}

export function AuthButton({ compact = false }: AuthButtonProps) {
    const { user, loading, signInWithGoogle, signOut } = useAuth();
    const [showMenu, setShowMenu] = useState(false);

    if (loading) {
        return (
            <div className="auth-button-container">
                <div className="auth-loading">...</div>
            </div>
        );
    }

    if (user) {
        return (
            <div className="auth-button-container">
                <button
                    className="auth-user-button"
                    onClick={() => setShowMenu(!showMenu)}
                    title={user.user_metadata?.full_name || user.email || 'User'}
                >
                    {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="auth-avatar" />
                    ) : (
                        <span className="auth-avatar-placeholder">
                            {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                        </span>
                    )}
                    {!compact && (
                        <span className="auth-display-name">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                    )}
                </button>

                {showMenu && (
                    <div className="auth-dropdown">
                        <div className="auth-dropdown-header">
                            <strong>{user.user_metadata?.full_name || 'User'}</strong>
                            <span>{user.email}</span>
                        </div>
                        <button
                            className="auth-dropdown-item"
                            onClick={() => {
                                signOut();
                                setShowMenu(false);
                            }}
                        >
                            🚪 Đăng xuất
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="auth-button-container">
            <button
                className="auth-login-button"
                onClick={signInWithGoogle}
                title="Đăng nhập"
            >
                {compact ? '👤' : '🔑 Đăng nhập'}
            </button>
        </div>
    );
}

export default AuthButton;
