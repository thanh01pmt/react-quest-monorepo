/**
 * PracticeContent Component
 * 
 * Main content area wrapper for Practice mode.
 * Uses same layout structure as AppContent but with PracticeSidebar.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    QuestPlayer,
    Dialog,
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
import { exerciseToQuest, generateExerciseMapData } from '../services/ExerciseToQuestMapper';
import { saveSharedSession, getSharedSession } from '../services/SharedSessionService';
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
    const [searchParams, setSearchParams] = useSearchParams();

    // Session state
    const [session, setSession] = useState<PracticeSession | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    // Sidebar state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [showSolutionDialog, setShowSolutionDialog] = useState(false);
    const [isMapGenerating, setIsMapGenerating] = useState(false);

    // Current exercise and quest
    const currentExercise = session?.exercises[currentExerciseIndex];

    // Convert current exercise to Quest format for QuestPlayer
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
        loadExistingSession();
    }, []);

    // Helper to generate share URL
    // Handle Sharing via Firestore
    const handleShare = useCallback(async () => {
        if (!session) return;

        try {
            // Persist full session (with generated maps) to Firestore
            const shareId = await saveSharedSession(session);

            // Generate simple share URL with ID
            const params = new URLSearchParams();
            params.set('shareId', shareId);

            const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
            navigator.clipboard.writeText(url);
            alert(t('Practice.share_copied', 'Link copied to clipboard!'));
        } catch (e) {
            console.error('Failed to share session', e);
            alert('Failed to generate share link. Please try again.');
        }
    }, [session, t]);

    // Handle Shared Session Loading (Legacy + Firestore)
    useEffect(() => {
        const shareId = searchParams.get('shareId');

        // New: Load from Firestore
        if (shareId && !session) {
            async function loadShared() {
                try {
                    const sharedSession = await getSharedSession(shareId!);
                    if (sharedSession) {
                        saveSession(sharedSession);
                        setSession(sharedSession);
                        setCurrentExerciseIndex(0);
                        // Clean URL? Maybe not needed, keeps context.
                    } else {
                        console.error("Shared session not found");
                        alert("Shared session not found or expired.");
                    }
                } catch (e) {
                    console.error("Failed to load shared session", e);
                }
            }
            loadShared();
            return;
        }

        // Legacy: Load from URL config (Backwards compatibility)
        const mode = searchParams.get('mode');
        const configStr = searchParams.get('config');

        if (mode === 'share' && configStr && !session) {
            try {
                const config = JSON.parse(atob(configStr)) as PracticeConfig;
                // Force new seed if provided separately, otherwise use config's seed
                const seedParam = searchParams.get('seed');
                if (seedParam) {
                    config.seed = parseInt(seedParam, 10);
                }

                // Combine templates for generator
                // For shared sessions, strictly use BUNDLED_TEMPLATES to ensure determinism
                // This prevents local/custom templates from desynchronizing the RNG calls.
                const allTemplates = [...BUNDLED_TEMPLATES].sort((a, b) =>
                    a.metadata.id.localeCompare(b.metadata.id)
                );

                // Note: We deliberately ignore templateRegistry here because the receiver 
                // won't have the sender's local templates/registry state.

                // Auto-start session
                const generator = createPracticeGenerator(config, allTemplates);
                const newSession = generator.generateSession(config);

                saveSession(newSession);
                setSession(newSession);
                setCurrentExerciseIndex(0);

                // Clear params to avoid re-triggering on reload if not desired
                // setSearchParams({}); 
            } catch (e) {
                console.error("[PracticeContent] Failed to load shared session", e);
            }
        }
    }, [searchParams, session]); // Check on mount/params change

    // Ensure map data is generated and persisted for current exercise
    useEffect(() => {
        if (!session || !currentExercise) return;

        // If mapData is missing, generate it and update session
        if (!currentExercise.mapData) {
            setIsMapGenerating(true);

            // Use timeout to allow UI to render Loading state
            const timer = setTimeout(() => {
                try {
                    console.log(`[PracticeContent] Generating mapData for ${currentExercise.id}...`);
                    // Generate map data synchronously (but now unblocked via timeout)
                    const mapData = generateExerciseMapData(currentExercise);

                    // Update session state locally and persist
                    setSession(prevSession => {
                        if (!prevSession) return null;

                        const updatedExercises = [...prevSession.exercises];
                        // Update the specific exercise with generated mapData
                        updatedExercises[currentExerciseIndex] = {
                            ...currentExercise,
                            mapData
                        };

                        const newSession = {
                            ...prevSession,
                            exercises: updatedExercises
                        };

                        // Side effect: Save to session storage
                        saveSession(newSession);
                        return newSession;
                    });
                } catch (error) {
                    console.error("[PracticeContent] Failed to generate map data:", error);
                } finally {
                    setIsMapGenerating(false);
                }
            }, 50);

            return () => clearTimeout(timer);
        } else {
            // Map data exists, ensure loading is off
            setIsMapGenerating(false);
        }
    }, [currentExercise, currentExerciseIndex, session]); // Re-run when switching exercises

    // Handle starting a new practice session
    const handleStart = useCallback(async (config: PracticeConfig) => {
        // Combine templates for generator
        const allTemplates = [...templateRegistry.getAll()];
        BUNDLED_TEMPLATES.forEach(t => {
            if (!allTemplates.some(rt => rt.metadata.id === t.metadata.id)) {
                allTemplates.push(t);
            }
        });

        const generator = createPracticeGenerator(config, allTemplates);
        const newSession = generator.generateSession(config);

        await saveSession(newSession);
        setSession(newSession);
        setCurrentExerciseIndex(0);
    }, []);

    // Handle "Challenge Me" button
    const handleChallengeMe = useCallback(async () => {
        const categories = [
            'sequential', 'loop', 'conditional', 'function', 'variable',
            'progression', 'logic', 'memory', 'decomposition', 'search'
        ] as const;
        const shuffled = [...categories].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5); // ALWAYS 5 different categories

        const config: PracticeConfig = {
            topics: selected.map(category => ({
                category,
                enabled: true,
                questionCount: 1, // EXACTLY 1 question per category = 5 total
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
        if (result.isSuccess) {
            // Play success sound
            try {
                const audio = new Audio('/assets/maze/win.mp3');
                audio.volume = 0.4;
                audio.play().catch(() => { });
            } catch (e) { }

            if (currentExerciseIndex + 1 < session.exercises.length) {
                setTimeout(() => {
                    setCurrentExerciseIndex(currentExerciseIndex + 1);
                }, 1500); // Short delay to show success
            }
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

                <div style={{ display: session ? 'block' : 'none', width: '100%', marginTop: '12px' }}>
                    <button
                        onClick={handleShare}
                        className="practice-footer-btn share"
                        title={t('Practice.share_tooltip', 'Share this session')}
                    >
                        <span>🔗</span>
                        {!isSidebarCollapsed && <span>{t('Practice.share', 'Share')}</span>}
                    </button>

                    <button
                        onClick={() => setShowSolutionDialog(true)}
                        className="practice-footer-btn solution"
                        title={t('Practice.show_solution_tooltip', 'Show reference solution')}
                        disabled={!currentQuest?.referenceCode}
                    >
                        <span>💡</span>
                        {!isSidebarCollapsed && <span>{t('Practice.show_solution', 'Solution')}</span>}
                    </button>
                </div>
            </PracticeSidebar>

            <main className="main-content-area practice-main">
                {isMapGenerating ? (
                    <div className="practice-loading">
                        <div className="spinner"></div>
                        <p>{t('Practice.generating', 'Generating Challenge...')}</p>
                    </div>
                ) : isSessionComplete ? (
                    renderCompleteScreen()
                ) : currentQuest ? (
                    <MemoizedQuestPlayer
                        key={currentQuest.id}
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

            {/* Solution Dialog */}
            {showSolutionDialog && currentQuest?.referenceCode && (
                <Dialog
                    isOpen={true}
                    onClose={() => setShowSolutionDialog(false)}
                    title={t('Practice.solution_title', 'Reference Solution')}
                >
                    <div className="solution-content" style={{ padding: '20px', maxHeight: '60vh', overflow: 'auto' }}>
                        <p style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>
                            {t('Practice.solution_desc', 'This is one possible solution. There may be others!')}
                        </p>
                        <pre style={{
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            padding: '16px',
                            borderRadius: '8px',
                            overflowX: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            lineHeight: '1.5'
                        }}>
                            <code>{currentQuest.referenceCode}</code>
                        </pre>
                    </div>
                </Dialog>
            )}
        </div>
    );
}
