/**
 * ViewportToolbar Component - Compact Version
 * 
 * Minimalist floating toolbar with 2 modes:
 * - Select (S): Click to select objects, Shift+Drag for area selection
 * - Build (B): Place objects on grid
 * 
 * Expands on hover to show full labels and selection type toggle
 */

import React, { useState } from 'react';
import type { BuilderMode } from '../../types';
import './ViewportToolbar.css';

export type SelectionMode = 'box' | 'smart';

interface ViewportToolbarProps {
    // Mode control
    activeMode: BuilderMode;
    onModeChange: (mode: BuilderMode) => void;

    // Selection sub-mode
    selectionMode: SelectionMode;
    onSelectionModeChange: (mode: SelectionMode) => void;

    // State indicators
    hasSelection: boolean;
    selectionCount?: number;
}

type ModeConfig = {
    mode: BuilderMode;
    icon: string;
    label: string;
    shortcut: string;
    title: string;
};

// Merged: Navigate + Select Area → "Select" mode
// navigate mode now handles both click-select AND area-select
const MODES: ModeConfig[] = [
    {
        mode: 'navigate',
        icon: '👆',
        label: 'Select',
        shortcut: 'S',
        title: 'Select mode (S) - Click to select, Shift+Drag for area'
    },
    {
        mode: 'build-single',
        icon: '🧱',
        label: 'Build',
        shortcut: 'B',
        title: 'Build mode (B) - Place objects'
    },
];

export function ViewportToolbar({
    activeMode,
    onModeChange,
    selectionMode,
    onSelectionModeChange,
    hasSelection,
    selectionCount = 0,
}: ViewportToolbarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Map old build-area mode to navigate (unified select mode)
    const displayMode = activeMode === 'build-area' ? 'navigate' : activeMode;

    const handleModeChange = (mode: BuilderMode) => {
        // If clicking on "Select" (navigate), ensure we're in navigate mode
        // The build-area functionality is now integrated via Shift+Drag
        onModeChange(mode);
    };

    return (
        <div
            className={`viewport-toolbar ${isExpanded ? 'expanded' : 'compact'}`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Mode Buttons */}
            {MODES.map(({ mode, icon, label, shortcut, title }) => (
                <button
                    key={mode}
                    className={`toolbar-btn ${displayMode === mode ? 'active' : ''}`}
                    onClick={() => handleModeChange(mode)}
                    title={title}
                >
                    <span className="btn-icon">{isExpanded ? icon : shortcut}</span>
                    {isExpanded && <span className="btn-label">{label}</span>}
                    {mode === 'navigate' && hasSelection && selectionCount > 0 && (
                        <span className="selection-badge">{selectionCount}</span>
                    )}
                </button>
            ))}

            {/* Selection Mode Toggle (only in Select mode, only when expanded) */}
            {displayMode === 'navigate' && isExpanded && (
                <>
                    <div className="toolbar-divider" />
                    <div className="selection-toggle">
                        <button
                            className={`toggle-btn ${selectionMode === 'box' ? 'active' : ''}`}
                            onClick={() => onSelectionModeChange('box')}
                            title="Box Selection - Click or Shift+Drag"
                        >
                            ⬜
                        </button>
                        <button
                            className={`toggle-btn ${selectionMode === 'smart' ? 'active' : ''}`}
                            onClick={() => onSelectionModeChange('smart')}
                            title="Smart Selection - Click to select connected"
                        >
                            🎯
                        </button>
                    </div>
                    {isExpanded && (
                        <div className="toolbar-hint">
                            Shift+Drag: Area
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ViewportToolbar;
