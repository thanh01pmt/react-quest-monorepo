/**
 * ContestSidebar
 *
 * Left sidebar for the exam room: countdown timer, challenge list with status, submit button.
 */

import React, { useState, useEffect } from 'react';
import { useContest } from '../../contexts/ContestContext';
import { getSubmissionHistory } from '../../services/SupabaseContestService';
import type { ChallengeStatus } from '../../types/contest';
import './ContestSidebar.css';

const STATUS_ICONS: Record<ChallengeStatus, string> = {
    pending: '⬜',
    attempted: '🟡',
    passed: '✅',
    failed: '🔴',
};

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ContestSidebar() {
    const { state, selectChallenge, lockExam, remainingSeconds } = useContest();
    const { challenges, currentChallengeIndex, totalScore, isLocked, contest } = state;
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const activeChallenge = challenges[currentChallengeIndex];

    useEffect(() => {
        if (activeChallenge && contest) {
            setIsLoadingHistory(true);
            getSubmissionHistory(activeChallenge.questId, contest.id)
                .then(setHistory)
                .catch(console.error)
                .finally(() => setIsLoadingHistory(false));
        }
    }, [activeChallenge?.questId, contest?.id]);

    const isTimeCritical = remainingSeconds !== null && remainingSeconds <= 300; // 5 minutes

    const handleSubmitAll = () => {
        if (window.confirm('Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ không thể chỉnh sửa thêm.')) {
            lockExam();
        }
    };

    return (
        <aside className="contest-sidebar">
            {/* Test Mode Indicator */}
            {state.participant?.isTest && (
                <div className="test-mode-badge" title="Bài thi này sẽ không được tính vào bảng xếp hạng">
                    🧪 Chế độ thi thử
                </div>
            )}

            {/* Timer */}
            <div className={`contest-timer ${isTimeCritical ? 'timer-critical' : ''}`}>
                <div className="timer-label">⏱ Thời gian còn lại</div>
                <div className="timer-value">
                    {remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}
                </div>
            </div>

            {/* Score */}
            <div className="contest-score">
                <span className="score-label">Điểm</span>
                <span className="score-value">{totalScore} / {challenges.length * 100}</span>
            </div>

            {/* Challenge List */}
            <div className="challenge-list">
                <div className="challenge-list-header">Danh sách bài thi</div>
                {challenges.map((ch, index) => (
                    <button
                        key={ch.questId}
                        className={`challenge-item ${index === currentChallengeIndex ? 'active' : ''} ${ch.status}`}
                        onClick={() => selectChallenge(index)}
                        disabled={isLocked}
                    >
                        <span className="challenge-number">{index + 1}</span>
                        <span className="challenge-status-icon">{STATUS_ICONS[ch.status]}</span>
                        <span className="challenge-title">{ch.title}</span>
                        {ch.bestScore > 0 && (
                            <span className="challenge-score">{ch.bestScore}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Active Challenge History */}
            {activeChallenge && history.length > 0 && (
                <div className="sidebar-history-section">
                    <div className="sidebar-history-header">
                        Lần nộp ({history.length})
                    </div>
                    <div className="sidebar-history-list">
                        {history.slice(0, 5).map((sub) => (
                            <div key={sub.id} className="sidebar-history-item">
                                <span className={`history-status-dot ${sub.score >= 100 ? 'passed' : 'attempted'}`} />
                                <span className="history-time">
                                    {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="history-score">{sub.score}đ</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="contest-sidebar-footer">
                <button
                    className="submit-all-btn"
                    onClick={handleSubmitAll}
                    disabled={isLocked}
                >
                    {isLocked ? '🔒 Đã kết thúc' : '📤 Nộp & Kết thúc'}
                </button>
            </div>
        </aside>
    );
}

export default ContestSidebar;
