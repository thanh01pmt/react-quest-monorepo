/**
 * PlacementVariants - Component for generating and selecting placement variants
 * 
 * Uses AcademicPlacementGenerator from @repo/academic-placer to generate
 * multiple item placement options for the user to choose from.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    AcademicPlacementGenerator,
    MapAnalyzer,
    type AcademicPlacement,
    type ItemPlacement,
    type PlacementContext
} from '@repo/academic-placer';
import './PlacementVariants.css';

interface PlacementVariantsProps {
    pathInfo: {
        start_pos: [number, number, number];
        target_pos: [number, number, number];
        path_coords: [number, number, number][];
        placement_coords?: [number, number, number][];
        metadata?: Record<string, any>;
    } | null;
    onApplyPlacement: (items: ItemPlacement[]) => void;
}

type CategoryFilter = 'all' | 'sequential' | 'loop' | 'conditional' | 'function' | 'variable' | 'combination';

export function PlacementVariants({ pathInfo, onApplyPlacement }: PlacementVariantsProps) {
    const [placements, setPlacements] = useState<AcademicPlacement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get PlacementContext from pathInfo
    const context = useMemo((): PlacementContext | null => {
        if (!pathInfo?.path_coords || pathInfo.path_coords.length === 0) {
            return null;
        }

        try {
            return MapAnalyzer.fromTopology({
                start_pos: pathInfo.start_pos,
                target_pos: pathInfo.target_pos,
                path_coords: pathInfo.path_coords,
                placement_coords: pathInfo.placement_coords || [],
                metadata: pathInfo.metadata || {}
            });
        } catch (e) {
            console.error('Failed to create PlacementContext:', e);
            return null;
        }
    }, [pathInfo]);

    // Generate placements
    const handleGenerate = useCallback(() => {
        if (!context) {
            setError('No path data available. Generate ground from Topology tab first.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const generator = new AcademicPlacementGenerator(context);
            const allPlacements = generator.generateAll();

            setPlacements(allPlacements);
            setSelectedId(null);

            if (allPlacements.length === 0) {
                setError('No placements could be generated for this map configuration.');
            }
        } catch (e) {
            console.error('Failed to generate placements:', e);
            setError('Failed to generate placements. Check console for details.');
        } finally {
            setIsGenerating(false);
        }
    }, [context]);

    // Filter placements by category
    const filteredPlacements = useMemo(() => {
        if (categoryFilter === 'all') {
            return placements;
        }
        return placements.filter(p => {
            // Check if primary concept belongs to category
            const category = p.primaryConcept.split('_')[0];
            return category === categoryFilter ||
                (categoryFilter === 'function' && p.primaryConcept.includes('procedure')) ||
                (categoryFilter === 'loop' && (p.primaryConcept.includes('repeat') || p.primaryConcept.includes('loop')));
        });
    }, [placements, categoryFilter]);

    // Get selected placement
    const selectedPlacement = useMemo(() => {
        return placements.find(p => p.id === selectedId) || null;
    }, [placements, selectedId]);

    // Apply selected placement
    const handleApply = useCallback(() => {
        if (selectedPlacement) {
            onApplyPlacement(selectedPlacement.items);
        }
    }, [selectedPlacement, onApplyPlacement]);

    // Get category badge class
    const getCategoryClass = (concept: string): string => {
        if (concept.includes('sequential') || concept.includes('move')) return 'cat-sequential';
        if (concept.includes('repeat') || concept.includes('loop') || concept.includes('while')) return 'cat-loop';
        if (concept.includes('if') || concept.includes('condition')) return 'cat-conditional';
        if (concept.includes('procedure') || concept.includes('function')) return 'cat-function';
        if (concept.includes('var') || concept.includes('counter')) return 'cat-variable';
        return 'cat-combination';
    };

    // Get difficulty color
    const getDifficultyColor = (difficulty: number): string => {
        if (difficulty <= 3) return '#22c55e'; // green
        if (difficulty <= 5) return '#eab308'; // yellow
        if (difficulty <= 7) return '#f97316'; // orange
        return '#ef4444'; // red
    };

    // Category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: placements.length,
            sequential: 0, loop: 0, conditional: 0, function: 0, variable: 0, combination: 0
        };

        for (const p of placements) {
            const concept = p.primaryConcept;
            if (concept.includes('sequential') || concept.includes('move')) counts.sequential++;
            else if (concept.includes('repeat') || concept.includes('loop') || concept.includes('while')) counts.loop++;
            else if (concept.includes('if') || concept.includes('condition')) counts.conditional++;
            else if (concept.includes('procedure') || concept.includes('function')) counts.function++;
            else if (concept.includes('var') || concept.includes('counter')) counts.variable++;
            else counts.combination++;
        }

        return counts;
    }, [placements]);

    return (
        <div className="placement-variants">
            <div className="variants-header">
                <h3>🎲 Placement Variants</h3>
                <span className="variant-count">
                    {placements.length > 0 ? `${placements.length} variants` : 'None'}
                </span>
            </div>

            {/* Generate Button */}
            <button
                className="generate-variants-btn"
                onClick={handleGenerate}
                disabled={!context || isGenerating}
            >
                {isGenerating ? '⏳ Generating...' : '🎲 Generate All Variants'}
            </button>

            {error && (
                <div className="error-message">⚠️ {error}</div>
            )}

            {/* Category Filter */}
            {placements.length > 0 && (
                <div className="category-filters">
                    {(['all', 'sequential', 'loop', 'conditional', 'function', 'variable', 'combination'] as CategoryFilter[]).map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${categoryFilter === cat ? 'active' : ''} ${cat !== 'all' ? `cat-${cat}` : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            <span className="count">({categoryCounts[cat]})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Placements List */}
            {filteredPlacements.length > 0 && (
                <div className="placements-list">
                    {filteredPlacements.map(placement => (
                        <div
                            key={placement.id}
                            className={`placement-item ${selectedId === placement.id ? 'selected' : ''}`}
                            onClick={() => setSelectedId(placement.id)}
                        >
                            <div className="placement-header">
                                <span className={`concept-badge ${getCategoryClass(placement.primaryConcept)}`}>
                                    {placement.primaryConcept.replace(/_/g, ' ')}
                                </span>
                                <span
                                    className="difficulty-badge"
                                    style={{ backgroundColor: getDifficultyColor(placement.difficulty) }}
                                >
                                    Lv.{placement.difficulty}
                                </span>
                            </div>
                            <div className="placement-name">{placement.name}</div>
                            <div className="placement-meta">
                                <span>📦 {placement.items.length} items</span>
                                <span>🧩 {placement.requiredBlocks.length} blocks</span>
                            </div>
                            {selectedId === placement.id && (
                                <div className="placement-details">
                                    <p className="pattern-desc">{placement.patternDescription}</p>
                                    <p className="blocks-list">
                                        <strong>Blocks:</strong> {placement.requiredBlocks.join(', ')}
                                    </p>
                                    {placement.items.length > 0 && (
                                        <div className="items-preview">
                                            <strong>Items:</strong>
                                            <ul>
                                                {placement.items.slice(0, 5).map((item, i) => (
                                                    <li key={i}>
                                                        {item.type === 'crystal' ? '💎' : item.type === 'switch' ? '🔘' : '💠'}
                                                        {' '}at ({item.position.x}, {item.position.y}, {item.position.z})
                                                    </li>
                                                ))}
                                                {placement.items.length > 5 && (
                                                    <li>...and {placement.items.length - 5} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Apply Button */}
            {selectedPlacement && (
                <button className="apply-variant-btn" onClick={handleApply}>
                    ✅ Apply "{selectedPlacement.name}"
                </button>
            )}

            {/* Empty state */}
            {placements.length === 0 && !error && !isGenerating && (
                <div className="empty-state">
                    <p>Click "Generate All Variants" to see all possible item placements based on the map structure.</p>
                </div>
            )}
        </div>
    );
}

export default PlacementVariants;
