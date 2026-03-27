import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card glass-dark" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <Trophy size={48} className="text-secondary" style={{ filter: 'drop-shadow(0 0 10px rgba(88,166,255,0.3))' }} />
                </div>
                <h1 style={{ textAlign: 'center', marginBottom: 8, fontWeight: 800 }}>Contest Dashboard</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 32 }}>Hệ thống quản lý cuộc thi chuyên nghiệp</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
