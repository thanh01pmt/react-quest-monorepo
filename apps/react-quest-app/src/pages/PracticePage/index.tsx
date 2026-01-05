/**
 * PracticePage Component
 * 
 * Main page for Practice Mode - allows users to configure and start practice sessions.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type {
    TopicConfig,
    PracticeConfig,
    DifficultyLevel,
    ConceptCategory
} from '@repo/shared-templates';
import { TopicSelector } from './TopicSelector';
import './PracticePage.css';

// Available categories for practice
const AVAILABLE_CATEGORIES: ConceptCategory[] = [
    'sequential',
    'loop',
    'conditional',
    'function',
    'variable',
];

// Category display info
const CATEGORY_INFO: Record<ConceptCategory, { icon: string; nameKey: string }> = {
    sequential: { icon: '➡️', nameKey: 'Practice.category_sequential' },
    loop: { icon: '🔁', nameKey: 'Practice.category_loop' },
    conditional: { icon: '🔀', nameKey: 'Practice.category_conditional' },
    function: { icon: '📦', nameKey: 'Practice.category_function' },
    variable: { icon: '📊', nameKey: 'Practice.category_variable' },
    advanced: { icon: '🚀', nameKey: 'Practice.category_advanced' },
};

// Default topic config
function createDefaultTopicConfig(category: ConceptCategory): TopicConfig {
    return {
        category,
        enabled: false,
        questionCount: 3,
        difficultyLevel: 'medium',
    };
}

export function PracticePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Topic configurations
    const [topics, setTopics] = useState<TopicConfig[]>(() =>
        AVAILABLE_CATEGORIES.map(createDefaultTopicConfig)
    );

    // UI state
    const [isStarting, setIsStarting] = useState(false);

    // Get enabled topics count
    const enabledCount = topics.filter(t => t.enabled).length;
    const totalQuestions = topics
        .filter(t => t.enabled)
        .reduce((sum, t) => sum + t.questionCount, 0);

    // Toggle topic enabled
    const handleToggleTopic = useCallback((category: ConceptCategory) => {
        setTopics(prev => prev.map(topic =>
            topic.category === category
                ? { ...topic, enabled: !topic.enabled }
                : topic
        ));
    }, []);

    // Update question count
    const handleQuestionCountChange = useCallback((category: ConceptCategory, count: number) => {
        setTopics(prev => prev.map(topic =>
            topic.category === category
                ? { ...topic, questionCount: count }
                : topic
        ));
    }, []);

    // Update difficulty
    const handleDifficultyChange = useCallback((category: ConceptCategory, level: DifficultyLevel) => {
        setTopics(prev => prev.map(topic =>
            topic.category === category
                ? { ...topic, difficultyLevel: level }
                : topic
        ));
    }, []);

    // Start practice session
    const handleStartPractice = useCallback(async () => {
        if (enabledCount === 0) return;

        setIsStarting(true);

        const config: PracticeConfig = {
            topics: topics.filter(t => t.enabled),
            mode: 'custom',
            seed: Date.now(),
        };

        // Store config in session storage for the practice session page
        sessionStorage.setItem('practiceConfig', JSON.stringify(config));

        // Navigate to practice session
        navigate('/practice/session');
    }, [topics, enabledCount, navigate]);

    // Challenge me - random config
    const handleChallengeMe = useCallback(() => {
        setIsStarting(true);

        // Random selection of 2-4 categories
        const shuffled = [...AVAILABLE_CATEGORIES].sort(() => Math.random() - 0.5);
        const selectedCount = 2 + Math.floor(Math.random() * 3);
        const selectedCategories = shuffled.slice(0, selectedCount);

        // Random difficulties
        const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

        const randomTopics: TopicConfig[] = selectedCategories.map(category => ({
            category,
            enabled: true,
            questionCount: 2 + Math.floor(Math.random() * 4),
            difficultyLevel: difficulties[Math.floor(Math.random() * difficulties.length)],
        }));

        const config: PracticeConfig = {
            topics: randomTopics,
            mode: 'challenge_me',
            seed: Date.now(),
        };

        sessionStorage.setItem('practiceConfig', JSON.stringify(config));
        navigate('/practice/session');
    }, [navigate]);

    return (
        <div className="practice-page">
            <div className="practice-container">
                {/* Header */}
                <header className="practice-header">
                    <h1 className="practice-title">
                        📚 {t('Practice.title', 'Chế độ Luyện tập')}
                    </h1>
                    <p className="practice-subtitle">
                        {t('Practice.subtitle', 'Chọn chủ đề và độ khó để bắt đầu luyện tập')}
                    </p>
                </header>

                {/* Topic Selection */}
                <section className="practice-topics">
                    <h2 className="section-title">
                        🎯 {t('Practice.select_topics', 'Chủ đề luyện tập')}
                    </h2>

                    <div className="topics-grid">
                        {topics.map(topic => (
                            <TopicSelector
                                key={topic.category}
                                topic={topic}
                                info={CATEGORY_INFO[topic.category]}
                                onToggle={() => handleToggleTopic(topic.category)}
                                onQuestionCountChange={(count) => handleQuestionCountChange(topic.category, count)}
                                onDifficultyChange={(level) => handleDifficultyChange(topic.category, level)}
                            />
                        ))}
                    </div>
                </section>

                {/* Summary */}
                <section className="practice-summary">
                    <div className="summary-stats">
                        <span className="stat">
                            <span className="stat-value">{enabledCount}</span>
                            <span className="stat-label">{t('Practice.topics_selected', 'chủ đề')}</span>
                        </span>
                        <span className="stat-divider">•</span>
                        <span className="stat">
                            <span className="stat-value">{totalQuestions}</span>
                            <span className="stat-label">{t('Practice.questions', 'câu hỏi')}</span>
                        </span>
                    </div>
                </section>

                {/* Actions */}
                <section className="practice-actions">
                    <button
                        className="btn-challenge"
                        onClick={handleChallengeMe}
                        disabled={isStarting}
                    >
                        🎲 {t('Practice.challenge_me', 'Thách thức tôi!')}
                    </button>

                    <button
                        className="btn-start"
                        onClick={handleStartPractice}
                        disabled={enabledCount === 0 || isStarting}
                    >
                        {isStarting ? (
                            <>{t('Practice.starting', 'Đang tạo...')}</>
                        ) : (
                            <>▶ {t('Practice.start', 'Bắt đầu luyện tập')}</>
                        )}
                    </button>
                </section>

                {/* Back link */}
                <div className="practice-back">
                    <button
                        className="btn-back"
                        onClick={() => navigate('/')}
                    >
                        ← {t('Practice.back_to_quests', 'Quay lại danh sách thử thách')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PracticePage;
