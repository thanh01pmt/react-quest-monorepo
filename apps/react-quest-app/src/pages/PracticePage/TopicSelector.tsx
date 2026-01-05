/**
 * TopicSelector Component
 * 
 * Individual topic configuration card with toggle, count, and difficulty.
 */

import { useTranslation } from 'react-i18next';
import type { TopicConfig, DifficultyLevel } from '@repo/shared-templates';
import { DifficultySlider } from './DifficultySlider';
import './TopicSelector.css';

interface TopicSelectorProps {
    topic: TopicConfig;
    info: { icon: string; nameKey: string };
    onToggle: () => void;
    onQuestionCountChange: (count: number) => void;
    onDifficultyChange: (level: DifficultyLevel) => void;
}

export function TopicSelector({
    topic,
    info,
    onToggle,
    onQuestionCountChange,
    onDifficultyChange,
}: TopicSelectorProps) {
    const { t } = useTranslation();

    return (
        <div className={`topic-card ${topic.enabled ? 'enabled' : ''}`}>
            {/* Header with toggle */}
            <div className="topic-header" onClick={onToggle}>
                <div className="topic-checkbox">
                    <input
                        type="checkbox"
                        checked={topic.enabled}
                        onChange={onToggle}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <span className="topic-icon">{info.icon}</span>
                <span className="topic-name">{t(info.nameKey, topic.category)}</span>
            </div>

            {/* Settings (visible when enabled) */}
            {topic.enabled && (
                <div className="topic-settings">
                    {/* Question count */}
                    <div className="setting-row">
                        <label className="setting-label">
                            {t('Practice.question_count', 'Số câu')}
                        </label>
                        <div className="count-control">
                            <button
                                className="count-btn"
                                onClick={() => onQuestionCountChange(Math.max(1, topic.questionCount - 1))}
                                disabled={topic.questionCount <= 1}
                            >
                                −
                            </button>
                            <span className="count-value">{topic.questionCount}</span>
                            <button
                                className="count-btn"
                                onClick={() => onQuestionCountChange(Math.min(10, topic.questionCount + 1))}
                                disabled={topic.questionCount >= 10}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="setting-row">
                        <label className="setting-label">
                            {t('Practice.difficulty', 'Độ khó')}
                        </label>
                        <DifficultySlider
                            value={topic.difficultyLevel}
                            onChange={onDifficultyChange}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
