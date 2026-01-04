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
import { QuestPlayer, type Quest, type QuestPlayerSettings } from '@repo/quest-player';
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
        return {
            ...quest,
            // Ensure gameType defaults to 'maze' if missing, to prevent "type undefined" error
            gameType: (quest.gameType as string) || 'maze'
        } as unknown as Quest;
    }, [quest]);

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

    const handleQuestComplete = () => {
        // Return to sync page after completion
        setIsPlaying(false);
    };

    // If playing, show the QuestPlayer
    if (isPlaying && questForPlayer) {
        return (
            <div className="sync-player-wrapper">
                <div className="sync-player-header">
                    <button className="sync-back-btn" onClick={handleBack}>
                        ← Back to Sync
                    </button>
                    <span className="sync-badge">Builder Mode</span>
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
