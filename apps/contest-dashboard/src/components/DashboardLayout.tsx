import { Outlet, NavLink, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function DashboardLayout() {
    const { id: contestId } = useParams();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="app-layout">
            <aside className="app-sidebar">
                <div className="app-sidebar-logo">🏆 Contest Dashboard</div>
                <nav className="app-sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        📋 Cuộc thi
                    </NavLink>

                    {contestId && (
                        <>
                            <div style={{ padding: '12px 12px 4px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Contest: {contestId.slice(0, 12)}...
                            </div>
                            <NavLink to={`/contest/${contestId}/edit`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                ✏️ Cấu hình
                            </NavLink>
                            <NavLink to={`/contest/${contestId}/challenges`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                🧩 Đề thi
                            </NavLink>
                            <NavLink to={`/contest/${contestId}/accounts`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                👥 Tài khoản
                            </NavLink>
                            <NavLink to={`/contest/${contestId}/live`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                📡 Giám sát
                            </NavLink>
                        </>
                    )}
                </nav>

                <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
                        🚪 Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}
