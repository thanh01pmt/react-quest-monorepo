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
    getPublicContestInfo,
    resolveSupabaseContestSession,
    saveSupabaseSubmission,
    submitToJudgeApi,
    submitSb3File,
    getSubmissionById,
    updateSupabaseParticipantStatus,
    getSupabaseSubmissions,
    calculateScore,
    joinContest, // Added
} from '../services/SupabaseContestService';
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
    /** Join as guest for test mode */
    joinAsGuest: (displayName: string) => Promise<void>; // Added
    /** Switch to a different challenge */
    selectChallenge: (index: number) => void;
    /** Save code for the current challenge (when switching) */
    saveCurrentCode: (code: string) => void;
    /** Submit a challenge result */
    submitChallenge: (questId: string, code: string, language: string) => Promise<void>;
    /** Submit a Scratch (.sb3) file. isDryRun=true will not save as official submission. */
    submitSb3: (questId: string, file: File, isDryRun?: boolean) => Promise<any>;
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
    const { user, signInAnonymously } = useAuth(); // Added signInAnonymously
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const stateRef = useRef(state);
    const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Use effect to cleanup on unmount
    useEffect(() => {
        return () => {
            pollingRefs.current.forEach(interval => clearInterval(interval));
            pollingRefs.current.clear();
        };
    }, []);

    // ── Lock Exam ─────────────────────────────────────────────────────

    const lockExam = useCallback(async () => {
        if (state.participant?.id) {
            await updateSupabaseParticipantStatus(state.participant.id, 'submitted');
        }
        setState((s) => ({ ...s, isLocked: true }));
        if (timerRef.current) clearInterval(timerRef.current);
    }, [state.participant]);

    // ── Timer ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!state.participant?.deadline || state.isLocked || state.participant?.isTest) {
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
        const submissions = await getSupabaseSubmissions(contestId, participantId);
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
            if (user) {
                // Try resolving active session if user logged in
                const session = await resolveSupabaseContestSession(contestId);
                if (session) {
                    setState((s) => ({
                        ...s,
                        contest: session.contest,
                        participant: session.participant,
                        challenges: session.contest.questData.map((q: any) => ({
                            questId: q.id,
                            title: q.titleKey || q.id,
                            status: 'pending',
                            bestScore: 0,
                            attempts: 0,
                        })),
                        loading: false,
                    }));

                    // Restore challenge states from submissions
                    await restoreChallengeStates(session.contest.id, session.participant.id!);
                    return;
                }
            }

            // Fallback to generic metadata
            const publicInfo = await getPublicContestInfo(contestId);
            if (publicInfo) {
                setState((s) => ({
                    ...s,
                    // Use type any here since metadata is partial Config
                    contest: { 
                        id: publicInfo.id, 
                        title: publicInfo.title, 
                        description: publicInfo.description, 
                        status: publicInfo.status 
                    } as any,
                    loading: false,
                }));
                return;
            }

            setState((s) => ({ ...s, loading: false, error: 'Cuộc thi không tồn tại.' }));
        } catch (error: any) {
            setState((s) => ({
                ...s,
                loading: false,
                error: error.message || 'Lỗi tải cuộc thi',
            }));
        }
    }, [restoreChallengeStates, user]);

    // ── Register Participant ──────────────────────────────────────────

    const registerParticipant = useCallback(
        async (data: {
            username: string;
            displayName: string;
            email: string;
            phone: string;
        }) => {
            if (!state.contest || !user) return;

            if (state.participant) {
                // In pre-created flow, the participant record already exists. 
                // We just mark it as 'active' locally.
                const updated = {
                    ...state.participant,
                    displayName: data.displayName || state.participant.displayName,
                    email: data.email || state.participant.email,
                };
                setState(s => ({ ...s, participant: updated }));
                return;
            }
            
            console.warn("[ContestContext] registerParticipant called but no pre-existing participant found.");
        },
        [state.contest, user, state.participant]
    );

    // ── Join As Guest ──────────────────────────────────────────────────

    const joinAsGuest = useCallback(
        async (displayName: string) => {
            if (!state.contest) return;

            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                // 1. Sign in anonymously if not already
                if (!user) {
                    await signInAnonymously();
                }

                // 2. Participate in contest via RPC
                const res = await joinContest(state.contest.id, displayName, true);
                if (!res) throw new Error('Không thể tham gia cuộc thi thử');

                // 3. Reload everything to populate participant session
                await loadContest(state.contest.id);
            } catch (error: any) {
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: error.message || 'Lỗi tham gia thi thử',
                }));
                throw error;
            }
        },
        [state.contest, user, signInAnonymously, loadContest]
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
        ) => {
            if (!state.contest || !state.participant || state.isLocked) return;

            // Submit to headless judge API (Express)
            const result = await submitToJudgeApi({
                contestId: state.contest.id,
                participantId: state.participant.id!,
                questId,
                code,
                language,
                testResults: [], // Managed by backend
                score: 0,        // Managed by backend
                submittedAt: new Date().toISOString(),
                attempt: 0,      // Managed by backend
            });

            if (!result) return;

            const { score } = result;
            const challengeIndex = state.challenges.findIndex((ch) => ch.questId === questId);
            const attemptCount = challengeIndex >= 0 ? (state.challenges[challengeIndex].attempts || 0) + 1 : 1;

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
                        attempts: attemptCount,
                        status: newBestScore >= 100 ? 'passed' : newBestScore > 0 ? 'attempted' : 'failed',
                    };
                }

                const totalScore = challenges.reduce((sum, ch) => sum + ch.bestScore, 0);
                return { ...s, challenges, totalScore };
            });
        },
        [state.contest, state.participant, state.isLocked, state.challenges]
    );

    // ── Submit Scratch (.sb3) ────────────────────────────────────────

    const submitSb3 = useCallback(
        async (questId: string, file: File, isDryRun: boolean = false) => {
            if (!state.contest || !state.participant || state.isLocked) return;

            const res = await submitSb3File(
                state.participant.id!,
                state.contest.id,
                questId,
                file,
                isDryRun
            );

            if (!res) return;

            const { submissionId } = res;
            
            // If it's a dry run, we don't necessarily update the global score,
            // but we might want to return the result to the caller (ScratchUploader)
            // for immediate feedback.

            // Clear existing polling for this quest if any
            if (pollingRefs.current.has(questId)) {
                clearInterval(pollingRefs.current.get(questId)!);
            }

            // Start polling for result
            const pollInterval = setInterval(async () => {
                const sub = await getSubmissionById(submissionId);
                if (sub && sub.score !== null && sub.score !== undefined && sub.testResults && sub.testResults.length > 0) {
                    clearInterval(pollInterval);
                    pollingRefs.current.delete(questId);
                    
                    // Update locally
                    const challengeIndex = stateRef.current.challenges.findIndex((ch) => ch.questId === questId);
                    setState((s) => {
                        const challenges = [...s.challenges];
                        if (challengeIndex >= 0) {
                            const current = challenges[challengeIndex];
                            const newBestScore = s.contest?.settings.scoringMode === 'highest'
                                ? Math.max(current.bestScore, sub.score)
                                : sub.score;
                            
                            challenges[challengeIndex] = {
                                ...current,
                                bestScore: newBestScore,
                                attempts: (current.attempts || 0) + 1,
                                status: newBestScore >= 100 ? 'passed' : newBestScore > 0 ? 'attempted' : 'failed',
                            };
                        }
                        const totalScore = challenges.reduce((sum, ch) => sum + ch.bestScore, 0);
                        return { ...s, challenges, totalScore };
                    });
                }
            }, 3000); // Poll every 3s

            pollingRefs.current.set(questId, pollInterval);

            // Auto-clear after 2 minutes to avoid infinite loops if judge fails
            setTimeout(() => {
                if (pollingRefs.current.get(questId) === pollInterval) {
                    clearInterval(pollInterval);
                    pollingRefs.current.delete(questId);
                }
            }, 120000);
        },
        [state.contest, state.participant, state.isLocked, state.challenges]
    );

    // ── Value ─────────────────────────────────────────────────────────

    const value: ContestContextType = {
        state,
        loadContest,
        registerParticipant,
        joinAsGuest,
        selectChallenge,
        saveCurrentCode,
        submitChallenge,
        submitSb3,
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
