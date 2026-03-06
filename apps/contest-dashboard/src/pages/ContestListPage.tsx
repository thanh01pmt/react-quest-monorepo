import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Contest } from '../types';

export function ContestListPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        const { data, error } = await supabase
            .from('contests')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setContests(data as Contest[]);
        }
        setLoading(false);
    };

    const createContest = async () => {
        const id = `contest-${Date.now()}`;
        const now = new Date();
        const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { error } = await supabase.from('contests').insert({
            id,
            title: 'Cuộc thi mới',
            description: '',
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: 120,
            status: 'draft',
            quest_data: [],
            settings: {
                allowLanguages: ['javascript', 'python'],
                showHiddenTestCases: false,
                maxSubmissionsPerChallenge: 0,
                scoringMode: 'highest',
            },
        });

        if (!error) {
            navigate(`/contest/${id}/edit`);
        }
    };

    const deleteContest = async (id: string) => {
        if (!confirm('Xóa cuộc thi này?')) return;
        await supabase.from('contests').delete().eq('id', id);
        setContests((prev) => prev.filter((c) => c.id !== id));
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            draft: 'badge-draft',
            scheduled: 'badge-scheduled',
            active: 'badge-active',
            ended: 'badge-ended',
        };
        const labels: Record<string, string> = {
            draft: 'Nháp',
            scheduled: 'Đã lên lịch',
            active: 'Đang thi',
            ended: 'Kết thúc',
        };
        return <span className={`badge ${map[status] || ''}`}>{labels[status] || status}</span>;
    };

    if (loading) return <div className="empty-state">Đang tải...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Quản lý Cuộc thi</h1>
                <button className="btn btn-primary" onClick={createContest}>+ Tạo cuộc thi</button>
            </div>

            {contests.length === 0 ? (
                <div className="empty-state">
                    <h3>Chưa có cuộc thi nào</h3>
                    <p>Nhấn "Tạo cuộc thi" để bắt đầu</p>
                </div>
            ) : (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tên cuộc thi</th>
                                <th>Trạng thái</th>
                                <th>Thời gian bắt đầu</th>
                                <th>Thời lượng</th>
                                <th>Số câu hỏi</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contests.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <strong
                                            style={{ cursor: 'pointer', color: 'var(--accent)' }}
                                            onClick={() => navigate(`/contest/${c.id}/edit`)}
                                        >
                                            {c.title}
                                        </strong>
                                    </td>
                                    <td>{getStatusBadge(c.status)}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {new Date(c.start_time).toLocaleString('vi-VN')}
                                    </td>
                                    <td>{c.duration_minutes} phút</td>
                                    <td>{c.quest_data?.length || 0}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => navigate(`/contest/${c.id}/live`)}
                                            >
                                                📡 Live
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteContest(c.id)}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
