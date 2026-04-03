import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './LeaderboardPage.css';

interface LeaderboardEntry {
    rank: number;
    full_name: string;
    school: string;
    grade: string;
    score: number;
    total_score: number;
    penalty_minutes: number;
    submitted_at: string;
}

export default function LeaderboardPage() {
    const { contestId } = useParams<{ contestId: string }>();
    const [problemId, setProblemId] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [problems, setProblems] = useState<{ id: string, title: string }[]>([]);

    useEffect(() => {
        // Fetch problems for this contest (assuming we use contestId to filter)
        // For now, let's assume contestId is the problemId for a single-problem leaderboard
        if (contestId) {
            setProblemId(contestId);
        }
    }, [contestId]);

    const fetchLeaderboard = async () => {
        if (!problemId) return;
        setIsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${apiUrl}/leaderboard/${problemId}`);
            if (!res.ok) throw new Error('Không thể tải bảng xếp hạng');
            const data = await res.json();
            setLeaderboard(data.leaderboard);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 15000); // 15s auto-refresh
        return () => clearInterval(interval);
    }, [problemId]);

    return (
        <div className="leaderboard-page">
            <header className="leaderboard-header">
                <h1>Bảng Xếp Hạng</h1>
                <div className="problem-selector">
                    <label>Chọn đề bài:</label>
                    <select value={problemId} onChange={(e) => setProblemId(e.target.value)}>
                        <option value={contestId}>{contestId}</option>
                        {/* More problems can be listed here if available */}
                    </select>
                </div>
            </header>

            {error && <div className="error-alert">{error}</div>}

            <div className="table-container">
                {isLoading && leaderboard.length === 0 ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : (
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Hạng</th>
                                <th>Thí sinh</th>
                                <th>Trường/Lớp</th>
                                <th>Điểm</th>
                                <th>Thời gian (P)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, idx) => (
                                <tr key={idx} className={idx < 3 ? `top-rank rank-${entry.rank}` : ''}>
                                    <td className="rank-cell">
                                        {entry.rank === 1 && '🥇'}
                                        {entry.rank === 2 && '🥈'}
                                        {entry.rank === 3 && '🥉'}
                                        {entry.rank > 3 && entry.rank}
                                    </td>
                                    <td className="name-cell">
                                        <div className="full-name">{entry.full_name}</div>
                                    </td>
                                    <td className="school-cell">
                                        <div>{entry.school}</div>
                                        <div className="grade-badge">Lớp {entry.grade}</div>
                                    </td>
                                    <td className="score-cell">
                                        <span className="score-value">{entry.score}</span>
                                        <span className="total-divider">/</span>
                                        <span className="total-score">{entry.total_score}</span>
                                    </td>
                                    <td className="penalty-cell">
                                        {entry.penalty_minutes}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {leaderboard.length === 0 && !isLoading && (
                    <div className="empty-state">Chưa có lượt nộp bài nào được ghi nhận.</div>
                )}
            </div>

            <footer className="leaderboard-footer">
                <p>Tự động cập nhật mỗi 15 giây • Cập nhật lúc: {new Date().toLocaleTimeString()}</p>
            </footer>
        </div>
    );
}
