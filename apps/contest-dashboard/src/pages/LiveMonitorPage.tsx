import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Participant, LeaderboardEntry } from '../types';

export function LiveMonitorPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        if (contestId) {
            loadData(contestId);
            // Subscribe to new submissions via Supabase Realtime
            const channel = supabase
                .channel(`contest-${contestId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'submissions',
                        filter: `contest_id=eq.${contestId}`,
                    },
                    (_payload) => {
                        // Refresh leaderboard on new submission
                        loadLeaderboard(contestId);
                        setLastUpdate(new Date());
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [contestId]);

    const loadData = async (cid: string) => {
        await Promise.all([loadParticipants(cid), loadLeaderboard(cid)]);
    };

    const loadParticipants = async (cid: string) => {
        const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('contest_id', cid)
            .order('joined_at', { ascending: true });
        if (data) setParticipants(data as Participant[]);
    };

    const loadLeaderboard = async (cid: string) => {
        const { data } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('contest_id', cid)
            .order('total_score', { ascending: false });
        if (data) setLeaderboard(data as LeaderboardEntry[]);
    };

    const extendTime = async (participantId: string) => {
        const minutes = prompt('Thêm bao nhiêu phút?', '15');
        if (!minutes) return;
        const participant = participants.find((p) => p.id === participantId);
        if (!participant) return;

        const newDeadline = new Date(
            new Date(participant.deadline).getTime() + parseInt(minutes) * 60 * 1000
        );

        await supabase
            .from('participants')
            .update({ deadline: newDeadline.toISOString() })
            .eq('id', participantId);

        loadParticipants(contestId!);
    };

    const forceSubmit = async (participantId: string) => {
        if (!confirm('Buộc nộp bài thí sinh này?')) return;
        await supabase
            .from('participants')
            .update({ status: 'submitted' })
            .eq('id', participantId);
        loadParticipants(contestId!);
    };

    const activeCount = participants.filter((p) => p.status === 'active').length;
    const submittedCount = participants.filter((p) => p.status === 'submitted').length;

    const exportCSV = () => {
        const headers = ['Rank', 'Username', 'Display Name', 'Total Score', 'Challenges Solved', 'Status'];
        const rows = leaderboard.map((entry, i) => [
            i + 1,
            entry.username,
            entry.display_name,
            entry.total_score,
            entry.challenges_solved,
            entry.status,
        ]);
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `results-${contestId}.csv`;
        a.click();
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>📡 Giám sát trực tiếp</h1>
                    {lastUpdate && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => loadData(contestId!)}>
                        🔄 Refresh
                    </button>
                    <button className="btn btn-primary" onClick={exportCSV}>
                        📥 Xuất CSV
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-label">Tổng thí sinh</div>
                    <div className="stat-value">{participants.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Đang thi</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{activeCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Đã nộp</div>
                    <div className="stat-value" style={{ color: 'var(--accent)' }}>{submittedCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Tổng submissions</div>
                    <div className="stat-value">{leaderboard.reduce((sum, e) => sum + (e.challenges_solved || 0), 0)}</div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 16 }}>🏆 Bảng xếp hạng</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Thí sinh</th>
                            <th>Username</th>
                            <th>Điểm</th>
                            <th>Bài giải</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, i) => (
                            <tr key={entry.participant_id}>
                                <td style={{ fontWeight: 700, color: i < 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                    {i + 1}
                                </td>
                                <td><strong>{entry.display_name}</strong></td>
                                <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                    {entry.username}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{entry.total_score}</td>
                                <td>{entry.challenges_solved}</td>
                                <td>
                                    <span className={`badge badge-${entry.status === 'active' ? 'active' : entry.status === 'submitted' ? 'scheduled' : 'ended'}`}>
                                        {entry.status === 'active' ? 'Đang thi' : entry.status === 'submitted' ? 'Đã nộp' : entry.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => extendTime(entry.participant_id)}>
                                            ⏰ +T
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => forceSubmit(entry.participant_id)}>
                                            🔒
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
