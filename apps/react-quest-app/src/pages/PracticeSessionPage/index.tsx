/**
 * PracticeSessionPage Component
 * 
 * Page for playing practice exercises. Shows current exercise and tracks progress.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PracticeSession, PracticeConfig, GeneratedExercise } from '@repo/shared-templates';
import { templateRegistry } from '@repo/shared-templates';
import { createPracticeGenerator } from '../../services/PracticeGenerator';
import { saveSession, loadSession, getIncompleteSessions } from '../../services/SessionStorage';
import { updateProgress, loadProgress, getProgressSummary } from '../../services/ProgressService';
import './PracticeSessionPage.css';

// Bundled templates (will be loaded from package)
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

export function PracticeSessionPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [session, setSession] = useState<PracticeSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize session
    useEffect(() => {
        async function initSession() {
            try {
                // Check for existing incomplete session
                const incompleteSessions = await getIncompleteSessions();
                if (incompleteSessions.length > 0) {
                    // Resume latest incomplete session
                    setSession(incompleteSessions[0]);
                    setIsLoading(false);
                    return;
                }

                // Load config from session storage
                const configJson = sessionStorage.getItem('practiceConfig');
                if (!configJson) {
                    setError('No practice configuration found');
                    setIsLoading(false);
                    return;
                }

                const config: PracticeConfig = JSON.parse(configJson);

                // Initialize template registry with bundled templates
                for (const template of BUNDLED_TEMPLATES) {
                    templateRegistry.register(template);
                }

                // Generate new session
                const generator = createPracticeGenerator(config, templateRegistry.getAll());
                const newSession = generator.generateSession(config);

                // Save session
                await saveSession(newSession);
                setSession(newSession);

                // Clear config from session storage
                sessionStorage.removeItem('practiceConfig');
            } catch (e) {
                console.error('[PracticeSession] Init error:', e);
                setError('Failed to initialize practice session');
            } finally {
                setIsLoading(false);
            }
        }

        initSession();
    }, []);

    // Current exercise
    const currentExercise = session?.exercises[session.currentIndex];
    const progress = session ? (session.currentIndex / session.exercises.length) * 100 : 0;

    // Handle exercise completion (mock for now)
    const handleCompleteExercise = useCallback(async (success: boolean) => {
        if (!session || !currentExercise) return;

        const result = {
            exerciseId: currentExercise.id,
            completed: true,
            success,
            timeTaken: 30, // Mock time
            hintsUsed: 0,
            attempts: 1,
            blocksUsed: 5,
            xpEarned: success ? currentExercise.difficulty * 10 : 5,
            completedAt: new Date(),
        };

        // Update progress
        updateProgress(currentExercise.concept as any, result);

        // Update session
        const updatedSession = {
            ...session,
            results: [...session.results, result],
            currentIndex: session.currentIndex + 1,
        };

        // Check if complete
        if (updatedSession.currentIndex >= updatedSession.exercises.length) {
            updatedSession.completedAt = new Date();
        }

        await saveSession(updatedSession);
        setSession(updatedSession);
    }, [session, currentExercise]);

    // Handle exit
    const handleExit = useCallback(() => {
        navigate('/practice');
    }, [navigate]);

    // Loading state
    if (isLoading) {
        return (
            <div className="practice-session-page">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>{t('Practice.loading', 'Đang tải...')}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !session) {
        return (
            <div className="practice-session-page">
                <div className="error-container">
                    <h2>⚠️ {t('Practice.error', 'Lỗi')}</h2>
                    <p>{error || 'Session not found'}</p>
                    <button onClick={() => navigate('/practice')}>
                        {t('Practice.back', 'Quay lại')}
                    </button>
                </div>
            </div>
        );
    }

    // Session complete
    if (session.completedAt) {
        const summary = getProgressSummary(loadProgress());
        const totalXP = session.results.reduce((sum, r) => sum + r.xpEarned, 0);
        const successCount = session.results.filter(r => r.success).length;

        return (
            <div className="practice-session-page">
                <div className="session-complete">
                    <h1>🎉 {t('Practice.complete', 'Hoàn thành!')}</h1>

                    <div className="complete-stats">
                        <div className="stat-card">
                            <span className="stat-icon">⭐</span>
                            <span className="stat-value">+{totalXP}</span>
                            <span className="stat-label">XP</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-icon">✅</span>
                            <span className="stat-value">{successCount}/{session.exercises.length}</span>
                            <span className="stat-label">{t('Practice.correct', 'Đúng')}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-icon">📈</span>
                            <span className="stat-value">Lv.{summary.totalLevel}</span>
                            <span className="stat-label">{t('Practice.level', 'Cấp độ')}</span>
                        </div>
                    </div>

                    <div className="complete-actions">
                        <button className="btn-primary" onClick={() => navigate('/practice')}>
                            {t('Practice.practice_again', 'Luyện tập tiếp')}
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/')}>
                            {t('Practice.back_home', 'Về trang chủ')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active exercise view
    return (
        <div className="practice-session-page">
            {/* Header with progress */}
            <header className="session-header">
                <button className="btn-exit" onClick={handleExit}>
                    ✕
                </button>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-text">
                    {session.currentIndex + 1} / {session.exercises.length}
                </span>
            </header>

            {/* Exercise info */}
            {currentExercise && (
                <div className="exercise-container">
                    <div className="exercise-info">
                        <h2 className="exercise-title">
                            {BUNDLED_TEMPLATES.find(t => t.metadata.id === currentExercise.templateId)?.metadata.name || 'Exercise'}
                        </h2>
                        <div className="exercise-meta">
                            <span className="difficulty">
                                {'⭐'.repeat(Math.ceil(currentExercise.difficulty / 2))}
                            </span>
                            <span className="concept">
                                {currentExercise.concept}
                            </span>
                        </div>
                    </div>

                    {/* Placeholder for actual game - Will integrate with QuestPlayer */}
                    <div className="game-placeholder">
                        <p>🎮 {t('Practice.game_placeholder', 'Phần game sẽ được tích hợp ở đây')}</p>
                        <p className="hint">{currentExercise.hints[0]}</p>
                    </div>

                    {/* Mock controls */}
                    <div className="exercise-controls">
                        <button
                            className="btn-success"
                            onClick={() => handleCompleteExercise(true)}
                        >
                            ✓ {t('Practice.mark_correct', 'Đánh dấu đúng')}
                        </button>
                        <button
                            className="btn-skip"
                            onClick={() => handleCompleteExercise(false)}
                        >
                            → {t('Practice.skip', 'Bỏ qua')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PracticeSessionPage;
