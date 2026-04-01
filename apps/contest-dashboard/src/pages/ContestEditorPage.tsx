import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Contest } from '../types';
import { RoundManager } from '../components/ContestManagement/RoundManager';
import { BoardManager } from '../components/ContestManagement/BoardManager';
import {
    ArrowLeft,
    Save,
    Download,
    Info,
    Layers,
    Group,
    CheckCircle,
    FileText,
    Settings,
    Users,
    Zap,
    Activity,
    TrendingUp,
    ExternalLink
} from 'lucide-react';

export function ContestEditorPage() {
    const { id } = useParams<{ id: string }>();

    const navigate = useNavigate();
    const [contest, setContest] = useState<Contest | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'rounds' | 'boards'>('info');

    useEffect(() => {
        if (id) loadContest(id);
    }, [id]);

    const loadContest = async (contestId: string) => {
        const { data } = await supabase
            .from('contests')
            .select('*')
            .eq('id', contestId)
            .single();
        if (data) setContest(data as Contest);
    };

    const handleSave = async () => {
        if (!contest) return;
        setSaving(true);
        const { error } = await supabase
            .from('contests')
            .update({
                title: contest.title,
                description: contest.description,
                status: contest.status,
                settings: contest.settings,
            })
            .eq('id', contest.id);
        setSaving(false);
        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const exportContest = async () => {
        if (!contest) return;
        setSaving(true); // Reuse saving state for export loading

        try {
            // 1. Fetch Rounds
            const { data: rounds } = await supabase
                .from('rounds')
                .select('*')
                .eq('contest_id', contest.id)
                .order('order_index');

            // 2. Fetch Boards for all rounds
            const roundIds = (rounds || []).map(r => r.id);
            const { data: boards } = await supabase
                .from('exam_boards')
                .select('*')
                .in('round_id', roundIds);

            // 3. Fetch Problems for those boards
            const boardIds = (boards || []).map(b => b.id);
            const { data: problems } = await supabase
                .from('problems')
                .select('*')
                .in('board_id', boardIds);

            const fullData = {
                ...contest,
                rounds: rounds || [],
                boards: boards || [],
                problems: problems || []
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = `full-contest-${contest.short_code || contest.id}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error('Export failed', err);
            alert('Lỗi khi xuất dữ liệu: ' + (err as any).message);
        } finally {
            setSaving(false);
        }
    };

    const updateField = <K extends keyof Contest>(key: K, value: Contest[K]) => {
        setContest((prev) => (prev ? { ...prev, [key]: value } : null));
    };

    const updateSetting = (key: string, value: any) => {
        setContest((prev) =>
            prev ? { ...prev, settings: { ...prev.settings, [key]: value } } : null
        );
    };

    if (!contest) return <div className="empty-state card">Đang tải cấu hình...</div>;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} title="Quay lại" style={{ padding: 8 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1>{contest.title || 'Cấu hình cuộc thi'}</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {saved && (
                        <span style={{ color: 'var(--success)', alignSelf: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <CheckCircle size={14} />
                            Đã lưu
                        </span>
                    )}
                    <button className="btn btn-secondary" onClick={exportContest}>
                        <Download size={18} />
                        <span>Export JSON</span>
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={18} />
                        <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                    </button>
                </div>
            </div>

            <div className="card glass" style={{ padding: 6, display: 'inline-flex', gap: 4, marginBottom: 24, background: 'var(--bg-tertiary)', border: 'none' }}>
                <button
                    className={`btn btn-sm ${activeTab === 'info' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('info')}
                    style={{ background: activeTab === 'info' ? 'var(--accent)' : 'transparent', color: activeTab === 'info' ? '#fff' : 'var(--text-secondary)', border: 'none' }}
                >
                    <Info size={16} />
                    <span>Thông tin chung</span>
                </button>
                <button
                    className={`btn btn-sm ${activeTab === 'rounds' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('rounds')}
                    style={{ background: activeTab === 'rounds' ? 'var(--accent)' : 'transparent', color: activeTab === 'rounds' ? '#fff' : 'var(--text-secondary)', border: 'none' }}
                >
                    <Layers size={16} />
                    <span>Vòng thi (Rounds)</span>
                </button>
                <button
                    className={`btn btn-sm ${activeTab === 'boards' ? 'btn-primary' : ''}`}
                    onClick={() => setActiveTab('boards')}
                    style={{ background: activeTab === 'boards' ? 'var(--accent)' : 'transparent', color: activeTab === 'boards' ? '#fff' : 'var(--text-secondary)', border: 'none' }}
                >
                    <Group size={16} />
                    <span>Cụm thi (Boards)</span>
                </button>
            </div>

            {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card glass-dark" style={{ padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <FileText size={20} className="text-secondary" />
                                <span>Thông tin cơ bản</span>
                            </h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${id}/accounts`)} title="Tài khoản">
                                    <Users size={16} />
                                    <span>Tài khoản</span>
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${id}/challenges`)} title="Bài tập">
                                    <Zap size={16} />
                                    <span>Bài tập</span>
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${id}/live`)} title="Giám sát">
                                    <Activity size={16} />
                                    <span>Giám sát</span>
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${id}/promotion`)} title="Chuyển vòng">
                                    <TrendingUp size={16} />
                                    <span>Chuyển vòng</span>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Tên cuộc thi</label>
                            <input
                                value={contest.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Ví dụ: Olympic Tin học Teky 2024"
                                style={{ fontSize: '1.1rem', fontWeight: 700, padding: 14 }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Mô tả chi tiết</label>
                            <textarea
                                value={contest.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={4}
                                placeholder="Nhập nội dung giới thiệu cuộc thi..."
                                style={{ padding: 14, lineHeight: 1.6 }}
                            />
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: 20 }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Trạng thái vận hành</label>
                                <select
                                    value={contest.status}
                                    onChange={(e) => updateField('status', e.target.value as any)}
                                    style={{ padding: 12, fontWeight: 600 }}
                                >
                                    <option value="draft">Bản nháp (Draft)</option>
                                    <option value="scheduled">Đã lên lịch</option>
                                    <option value="lobby">Phòng chờ (Lobby)</option>
                                    <option value="active">Đang diễn ra</option>
                                    <option value="ended">Đã kết thúc</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Mã tham gia (Short Code)</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        value={contest.short_code || ''}
                                        disabled
                                        style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.1em', textAlign: 'center', color: 'var(--accent)', padding: 12 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card glass-dark" style={{ padding: 32 }}>
                        <h3 style={{ marginBottom: 24, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Settings size={20} className="text-secondary" />
                            <span>Quy định & Tính điểm</span>
                        </h3>
                        <div className="form-group">
                            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Chế độ tính điểm</label>
                            <select
                                value={contest.settings.scoringMode}
                                onChange={(e) => updateSetting('scoringMode', e.target.value)}
                                style={{ padding: 12, fontWeight: 600 }}
                            >
                                <option value="highest">Lấy điểm cao nhất trong các lần nộp</option>
                                <option value="latest">Chỉ lấy điểm của lần nộp cuối cùng</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <input
                                    type="checkbox"
                                    checked={contest.settings.showHiddenTestCases}
                                    onChange={(e) => updateSetting('showHiddenTestCases', e.target.checked)}
                                    style={{ width: 22, height: 22 }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Hiển thị Hidden Test Cases</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Thí sinh có thể xem kết quả của các bộ test ẩn sau khi nộp bài.</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rounds' && (
                <div className="glass card" style={{ padding: 32 }}>
                    <RoundManager contestId={id!} />
                </div>
            )}

            {activeTab === 'boards' && (
                <div className="glass card" style={{ padding: 32 }}>
                    <BoardManager contestId={id!} />
                </div>
            )}
        </div>
    );
}


