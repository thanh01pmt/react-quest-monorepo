/**
 * ExamRoom
 *
 * The actual contest environment. Combines ContestSidebar with QuestPlayer.
 * Quests are loaded dynamically from the ContestContext.
 */

import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuestPlayer } from '@repo/quest-player';
import { useContest } from '../../contexts/ContestContext';
import { ContestSidebar } from '../../components/ContestSidebar';
import './ExamRoom.css';

export function ExamRoom() {
    const { contestId } = useParams<{ contestId: string }>();
    const navigate = useNavigate();
    const { state, loadContest, selectChallenge, submitChallenge, saveCurrentCode } = useContest();

    const {
        contest,
        participant,
        challenges,
        currentChallengeIndex,
        isLocked,
        loading,
    } = state;

    // 1. Load contest if not loaded (e.g. direct URL access)
    useEffect(() => {
        if (!contest && contestId) {
            loadContest(contestId);
        }
    }, [contestId, contest, loadContest]);

    // 2. Route guard: redirect to entrance if not authenticated or no participant record
    useEffect(() => {
        if (!loading && contest && !participant) {
            navigate(`/contest/${contestId}`, { replace: true });
        }
    }, [loading, contest, participant, contestId, navigate]);

    // 3. Get current quest data
    const currentQuest = useMemo(() => {
        if (!contest || challenges.length === 0) return null;
        return contest.questData[currentChallengeIndex];
    }, [contest, challenges, currentChallengeIndex]);

    // 4. Handle challenge completion (submission)
    const handleQuestComplete = async (result: any) => {
        if (isLocked || !currentQuest) return;

        // The QuestPlayer returns QuestCompletionResult
        // which contains isSuccess, finalState.testResults, userCode, etc.
        const { userCode, finalState } = result;
        const testResults = finalState.testResults || [];

        await submitChallenge(
            currentQuest.id,
            userCode,
            'javascript', // Default to JS for now, can be extended
            testResults
        );
    };

    // ── Render ────────────────────────────────────────────────────────

    if (loading || !contest || !participant) {
        return (
            <div className="exam-loading-screen">
                <div className="loader-spinner"></div>
                <p>Đang chuẩn bị phòng thi...</p>
            </div>
        );
    }

    return (
        <div className={`exam-room-container ${isLocked ? 'exam-locked' : ''}`}>
            <ContestSidebar />

            <main className="exam-main-content">
                {currentQuest ? (
                    <QuestPlayer
                        key={`${currentQuest.id}-${currentChallengeIndex}`} // Force remount on switch
                        isStandalone={false}
                        language="vi"
                        questData={currentQuest}
                        initialSettings={{
                            displayLanguage: 'javascript',
                            colorSchemeMode: 'dark',
                            toolboxMode: 'default'
                        }}
                        onQuestComplete={handleQuestComplete}
                        onSettingsChange={() => { }}
                    />
                ) : (
                    <div className="no-quest-selected">
                        <p>Vui lòng chọn một thử thách từ danh sách bên trái.</p>
                    </div>
                )}

                {isLocked && (
                    <div className="exam-overlay-locked">
                        <div className="locked-message">
                            <h2>🔒 Phòng thi đã đóng</h2>
                            <p>Bạn đã hoàn thành bài thi hoặc thời gian đã hết.</p>
                            <div className="final-score-box">
                                <span className="label">Tổng điểm của bạn:</span>
                                <span className="value">{state.totalScore}</span>
                            </div>
                            <button
                                className="exit-btn"
                                onClick={() => navigate(`/contest/${contestId}`, { replace: true })}
                            >
                                Quay lại Trang chủ Cuộc thi
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ExamRoom;
