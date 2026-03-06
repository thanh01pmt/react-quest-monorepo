import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface GeneratedAccount {
    username: string;
    email: string;
    password: string;
}

export function AccountsPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const [prefix, setPrefix] = useState('ts');
    const [count, setCount] = useState(10);
    const [passwordLength, setPasswordLength] = useState(8);
    const [accounts, setAccounts] = useState<GeneratedAccount[]>([]);
    const [generating, setGenerating] = useState(false);
    const [existingCount, setExistingCount] = useState(0);

    useEffect(() => {
        if (contestId) loadExistingCount();
    }, [contestId]);

    const loadExistingCount = async () => {
        const { count } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contestId!);
        setExistingCount(count || 0);
    };

    const generatePassword = (length: number): string => {
        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const generateAccounts = () => {
        const generated: GeneratedAccount[] = [];
        for (let i = 1; i <= count; i++) {
            const num = String(i).padStart(3, '0');
            const username = `${prefix}${num}`;
            generated.push({
                username,
                email: `${username}@contest.local`,
                password: generatePassword(passwordLength),
            });
        }
        setAccounts(generated);
    };

    const createSupabaseAccounts = async () => {
        if (accounts.length === 0) return;
        setGenerating(true);

        let successCount = 0;
        for (const acc of accounts) {
            const { error } = await supabase.auth.admin.createUser({
                email: acc.email,
                password: acc.password,
                email_confirm: true,
            });
            if (!error) successCount++;
        }

        alert(`Đã tạo thành công ${successCount}/${accounts.length} tài khoản trên Supabase Auth.`);
        setGenerating(false);
    };

    const exportCSV = () => {
        if (accounts.length === 0) return;
        const headers = ['Username', 'Email', 'Password'];
        const rows = accounts.map((a) => [a.username, a.email, a.password]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts-${contestId}.csv`;
        a.click();
    };

    return (
        <div>
            <div className="page-header">
                <h1>👥 Quản lý tài khoản</h1>
            </div>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-label">Đã đăng ký</div>
                    <div className="stat-value">{existingCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Đã generate</div>
                    <div className="stat-value">{accounts.length}</div>
                </div>
            </div>

            {/* Generator */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 16 }}>🔑 Sinh tài khoản hàng loạt</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Tiền tố username</label>
                        <input
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="ts"
                        />
                    </div>
                    <div className="form-group">
                        <label>Số lượng</label>
                        <input
                            type="number"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                            min={1}
                            max={1000}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Độ dài mật khẩu</label>
                    <input
                        type="number"
                        value={passwordLength}
                        onChange={(e) => setPasswordLength(parseInt(e.target.value) || 8)}
                        min={6}
                        max={16}
                        style={{ width: 120 }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={generateAccounts}>
                        ⚡ Generate
                    </button>
                    {accounts.length > 0 && (
                        <>
                            <button className="btn btn-secondary" onClick={exportCSV}>
                                📥 Xuất CSV
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={createSupabaseAccounts}
                                disabled={generating}
                            >
                                {generating ? 'Đang tạo...' : '🚀 Tạo trên Supabase Auth'}
                            </button>
                        </>
                    )}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                    Convention: {prefix}001@contest.local, {prefix}002@contest.local, ...
                </p>
            </div>

            {/* Preview */}
            {accounts.length > 0 && (
                <div className="card">
                    <h3 style={{ marginBottom: 12 }}>📋 Preview ({accounts.length} tài khoản)</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Password</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.slice(0, 20).map((acc, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{acc.username}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {acc.email}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                        {acc.password}
                                    </td>
                                </tr>
                            ))}
                            {accounts.length > 20 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ... và {accounts.length - 20} tài khoản nữa (xuất CSV để xem tất cả)
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
