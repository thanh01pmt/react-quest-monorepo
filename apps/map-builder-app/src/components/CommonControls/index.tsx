/**
 * CommonControls Component
 * 
 * Shared controls visible in both Manual and Auto modes.
 * Includes: Mode Toggle, Layer Selector, Smart Snap, Theme Selector
 */

import React from 'react';
import { useBuilderMode, BuilderMode } from '../../store/builderModeContext';
import { MapTheme } from '../../types';
import './CommonControls.css';

interface CommonControlsProps {
    /** Current theme */
    mapTheme: MapTheme;
    /** Theme change handler */
    onThemeChange: (theme: MapTheme) => void;
    /** Available themes */
    availableThemes?: MapTheme[];
}

// Extended theme with display name for UI
interface ThemeOption {
    theme: MapTheme;
    displayName: string;
}

// Default themes with display names
const defaultThemeOptions: ThemeOption[] = [
    { theme: { ground: 'ground.checker', obstacle: 'wall.brick02' }, displayName: 'Classic' },
    { theme: { ground: 'ground.grass', obstacle: 'wall.stone01' }, displayName: 'Forest' },
    { theme: { ground: 'ground.sand', obstacle: 'wall.brick01' }, displayName: 'Desert' },
    { theme: { ground: 'ground.ice', obstacle: 'wall.stone02' }, displayName: 'Ice' },
];

export function CommonControls({
    mapTheme,
    onThemeChange,
    availableThemes,
}: CommonControlsProps) {
    const {
        state,
        setMode,
        setActiveLayer,
        toggleSmartSnap,
    } = useBuilderMode();

    const handleModeChange = (mode: BuilderMode) => {
        // Could add confirmation dialog here if needed
        setMode(mode);
    };

    // Convert availableThemes to ThemeOptions
    const themeOptions: ThemeOption[] = availableThemes
        ? availableThemes.map(t => ({
            theme: t,
            displayName: t.ground.replace('ground.', '').charAt(0).toUpperCase() +
                t.ground.replace('ground.', '').slice(1)
        }))
        : defaultThemeOptions;

    // Find current theme option
    const currentThemeKey = mapTheme.ground;

    return (
        <div className="common-controls">
            {/* Mode Toggle */}
            <div className="control-section mode-toggle">
                <div className="mode-buttons">
                    <button
                        className={`mode-btn ${state.mode === 'manual' ? 'active' : ''}`}
                        onClick={() => handleModeChange('manual')}
                        title="Manual Mode - Build map by placing objects"
                    >
                        <span className="mode-icon">🔧</span>
                        <span className="mode-label">Manual</span>
                    </button>
                    <button
                        className={`mode-btn ${state.mode === 'auto' ? 'active' : ''}`}
                        onClick={() => handleModeChange('auto')}
                        title="Auto Mode - Generate map from topology"
                    >
                        <span className="mode-icon">⚡</span>
                        <span className="mode-label">Auto</span>
                    </button>
                </div>
                {state.isEditing && state.mode === 'auto' && (
                    <div className="mode-indicator editing">
                        <span className="indicator-dot"></span>
                        Editing Generated Map
                    </div>
                )}
            </div>

            {/* Layer & Options Row */}
            <div className="control-section controls-row">
                {/* Layer Selector */}
                <div className="control-group">
                    <label className="control-label">Layer</label>
                    <select
                        className="control-select"
                        value={state.activeLayer}
                        onChange={(e) => setActiveLayer(e.target.value as 'all' | 'ground' | 'items')}
                    >
                        <option value="all">All</option>
                        <option value="ground">Ground</option>
                        <option value="items">Items</option>
                    </select>
                </div>

                {/* Smart Snap Toggle */}
                <div className="control-group">
                    <label className="control-checkbox">
                        <input
                            type="checkbox"
                            checked={state.smartSnapEnabled}
                            onChange={toggleSmartSnap}
                        />
                        <span className="checkbox-label">Smart Snap</span>
                    </label>
                </div>
            </div>

            {/* Theme Selector */}
            <div className="control-section">
                <div className="control-group full-width">
                    <label className="control-label">Theme</label>
                    <select
                        className="control-select"
                        value={currentThemeKey}
                        onChange={(e) => {
                            const option = themeOptions.find(t => t.theme.ground === e.target.value);
                            if (option) onThemeChange(option.theme);
                        }}
                    >
                        {themeOptions.map((option) => (
                            <option key={option.theme.ground} value={option.theme.ground}>
                                {option.displayName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

export default CommonControls;
