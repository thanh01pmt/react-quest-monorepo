/**
 * PatternSelector - Component for selecting segment patterns
 * 
 * Allows users to choose from predefined patterns like:
 * - 1 × C (single crystal)
 * - 1 × (C-C) (pair)
 * - 1 × (CSC) (crystal-switch-crystal)
 * - Fill patterns
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Grid3X3, Layers } from 'lucide-react';
import type { SegmentPattern } from '@repo/academic-map-generator';
import { SEGMENT_PATTERNS, getApplicablePatterns } from '@repo/academic-map-generator';
import './PatternSelector.css';

interface PatternSelectorProps {
    segmentLength: number;
    selectedPatternId: string | null;
    onPatternSelect: (pattern: SegmentPattern | null) => void;
}

// Group patterns by category
const PATTERN_CATEGORIES = {
    single: { name: 'Single Items', icon: '•', patterns: ['single_crystal', 'single_switch'] },
    pairs: { name: 'Pairs', icon: '••', patterns: ['pair_cc', 'pair_cs', 'spaced_c_c', 'spaced_c__c'] },
    triplets: { name: 'Triplets', icon: '•••', patterns: ['triple_csc', 'triple_scs', 'triple_c_s_c'] },
    fill: { name: 'Fill Patterns', icon: '▓', patterns: ['fill_crystals', 'fill_alternating', 'fill_spaced'] },
    edges: { name: 'Edge Patterns', icon: '◀▶', patterns: ['edges_crystals', 'edges_switches'] }
};

export function PatternSelector({
    segmentLength,
    selectedPatternId,
    onPatternSelect
}: PatternSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>('single');

    // Get applicable patterns for this segment length
    const applicablePatterns = useMemo(() => {
        return getApplicablePatterns(segmentLength);
    }, [segmentLength]);

    const applicableIds = useMemo(() => {
        return new Set(applicablePatterns.map(p => p.id));
    }, [applicablePatterns]);

    // Find selected pattern
    const selectedPattern = useMemo(() => {
        return SEGMENT_PATTERNS.find(p => p.id === selectedPatternId) || null;
    }, [selectedPatternId]);

    const handlePatternClick = (patternId: string) => {
        const pattern = SEGMENT_PATTERNS.find(p => p.id === patternId);
        if (pattern && applicableIds.has(patternId)) {
            if (selectedPatternId === patternId) {
                onPatternSelect(null); // Deselect
            } else {
                onPatternSelect(pattern);
            }
        }
    };

    const toggleCategory = (categoryKey: string) => {
        setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
    };

    // Render pattern visualization
    const renderPatternPreview = (pattern: SegmentPattern) => {
        return pattern.pattern.map((item, i) => (
            <span key={i} className={`pattern-item pattern-${item.toLowerCase()}`}>
                {item === 'C' ? '💎' : item === 'S' ? '🔘' : '·'}
            </span>
        ));
    };

    return (
        <div className="pattern-selector">
            <button
                className="pattern-selector-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="header-content">
                    <Sparkles size={16} />
                    <span>Segment Pattern</span>
                </span>
                <span className="header-right">
                    {selectedPattern && (
                        <span className="selected-pattern-badge">
                            {selectedPattern.name}
                        </span>
                    )}
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
            </button>

            {isExpanded && (
                <div className="pattern-content">
                    {segmentLength < 3 ? (
                        <div className="pattern-warning">
                            Segment too short for patterns (min 3 blocks)
                        </div>
                    ) : (
                        <>
                            {/* Quick select row */}
                            <div className="quick-patterns">
                                {['single_crystal', 'pair_cc', 'triple_csc', 'fill_crystals'].map(id => {
                                    const pattern = SEGMENT_PATTERNS.find(p => p.id === id);
                                    if (!pattern) return null;
                                    const isApplicable = applicableIds.has(id);
                                    const isSelected = selectedPatternId === id;

                                    return (
                                        <button
                                            key={id}
                                            className={`quick-pattern ${isSelected ? 'selected' : ''} ${!isApplicable ? 'disabled' : ''}`}
                                            onClick={() => handlePatternClick(id)}
                                            disabled={!isApplicable}
                                            title={pattern.description}
                                        >
                                            <span className="quick-pattern-preview">
                                                {renderPatternPreview(pattern)}
                                            </span>
                                            <span className="quick-pattern-name">{pattern.name.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Category list */}
                            <div className="pattern-categories">
                                {Object.entries(PATTERN_CATEGORIES).map(([key, category]) => {
                                    const categoryPatterns = category.patterns
                                        .map(id => SEGMENT_PATTERNS.find(p => p.id === id))
                                        .filter((p): p is SegmentPattern => p !== undefined);

                                    const applicableCount = categoryPatterns.filter(p => applicableIds.has(p.id)).length;
                                    if (applicableCount === 0) return null;

                                    return (
                                        <div key={key} className="pattern-category">
                                            <button
                                                className="category-header"
                                                onClick={() => toggleCategory(key)}
                                            >
                                                <span className="category-icon">{category.icon}</span>
                                                <span className="category-name">{category.name}</span>
                                                <span className="category-count">({applicableCount})</span>
                                                {expandedCategory === key ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            </button>

                                            {expandedCategory === key && (
                                                <div className="category-patterns">
                                                    {categoryPatterns.map(pattern => {
                                                        const isApplicable = applicableIds.has(pattern.id);
                                                        const isSelected = selectedPatternId === pattern.id;

                                                        return (
                                                            <button
                                                                key={pattern.id}
                                                                className={`pattern-option ${isSelected ? 'selected' : ''} ${!isApplicable ? 'disabled' : ''}`}
                                                                onClick={() => handlePatternClick(pattern.id)}
                                                                disabled={!isApplicable}
                                                            >
                                                                <span className="pattern-preview">
                                                                    {renderPatternPreview(pattern)}
                                                                </span>
                                                                <span className="pattern-info">
                                                                    <span className="pattern-name">{pattern.name}</span>
                                                                    <span className="pattern-desc">{pattern.description}</span>
                                                                </span>
                                                                {!isApplicable && (
                                                                    <span className="pattern-min">min {pattern.minSegmentLength}</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default PatternSelector;
