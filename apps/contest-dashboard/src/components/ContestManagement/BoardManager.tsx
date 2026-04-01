import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Round, ExamBoard, Exam, RoundTiming } from '../../types';
import {
    Map,
    Plus,
    Settings,
    Trash2,
    CheckCircle,
    XCircle,
    Info,
    Clock,
    Zap,
    Play
} from 'lucide-react';

interface BoardManagerProps {
    contestId: string;
}

export function BoardManager({ contestId }: BoardManagerProps) {
    const [rounds, setRounds] = useState<Round[]>([]);
    const [selectedRoundId, setSelectedRoundId] = useState<string>('');
    const [boards, setBoards] = useState<ExamBoard[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBoard, setEditingBoard] = useState<ExamBoard | null>(null);

    useEffect(() => {
        loadRounds();
    }, [contestId]);

    useEffect(() => {
        if (selectedRoundId) {
            loadBoardsAndExams(selectedRoundId);
        } else {
            setBoards([]);
            setExams([]);
        }
    }, [selectedRoundId]);

    const loadRounds = async () => {
        const { data } = await supabase
            .from('rounds')
            .select('id, title, order_index')
            .eq('contest_id', contestId)
            .order('order_index', { ascending: true });

        if (data && data.length > 0) {
            setRounds(data as Round[]);
            setSelectedRoundId(data[0].id);
        }
        setLoading(false);
    };

    const loadBoardsAndExams = async (roundId: string) => {
        const [boardsRes, examsRes] = await Promise.all([
            supabase.from('exam_boards').select('*').eq('round_id', roundId).order('name', { ascending: true }),
            supabase.from('exams').select('id, title').eq('round_id', roundId)
        ]);

        if (boardsRes.data) setBoards(boardsRes.data as ExamBoard[]);
        if (examsRes.data) setExams(examsRes.data as Exam[]);
    };

    const addBoard = async () => {
        if (!selectedRoundId) return;
        const newBoard: Partial<ExamBoard> = {
            round_id: selectedRoundId,
            name: `Cụm thi ${boards.length + 1}`,
            exam_id: exams.length > 0 ? exams[0].id : null,
            timing_override: null
        };

        const { data, error } = await supabase.from('exam_boards').insert(newBoard).select().single();
        if (!error && data) setBoards([...boards, data as ExamBoard]);
    };

    const updateBoard = async (board: ExamBoard) => {
        const { error } = await supabase
            .from('exam_boards')
            .update(board)
            .eq('id', board.id);

        if (!error) {
            setBoards(boards.map(b => b.id === board.id ? board : b));
            setEditingBoard(null);
        }
    };

    const deleteBoard = async (id: string) => {
        if (!confirm('Xóa cụm thi này?')) return;
        const { error } = await supabase.from('exam_boards').delete().eq('id', id);
        if (!error) setBoards(boards.filter(b => b.id !== id));
    };

    const handleTestAttempt = async (board: ExamBoard) => {
        if (!board.exam_id) {
            alert('Cụm này chưa gán đề thi!');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Chưa đăng nhập');

            // 1. Đảm bảo có bản ghi participant cho admin
            let { data: participant } = await supabase
                .from('participants')
                .select('id')
                .eq('contest_id', contestId)
                .eq('external_uid', user.id)
                .maybeSingle();

            if (!participant) {
                const { data: newPart, error: partErr } = await supabase
                    .from('participants')
                    .insert({
                        contest_id: contestId,
                        external_uid: user.id,
                        username: `admin-${user.email?.split('@')[0] || 'user'}`,
                        display_name: `Admin Preview (${user.email})`,
                    })
                    .select()
                    .single();

                if (partErr) throw partErr;
                participant = newPart;
            }

            // 2. Tạo hoặc lấy board_participant với is_test = true
            let { data: bp } = await supabase
                .from('board_participants')
                .select('id')
                .eq('board_id', board.id)
                .eq('participant_id', participant!.id)
                .eq('is_test', true)
                .maybeSingle();

            if (!bp) {
                const now = new Date();
                const deadline = new Date(now.getTime() + 120 * 60 * 1000); // Mặc định 120p thi thử

                const { data: newBP, error: bpErr } = await supabase
                    .from('board_participants')
                    .insert({
                        board_id: board.id,
                        participant_id: participant!.id,
                        status: 'active',
                        started_at: now.toISOString(),
                        deadline: deadline.toISOString(),
                        is_test: true
                    })
                    .select()
                    .single();

                if (bpErr) throw bpErr;
                bp = newBP;
            }

            // 3. Chuyển hướng sang Learner App với contest ID (KHÔNG phải bp.id)
            // Bảo mật: auth.uid() được kiểm tra server-side trong resolve_participant_session
            // → Người lạ có link cũng không vào được vì không có is_test session
            const learnerUrl = import.meta.env.VITE_LEARNER_APP_URL || 'http://localhost:5173';
            window.open(`${learnerUrl}/contest/${contestId}`, '_blank');

        } catch (error: any) {
            console.error('Lỗi thi thử:', error);
            alert(`Không thể bắt đầu thi thử: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="empty-state card">Đang tải thông tin...</div>;

    return (
        <div className="board-manager">
            <div className="card glass-dark" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20, border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vòng thi đang cấu hình</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info size={18} className="text-secondary" />
                        </div>
                        <select
                            value={selectedRoundId}
                            onChange={e => setSelectedRoundId(e.target.value)}
                            style={{ width: '100%', fontWeight: 700, fontSize: '1.05rem', border: 'none', background: 'transparent', paddingLeft: 0 }}
                        >
                            {rounds.map(r => (
                                <option key={r.id} value={r.id}>{r.title} (Vòng {r.order_index})</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ height: 40, width: 1, background: 'var(--border)' }}></div>
                <div>
                    <button className="btn btn-primary" onClick={addBoard} disabled={!selectedRoundId} style={{ padding: '12px 24px' }}>
                        <Plus size={18} />
                        <span>Thêm cụm mới</span>
                    </button>
                </div>
            </div>

            {selectedRoundId && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Map size={20} className="text-accent" />
                            <span>Mạng lưới Cụm thi</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 10 }}>• {boards.length} cụm đang hoạt động</span>
                        </h3>
                    </div>

                    {boards.length === 0 ? (
                        <div className="empty-state card glass-dark">Chưa có cụm thi nào trong vòng này. Hãy nhấn nút "Thêm cụm mới" để thiết lập địa điểm thi.</div>
                    ) : (
                        <div className="card glass-dark" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <table className="data-table">
                                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px' }}>Địa danh / Tên cụm</th>
                                        <th>Đề thi áp dụng</th>
                                        <th>Trạng thái Timing</th>
                                        <th style={{ textAlign: 'right', paddingRight: 24 }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boards.map(board => (
                                        <tr key={board.id}>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{board.name}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <select
                                                        value={board.exam_id || ''}
                                                        onChange={e => updateBoard({ ...board, exam_id: e.target.value || null })}
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            padding: '8px 12px',
                                                            background: 'var(--bg-tertiary)',
                                                            borderRadius: 8,
                                                            border: '1px solid transparent',
                                                            minWidth: 180,
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <option value="">(Chưa gán đề)</option>
                                                        {exams.map(ex => (
                                                            <option key={ex.id} value={ex.id}>{ex.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    {board.timing_override ? (
                                                        <span className="badge" style={{ background: 'rgba(255, 170, 0, 0.1)', color: 'var(--warning)', border: '1px solid rgba(255, 170, 0, 0.2)', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Zap size={12} />
                                                            RIÊNG BIỆT
                                                        </span>
                                                    ) : (
                                                        <span className="badge" style={{ background: 'rgba(0, 204, 136, 0.1)', color: 'var(--accent)', border: '1px solid rgba(0, 204, 136, 0.2)', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Clock size={12} />
                                                            THEO VÒNG
                                                        </span>
                                                    )}
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ padding: '6px' }}
                                                        onClick={() => setEditingBoard(board)}
                                                        title="Cấu hình nâng cao"
                                                    >
                                                        <Settings size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleTestAttempt(board)}
                                                        title="Thi thử (Xem trước học sinh)"
                                                        style={{ color: 'var(--accent)', borderColor: 'rgba(0, 204, 136, 0.3)' }}
                                                    >
                                                        <Play size={16} />
                                                        <span>Thi thử</span>
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => deleteBoard(board.id)} style={{ padding: 8 }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {editingBoard && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card glass-dark modal-content" style={{ width: 440, padding: 32, border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Cấu hình Cụm thi</h3>
                            <button className="btn-link" onClick={() => setEditingBoard(null)} style={{ color: 'var(--text-muted)' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Tên cụm / Địa điểm</label>
                            <input
                                value={editingBoard.name}
                                onChange={e => setEditingBoard({ ...editingBoard, name: e.target.value })}
                                style={{ padding: '12px 16px', fontWeight: 600, fontSize: '1.1rem' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: 24 }}>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <input
                                    type="checkbox"
                                    checked={!!editingBoard.timing_override}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setEditingBoard({
                                                ...editingBoard,
                                                timing_override: { timingMode: 'synchronized', duration_minutes: 120, start_time: null, end_time: null }
                                            });
                                        } else {
                                            setEditingBoard({ ...editingBoard, timing_override: null });
                                        }
                                    }}
                                    style={{ width: 22, height: 22 }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Ghi đè thời gian (Override)</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sử dụng khung giờ riêng cho cụm này thay vì giờ mặc định của vòng.</div>
                                </div>
                            </label>
                        </div>

                        {editingBoard.timing_override && (
                            <div className="form-row" style={{ marginTop: 16 }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Thời lượng thi (phút)</label>
                                    <input
                                        type="number"
                                        value={editingBoard.timing_override.duration_minutes}
                                        onChange={e => setEditingBoard({
                                            ...editingBoard,
                                            timing_override: { ...editingBoard.timing_override!, duration_minutes: parseInt(e.target.value) || 0 }
                                        })}
                                        style={{ padding: '12px', fontWeight: 800, fontSize: '1.2rem', textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setEditingBoard(null)} style={{ padding: '12px 24px' }}>Hủy bỏ</button>
                            <button className="btn btn-primary" onClick={() => updateBoard(editingBoard)} style={{ padding: '12px 32px' }}>
                                <CheckCircle size={18} />
                                <span>Lưu cấu hình</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

