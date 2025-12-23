/**
 * PlacementSelector - Component for selecting placeable elements
 * 
 * Displays a list of selectable elements (keypoints, segments, positions)
 * and allows users to assign item types to them.
 */

import React, { useState, useMemo } from 'react';
import type {
    SelectableElement,
    ElementCategory
} from '@repo/academic-map-generator';
import './PlacementSelector.css';

interface PlacementSelection {
    elementId: string;
    itemType: 'crystal' | 'switch' | 'gem';
    symmetric?: boolean;
}

interface PlacementSelectorProps {
    elements: SelectableElement[];
    onSelectionsChange: (selections: PlacementSelection[]) => void;
    initialSelections?: PlacementSelection[];
}

type ItemType = 'crystal' | 'switch' | 'gem' | null;

interface ElementState {
    selected: boolean;
    itemType: ItemType;
    symmetric: boolean;
}

export function PlacementSelector({
    elements,
    onSelectionsChange,
    initialSelections = []
}: PlacementSelectorProps) {
    // Deduplicate elements by ID (prevent React key warnings)
    const uniqueElements = useMemo(() => {
        const seen = new Set<string>();
        return elements.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });
    }, [elements]);

    // Group elements by type
    const grouped = useMemo(() => {
        const keypoints = uniqueElements.filter(e => e.type === 'keypoint');
        const segments = uniqueElements.filter(e => e.type === 'segment');
        const positions = uniqueElements.filter(e => e.type === 'position');
        return { keypoints, segments, positions };
    }, [uniqueElements]);

    // Selection state
    const [elementStates, setElementStates] = useState<Record<string, ElementState>>(() => {
        const states: Record<string, ElementState> = {};
        for (const sel of initialSelections) {
            states[sel.elementId] = {
                selected: true,
                itemType: sel.itemType,
                symmetric: sel.symmetric || false
            };
        }
        return states;
    });

    // Handle element selection
    const toggleElement = (elementId: string) => {
        setElementStates(prev => {
            const current = prev[elementId];
            const newState = {
                ...prev,
                [elementId]: current?.selected
                    ? { ...current, selected: false }
                    : { selected: true, itemType: 'crystal' as ItemType, symmetric: false }
            };

            // Notify parent
            const selections = buildSelections(newState);
            onSelectionsChange(selections);

            return newState;
        });
    };

    // Handle item type change
    const setItemType = (elementId: string, itemType: ItemType) => {
        setElementStates(prev => {
            const newState = {
                ...prev,
                [elementId]: { ...prev[elementId], itemType }
            };

            const selections = buildSelections(newState);
            onSelectionsChange(selections);

            return newState;
        });
    };

    // Handle symmetric toggle
    const toggleSymmetric = (elementId: string) => {
        setElementStates(prev => {
            const current = prev[elementId];
            const newState = {
                ...prev,
                [elementId]: { ...current, symmetric: !current?.symmetric }
            };

            const selections = buildSelections(newState);
            onSelectionsChange(selections);

            return newState;
        });
    };

    // Build selections array from state
    const buildSelections = (states: Record<string, ElementState>): PlacementSelection[] => {
        const selections: PlacementSelection[] = [];
        for (const [id, state] of Object.entries(states)) {
            if (state.selected && state.itemType) {
                selections.push({
                    elementId: id,
                    itemType: state.itemType,
                    symmetric: state.symmetric
                });
            }
        }
        return selections;
    };

    // Get category badge color
    const getCategoryClass = (category: ElementCategory): string => {
        switch (category) {
            case 'critical': return 'badge-critical';
            case 'important': return 'badge-important';
            case 'recommended': return 'badge-recommended';
            case 'optional': return 'badge-optional';
            case 'avoid': return 'badge-avoid';
            default: return '';
        }
    };

    // Render element item
    const renderElement = (element: SelectableElement) => {
        const state = elementStates[element.id];
        const isSelected = state?.selected || false;
        const hasMirror = !!element.relationships.mirrorOf;

        // Elements with 'avoid' category should not be selectable
        const isAvoid = element.category === 'avoid';
        const canSelect = !isAvoid;

        const handleClick = () => {
            if (canSelect) {
                toggleElement(element.id);
            }
        };

        return (
            <div
                key={element.id}
                className={`placement-element ${isSelected ? 'selected' : ''} ${isAvoid ? 'disabled' : ''}`}
            >
                <div
                    className={`element-header ${!canSelect ? 'not-selectable' : ''}`}
                    onClick={handleClick}
                    title={isAvoid ? 'Cannot place items on start/goal positions' : undefined}
                >
                    <span className="element-icon">{element.display.icon}</span>
                    <span className="element-name">{element.display.name}</span>
                    <span className={`element-badge ${getCategoryClass(element.category)}`}>
                        {element.category}
                    </span>
                </div>

                {/* Only show controls if selected AND not an avoid element */}
                {isSelected && !isAvoid && (
                    <div className="element-controls">
                        <select
                            value={state?.itemType || 'crystal'}
                            onChange={(e) => setItemType(element.id, e.target.value as ItemType)}
                            className="item-type-select"
                        >
                            <option value="crystal">💎 Crystal</option>
                            <option value="switch">🔘 Switch</option>
                            <option value="gem">💠 Gem</option>
                        </select>

                        {hasMirror && (
                            <label className="symmetric-toggle">
                                <input
                                    type="checkbox"
                                    checked={state?.symmetric || false}
                                    onChange={() => toggleSymmetric(element.id)}
                                />
                                <span>Symmetric</span>
                            </label>
                        )}
                    </div>
                )}

                {/* Show disabled message for avoid elements */}
                {isAvoid && (
                    <div className="avoid-message">
                        ⛔ Cannot place items here
                    </div>
                )}
            </div>
        );
    };

    // Count selections
    const selectionCount = Object.values(elementStates).filter(s => s.selected).length;

    return (
        <div className="placement-selector">
            <div className="selector-header">
                <h3>📍 Place Items</h3>
                <span className="selection-count">{selectionCount} selected</span>
            </div>

            {/* Keypoints */}
            {grouped.keypoints.length > 0 && (
                <div className="element-group">
                    <div className="group-header">
                        <span className="group-icon">●</span>
                        <span>Key Points ({grouped.keypoints.length})</span>
                    </div>
                    <div className="group-elements">
                        {grouped.keypoints.map(renderElement)}
                    </div>
                </div>
            )}

            {/* Segments */}
            {grouped.segments.length > 0 && (
                <div className="element-group">
                    <div className="group-header">
                        <span className="group-icon">─</span>
                        <span>Segments ({grouped.segments.length})</span>
                    </div>
                    <div className="group-elements">
                        {grouped.segments.map(renderElement)}
                    </div>
                </div>
            )}

            {/* Positions - collapsible */}
            {grouped.positions.length > 0 && (
                <details className="element-group positions-group">
                    <summary className="group-header">
                        <span className="group-icon">○</span>
                        <span>Positions ({grouped.positions.length})</span>
                    </summary>
                    <div className="group-elements">
                        {grouped.positions.map(renderElement)}
                    </div>
                </details>
            )}
        </div>
    );
}

export default PlacementSelector;
