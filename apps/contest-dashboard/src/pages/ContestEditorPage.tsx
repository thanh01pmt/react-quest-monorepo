import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Contest } from '../types';

export function ContestEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contest, setContest] = useState<Contest | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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
                start_time: contest.start_time,
                end_time: contest.end_time,
                duration_minutes: contest.duration_minutes,
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

    const updateField = <K extends keyof Contest>(key: K, value: Contest[K]) => {
        setContest((prev) => (prev ? { ...prev, [key]: value } : null));
    };

    const updateSetting = (key: string, value: any) => {
        setContest((prev) =>
            prev ? { ...prev, settings: { ...prev.settings, [key]: value } } : null
        );
    };

    if (!contest) return <div className="empty-state">Đang tải...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Cấu hình cuộc thi</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {saved && <span style={{ color: 'var(--success)', alignSelf: 'center', fontSize: '0.85rem' }}>✓ Đã lưu</span>}
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Đang lưu...' : '💾 Lưu'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="form-group">
                    <label>Tên cuộc thi</label>
                    <input
                        value={contest.title}
                        onChange={(e) => updateField('title', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                        value={contest.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Thời gian bắt đầu</label>
                        <input
                            type="datetime-local"
                            value={contest.start_time?.slice(0, 16)}
                            onChange={(e) => updateField('start_time', new Date(e.target.value).toISOString())}
                        />
                    </div>
                    <div className="form-group">
                        <label>Thời gian kết thúc</label>
                        <input
                            type="datetime-local"
                            value={contest.end_time?.slice(0, 16)}
                            onChange={(e) => updateField('end_time', new Date(e.target.value).toISOString())}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Thời lượng (phút)</label>
                        <input
                            type="number"
                            value={contest.duration_minutes}
                            onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 120)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select
                            value={contest.status}
                            onChange={(e) => updateField('status', e.target.value as Contest['status'])}
                        >
                            <option value="draft">Nháp</option>
                            <option value="scheduled">Đã lên lịch</option>
                            <option value="active">Đang thi</option>
                            <option value="ended">Kết thúc</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: 16 }}>⚙️ Cài đặt</h3>

                <div className="form-group">
                    <label>Chế độ tính điểm</label>
                    <select
                        value={contest.settings.scoringMode}
                        onChange={(e) => updateSetting('scoringMode', e.target.value)}
                    >
                        <option value="highest">Điểm cao nhất</option>
                        <option value="latest">Lần nộp cuối</option>
                    </select>
                </div>

                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={contest.settings.showHiddenTestCases}
                            onChange={(e) => updateSetting('showHiddenTestCases', e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <span>Cho thí sinh xem hidden test cases</span>
                    </label>
                </div>

                <div style={{ marginTop: 20 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/contest/${id}/challenges`)}
                    >
                        🧩 Quản lý đề thi →
                    </button>
                </div>
            </div>
        </div>
    );
}
