import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { BoardParticipant, LeaderboardEntry, Round, ExamBoard } from '../types';
import {
    Activity,
    ArrowLeft,
    RefreshCw,
    Download,
    MapPin,
    Layers,
    Trophy,
    Clock,
    Lock,
    Search,
    Filter,
    CheckSquare,
    Square,
    UserMinus,
    Trash2,
    Skull,
    History
} from 'lucide-react';

export function LiveMonitorPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // UI State
    const [viewLevel, setViewLevel] = useState<'board' | 'round' | 'contest'>('board');
    const [rounds, setRounds] = useState<Round[]>([]);
    const [selectedRoundId, setSelectedRoundId] = useState<string>('');
    const [boards, setBoards] = useState<ExamBoard[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');

    // Data State
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    useEffect(() => {
        if (contestId) loadHierarchy(contestId);
        setSelectedIds(new Set()); // Clear selection on scope change
    }, [contestId, viewLevel, selectedRoundId, selectedBoardId]);

    useEffect(() => {
        if (selectedRoundId) loadBoards(selectedRoundId);
    }, [selectedRoundId]);

    useEffect(() => {
        if (contestId) {
            loadLeaderboard();

            // Subscribe to hierarchical updates
            const channel = supabase
                .channel(`live-${contestId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => {
                    loadLeaderboard();
                    setLastUpdate(new Date());
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'contest_progress' }, () => {
                    loadLeaderboard();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [contestId, viewLevel, selectedRoundId, selectedBoardId]);

    const loadHierarchy = async (cid: string) => {
        const { data } = await supabase.from('rounds').select('id, title').eq('contest_id', cid).order('order_index');
        if (data && data.length > 0) {
            setRounds(data as Round[]);
            setSelectedRoundId(data[0].id);
        }
        setLoading(false);
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

    const loadLeaderboard = async () => {
        if (!contestId) return;
        let query;

        if (viewLevel === 'board') {
            if (!selectedBoardId) return;
            query = supabase.from('board_leaderboard').select('*').eq('board_id', selectedBoardId);
        } else if (viewLevel === 'round') {
            if (!selectedRoundId) return;
            query = supabase.from('round_leaderboard').select('*').eq('round_id', selectedRoundId);
        } else {
            query = supabase.from('contest_leaderboard').select('*').eq('contest_id', contestId);
        }

        const { data } = query ? await query.order('total_score', { ascending: false }) : { data: null };
        if (data) setLeaderboard(data as LeaderboardEntry[]);
    };

    const extendTime = async (bpId: string) => {
        const minutes = prompt('Thêm bao nhiêu phút?', '15');
        if (!minutes) return;
        const { data: bp } = await supabase.from('board_participants').select('deadline').eq('id', bpId).single();
        if (!bp || !bp.deadline) return;

        const newDeadline = new Date(new Date(bp.deadline).getTime() + parseInt(minutes) * 60 * 1000);
        await supabase.from('board_participants').update({ deadline: newDeadline.toISOString() }).eq('id', bpId);
        loadLeaderboard();
    };

    const forceSubmit = async (bpId: string) => {
        if (!confirm('Buộc nộp bài thí sinh này?')) return;
        await supabase.from('board_participants').update({ status: 'submitted' }).eq('id', bpId);
        loadLeaderboard();
    };

    const exportCSV = () => {
        const headers = ['Rank', 'Name', 'Username', 'Score', 'Solved', 'Status'];
        const rows = leaderboard.map((e, i) => [i + 1, e.display_name, e.username, e.total_score, e.challenges_solved, e.status]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `leaderboard-${viewLevel}-${contestId}.csv`;
        a.click();
    };

    // Bulk Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === leaderboard.length && leaderboard.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(leaderboard.map(e => e.board_participant_id)));
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleBulkOperation = async (action: 'extend' | 'submit' | 'reset' | 'disqualify') => {
        if (selectedIds.size === 0) return;
        setBulkLoading(true);

        try {
            const ids = Array.from(selectedIds);
            let updateData: any = {};

            switch (action) {
                case 'extend':
                    const mins = prompt(`Thêm bao nhiêu phút cho ${selectedIds.size} thí sinh?`, '15');
                    if (!mins) { setBulkLoading(false); return; }
                    
                    // Supabase doesn't easily support "new_val = old_val + interval" in batch update via client
                    // We need to fetch and then loop or use a function.
                    // For simplicity and speed for the user, we'll use a loop of updates or a smart approach.
                    // Actually, let's just use a loop for individual deadlines to be precise.
                    const { data: bps } = await supabase.from('board_participants').select('id, deadline').in('id', ids);
                    if (bps) {
                        for (const bp of bps) {
                            if (!bp.deadline) continue;
                            const newDeadline = new Date(new Date(bp.deadline).getTime() + parseInt(mins) * 60 * 1000);
                            await supabase.from('board_participants').update({ deadline: newDeadline.toISOString() }).eq('id', bp.id);
                        }
                    }
                    break;
                case 'submit':
                    if (!confirm(`Buộc nộp bài cho ${selectedIds.size} thí sinh?`)) { setBulkLoading(false); return; }
                    await supabase.from('board_participants').update({ status: 'submitted' }).in('id', ids);
                    break;
                case 'reset':
                    if (!confirm(`ĐẶT LẠI trạng thái cho ${selectedIds.size} thí sinh? Dữ liệu Score sẽ được giữ lại nhưng thí sinh có thể làm lại bài.`)) { setBulkLoading(false); return; }
                    await supabase.from('board_participants').update({ 
                        status: 'active', 
                        started_at: null, 
                        submitted_at: null 
                    }).in('id', ids);
                    break;
                case 'disqualify':
                    if (!confirm(`Hủy tư cách thi (Disqualify) ${selectedIds.size} thí sinh?`)) { setBulkLoading(false); return; }
                    await supabase.from('board_participants').update({ status: 'disqualified' }).in('id', ids);
                    break;
            }

            alert('Thao tác hàng loạt hoàn tất!');
            loadLeaderboard();
            setSelectedIds(new Set());
        } catch (error: any) {
            alert('Lỗi thao tác hàng loạt: ' + error.message);
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) return <div className="empty-state">Đang tải...</div>;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} title="Quay lại" style={{ padding: '8px 12px' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
                        <Activity size={28} className="text-secondary" />
                        <span style={{ fontWeight: 700 }}>Giám sát Live:</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{viewLevel === 'board' ? 'Cụm thi' : viewLevel === 'round' ? 'Vòng thi' : 'Toàn diện'}</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => loadLeaderboard()}>
                        <RefreshCw size={18} />
                        <span>Làm mới</span>
                    </button>
                    <button className="btn btn-primary" onClick={exportCSV}>
                        <Download size={18} />
                        <span>Xuất CSV</span>
                    </button>
                </div>
            </div>

            {/* Level Selector Tabs */}
            <div className="card glass-dark" style={{ padding: 6, display: 'inline-flex', gap: 6, marginBottom: 32, border: '1px solid var(--border)', borderRadius: 12 }}>
                <button
                    className={`btn btn-sm ${viewLevel === 'board' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewLevel('board')}
                    style={{
                        background: viewLevel === 'board' ? 'var(--accent)' : 'transparent',
                        color: viewLevel === 'board' ? '#fff' : 'var(--text-secondary)',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.9rem'
                    }}
                >
                    <MapPin size={16} />
                    <span>Theo Cụm</span>
                </button>
                <button
                    className={`btn btn-sm ${viewLevel === 'round' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewLevel('round')}
                    style={{
                        background: viewLevel === 'round' ? 'var(--accent)' : 'transparent',
                        color: viewLevel === 'round' ? '#fff' : 'var(--text-secondary)',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.9rem'
                    }}
                >
                    <Layers size={16} />
                    <span>Theo Vòng</span>
                </button>
                <button
                    className={`btn btn-sm ${viewLevel === 'contest' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewLevel('contest')}
                    style={{
                        background: viewLevel === 'contest' ? 'var(--accent)' : 'transparent',
                        color: viewLevel === 'contest' ? '#fff' : 'var(--text-secondary)',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.9rem'
                    }}
                >
                    <Trophy size={16} />
                    <span>Toàn diện</span>
                </button>
            </div>

            {/* Scope Filters */}
            <div className="card glass-dark" style={{ marginBottom: 24, padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layers size={14} className="text-accent" />
                            Vòng thi đang chọn
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedRoundId}
                                onChange={(e) => setSelectedRoundId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    paddingRight: '40px',
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    appearance: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {rounds.map((round) => (
                                    <option key={round.id} value={round.id}>
                                        {round.title}
                                    </option>
                                ))}
                            </select>
                            <Filter size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }} />
                        </div>
                    </div>
                    {viewLevel === 'board' && (
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={14} className="text-accent" />
                                Cụm thi đang xem
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedBoardId}
                                    onChange={e => setSelectedBoardId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        paddingRight: '40px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 8,
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        {lastUpdate && (
                            <div className="glass-dark" style={{ padding: '10px 16px', borderRadius: 10, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)' }}>
                                <span className="pulse" style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--success)', borderRadius: '50%' }}></span>
                                <span>Cập nhật Live: <strong style={{ color: 'var(--text-primary)', marginLeft: 4 }}>{lastUpdate.toLocaleTimeString('vi-VN')}</strong></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="card glass-dark" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                <table className="data-table">
                    <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <tr>
                            <th style={{ width: 50, padding: '16px 24px' }}>
                                <input
                                    type="checkbox"
                                    className="checkbox-custom"
                                    checked={selectedIds.size === leaderboard.length && leaderboard.length > 0}
                                    ref={el => {
                                        if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < leaderboard.length;
                                    }}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th style={{ width: 80 }}># Rank</th>
                            <th>Thí sinh</th>
                            <th>Username</th>
                            {viewLevel === 'round' && <th>Cụm thi</th>}
                            <th style={{ textAlign: 'center' }}>Điểm số</th>
                            <th style={{ textAlign: 'center' }}>Bài giải</th>
                            <th>Trạng thái</th>
                            <th style={{ textAlign: 'right', paddingRight: 24 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, i) => (
                            <tr key={entry.board_participant_id} className={selectedIds.has(entry.board_participant_id) ? 'selected' : ''}>
                                <td style={{ padding: '18px 24px' }}>
                                    <input
                                        type="checkbox"
                                        className="checkbox-custom"
                                        checked={selectedIds.has(entry.board_participant_id)}
                                        onChange={() => toggleSelectRow(entry.board_participant_id)}
                                    />
                                </td>
                                <td>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < 3 ? 'var(--warning)' : 'var(--bg-tertiary)', color: i < 3 ? '#000' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                                        {i + 1}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <strong>{entry.display_name}</strong>
                                        {entry.status === 'active' && (
                                            <div className="pulse" style={{ width: 10, height: 10, background: '#3fb950', borderRadius: '50%', boxShadow: '0 0 10px #3fb950' }} title="Đang trực tuyến" />
                                        )}
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{entry.username}</td>
                                {viewLevel === 'round' && <td>{entry.board_name}</td>}
                                <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{entry.total_score}</td>
                                <td style={{ textAlign: 'center' }}>{entry.challenges_solved}</td>
                                <td>
                                    <span className={`badge badge-${entry.status}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => extendTime(entry.board_participant_id)} title="Cấp thêm thời gian" style={{ padding: 8 }}>
                                            <Clock size={16} />
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => forceSubmit(entry.board_participant_id)} title="Kết thúc bài thi sớm" style={{ padding: 8 }}>
                                            <Lock size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leaderboard.length === 0 && (
                    <div className="empty-state" style={{ padding: 80 }}>
                        <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
                        <h3 style={{ margin: 0 }}>Chưa có dữ liệu cho phạm vi này</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Thí sinh có thể chưa bắt đầu làm bài hoặc không có thí sinh nào trong cụm/vòng này.</p>
                    </div>
                )}
            </div>

            {/* Bulk Action Toolbar */}
            <div className={`bulk-action-toolbar ${selectedIds.size > 0 ? 'visible' : ''}`}>
                <div className="selection-info">
                    <span className="selection-badge">{selectedIds.size}</span>
                    <span>Thí sinh đã chọn</span>
                </div>
                <div className="bulk-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleBulkOperation('extend')} disabled={bulkLoading}>
                        <Clock size={16} />
                        <span>Gia hạn</span>
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleBulkOperation('submit')} disabled={bulkLoading}>
                        <Lock size={16} />
                        <span>Nộp bài</span>
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleBulkOperation('reset')} disabled={bulkLoading}>
                        <History size={16} />
                        <span>Reset</span>
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleBulkOperation('disqualify')} disabled={bulkLoading} style={{ background: 'rgba(248, 81, 73, 0.2)', border: '1px solid var(--danger)' }}>
                        <Skull size={16} />
                        <span>Hủy tư cách</span>
                    </button>
                    {bulkLoading && <RefreshCw size={16} className="pulse" />}
                </div>
                <button className="btn btn-link btn-sm" onClick={() => setSelectedIds(new Set())} style={{ marginLeft: 12, color: 'var(--text-secondary)' }}>
                    Hủy
                </button>
            </div>
        </div>
    );
}

