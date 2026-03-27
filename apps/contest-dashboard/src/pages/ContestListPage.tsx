import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Contest } from '../types';
import { Activity, Trash2, Plus, Download, Layout } from 'lucide-react';
import { JsonImportModal } from '../components/ContestManagement/JsonImportModal';

export function ContestListPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        const { data, error } = await supabase
            .from('contests')
            .select(`
                *,
                rounds (
                    id,
                    exam_boards (id)
                )
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const formatted = data.map((c: any) => {
                const rounds = c.rounds || [];
                const boardCount = rounds.reduce((sum: number, r: any) => sum + (r.exam_boards?.length || 0), 0);
                return {
                    ...c,
                    roundCount: rounds.length,
                    boardCount: boardCount
                };
            });
            setContests(formatted as any);
        } else if (error) {
            console.error("Error fetching contests:", error);
        }
        setLoading(false);
    };

    const createContest = async () => {
        const id = `contest-${Date.now()}`;
        const { error } = await supabase.from('contests').insert({
            id,
            title: 'Cuộc thi mới',
            description: '',
            status: 'draft',
            settings: {
                allowLanguages: ['javascript', 'python'],
                showHiddenTestCases: false,
                maxSubmissionsPerChallenge: 0,
                scoringMode: 'highest'
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
            lobby: 'badge-lobby',
            active: 'badge-active',
            ended: 'badge-ended',
        };
        const labels: Record<string, string> = {
            draft: 'Nháp',
            scheduled: 'Đã lên lịch',
            lobby: 'Phòng chờ',
            active: 'Đang thi',
            ended: 'Kết thúc',
        };

        return <span className={`badge ${map[status] || ''}`}>{labels[status] || status}</span>;
    };

    if (loading) return <div className="empty-state">Đang tải...</div>;

    return (
        <div>
            <div className="page-header">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Layout size={28} />
                    <span>Quản lý Cuộc thi</span>
                </h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                        <Download size={18} />
                        <span>Import JSON</span>
                    </button>
                    <button className="btn btn-primary" onClick={createContest}>
                        <Plus size={18} />
                        <span>Tạo cuộc thi</span>
                    </button>
                </div>
            </div>

            {showImport && (
                <JsonImportModal
                    onClose={() => setShowImport(false)}
                    onSuccess={loadContests}
                    context={{}}
                />
            )}

            {contests.length === 0 ? (
                <div className="empty-state card">
                    <h3>Chưa có cuộc thi nào</h3>
                    <p>Nhấn "Tạo cuộc thi" để bắt đầu thiết lập hệ thống contest đa cấp bậc.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead style={{ background: 'var(--bg-tertiary)' }}>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>Tên cuộc thi</th>
                                <th>Mã tham gia</th>
                                <th>Trạng thái</th>
                                <th>Số vòng</th>
                                <th>Số cụm</th>
                                <th>Ngày tạo</th>
                                <th style={{ textAlign: 'right', paddingRight: 24 }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contests.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ paddingLeft: 24 }}>
                                        <strong
                                            style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '1rem' }}
                                            onClick={() => navigate(`/contest/${c.id}/edit`)}
                                        >
                                            {c.title}
                                        </strong>
                                    </td>
                                    <td>
                                        <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em' }}>
                                            {c.short_code || 'None'}
                                        </code>
                                    </td>
                                    <td>{getStatusBadge(c.status)}</td>
                                    <td style={{ fontWeight: 600 }}>{(c as any).roundCount || 0}</td>
                                    <td style={{ fontWeight: 600 }}>{(c as any).boardCount || 0}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {new Date(c.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => navigate(`/contest/${c.id}/live`)}
                                                style={{ padding: '6px 12px' }}
                                            >
                                                <Activity size={14} />
                                                <span>Live</span>
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteContest(c.id)}
                                                style={{ padding: '6px' }}
                                            >
                                                <Trash2 size={14} />
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

