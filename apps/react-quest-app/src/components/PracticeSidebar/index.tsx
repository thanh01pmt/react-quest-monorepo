/**
 * PracticeSidebar Component
 * 
 * Left sidebar for Practice Mode - contains configuration and exercise list.
 * Can expand to 2x width (600px) for better configuration experience.
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
    TopicConfig,
    PracticeConfig,
    DifficultyLevel,
    ConceptCategory,
    PracticeSession,
    GeneratedExercise
} from '@repo/shared-templates';
import './PracticeSidebar.css';

// Simple inline difficulty slider for this component
const DIFFICULTY_LEVELS: DifficultyLevel[] = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];
const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    very_easy: '#4ade80',
    easy: '#a3e635',
    medium: '#facc15',
    hard: '#fb923c',
    very_hard: '#f87171',
};

// Available categories
const AVAILABLE_CATEGORIES: ConceptCategory[] = [
    'sequential', 'loop', 'conditional', 'function', 'variable',
    'progression', 'logic', 'memory', 'decomposition', 'search'
];

const CATEGORY_INFO: Record<ConceptCategory, { icon: string; nameKey: string }> = {
    sequential: { icon: '➡️', nameKey: 'Practice.category_sequential' },
    loop: { icon: '🔁', nameKey: 'Practice.category_loop' },
    conditional: { icon: '🔀', nameKey: 'Practice.category_conditional' },
    function: { icon: '📦', nameKey: 'Practice.category_function' },
    variable: { icon: '📊', nameKey: 'Practice.category_variable' },
    advanced: { icon: '🚀', nameKey: 'Practice.category_advanced' },
    progression: { icon: '📈', nameKey: 'Practice.category_progression' },
    logic: { icon: '🧠', nameKey: 'Practice.category_logic' },
    memory: { icon: '💾', nameKey: 'Practice.category_memory' },
    decomposition: { icon: '🧩', nameKey: 'Practice.category_decomposition' },
    search: { icon: '🔍', nameKey: 'Practice.category_search' },
};

// Inline DifficultySlider component
function DifficultySlider({
    value,
    onChange
}: {
    value: DifficultyLevel;
    onChange: (level: DifficultyLevel) => void;
}) {
    const currentIndex = DIFFICULTY_LEVELS.indexOf(value);

    return (
        <div className="difficulty-slider-inline">
            {DIFFICULTY_LEVELS.map((level, index) => (
                <button
                    key={level}
                    className={`diff-dot ${index <= currentIndex ? 'active' : ''}`}
                    style={{ backgroundColor: index <= currentIndex ? DIFFICULTY_COLORS[level] : undefined }}
                    onClick={() => onChange(level)}
                    title={level.replace('_', ' ')}
                />
            ))}
        </div>
    );
}

interface PracticeSidebarProps {
    session: PracticeSession | null;
    currentExerciseIndex: number;
    onStart: (config: PracticeConfig) => void;
    onChallengeMe: () => void;
    onExerciseSelect: (index: number) => void;
    isCollapsed: boolean;
    isExpanded: boolean; // 2x width mode
    onToggle: () => void;
    onExpandToggle: () => void;
    children?: React.ReactNode;
}

function createDefaultTopicConfig(category: ConceptCategory): TopicConfig {
    return {
        category,
        enabled: false,
        questionCount: 3,
        difficultyLevel: 'medium',
    };
}

export const PracticeSidebar: React.FC<PracticeSidebarProps> = ({
    session,
    currentExerciseIndex,
    onStart,
    onChallengeMe,
    onExerciseSelect,
    isCollapsed,
    isExpanded,
    onToggle,
    onExpandToggle,
    children,
}) => {
    const { t } = useTranslation();

    // Configuration state
    const [topics, setTopics] = useState<TopicConfig[]>(() =>
        AVAILABLE_CATEGORIES.map(createDefaultTopicConfig)
    );
    const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Computed values
    const enabledCount = topics.filter(t => t.enabled).length;
    const totalQuestions = topics
        .filter(t => t.enabled)
        .reduce((sum, t) => sum + t.questionCount, 0);

    // Handlers
    const handleToggleTopic = useCallback((category: ConceptCategory) => {
        setTopics(prev => prev.map(topic =>
            topic.category === category
                ? { ...topic, enabled: !topic.enabled }
                : topic
        ));
    }, []);

    const handleQuestionCountChange = useCallback((category: ConceptCategory, delta: number) => {
        setTopics(prev => prev.map(topic =>
            topic.category === category
                ? { ...topic, questionCount: Math.max(1, Math.min(10, topic.questionCount + delta)) }
                : topic
        ));
    }, []);

    const handleDifficultyChange = useCallback((category: ConceptCategory, level: DifficultyLevel) => {
        setTopics(prev => prev.map(topic =>
            topic.category === category
                ? { ...topic, difficultyLevel: level }
                : topic
        ));
    }, []);

    const handleStartPractice = useCallback(() => {
        if (enabledCount === 0) return;
        setIsGenerating(true);

        const config: PracticeConfig = {
            topics: topics.filter(t => t.enabled),
            mode: 'custom',
            seed: Date.now(),
        };

        onStart(config);
        setIsConfigCollapsed(true);
        setIsGenerating(false);
    }, [topics, enabledCount, onStart]);

    const handleChallengeMe = useCallback(() => {
        setIsGenerating(true);
        onChallengeMe();
        setIsConfigCollapsed(true);
        setIsGenerating(false);
    }, [onChallengeMe]);

    // Render collapsed view
    if (isCollapsed) {
        return (
            <aside className="practice-sidebar collapsed">
                <div className="sidebar-header">
                    <button onClick={onToggle} className="toggle-button" aria-label={t('UI.ToggleSidebar')}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </aside>
        );
    }

    return (
        <aside className={`practice-sidebar ${isExpanded ? 'expanded' : ''}`}>
            {/* Header */}
            <div className="sidebar-header">
                <h2>📚 {t('Practice.title', 'Luyện tập')}</h2>
                <div className="header-actions">
                    <button
                        onClick={onExpandToggle}
                        className="expand-button"
                        title={isExpanded ? t('UI.Collapse', 'Thu nhỏ') : t('UI.Expand', 'Mở rộng')}
                    >
                        <i className={`fas ${isExpanded ? 'fa-compress-alt' : 'fa-expand-alt'}`}></i>
                    </button>
                    <button onClick={onToggle} className="toggle-button" aria-label={t('UI.ToggleSidebar')}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                </div>
            </div>

            <div className="sidebar-content">
                {/* Quick Start Section - Always visible at top */}
                <div className="quick-start-section">
                    <button
                        className="btn-challenge-big"
                        onClick={handleChallengeMe}
                        disabled={isGenerating}
                    >
                        <span className="challenge-icon">🎲</span>
                        <span className="challenge-text">
                            <strong>{t('Practice.challenge_me', 'Thách thức tôi!')}</strong>
                            <small>{t('Practice.challenge_desc', 'Bắt đầu ngay với chủ đề ngẫu nhiên')}</small>
                        </span>
                    </button>
                </div>

                {/* Separator */}
                <div className="section-divider">
                    <span>{t('Practice.or_custom', 'hoặc tùy chỉnh')}</span>
                </div>

                {/* Manual Configuration Section */}
                <div className={`config-section ${isConfigCollapsed ? 'collapsed' : ''}`}>
                    <div
                        className="section-header"
                        onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
                    >
                        <span>🎯 {t('Practice.select_topics', 'Chọn chủ đề & độ khó')}</span>
                        <i className={`fas fa-chevron-${isConfigCollapsed ? 'down' : 'up'}`}></i>
                    </div>

                    {!isConfigCollapsed && (
                        <div className="config-content">
                            {/* Topic Cards */}
                            <div className={`topics-list ${isExpanded ? 'expanded' : ''}`}>
                                {topics.map(topic => (
                                    <div
                                        key={topic.category}
                                        className={`topic-card ${topic.enabled ? 'enabled' : ''}`}
                                    >
                                        <div className="topic-header" onClick={() => handleToggleTopic(topic.category)}>
                                            <input
                                                type="checkbox"
                                                checked={topic.enabled}
                                                onChange={() => handleToggleTopic(topic.category)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <span className="topic-icon">{CATEGORY_INFO[topic.category].icon}</span>
                                            <span className="topic-name">
                                                {t(CATEGORY_INFO[topic.category].nameKey, topic.category)}
                                            </span>
                                        </div>

                                        {topic.enabled && (
                                            <div className="topic-settings">
                                                <div className="setting-row">
                                                    <span className="setting-label">{t('Practice.question_count', 'Số câu')}</span>
                                                    <div className="count-control">
                                                        <button onClick={() => handleQuestionCountChange(topic.category, -1)}>−</button>
                                                        <span>{topic.questionCount}</span>
                                                        <button onClick={() => handleQuestionCountChange(topic.category, 1)}>+</button>
                                                    </div>
                                                </div>
                                                <div className="setting-row">
                                                    <span className="setting-label">{t('Practice.difficulty', 'Độ khó')}</span>
                                                    <DifficultySlider
                                                        value={topic.difficultyLevel}
                                                        onChange={(level) => handleDifficultyChange(topic.category, level)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="config-summary">
                                <span>{enabledCount} {t('Practice.topics_selected', 'chủ đề')}</span>
                                <span className="divider">•</span>
                                <span>{totalQuestions} {t('Practice.questions', 'câu hỏi')}</span>
                            </div>

                            {/* Start Button - only for manual config */}
                            <div className="config-actions">
                                <button
                                    className="btn-start"
                                    onClick={handleStartPractice}
                                    disabled={enabledCount === 0 || isGenerating}
                                >
                                    ▶ {t('Practice.start_custom', 'Bắt đầu luyện tập')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Exercise List Section */}
                {session && session.exercises.length > 0 && (
                    <div className="exercise-list-section">
                        <div className="section-header">
                            <span>📝 {t('Practice.exercise_list', 'Danh sách bài tập')}</span>
                            <span className="progress-badge">
                                {session.currentIndex}/{session.exercises.length}
                            </span>
                        </div>

                        <div className="exercise-list">
                            {session.exercises.map((exercise, index) => {
                                const isCompleted = index < session.currentIndex;
                                const isCurrent = index === currentExerciseIndex;
                                const result = session.results[index];

                                return (
                                    <div
                                        key={exercise.id}
                                        className={`exercise-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={() => onExerciseSelect(index)}
                                    >
                                        <span className="exercise-status">
                                            {isCompleted ? (result?.success ? '✓' : '✗') : (isCurrent ? '▶' : '○')}
                                        </span>
                                        <span className="exercise-number">{index + 1}</span>
                                        <span className="exercise-concept">
                                            {t('Practice.challenge', 'Bài')} {index + 1}
                                        </span>
                                        {result && (
                                            <span className="exercise-xp">+{result.xpEarned} XP</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">{children}</div>
        </aside>
    );
};
