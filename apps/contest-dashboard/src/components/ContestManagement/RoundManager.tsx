import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Round, ContestStatus, TimingMode, PromotionMode } from '../../types';
import {
    Layout,
    Plus,
    Clock,
    Edit2,
    Trash2,
    Settings,
    X,
    Save,
    Folder,
    Calendar,
    CheckCircle2,
    Timer,
    GitMerge
} from 'lucide-react';

// Helper: chuyển ISO string về "YYYY-MM-DDTHH:MM" cho input[type=datetime-local]
function toLocalInput(iso: string | null | undefined): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        // format to local datetime string (YYYY-MM-DDTHH:MM)
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ''; }
}

// Helper: chuyển local datetime string về UTC ISO string
function fromLocalInput(val: string): string | null {
    if (!val) return null;
    return new Date(val).toISOString();
}

interface RoundManagerProps {
    contestId: string;
}

export function RoundManager({ contestId }: RoundManagerProps) {
    const [rounds, setRounds] = useState<Round[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRound, setEditingRound] = useState<Round | null>(null);

    useEffect(() => {
        loadRounds();
    }, [contestId]);

    const loadRounds = async () => {
        const { data, error } = await supabase
            .from('rounds')
            .select('*')
            .eq('contest_id', contestId)
            .order('order_index', { ascending: true });

        if (!error && data) setRounds(data as Round[]);
        setLoading(false);
    };

    const addRound = async () => {
        const newRound: Partial<Round> = {
            contest_id: contestId,
            title: `Vòng ${rounds.length + 1}`,
            order_index: rounds.length + 1,
            status: 'draft',
            timing: {
                timingMode: 'synchronized',
                duration_minutes: 120,
                start_time: null,
                end_time: null
            },
            promotion_config: {
                mode: 'manual',
                autoRule: null
            }
        };

        const { data, error } = await supabase.from('rounds').insert(newRound).select().single();
        if (!error && data) {
            setRounds([...rounds, data as Round]);
            setEditingRound(data as Round);
        }
    };

    const updateRound = async (round: Round) => {
        const { error } = await supabase
            .from('rounds')
            .update(round)
            .eq('id', round.id);

        if (!error) {
            setRounds(rounds.map(r => r.id === round.id ? round : r));
            setEditingRound(null);
        }
    };

    const deleteRound = async (id: string) => {
        if (!confirm('Xóa vòng thi này?')) return;
        const { error } = await supabase.from('rounds').delete().eq('id', id);
        if (!error) setRounds(rounds.filter(r => r.id !== id));
    };

    const exportRound = (round: Round) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(round, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `round-${round.order_index}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    if (loading) return <div className="empty-state card">Đang tải danh sách vòng...</div>;

    return (
        <div className="round-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem' }}>
                    <Layout size={20} className="text-accent" />
                    <span>Hành trình Vòng thi</span>
                </h3>
                <button className="btn btn-primary" onClick={addRound}>
                    <Plus size={18} />
                    <span>Thêm vòng mới</span>
                </button>
            </div>

            {rounds.length === 0 ? (
                <div className="empty-state card" style={{ padding: 40, textAlign: 'center' }}>
                    <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
                    <h3>Chưa có vòng thi nào</h3>
                    <p>Nhấn "Thêm vòng mới" để bắt đầu phân cấp cuộc thi.</p>
                </div>
            ) : (
                <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {rounds.map((round) => (
                        <div key={round.id} className="card glass-dark" style={{ border: '1px solid var(--border)', position: 'relative', padding: 24 }}>
                            {/* Status badge */}
                            <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                                    background: round.status === 'active' ? 'rgba(34,197,94,0.15)' : round.status === 'scheduled' ? 'rgba(99,102,241,0.15)' : round.status === 'ended' ? 'rgba(107,114,128,0.2)' : 'rgba(234,179,8,0.15)',
                                    color: round.status === 'active' ? '#22c55e' : round.status === 'scheduled' ? '#818cf8' : round.status === 'ended' ? '#6b7280' : '#eab308'
                                }}>
                                    {round.status === 'active' ? '🟢 Đang TN' : round.status === 'scheduled' ? '📅 Lên lịch' : round.status === 'ended' ? '✅ Kết thúc' : '🔒 Nháp'}
                                </span>
                            </div>
                            <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Phase {round.order_index}
                            </div>
                            <div style={{ padding: '16px 0 12px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>{round.title}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <Timer size={14} className="text-accent" />
                                        <span>{round.timing.duration_minutes || 120} phút</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <Clock size={14} className="text-accent" />
                                        <span>{round.timing.timingMode === 'synchronized' ? 'Đồng bộ' : 'Từng cụm'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <GitMerge size={14} className="text-secondary" />
                                        <span>{round.promotion_config.mode === 'manual' ? 'Duyệt tay' : 'Tự động'}</span>
                                    </div>
                                </div>
                                {round.timing.start_time && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        <Calendar size={12} />
                                        <span>{new Date(round.timing.start_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        {round.timing.end_time && (
                                            <span>→ {new Date(round.timing.end_time).toLocaleString('vi-VN', { timeStyle: 'short' })}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setEditingRound(round)}>
                                    <Edit2 size={14} />
                                    <span>Cấu hình</span>
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteRound(round.id)} style={{ padding: 8 }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingRound && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card glass-dark" style={{ width: 500, padding: 32, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontWeight: 800 }}>
                                <Settings size={20} className="text-accent" />
                                <span>Cấu hình Vòng thi</span>
                            </h3>
                            <button onClick={() => setEditingRound(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Tên vòng thi</label>
                            <input
                                value={editingRound.title}
                                onChange={(e) => setEditingRound({ ...editingRound, title: e.target.value })}
                                style={{ padding: 12, fontWeight: 700, width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* ── Trạng thái vòng ── */}
                        <div className="form-row" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                    <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    Trạng thái vòng
                                </label>
                                <select
                                    value={editingRound.status || 'draft'}
                                    onChange={(e) => setEditingRound({ ...editingRound, status: e.target.value as ContestStatus })}
                                    style={{ padding: 12, fontWeight: 700, width: '100%' }}
                                >
                                    <option value="draft">🔒 Nháp (ẩn với HS)</option>
                                    <option value="scheduled">📅 Đã lên lịch (HS vào phòng chờ)</option>
                                    <option value="active">🟢 Đang diễn ra</option>
                                    <option value="ended">✅ Đã kết thúc</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Chế độ Timing</label>
                                <select
                                    value={editingRound.timing.timingMode}
                                    onChange={(e) => setEditingRound({
                                        ...editingRound,
                                        timing: { ...editingRound.timing, timingMode: e.target.value as TimingMode }
                                    })}
                                    style={{ padding: 12, fontWeight: 600, width: '100%' }}
                                >
                                    <option value="synchronized">Đồng bộ tất cả</option>
                                    <option value="per_board">Từng cụm riêng</option>
                                </select>
                            </div>
                        </div>

                        {/* ── Thời lượng làm bài ── */}
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                <Timer size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                Thời lượng làm bài (phút)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={editingRound.timing.duration_minutes || 120}
                                onChange={(e) => setEditingRound({
                                    ...editingRound,
                                    timing: { ...editingRound.timing, duration_minutes: parseInt(e.target.value) || 0 }
                                })}
                                style={{ padding: 12, fontWeight: 800, fontSize: '1.3rem', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* ── Giờ bắt đầu / kết thúc (chỉ hiện khi synchronized) ── */}
                        {editingRound.timing.timingMode === 'synchronized' && (
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                        <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                        Giờ bắt đầu
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={toLocalInput(editingRound.timing.start_time)}
                                        onChange={(e) => setEditingRound({
                                            ...editingRound,
                                            timing: { ...editingRound.timing, start_time: fromLocalInput(e.target.value) }
                                        })}
                                        style={{ padding: 10, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                        <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                        Giờ kết thúc
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={toLocalInput(editingRound.timing.end_time)}
                                        onChange={(e) => setEditingRound({
                                            ...editingRound,
                                            timing: { ...editingRound.timing, end_time: fromLocalInput(e.target.value) }
                                        })}
                                        style={{ padding: 10, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Promotion mode ── */}
                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Chế độ Promotion</label>
                            <select
                                value={editingRound.promotion_config.mode}
                                onChange={(e) => setEditingRound({
                                    ...editingRound,
                                    promotion_config: { ...editingRound.promotion_config, mode: e.target.value as PromotionMode }
                                })}
                                style={{ padding: 12, fontWeight: 600, width: '100%' }}
                            >
                                <option value="manual">Duyệt thủ công</option>
                                <option value="auto">Tự động đẩy</option>
                            </select>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 24, display: 'flex', gap: 12 }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: 12 }}
                                onClick={() => updateRound(editingRound)}
                            >
                                <Save size={18} />
                                <span>Lưu cấu hình</span>
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => setEditingRound(null)}>
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
