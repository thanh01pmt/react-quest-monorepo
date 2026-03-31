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
            generated.push({ username, email: `${username}@contest.local`, password: generatePassword(passwordLength) });
        }
        setAccounts(generated);
    };

    const createSupabaseAccounts = async () => {
        if (accounts.length === 0) return;
        setGenerating(true);
        const newParticipants = accounts.map(acc => ({
            contest_id: contestId,
            user_id: '00000000-0000-0000-0000-000000000000',
            username: acc.username,
            display_name: acc.username.toUpperCase(),
            email: acc.email
        }));

        const { error } = await supabase.from('participants').insert(newParticipants);
        if (!error) {
            loadParticipants();
            setAccounts([]);
            alert('Tài khoản đã được đăng ký thành công!');
        }
        setGenerating(false);
    };

    const assignToBoard = async () => {
        if (!selectedBoardId || participants.length === 0) return;
        setAssigning(true);

        const links = participants.map(p => ({
            board_id: selectedBoardId,
            participant_id: p.id
        }));

        const { error } = await supabase.from('board_participants').insert(links);
        if (error) {
            if (error.code === '23505') alert('Một số thí sinh đã có trong cụm này rồi.');
            else alert('Lỗi assignment: ' + error.message);
        } else {
            alert('Đã gán thành công!');
        }
        setAssigning(false);
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
                    </div>

                    <button className="btn btn-primary" onClick={generateAccounts} style={{ width: '100%', padding: 14, marginBottom: 16 }}>
                        <Zap size={18} />
                        <span>Xem trước Danh sách (Preview)</span>
                    </button>

                    {accounts.length > 0 && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={createSupabaseAccounts} disabled={generating} style={{ flex: 2, padding: 14 }}>
                                {generating ? 'Đang khởi tạo...' : (
                                    <>
                                        <Database size={18} />
                                        <span>Xác nhận & Lưu Database</span>
                                    </>
                                )}
                            </button>
                            <button className="btn btn-link" onClick={() => setAccounts([])} style={{ flex: 1, color: 'var(--text-muted)' }}>Hủy bỏ</button>
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

            {/* List Preview */}
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

