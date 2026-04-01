import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Round, ExamBoard, Participant } from '../types';
import {
    ArrowLeft,
    Users,
    Key,
    Zap,
    Map,
    Link,
    List,
    Mail,
    Calendar,
    Settings,
    UserPlus,
    Database
} from 'lucide-react';

interface GeneratedAccount {
    username: string;
    email: string;
    password: string;
}

export function AccountsPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Gen State
    const [prefix, setPrefix] = useState('ts');
    const [count, setCount] = useState(10);
    const [passwordLength, setPasswordLength] = useState(8);
    const [accounts, setAccounts] = useState<GeneratedAccount[]>([]);
    const [generating, setGenerating] = useState(false);

    // DB State
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [boards, setBoards] = useState<ExamBoard[]>([]);
    const [selectedRoundId, setSelectedRoundId] = useState('');
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (contestId) {
            loadParticipants();
            loadRounds();
        }
    }, [contestId]);

    useEffect(() => {
        if (selectedRoundId) loadBoards(selectedRoundId);
    }, [selectedRoundId]);

    const loadParticipants = async () => {
        const { data } = await supabase.from('participants').select('*').eq('contest_id', contestId!).order('username');
        if (data) setParticipants(data as Participant[]);
    };

    const loadRounds = async () => {
        const { data } = await supabase.from('rounds').select('id, title').eq('contest_id', contestId!).order('order_index');
        if (data && data.length > 0) {
            setRounds(data as Round[]);
            setSelectedRoundId(data[0].id);
        }
    };

    const loadBoards = async (rid: string) => {
        const { data } = await supabase.from('exam_boards').select('id, name').eq('round_id', rid).order('name');
        if (data && data.length > 0) {
            setBoards(data as ExamBoard[]);
            setSelectedBoardId(data[0].id);
        } else {
            setBoards([]);
            setSelectedBoardId('');
        }
    };

    const generatePassword = (length: number): string => {
        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const generateAccounts = () => {
        const generated: GeneratedAccount[] = [];
        for (let i = 1; i <= count; i++) {
            const num = String(participants.length + i).padStart(3, '0');
            const username = `${prefix}${num}`;
            generated.push({ username, email: `${username}@contest.io`, password: generatePassword(passwordLength) });
        }
        setAccounts(generated);
    };

    const exportToCSV = () => {
        if (accounts.length === 0) return;
        const headers = 'Username,Email,Password\n';
        const rows = accounts.map(acc => `${acc.username},${acc.email},${acc.password}`).join('\n');
        const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contest_accounts_${contestId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const createSupabaseAccounts = async () => {
        if (accounts.length === 0) return;
        setGenerating(true);

        try {
            for (const acc of accounts) {
                const { error } = await supabase.rpc('admin_create_participant_auth', {
                    p_username: acc.username,
                    p_email: acc.email,
                    p_password: acc.password,
                    p_contest_id: contestId,
                    p_display_name: `Thí sinh ${acc.username.toUpperCase()}`
                });

                if (error) {
                    console.error(`Error creating ${acc.username}:`, error);
                    alert(`Lỗi khi tạo ${acc.username}: ${error.message}`);
                    throw error;
                }
            }

            alert('Tất cả tài khoản đã được khởi tạo thành công trên hệ thống Auth!');
            loadParticipants();
            // Don't clear accounts immediately so they can download the CSV
        } catch (err) {
            console.error('Batch creation failed', err);
        } finally {
            setGenerating(false);
        }
    };

    const assignToBoard = async () => {
        if (!selectedBoardId || !selectedRoundId || participants.length === 0) return;
        setAssigning(true);

        try {
            const participantIds = participants.map(p => p.id);

            // 1. Get all board IDs in the selected round to clear existing assignments
            const { data: boardsInRound } = await supabase
                .from('exam_boards')
                .select('id')
                .eq('round_id', selectedRoundId);

            if (boardsInRound && boardsInRound.length > 0) {
                const boardIdsInRound = boardsInRound.map(b => b.id);
                // 2. Clear existing assignments for these participants in this round
                await supabase
                    .from('board_participants')
                    .delete()
                    .in('participant_id', participantIds)
                    .in('board_id', boardIdsInRound);
            }

            // 3. Assign all to the selected board
            const links = participantIds.map(pid => ({
                board_id: selectedBoardId,
                participant_id: pid
            }));

            const { error } = await supabase.from('board_participants').insert(links);
            if (error) throw error;

            alert('Đã gán thành công TẤT CẢ thí sinh vào cụm thi!');
        } catch (error: any) {
            alert('Lỗi assignment: ' + error.message);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${contestId}/edit`)} style={{ padding: 8 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Users size={28} className="text-secondary" />
                            <span>Quản lý thí sinh & Cụm thi</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                {/* Gen Column */}
                <div className="card glass-dark" style={{ border: '1px solid var(--border)', padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Key size={20} className="text-accent" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Sinh tài khoản tự động</h3>
                    </div>

                    <div className="form-row" style={{ gap: 16, marginBottom: 24 }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Tiền tố (Prefix)</label>
                            <input value={prefix} onChange={e => setPrefix(e.target.value)} style={{ padding: 12, fontWeight: 700 }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Số lượng</label>
                            <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} style={{ padding: 12, fontWeight: 700 }} />
                        </div>
                        <div className="form-group" style={{ flex: 0.6 }}>
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Độ dài Pass</label>
                            <input type="number" value={passwordLength} onChange={e => setPasswordLength(parseInt(e.target.value) || 8)} style={{ padding: 12, fontWeight: 700 }} />
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={generateAccounts} style={{ width: '100%', padding: 14, marginBottom: 16 }}>
                        <Zap size={18} />
                        <span>Xem trước Danh sách (Preview)</span>
                    </button>

                    {accounts.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <div style={{ background: 'rgba(255,100,100,0.1)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', color: '#ff8888', border: '1px solid rgba(255,100,100,0.2)' }}>
                                <strong>Lưu ý:</strong> Hãy tải file CSV trước khi bấm "Lưu Database" hoặc tải lại trang để không mất mật khẩu của thí sinh.
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <button className="btn btn-secondary" onClick={exportToCSV} style={{ padding: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}>
                                    <List size={18} />
                                    <span>Tải CSV</span>
                                </button>
                                <button className="btn btn-primary" onClick={createSupabaseAccounts} disabled={generating} style={{ padding: 12 }}>
                                    {generating ? 'Đang tạo...' : (
                                        <>
                                            <Database size={18} />
                                            <span>Lưu DB</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <button className="btn btn-link" onClick={() => setAccounts([])} style={{ width: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hủy danh sách hiện tại</button>
                        </div>
                    )}
                </div>

                {/* Assignment Column */}
                <div className="card glass-dark" style={{ border: '1px solid var(--border)', padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Map size={20} className="text-secondary" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Phân phối Cụm thi (Board)</h3>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Lựa chọn Vòng thi</label>
                        <select value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                            {rounds.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Lựa chọn Cụm thi mục tiêu</label>
                        <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                            <option value="">(Chưa chọn cụm)</option>
                            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={assignToBoard}
                        disabled={!selectedBoardId || assigning || participants.length === 0}
                        style={{ width: '100%', padding: 14, border: '1px solid var(--border)' }}
                    >
                        {assigning ? 'Đang gán...' : (
                            <>
                                <Link size={18} />
                                <span>Gán TẤT CẢ thí sinh vào cụm này</span>
                            </>
                        )}
                    </button>
                    <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Users size={14} />
                        <span>Cơ sở dữ liệu hiện có: <strong>{participants.length}</strong> thí sinh</span>
                    </div>
                </div>
            </div>

            {/* Preview of Generated Accounts */}
            {accounts.length > 0 && (
                <div className="card glass-dark" style={{ marginTop: 32, padding: 0, border: '1px solid var(--accent)', boxShadow: '0 0 20px rgba(0, 243, 255, 0.1)' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 243, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Zap size={18} className="text-accent" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Xem trước danh sách vừa sinh (Preview)</h3>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa lưu vào Database</span>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '12px 24px' }}>Username</th>
                                    <th>Password (Mật khẩu)</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '10px 24px' }}><code>{acc.username}</code></td>
                                        <td><code style={{ color: 'var(--accent)', fontWeight: 700 }}>{acc.password}</code></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{acc.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <div className="card glass" style={{ marginTop: 32, padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <List size={20} className="text-secondary" />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Dữ liệu Participant (Tổng quan)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead style={{ background: 'rgba(0,0,0,0.1)' }}>
                            <tr>
                                <th style={{ padding: '16px 32px' }}>Tài khoản (UID)</th>
                                <th>Họ tên hiển thị</th>
                                <th>Địa chỉ Email</th>
                                <th>Khởi tạo lúc</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có thí sinh nào được đăng ký.</td>
                                </tr>
                            ) : participants.map(p => (
                                <tr key={p.id}>
                                    <td style={{ padding: '18px 32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Settings size={14} className="text-muted" />
                                            <code>{p.username}</code>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, background: 'var(--bg-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', fontSize: '0.8rem' }}>
                                                {p.display_name?.charAt(0)}
                                            </div>
                                            <strong>{p.display_name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                            <Mail size={14} />
                                            {p.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <Calendar size={14} />
                                            {new Date(p.joined_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

