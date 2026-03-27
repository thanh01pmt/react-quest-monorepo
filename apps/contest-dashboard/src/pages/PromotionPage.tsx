import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Round, LeaderboardEntry, ExamBoard } from '../types';
import {
    ArrowLeft,
    Trophy,
    Search,
    Users,
    Zap,
    CheckCircle,
    ArrowRight,
    Filter
} from 'lucide-react';

export function PromotionPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [rounds, setRounds] = useState<Round[]>([]);
    const [sourceRoundId, setSourceRoundId] = useState('');
    const [targetRoundId, setTargetRoundId] = useState('');

    const [candidates, setCandidates] = useState<LeaderboardEntry[]>([]);
    const [targetBoards, setTargetBoards] = useState<ExamBoard[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [promoting, setPromoting] = useState(false);

    useEffect(() => {
        if (contestId) loadRounds();
    }, [contestId]);

    useEffect(() => {
        if (sourceRoundId) loadCandidates(sourceRoundId);
    }, [sourceRoundId]);

    useEffect(() => {
        if (targetRoundId) loadTargetBoards(targetRoundId);
    }, [targetRoundId]);

    const loadRounds = async () => {
        const { data } = await supabase.from('rounds').select('id, title').eq('contest_id', contestId!).order('order_index');
        if (data && data.length > 1) {
            setRounds(data as Round[]);
            setSourceRoundId(data[0].id);
            setTargetRoundId(data[1].id);
        }
    };

    const loadCandidates = async (rid: string) => {
        const { data } = await supabase.from('round_leaderboard').select('*').eq('round_id', rid).order('total_score', { ascending: false });
        if (data) setCandidates(data as LeaderboardEntry[]);
    };

    const loadTargetBoards = async (rid: string) => {
        const { data } = await supabase.from('exam_boards').select('id, name').eq('round_id', rid);
        if (data && data.length > 0) {
            setTargetBoards(data as ExamBoard[]);
            setSelectedBoardId(data[0].id);
        }
    };

    const executePromotion = async () => {
        if (!selectedBoardId || candidates.length === 0) return;
        if (!confirm(`Xác nhận chuyển ${candidates.length} thí sinh vào vòng tiếp theo?`)) return;

        setPromoting(true);
        const links = candidates.map(c => ({
            board_id: selectedBoardId,
            participant_id: (c as any).participant_id || c.board_participant_id
        }));

        const { error } = await supabase.from('board_participants').insert(links);
        if (error) alert('Lỗi promotion: ' + error.message);
        else alert('Promotion thành công!');
        setPromoting(false);
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${contestId}/edit`)} style={{ padding: 8 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Trophy size={28} className="text-secondary" />
                            <span>Xét tuyển & Thăng hạng</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="card glass-dark" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'end', marginBottom: 32, padding: 32, border: '1px solid var(--border)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Vòng xuất phát (Source)</label>
                    <select value={sourceRoundId} onChange={e => setSourceRoundId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                        {rounds.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Vòng mục tiêu (Target)</label>
                    <select value={targetRoundId} onChange={e => setTargetRoundId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                        {rounds.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Đích đến (Board)</label>
                    <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                        {targetBoards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="card glass" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, background: 'var(--bg-tertiary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} className="text-secondary" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Đề xuất Thăng hạng</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{candidates.length} thí sinh đủ tiêu chuẩn</div>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={executePromotion}
                        disabled={promoting || !selectedBoardId || candidates.length === 0}
                        style={{ padding: '12px 24px' }}
                    >
                        {promoting ? 'Đang xử lý...' : (
                            <>
                                <Zap size={18} />
                                <span>Thực hiện Thăng hạng</span>
                            </>
                        )}
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead style={{ background: 'rgba(0,0,0,0.1)' }}>
                            <tr>
                                <th style={{ padding: '16px 32px' }}># Thử tự</th>
                                <th>Thí sinh / Username</th>
                                <th>Điểm tích lũy</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Chưa có bảng điểm cho vòng thi này để đề xuất thăng hạng.
                                    </td>
                                </tr>
                            ) : candidates.map((c, i) => (
                                <tr key={c.board_participant_id}>
                                    <td style={{ padding: '18px 32px' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < 3 ? 'var(--accent)' : 'var(--bg-tertiary)', color: i < 3 ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                                            {i + 1}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.display_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{c.username}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{c.total_score}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>pts</span>
                                    </td>
                                    <td>
                                        <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content', padding: '6px 12px' }}>
                                            <CheckCircle size={12} />
                                            {c.status || 'Qualified'}
                                        </span>
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

