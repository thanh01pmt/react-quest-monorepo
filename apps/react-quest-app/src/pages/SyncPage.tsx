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

        // If "Show Solution" is OFF, we verify if we need to clear the answer.
        // Usually builder sends the "answer" in startBlocks.
        if (!showSolution && finalQuest.blocklyConfig?.startBlocks) {
            // Check if startBlocks contains more than just maze_start to consider it a "solution"
            // For now, if toggle is OFF, we force a simple empty start block
            return {
                ...finalQuest,
                blocklyConfig: {
                    ...finalQuest.blocklyConfig,
                    // Only reset start blocks, keep toolboxes
                    startBlocks: '<xml><block type="maze_start" deletable="false" movable="false"><statement name="DO"></statement></block></xml>'
                }
            };
        }

        return finalQuest;
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
            <div className="sync-player-wrapper">
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
                    questData={questForPlayer}
                    initialSettings={settings}
                    onSettingsChange={onSettingsChange}
                    onQuestComplete={handleQuestComplete}
                />
            </div>
        );
    }

    // Show sync page
    return (
        <div className="sync-page">
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
