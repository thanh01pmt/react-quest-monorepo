/**
 * PracticeContent Component
 * 
 * Main content area wrapper for Practice mode.
 * Uses same layout structure as AppContent but with PracticeSidebar.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    QuestPlayer,
    LanguageSelector,
    type Quest,
    type QuestPlayerSettings,
    type QuestCompletionResult,
} from '@repo/quest-player';
import type { PracticeConfig, PracticeSession, GeneratedExercise, ConceptCategory } from '@repo/shared-templates';
import { templateRegistry, BUNDLED_TEMPLATES } from '@repo/shared-templates';
import { PracticeSidebar } from '../components/PracticeSidebar';
import { createPracticeGenerator } from '../services/PracticeGenerator';
import { saveSession, getIncompleteSessions } from '../services/SessionStorage';
import { updateProgress } from '../services/ProgressService';
import { exerciseToQuest } from '../services/ExerciseToQuestMapper';
import '../App.css';

// Wrapped QuestPlayer
const MemoizedQuestPlayer = React.memo(QuestPlayer);

type AppSettings = QuestPlayerSettings & { language: string };



interface PracticeContentProps {
    settings: AppSettings;
    onSettingsChange: (settings: QuestPlayerSettings) => void;
    onLanguageChange: (lang: string) => void;
}

export function PracticeContent({
    settings,
    onSettingsChange,
    onLanguageChange,
}: PracticeContentProps) {
    const { t, i18n } = useTranslation();

    // Session state
    const [session, setSession] = useState<PracticeSession | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    // Sidebar state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Current exercise and quest
    const currentExercise = session?.exercises[currentExerciseIndex];

    // Convert current exercise to Quest format for QuestPlayer
    const currentQuest: Quest | null = useMemo(() => {
        if (!currentExercise) return null;
        return exerciseToQuest(currentExercise, currentExerciseIndex);
    }, [currentExercise, currentExerciseIndex]);

    // Initialize templates
    useEffect(() => {
        for (const template of BUNDLED_TEMPLATES) {
            templateRegistry.register(template);
        }
    }, []);

    // Load incomplete session on mount
    useEffect(() => {
        async function loadExistingSession() {
            const incomplete = await getIncompleteSessions();
            if (incomplete.length > 0) {
                setSession(incomplete[0]);
                setCurrentExerciseIndex(incomplete[0].currentIndex);
            }
        }
        loadExistingSession();
    }, []);

    // Handle starting a new practice session
    const handleStart = useCallback(async (config: PracticeConfig) => {
        const generator = createPracticeGenerator(config, templateRegistry.getAll());
        const newSession = generator.generateSession(config);

        await saveSession(newSession);
        setSession(newSession);
        setCurrentExerciseIndex(0);
    }, []);

    // Handle "Challenge Me" button
    const handleChallengeMe = useCallback(async () => {
        const categories = ['sequential', 'loop', 'conditional', 'function', 'variable'] as const;
        const shuffled = [...categories].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 2 + Math.floor(Math.random() * 3));

        const config: PracticeConfig = {
            topics: selected.map(category => ({
                category,
                enabled: true,
                questionCount: 2 + Math.floor(Math.random() * 3),
                difficultyLevel: (['easy', 'medium', 'hard'] as const)[Math.floor(Math.random() * 3)],
            })),
            mode: 'challenge_me',
            seed: Date.now(),
        };

        await handleStart(config);
    }, [handleStart]);

    // Handle exercise selection
    const handleExerciseSelect = useCallback((index: number) => {
        setCurrentExerciseIndex(index);
    }, []);

    // Handle QuestPlayer completion
    const handleQuestComplete = useCallback((result: QuestCompletionResult) => {
        if (!session || !currentExercise) return;

        const exerciseResult = {
            exerciseId: currentExercise.id,
            completed: true,
            success: result.isSuccess,
            timeTaken: result.metrics?.totalTime ? result.metrics.totalTime / 1000 : 30,
            hintsUsed: 0,
            attempts: (result.metrics?.runCount || 0) + (result.metrics?.debugCount || 0),
            blocksUsed: result.unitCount || 5,
            xpEarned: result.isSuccess ? currentExercise.difficulty * 10 * (result.stars || 1) : 0,
            completedAt: new Date(),
        };

        updateProgress(currentExercise.concept as ConceptCategory, exerciseResult);

        const updatedSession = {
            ...session,
            results: [...session.results, exerciseResult],
            currentIndex: currentExerciseIndex + 1,
        };

        if (updatedSession.currentIndex >= updatedSession.exercises.length) {
            updatedSession.completedAt = new Date();
        }

        saveSession(updatedSession);
        setSession(updatedSession);

        // Move to next exercise if available
        if (result.isSuccess && currentExerciseIndex + 1 < session.exercises.length) {
            setTimeout(() => {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
            }, 1500); // Short delay to show success
        }
    }, [session, currentExercise, currentExerciseIndex]);

    // Render empty state
    const renderEmptyState = () => (
        <div className="practice-empty-state">
            <h2>📚 {t('Practice.title', 'Chế độ Luyện tập')}</h2>
            <p>{t('Practice.empty_message', 'Chọn chủ đề và bấm "Bắt đầu" để luyện tập')}</p>
            <div className="practice-info">
                <div className="info-item">
                    <span className="icon">🎯</span>
                    <span>{t('Practice.info_topics', 'Chọn chủ đề bạn muốn luyện tập')}</span>
                </div>
                <div className="info-item">
                    <span className="icon">⚙️</span>
                    <span>{t('Practice.info_config', 'Điều chỉnh số câu và độ khó')}</span>
                </div>
                <div className="info-item">
                    <span className="icon">🎲</span>
                    <span>{t('Practice.info_challenge', 'Hoặc thử "Thách thức tôi!" để random')}</span>
                </div>
            </div>
        </div>
    );

    // Render session complete screen
    const renderCompleteScreen = () => {
        if (!session) return null;

        const totalXP = session.results.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
        const successCount = session.results.filter(r => r.success).length;

        return (
            <div className="practice-complete-screen">
                <h2>🎉 {t('Practice.complete', 'Hoàn thành!')}</h2>
                <div className="complete-stats">
                    <div className="stat-item">
                        <span className="stat-value">{successCount}/{session.exercises.length}</span>
                        <span className="stat-label">{t('Practice.correct', 'Đúng')}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">+{totalXP}</span>
                        <span className="stat-label">XP</span>
                    </div>
                </div>
                <div className="complete-actions">
                    <button
                        className="btn-start"
                        onClick={() => {
                            setSession(null);
                            setCurrentExerciseIndex(0);
                        }}
                    >
                        {t('Practice.practice_again', 'Luyện tập tiếp')}
                    </button>
                </div>
            </div>
        );
    };

    // Check if session is complete
    const isSessionComplete = session && session.completedAt;

    return (
        <div className="app-container">
            <PracticeSidebar
                session={session}
                currentExerciseIndex={currentExerciseIndex}
                onStart={handleStart}
                onChallengeMe={handleChallengeMe}
                onExerciseSelect={handleExerciseSelect}
                isCollapsed={isSidebarCollapsed}
                isExpanded={isSidebarExpanded}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onExpandToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
            >
                <LanguageSelector
                    language={settings.language}
                    onChange={onLanguageChange}
                    onIconClick={isSidebarCollapsed ? () => setIsSidebarCollapsed(false) : undefined}
                />
            </PracticeSidebar>

            <main className="main-content-area practice-main">
                {isSessionComplete ? (
                    renderCompleteScreen()
                ) : currentQuest ? (
                    <MemoizedQuestPlayer
                        key={currentQuest.id}  // Force re-mount on exercise change
                        isStandalone={false}
                        language={i18n.language}
                        questData={currentQuest}
                        initialSettings={settings}
                        onQuestComplete={handleQuestComplete}
                        onSettingsChange={onSettingsChange}
                    />
                ) : (
                    renderEmptyState()
                )}
            </main>
        </div>
    );
}
