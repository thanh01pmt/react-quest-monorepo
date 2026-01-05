/**
 * DifficultySlider Component
 * 
 * 5-level difficulty selector with visual feedback.
 */

import { useTranslation } from 'react-i18next';
import type { DifficultyLevel } from '@repo/shared-templates';
import './DifficultySlider.css';

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
    'very_easy',
    'easy',
    'medium',
    'hard',
    'very_hard',
];

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    very_easy: 'Practice.difficulty_very_easy',
    easy: 'Practice.difficulty_easy',
    medium: 'Practice.difficulty_medium',
    hard: 'Practice.difficulty_hard',
    very_hard: 'Practice.difficulty_very_hard',
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    very_easy: '#4ade80',  // green
    easy: '#a3e635',       // lime
    medium: '#facc15',     // yellow
    hard: '#fb923c',       // orange
    very_hard: '#f87171',  // red
};

interface DifficultySliderProps {
    value: DifficultyLevel;
    onChange: (level: DifficultyLevel) => void;
}

export function DifficultySlider({ value, onChange }: DifficultySliderProps) {
    const { t } = useTranslation();
    const currentIndex = DIFFICULTY_LEVELS.indexOf(value);

    return (
        <div className="difficulty-slider">
            <div className="difficulty-track">
                {DIFFICULTY_LEVELS.map((level, index) => (
                    <button
                        key={level}
                        className={`difficulty-dot ${index <= currentIndex ? 'active' : ''}`}
                        style={{
                            '--dot-color': DIFFICULTY_COLORS[level],
                        } as React.CSSProperties}
                        onClick={() => onChange(level)}
                        title={t(DIFFICULTY_LABELS[level], level)}
                    />
                ))}
                <div
                    className="difficulty-fill"
                    style={{
                        width: `${(currentIndex / (DIFFICULTY_LEVELS.length - 1)) * 100}%`,
                        background: `linear-gradient(to right, ${DIFFICULTY_COLORS.very_easy}, ${DIFFICULTY_COLORS[value]})`,
                    }}
                />
            </div>
            <span
                className="difficulty-label"
                style={{ color: DIFFICULTY_COLORS[value] }}
            >
                {t(DIFFICULTY_LABELS[value], value)}
            </span>
        </div>
    );
}
