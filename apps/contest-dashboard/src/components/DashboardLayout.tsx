import { Outlet, NavLink, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    Settings,
    ScrollText,
    Users,
    Activity,
    LogOut,
    Trophy
} from 'lucide-react';

export function DashboardLayout() {
    const { id: contestId } = useParams();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="app-layout">
            <aside className="app-sidebar">
                <div className="app-sidebar-logo">
                    <Trophy size={20} />
                    <span>Contest Dashboard</span>
                </div>
                <nav className="app-sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={18} />
                        <span>Cuộc thi</span>
                    </NavLink>

                    {contestId && (
                        <>
                            <div style={{ padding: '16px 12px 8px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Contest: {contestId.slice(0, 12)}
                            </div>
                            <NavLink to={`/contest/${contestId}/edit`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Settings size={18} />
                                <span>Cấu hình</span>
                            </NavLink>
                            <NavLink to={`/contest/${contestId}/challenges`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <ScrollText size={18} />
                                <span>Đề thi</span>
                            </NavLink>
                            <NavLink to={`/contest/${contestId}/accounts`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={18} />
                                <span>Tài khoản</span>
                            </NavLink>
                            <NavLink to={`/contest/${contestId}/live`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Activity size={18} />
                                <span>Giám sát</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>


            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}
