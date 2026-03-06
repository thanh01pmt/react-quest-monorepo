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

    return (
        <Routes>
            <Route element={<DashboardLayout />}>
                <Route path="/" element={<ContestListPage />} />
                <Route path="/contest/:id/edit" element={<ContestEditorPage />} />
                <Route path="/contest/:id/challenges" element={<ChallengeBuilderPage />} />
                <Route path="/contest/:id/accounts" element={<AccountsPage />} />
                <Route path="/contest/:id/live" element={<LiveMonitorPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
