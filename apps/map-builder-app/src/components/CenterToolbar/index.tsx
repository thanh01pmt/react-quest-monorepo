/**
 * CenterToolbar Component
 * 
 * Floating toolbar positioned over the 3D scene containing global controls:
 * - Layer selector (All/Ground/Items)
 * - Smart Snap toggle
 * - Theme selector
 */

import React from 'react';
import { MapTheme } from '../../types';
import './CenterToolbar.css';

interface CenterToolbarProps {
    // Layer control
    activeLayer: 'all' | 'ground' | 'items';
    onLayerChange: (layer: 'all' | 'ground' | 'items') => void;

    // Smart Snap control
    smartSnapEnabled: boolean;
    onToggleSmartSnap: () => void;

    // Theme control
    mapTheme: MapTheme;
    onThemeChange: (theme: MapTheme) => void;
    availableThemes?: MapTheme[];
}

// Default theme options
const defaultThemeOptions = [
    { theme: { ground: 'ground.checker', obstacle: 'wall.brick02' }, displayName: 'Classic' },
    { theme: { ground: 'ground.grass', obstacle: 'wall.stone01' }, displayName: 'Forest' },
    { theme: { ground: 'ground.sand', obstacle: 'wall.brick01' }, displayName: 'Desert' },
    { theme: { ground: 'ground.ice', obstacle: 'wall.stone02' }, displayName: 'Ice' },
];

export function CenterToolbar({
    activeLayer,
    onLayerChange,
    smartSnapEnabled,
    onToggleSmartSnap,
    mapTheme,
    onThemeChange,
    availableThemes,
}: CenterToolbarProps) {
    // Convert availableThemes to options
    const themeOptions = availableThemes
        ? availableThemes.map(t => ({
            theme: t,
            displayName: t.ground.replace('ground.', '').charAt(0).toUpperCase() +
                t.ground.replace('ground.', '').slice(1)
        }))
        : defaultThemeOptions;

    const currentThemeKey = `${mapTheme.ground}-${mapTheme.obstacle}`;


    return (
        <div className="center-toolbar">
            {/* Layer Selector */}
            <div className="toolbar-group">
                <label className="toolbar-label">📐 Layer:</label>
                <select
                    className="toolbar-select"
                    value={activeLayer}
                    onChange={(e) => onLayerChange(e.target.value as 'all' | 'ground' | 'items')}
                >
                    <option value="all">All</option>
                    <option value="ground">Ground</option>
                    <option value="items">Items</option>
                </select>
            </div>

            {/* Smart Snap Toggle */}
            <div className="toolbar-group">
                <label className="toolbar-checkbox">
                    <input
                        type="checkbox"
                        checked={smartSnapEnabled}
                        onChange={onToggleSmartSnap}
                    />
                    <span className="checkbox-label">⚡ Smart Snap</span>
                </label>
            </div>

            {/* Theme Selector */}
            <div className="toolbar-group">
                <label className="toolbar-label">🎨 Theme:</label>
                <select
                    className="toolbar-select"
                    value={currentThemeKey}
                    onChange={(e) => {
                        const option = themeOptions.find(t => `${t.theme.ground}-${t.theme.obstacle}` === e.target.value);
                        if (option) onThemeChange(option.theme);
                    }}
                >
                    {themeOptions.map((option, index) => (
                        <option
                            key={`${option.theme.ground}-${option.theme.obstacle}-${index}`}
                            value={`${option.theme.ground}-${option.theme.obstacle}`}
                        >
                            {option.displayName}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default CenterToolbar;
