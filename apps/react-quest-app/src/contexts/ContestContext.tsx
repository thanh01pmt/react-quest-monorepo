/**
 * ContestContext
 *
 * React context that holds the current contest state, participant info,
 * and challenge progress. Used by EntrancePage and ExamRoom.
 * Supports react-router-dom <Outlet /> for layout routing.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import type {
    ContestConfig,
    ContestParticipant,
    ContestState,
    ChallengeState,
    ContestSubmission,
} from '../types/contest';
import {
    getContest,
    findParticipant,
    createParticipant,
    saveSubmission,
    getParticipantSubmissions,
    calculateScore,
    updateParticipantStatus,
} from '../services/ContestService';
import { useAuth } from './AuthContext';

// ─── Context Type ───────────────────────────────────────────────────

interface ContestContextType {
    state: ContestState;
    /** Load a contest by ID */
    loadContest: (contestId: string) => Promise<void>;
    /** Register participant after login */
    registerParticipant: (data: {
        username: string;
        displayName: string;
        email: string;
        phone: string;
    }) => Promise<void>;
    /** Switch to a different challenge */
    selectChallenge: (index: number) => void;
    /** Save code for the current challenge (when switching) */
    saveCurrentCode: (code: string) => void;
    /** Submit a challenge result */
    submitChallenge: (questId: string, code: string, language: string, testResults: ContestSubmission['testResults']) => Promise<void>;
    /** Lock the exam (final submission or timeout) */
    lockExam: () => Promise<void>;
    /** Remaining time in seconds (null if not started) */
    remainingSeconds: number | null;
}

const ContestContext = createContext<ContestContextType | null>(null);

export function useContest() {
    const context = useContext(ContestContext);
    if (!context) {
        throw new Error('useContest must be used within a ContestProvider');
    }
    return context;
}

// ─── Provider ───────────────────────────────────────────────────────

const INITIAL_STATE: ContestState = {
    contest: null,
    participant: null,
    challenges: [],
    currentChallengeIndex: 0,
    totalScore: 0,
    isLocked: false,
    loading: true,
    error: null,
};

export function ContestProvider({ children }: { children?: React.ReactNode }) {
    const [state, setState] = useState<ContestState>(INITIAL_STATE);
    const { user } = useAuth();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    // ── Lock Exam ─────────────────────────────────────────────────────

    const lockExam = useCallback(async () => {
        if (state.participant?.id) {
            await updateParticipantStatus(state.participant.id, 'submitted');
        }
        setState((s) => ({ ...s, isLocked: true }));
        if (timerRef.current) clearInterval(timerRef.current);
    }, [state.participant]);

    // ── Timer ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!state.participant?.deadline || state.isLocked) {
            setRemainingSeconds(null);
            return;
        }

        const deadline = new Date(state.participant.deadline).getTime();

        const tick = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
            setRemainingSeconds(remaining);

            if (remaining <= 0) {
                // Auto-submit on timeout
                lockExam();
            }
        };

        tick(); // initial
        timerRef.current = setInterval(tick, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [state.participant?.deadline, state.isLocked, lockExam]);

    // ── Restore States ────────────────────────────────────────────────

    const restoreChallengeStates = useCallback(async (contestId: string, participantId: string) => {
        const submissions = await getParticipantSubmissions(contestId, participantId);
        if (submissions.length === 0) return;

        setState((s) => {
            const updatedChallenges = s.challenges.map((ch) => {
                const questSubmissions = submissions.filter((sub) => sub.questId === ch.questId);
                if (questSubmissions.length === 0) return ch;

                const bestScore = Math.max(...questSubmissions.map((sub) => sub.score));
                return {
                    ...ch,
                    status: bestScore >= 100 ? 'passed' : bestScore > 0 ? 'attempted' : 'failed',
                    bestScore,
                    attempts: questSubmissions.length,
                } as ChallengeState;
            });

            const totalScore = updatedChallenges.reduce((sum, ch) => sum + ch.bestScore, 0);
            return { ...s, challenges: updatedChallenges, totalScore };
        });
    }, []);

    // ── Load Contest ──────────────────────────────────────────────────

    const loadContest = useCallback(async (contestId: string) => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const contest = await getContest(contestId);
            if (!contest) {
                setState((s) => ({ ...s, loading: false, error: 'Không tìm thấy cuộc thi' }));
                return;
            }

            // Build challenge states from quest data
            const challenges: ChallengeState[] = contest.questData.map((quest) => ({
                questId: quest.id,
                title: quest.titleKey || quest.id,
                status: 'pending',
                bestScore: 0,
                attempts: 0,
            }));

            setState((s) => ({
                ...s,
                contest,
                challenges,
                loading: false,
            }));

            // If user is already logged in, try to find existing participant
            if (user) {
                const existing = await findParticipant(contestId, user.uid);
                if (existing) {
                    setState((s) => ({ ...s, participant: existing }));
                    // Restore challenge states from submissions
                    await restoreChallengeStates(contestId, existing.id!);
                }
            }
        } catch (error: any) {
            setState((s) => ({
                ...s,
                loading: false,
                error: error.message || 'Lỗi tải cuộc thi',
            }));
        }
    }, [user, restoreChallengeStates]);

    // ── Register Participant ──────────────────────────────────────────

    const registerParticipant = useCallback(
        async (data: {
            username: string;
            displayName: string;
            email: string;
            phone: string;
        }) => {
            if (!state.contest || !user) return;

            const now = new Date();
            const deadline = new Date(now.getTime() + state.contest.durationMinutes * 60 * 1000);

            // Also cap deadline at contest endTime
            const contestEnd = new Date(state.contest.endTime);
            const effectiveDeadline = deadline < contestEnd ? deadline : contestEnd;

            const participant = await createParticipant({
                contestId: state.contest.id,
                uid: user.uid,
                username: data.username,
                displayName: data.displayName,
                email: data.email,
                phone: data.phone,
                joinedAt: now.toISOString(),
                deadline: effectiveDeadline.toISOString(),
                status: 'active',
            });

            setState((s) => ({ ...s, participant }));
        },
        [state.contest, user]
    );

    // ── Select Challenge ──────────────────────────────────────────────

    const selectChallenge = useCallback((index: number) => {
        setState((s) => ({ ...s, currentChallengeIndex: index }));
    }, []);

    // ── Save Code ─────────────────────────────────────────────────────

    const saveCurrentCode = useCallback((code: string) => {
        setState((s) => {
            const challenges = [...s.challenges];
            challenges[s.currentChallengeIndex] = {
                ...challenges[s.currentChallengeIndex],
                savedCode: code,
            };
            return { ...s, challenges };
        });
    }, []);

    // ── Submit Challenge ──────────────────────────────────────────────

    const submitChallenge = useCallback(
        async (
            questId: string,
            code: string,
            language: string,
            testResults: ContestSubmission['testResults']
        ) => {
            if (!state.contest || !state.participant || state.isLocked) return;

            const score = calculateScore(testResults);
            const challengeIndex = state.challenges.findIndex((ch) => ch.questId === questId);
            const attempt = challengeIndex >= 0 ? state.challenges[challengeIndex].attempts + 1 : 1;

            // Save to Firestore
            await saveSubmission({
                contestId: state.contest.id,
                participantId: state.participant.id!,
                questId,
                code,
                language,
                testResults,
                score,
                submittedAt: new Date().toISOString(),
                attempt,
            });

            // Update local state
            setState((s) => {
                const challenges = [...s.challenges];
                if (challengeIndex >= 0) {
                    const current = challenges[challengeIndex];
                    const newBestScore =
                        s.contest?.settings.scoringMode === 'highest'
                            ? Math.max(current.bestScore, score)
                            : score;
                    challenges[challengeIndex] = {
                        ...current,
                        bestScore: newBestScore,
                        attempts: attempt,
                        status: newBestScore >= 100 ? 'passed' : newBestScore > 0 ? 'attempted' : 'failed',
                    };
                }

                const totalScore = challenges.reduce((sum, ch) => sum + ch.bestScore, 0);
                return { ...s, challenges, totalScore };
            });
        },
        [state.contest, state.participant, state.isLocked, state.challenges]
    );

    // ── Value ─────────────────────────────────────────────────────────

    const value: ContestContextType = {
        state,
        loadContest,
        registerParticipant,
        selectChallenge,
        saveCurrentCode,
        submitChallenge,
        lockExam,
        remainingSeconds,
    };

    return (
        <ContestContext.Provider value={value}>
            {children || <Outlet />}
        </ContestContext.Provider>
    );
}

export default ContestContext;
