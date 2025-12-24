/**
 * SelectionToolbar Component
 * 
 * Toolbar for selection and transform tools:
 * - Box Select (existing)
 * - Smart Select (new)
 * - Move tool
 * - Rotate tool
 * 
 * Positioned near the left side of the viewport
 */

import React from 'react';
import './SelectionToolbar.css';

export type SelectionMode = 'box' | 'smart';
export type ToolMode = 'navigate' | 'build' | 'select' | 'move' | 'rotate';

interface SelectionToolbarProps {
    // Current active tool
    activeMode: ToolMode;
    onModeChange: (mode: ToolMode) => void;

    // Selection sub-mode (when tool is 'select')
    selectionMode: SelectionMode;
    onSelectionModeChange: (mode: SelectionMode) => void;

    // State indicators
    hasSelection: boolean;
    selectionCount?: number;
}

export function SelectionToolbar({
    activeMode,
    onModeChange,
    selectionMode,
    onSelectionModeChange,
    hasSelection,
    selectionCount = 0,
}: SelectionToolbarProps) {

    return (
        <div className="selection-toolbar">
            <div className="toolbar-title">Tools</div>

            {/* Main Tool Buttons */}
            <div className="tool-group">
                <button
                    className={`tool-button ${activeMode === 'navigate' ? 'active' : ''}`}
                    onClick={() => onModeChange('navigate')}
                    title="Navigate mode (Pan/Orbit camera)"
                >
                    <span className="tool-icon">🧭</span>
                    <span className="tool-label">Navigate</span>
                </button>

                <button
                    className={`tool-button ${activeMode === 'build' ? 'active' : ''}`}
                    onClick={() => onModeChange('build')}
                    title="Build mode (Place objects)"
                >
                    <span className="tool-icon">🔨</span>
                    <span className="tool-label">Build</span>
                </button>

                <button
                    className={`tool-button ${activeMode === 'select' ? 'active' : ''}`}
                    onClick={() => onModeChange('select')}
                    title="Select mode (S) - Select objects"
                >
                    <span className="tool-icon">👆</span>
                    <span className="tool-label">Select</span>
                    {hasSelection && selectionCount > 0 && (
                        <span className="selection-badge">{selectionCount}</span>
                    )}
                </button>
            </div>

            {/* Selection Sub-modes (only show when Select tool active) */}
            {activeMode === 'select' && (
                <div className="tool-subgroup">
                    <div className="subgroup-title">Selection Mode</div>
                    <button
                        className={`tool-subbutton ${selectionMode === 'box' ? 'active' : ''}`}
                        onClick={() => onSelectionModeChange('box')}
                        title="Box Select - Drag to select area"
                    >
                        <span className="tool-icon">⬜</span>
                        <span className="tool-label">Box</span>
                    </button>

                    <button
                        className={`tool-subbutton ${selectionMode === 'smart' ? 'active' : ''}`}
                        onClick={() => onSelectionModeChange('smart')}
                        title="Smart Select (S) - Click to select connected"
                    >
                        <span className="tool-icon">🎯</span>
                        <span className="tool-label">Smart</span>
                    </button>
                </div>
            )}

            {/* Transform Tools (only show when objects selected) */}
            {hasSelection && (
                <div className="tool-group">
                    <div className="subgroup-title">Transform</div>
                    <button
                        className={`tool-button ${activeMode === 'move' ? 'active' : ''}`}
                        onClick={() => onModeChange('move')}
                        title="Move tool (G) - Move selected objects"
                        disabled={!hasSelection}
                    >
                        <span className="tool-icon">↔️</span>
                        <span className="tool-label">Move</span>
                    </button>

                    <button
                        className={`tool-button ${activeMode === 'rotate' ? 'active' : ''}`}
                        onClick={() => onModeChange('rotate')}
                        title="Rotate tool (R) - Rotate selected objects"
                        disabled={!hasSelection}
                    >
                        <span className="tool-icon">🔄</span>
                        <span className="tool-label">Rotate</span>
                    </button>
                </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="toolbar-hints">
                <div className="hint-title">Shortcuts</div>
                <div className="hint-item"><kbd>S</kbd> Smart Select</div>
                <div className="hint-item"><kbd>G</kbd> Move</div>
                <div className="hint-item"><kbd>R</kbd> Rotate</div>
                <div className="hint-item"><kbd>Esc</kbd> Clear Selection</div>
            </div>
        </div>
    );
}

export default SelectionToolbar;
