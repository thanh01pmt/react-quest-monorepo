import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { ContestListPage } from './pages/ContestListPage';
import { ContestEditorPage } from './pages/ContestEditorPage';
import { ChallengeBuilderPage } from './pages/ChallengeBuilderPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { AccountsPage } from './pages/AccountsPage';
import { PromotionPage } from './pages/PromotionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import type { Session } from '@supabase/supabase-js';


export function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    if (!session) {
        return <LoginPage />;
    }

    const isAdmin = session.user.app_metadata.role === 'admin';
    
    if (!isAdmin) {
        const match = window.location.pathname.match(/\/contest\/([^\/]+)/);
        const contestId = match ? match[1] : null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Truy cập bị từ chối</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Tài khoản thí sinh không được phép truy cập Contest Dashboard (Hệ thống quản trị).</p>
                
                {contestId && (
                    <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Đang chuyển hướng bạn đến sảnh chờ (Lobby) của cuộc thi...</p>
                        <a 
                            href={`${import.meta.env.VITE_LEARNER_APP_URL || 'https://quest-player.netlify.app'}/contest/${contestId}`}
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', padding: '12px 24px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                            🚀 Đi tới trang làm bài (Lobby)
                        </a>
                    </div>
                )}
                
                <button 
                    onClick={() => supabase.auth.signOut()}
                    className="btn btn-secondary"
                >
                    Đăng xuất khỏi hệ thống
                </button>
            </div>
        );
    }

    return (
        <Routes>
            <Route element={<DashboardLayout />}>
                <Route path="/" element={<ContestListPage />} />
                <Route path="/contest/:id/edit" element={<ContestEditorPage />} />
                <Route path="/contest/:id/challenges" element={<ChallengeBuilderPage />} />
                <Route path="/contest/:id/accounts" element={<AccountsPage />} />
                <Route path="/contest/:id/live" element={<LiveMonitorPage />} />
                <Route path="/contest/:id/promotion" element={<PromotionPage />} />
                <Route path="/contest/:id/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
        </Routes>
    );
}
