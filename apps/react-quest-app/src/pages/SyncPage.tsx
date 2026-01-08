/**
 * SyncPage - Dedicated page for Builder-to-Player quest sync
 * 
 * Route: /sync
 * - Loads quest from URL param (?quest=<encoded>) or localStorage
 * - Displays quest info and Play/Back buttons
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadBuilderQuest, clearBuilderQuest, type QuestData } from '../services/QuestLoaderService';
import { QuestPlayer, type Quest, type QuestPlayerSettings, Dialog, type QuestCompletionResult, type QuestMetrics } from '@repo/quest-player';
import { convertSolutionToXml } from '@repo/academic-map-generator';
import './SyncPage.css';

interface SyncPageProps {
    settings: QuestPlayerSettings;
    onSettingsChange: (settings: QuestPlayerSettings) => void;
}

export function SyncPage({ settings, onSettingsChange }: SyncPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [quest, setQuest] = useState<QuestData | null>(null);
    const [source, setSource] = useState<'url' | 'localStorage' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Toggle for showing the sample solution (if provided by builder)
    const [showSolution, setShowSolution] = useState(false);

    // Dialog state for completion

    // Dialog state for completion
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        stars?: number;
    }>({ isOpen: false, title: '', message: '' });

    // Compute theme class for container based on settings
    const themeClass = settings.colorSchemeMode === 'dark'
        ? 'theme-dark'
        : settings.colorSchemeMode === 'light'
            ? 'theme-light'
            : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'theme-dark' : 'theme-light');

    // Apply theme to document.body for CSS variables to cascade properly (mirrors App.tsx)
    useEffect(() => {
        const applyTheme = (isDarkMode: boolean) => {
            const newColorScheme = isDarkMode ? 'dark' : 'light';
            document.body.classList.remove('theme-light', 'theme-dark');
            document.body.classList.add(`theme-${newColorScheme}`);
        };

        const handleChange = (e: MediaQueryListEvent) => {
            if (settings.colorSchemeMode === 'auto') {
                applyTheme(e.matches);
            }
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const effectiveIsDark = settings.colorSchemeMode === 'auto' ? mediaQuery.matches : settings.colorSchemeMode === 'dark';
        applyTheme(effectiveIsDark);

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [settings.colorSchemeMode]);

    // Load quest on mount
    useEffect(() => {
        try {
            const { quest: loadedQuest, source: loadedSource } = loadBuilderQuest();

            if (loadedQuest) {
                setQuest(loadedQuest);
                setSource(loadedSource);
                setError(null);
            } else {
                setError('No quest available. Send a quest from Builder first.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load quest');
        }
    }, [searchParams]);

    // Convert QuestData to Quest type for QuestPlayer
    const questForPlayer = useMemo(() => {
        if (!quest) return null;

        const finalQuest = {
            ...quest,
            // Ensure gameType defaults to 'maze' if missing
            gameType: (quest.gameType as string) || 'maze'
        } as unknown as Quest;

        // VALIDATION: Check if gameConfig is valid to prevent Player crash
        const gc = (finalQuest as any).gameConfig;
        if (!gc) {
            setError("Invalid Quest: Missing game configuration.");
            return null;
        }
        if (!gc.players || gc.players.length === 0 || !gc.players[0]?.start) {
            setError("Invalid Quest: Missing Player Start position. Please place a Start object in builder.");
            return null;
        }
        if (!gc.finish) {
            setError("Invalid Quest: Missing Finish position. Please place a Finish object in builder.");
            return null;
        }

        // If "Show Solution" is ON, override startBlocks with the full solution
        if (showSolution) {
            // FIX: Generate full XML solution from structuredSolution if available
            if ((finalQuest as any).solution?.structuredSolution) {
                const solutionXml = convertSolutionToXml((finalQuest as any).solution.structuredSolution);
                return {
                    ...finalQuest,
                    blocklyConfig: {
                        ...finalQuest.blocklyConfig,
                        startBlocks: solutionXml
                    }
                };
            }
            // If no structured solution, fallback to existing startBlocks (might be answer or empty)
            return finalQuest;
        }

        // If "Show Solution" is OFF:
        // - Use user's custom startBlocks if they exist (from "Edit Start Blocks" in Builder)
        // - Otherwise, provide empty maze_start block (student starts from scratch)
        if (finalQuest.blocklyConfig?.startBlocks) {
            // User has created custom startBlocks - USE THEM!
            return finalQuest;
        }

        // No startBlocks from builder - provide default empty start block
        return {
            ...finalQuest,
            blocklyConfig: {
                ...finalQuest.blocklyConfig,
                startBlocks: '<xml><block type="maze_start" deletable="false" movable="false"><statement name="DO"></statement></block></xml>'
            }
        };
    }, [quest, showSolution]);

    const handlePlay = () => {
        setIsPlaying(true);
    };

    const handleBack = () => {
        if (isPlaying) {
            // Return to sync page (not home) for quick iteration
            setIsPlaying(false);
        } else {
            // Clear and go home
            clearBuilderQuest();
            navigate('/');
        }
    };

    const handleQuestComplete = (result: QuestCompletionResult) => {
        if (result.isSuccess) {
            const message = (
                <div style={{ textAlign: 'center' }}>
                    <div className="stars-container" style={{ fontSize: '24px', color: '#fbbf24', marginBottom: '10px' }}>
                        {[...Array(3)].map((_, i) => (
                            <i key={i} className={`star ${i < (result.stars || 1) ? 'fas fa-star' : 'far fa-star'}`}></i>
                        ))}
                    </div>
                    <p>{t('Games.dialogGoodJob', { count: result.unitCount, unit: result.unitLabel })}</p>
                    <div style={{ marginTop: '15px' }}>
                        <button
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                            onClick={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                        >
                            Play Again
                        </button>
                        <button
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#e5e7eb',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                setDialogState(prev => ({ ...prev, isOpen: false }));
                                setIsPlaying(false);
                            }}
                        >
                            Exit
                        </button>
                    </div>
                </div>
            );

            setDialogState({
                isOpen: true,
                title: 'Quest Completed! 🎉',
                message: message,
                stars: result.stars
            });
        }
    };

    // If playing, show the QuestPlayer
    if (isPlaying && questForPlayer) {
        return (
            <div className={`sync-player-wrapper ${themeClass}`}>
                <Dialog
                    isOpen={dialogState.isOpen}
                    title={dialogState.title}
                    onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                >
                    {dialogState.message}
                </Dialog>
                <div className="sync-player-header">
                    <button className="sync-back-btn" onClick={handleBack}>
                        ← Back to Sync
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label className="sync-toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0c0d0', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showSolution}
                                onChange={(e) => setShowSolution(e.target.checked)}
                                style={{ accentColor: '#8b5cf6' }}
                            />
                            👁️ Show Answer
                        </label>
                        <span className="sync-badge">Builder Mode</span>
                    </div>
                </div>
                <QuestPlayer
                    isStandalone={false}
                    language={(settings as any).language || 'en'}
                    questData={questForPlayer as Quest}
                    initialSettings={settings}
                    onSettingsChange={onSettingsChange}
                    onQuestComplete={handleQuestComplete}
                />
            </div>
        );
    }

    // Show sync page
    return (
        <div className={`sync-page ${themeClass}`}>
            <div className="sync-container">
                <div className="sync-header">
                    <h1>🔗 Builder Sync</h1>
                    <span className="sync-mode-badge">
                        {source === 'url' ? '🌐 URL Mode' : source === 'localStorage' ? '📦 Local Mode' : '⚠️ No Source'}
                    </span>
                </div>

                {error ? (
                    <div className="sync-error">
                        <p>{error}</p>
                        <button className="sync-btn secondary" onClick={() => navigate('/')}>
                            Back to Home
                        </button>
                    </div>
                ) : quest ? (
                    <div className="sync-content">
                        <div className="quest-info-card">
                            <h2>{(quest as any).id || 'Untitled Quest'}</h2>
                            <div className="quest-meta">
                                <span className="meta-item">
                                    <strong>Level:</strong> {(quest as any).level || 'N/A'}
                                </span>
                                <span className="meta-item">
                                    <strong>Type:</strong> {(quest as any).gameType || 'maze'}
                                </span>
                                {(quest as any).gameConfig?.blocks && (
                                    <span className="meta-item">
                                        <strong>Blocks:</strong> {(quest as any).gameConfig.blocks.length}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="sync-actions">
                            <button className="sync-btn primary" onClick={handlePlay}>
                                ▶ Play Quest
                            </button>
                            <button className="sync-btn secondary" onClick={handleBack}>
                                ← Back to Home
                            </button>
                        </div>

                        <p className="sync-hint">
                            💡 After playing, you'll return here to iterate quickly.
                        </p>
                    </div>
                ) : (
                    <div className="sync-loading">
                        Loading quest...
                    </div>
                )}
            </div>
        </div>
    );
}

export default SyncPage;
