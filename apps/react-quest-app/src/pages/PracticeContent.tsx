/**
 * PracticeContent Component
 * 
 * Main content area wrapper for Practice mode.
 * Uses same layout structure as AppContent but with PracticeSidebar.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    QuestPlayer,
    LanguageSelector,
    type Quest,
    type QuestPlayerSettings,
    type QuestCompletionResult,
} from '@repo/quest-player';
import type { PracticeConfig, PracticeSession, GeneratedExercise } from '@repo/shared-templates';
import { templateRegistry } from '@repo/shared-templates';
import { PracticeSidebar } from '../components/PracticeSidebar';
import { createPracticeGenerator } from '../services/PracticeGenerator';
import { saveSession, loadSession, getIncompleteSessions } from '../services/SessionStorage';
import { updateProgress, loadProgress } from '../services/ProgressService';
import '../App.css';

// Wrapped QuestPlayer
const MemoizedQuestPlayer = React.memo(QuestPlayer);

type AppSettings = QuestPlayerSettings & { language: string };

// Bundled templates for practice
const BUNDLED_TEMPLATES = [
    {
        metadata: {
            id: 'crystal-trail-basic',
            name: 'Crystal Trail',
            category: 'sequential' as const,
            concepts: ['sequential'],
            difficulty: 1,
            tags: ['moveForward', 'collectItem'],
            author: 'system',
            version: 1,
        },
        parameters: [{ name: '_CRYSTAL_COUNT_', displayName: 'Crystal Count', type: 'number' as const, defaultValue: 3, min: 2, max: 6 }],
        solutionCode: 'for (let i = 0; i < _CRYSTAL_COUNT_; i++) { moveForward(); collectItem(); }',
        descriptionMarkdown: 'Collect crystals along a straight path',
        rawContent: '',
    },
    {
        metadata: {
            id: 'staircase-climb',
            name: 'Staircase Climb',
            category: 'loop' as const,
            concepts: ['repeat_n'],
            difficulty: 3,
            tags: ['repeat', 'pattern'],
            author: 'system',
            version: 1,
        },
        parameters: [{ name: '_STEPS_', displayName: 'Steps', type: 'number' as const, defaultValue: 4, min: 3, max: 7 }],
        solutionCode: 'for (let i = 0; i < _STEPS_; i++) { moveForward(); jump(); }',
        descriptionMarkdown: 'Climb a staircase using repeat pattern',
        rawContent: '',
    },
    {
        metadata: {
            id: 'zigzag-path',
            name: 'Zigzag Path',
            category: 'loop' as const,
            concepts: ['repeat_n'],
            difficulty: 4,
            tags: ['repeat', 'turn'],
            author: 'system',
            version: 1,
        },
        parameters: [{ name: '_ZIG_COUNT_', displayName: 'Zig Count', type: 'number' as const, defaultValue: 3, min: 2, max: 5 }],
        solutionCode: 'for (let i = 0; i < _ZIG_COUNT_; i++) { moveForward(); turnRight(); moveForward(); turnLeft(); }',
        descriptionMarkdown: 'Navigate through a zigzag path',
        rawContent: '',
    },
    {
        metadata: {
            id: 'crystal-or-switch',
            name: 'Crystal or Switch',
            category: 'conditional' as const,
            concepts: ['if_else'],
            difficulty: 4,
            tags: ['if', 'else'],
            author: 'system',
            version: 1,
        },
        parameters: [{ name: '_PATH_LENGTH_', displayName: 'Path Length', type: 'number' as const, defaultValue: 5, min: 3, max: 8 }],
        solutionCode: 'for (let i = 0; i < _PATH_LENGTH_; i++) { if (isOnCrystal()) { collectItem(); } else { toggleSwitch(); } moveForward(); }',
        descriptionMarkdown: 'Decide based on what is in front',
        rawContent: '',
    },
    {
        metadata: {
            id: 'collect-procedure',
            name: 'Collect Procedure',
            category: 'function' as const,
            concepts: ['procedure_simple'],
            difficulty: 4,
            tags: ['procedure', 'function'],
            author: 'system',
            version: 1,
        },
        parameters: [{ name: '_COUNT_', displayName: 'Count', type: 'number' as const, defaultValue: 4, min: 3, max: 6 }],
        solutionCode: 'function collectAndMove() { collectItem(); moveForward(); } for (let i = 0; i < _COUNT_; i++) { collectAndMove(); }',
        descriptionMarkdown: 'Create a reusable procedure',
        rawContent: '',
    },
];

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
    const { t } = useTranslation();

    // Session state
    const [session, setSession] = useState<PracticeSession | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    // Sidebar state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Current exercise
    const currentExercise = session?.exercises[currentExerciseIndex];

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

    // Render exercise placeholder (will be replaced with actual QuestPlayer)
    const renderExercise = () => {
        if (!currentExercise) return renderEmptyState();

        const templateInfo = BUNDLED_TEMPLATES.find(t => t.metadata.id === currentExercise.templateId);

        return (
            <div className="practice-exercise-view">
                <div className="exercise-header">
                    <h3>{templateInfo?.metadata.name || 'Exercise'}</h3>
                    <span className="exercise-meta">
                        {'⭐'.repeat(Math.ceil(currentExercise.difficulty / 2))}
                        <span className="concept-badge">{currentExercise.concept}</span>
                    </span>
                </div>

                <div className="exercise-placeholder">
                    <p>🎮 {t('Practice.game_placeholder', 'QuestPlayer sẽ được tích hợp ở đây')}</p>
                    <p className="hint">{currentExercise.hints[0]}</p>
                </div>

                <div className="exercise-actions">
                    <button
                        className="btn-complete"
                        onClick={() => {
                            // Mock completion - will integrate with actual QuestPlayer
                            if (session) {
                                const result = {
                                    exerciseId: currentExercise.id,
                                    completed: true,
                                    success: true,
                                    timeTaken: 30,
                                    hintsUsed: 0,
                                    attempts: 1,
                                    blocksUsed: 5,
                                    xpEarned: currentExercise.difficulty * 10,
                                    completedAt: new Date(),
                                };

                                updateProgress(currentExercise.concept as any, result);

                                const updatedSession = {
                                    ...session,
                                    results: [...session.results, result],
                                    currentIndex: currentExerciseIndex + 1,
                                };

                                if (updatedSession.currentIndex >= updatedSession.exercises.length) {
                                    updatedSession.completedAt = new Date();
                                }

                                saveSession(updatedSession);
                                setSession(updatedSession);

                                if (currentExerciseIndex + 1 < session.exercises.length) {
                                    setCurrentExerciseIndex(currentExerciseIndex + 1);
                                }
                            }
                        }}
                    >
                        ✓ {t('Practice.complete_exercise', 'Hoàn thành')}
                    </button>

                    {currentExerciseIndex + 1 < (session?.exercises.length || 0) && (
                        <button
                            className="btn-skip"
                            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                        >
                            → {t('Practice.skip', 'Bỏ qua')}
                        </button>
                    )}
                </div>
            </div>
        );
    };

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
                {session && session.exercises.length > 0 ? renderExercise() : renderEmptyState()}
            </main>
        </div>
    );
}
