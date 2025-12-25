/**
 * CommonControls Component
 * 
 * Shared controls visible in both Manual and Auto modes.
 * Includes: Mode Toggle, Layer Selector, Smart Snap, Symmetry, Theme Selector
 */

import React, { useState, useRef, useEffect } from 'react';
import { useBuilderMode, BuilderMode } from '../../store/builderModeContext';
import { MapTheme } from '../../types';
import './CommonControls.css';

export type SymmetryAxis = 'x' | 'z' | 'both';

export interface CommonControlsProps {
    /** Current theme */
    mapTheme: MapTheme;
    /** Theme change handler */
    onThemeChange: (theme: MapTheme) => void;
    /** Available themes */
    availableThemes?: MapTheme[];

    // Symmetry Props
    symmetryEnabled: boolean;
    onSymmetryToggle: (enabled: boolean) => void;
    symmetryAxis: SymmetryAxis;
    onSymmetryAxisChange: (axis: SymmetryAxis) => void;
    symmetryCenter: { x: number; z: number };
    onSymmetryCenterChange: (center: { x: number; z: number }) => void;
    gridWidth?: number;
    gridDepth?: number;
}

interface ThemeOption {
    theme: MapTheme;
    displayName: string;
}

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
    symmetryEnabled,
    onSymmetryToggle,
    symmetryAxis,
    onSymmetryAxisChange,
    symmetryCenter,
    onSymmetryCenterChange,
    gridWidth = 14,
    gridDepth = 14,
}: CommonControlsProps) {
    const { state, setMode, setActiveLayer, toggleSmartSnap } = useBuilderMode();
    const [showSymmetrySettings, setShowSymmetrySettings] = useState(false);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                settingsButtonRef.current &&
                !settingsButtonRef.current.contains(event.target as Node)
            ) {
                setShowSymmetrySettings(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleModeChange = (mode: BuilderMode) => {
        setMode(mode);
    };

    const themeOptions: ThemeOption[] = availableThemes
        ? availableThemes.map(t => ({
            theme: t,
            displayName: t.ground.replace('ground.', '').charAt(0).toUpperCase() +
                t.ground.replace('ground.', '').slice(1)
        }))
        : defaultThemeOptions;

    const currentThemeKey = mapTheme.ground;

    return (
        <div className="common-controls">
            {/* Mode Toggle */}
            <div className="control-section mode-toggle">
                <div className="mode-buttons">
                    <button
                        className={`mode-btn ${state.mode === 'manual' ? 'active' : ''}`}
                        onClick={() => handleModeChange('manual')}
                        title="Manual Mode"
                    >
                        <span className="mode-icon">🔧</span>
                        <span className="mode-label">Manual</span>
                    </button>
                    <button
                        className={`mode-btn ${state.mode === 'auto' ? 'active' : ''}`}
                        onClick={() => handleModeChange('auto')}
                        title="Auto Mode"
                    >
                        <span className="mode-icon">⚡</span>
                        <span className="mode-label">Auto</span>
                    </button>
                </div>
            </div>

            {/* Middle Controls (Layer, Snap, Symmetry) */}
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

                <div className="divider-vertical" style={{ width: 1, height: 24, background: '#444' }} />

                {/* Smart Snap */}
                <div className="control-group">
                    <label className="control-checkbox" title="Align objects to grid">
                        <input
                            type="checkbox"
                            checked={state.smartSnapEnabled}
                            onChange={toggleSmartSnap}
                        />
                        <span className="checkbox-label">Smart Snap</span>
                    </label>
                </div>

                <div className="divider-vertical" style={{ width: 1, height: 24, background: '#444' }} />

                {/* Symmetry Toggle & Settings */}
                <div className="control-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label className="control-checkbox" title="Mirror object placement">
                            <input
                                type="checkbox"
                                checked={symmetryEnabled}
                                onChange={(e) => {
                                    onSymmetryToggle(e.target.checked);
                                    if (e.target.checked) setShowSymmetrySettings(true);
                                }}
                            />
                            <span className="checkbox-label" style={{ color: symmetryEnabled ? '#00ff88' : '#ccc' }}>
                                Symmetry
                            </span>
                        </label>
                        {symmetryEnabled && (
                            <button
                                ref={settingsButtonRef}
                                onClick={() => setShowSymmetrySettings(!showSymmetrySettings)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '2px',
                                    opacity: showSymmetrySettings ? 1 : 0.7
                                }}
                                title="Symmetry Settings"
                            >
                                ⚙️
                            </button>
                        )}
                    </div>

                    {/* Symmetry Popover */}
                    {showSymmetrySettings && (
                        <div
                            ref={popoverRef}
                            className="symmetry-popover"
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginTop: '10px',
                                background: '#1e1e24',
                                border: '1px solid #444',
                                borderRadius: '8px',
                                padding: '12px',
                                width: '240px',
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            }}
                        >
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Symmetry Settings</h4>

                            {/* Axis */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Mirror Axis</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[
                                        { id: 'x', label: 'Horiz' },
                                        { id: 'z', label: 'Vert' },
                                        { id: 'both', label: 'Both' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => onSymmetryAxisChange(opt.id as SymmetryAxis)}
                                            style={{
                                                flex: 1,
                                                padding: '4px',
                                                fontSize: '11px',
                                                background: symmetryAxis === opt.id ? 'rgba(0, 255, 136, 0.2)' : '#2a2a2e',
                                                color: symmetryAxis === opt.id ? '#00ff88' : '#888',
                                                border: `1px solid ${symmetryAxis === opt.id ? '#00ff88' : '#444'}`,
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Center */}
                            <div>
                                <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Center Line</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '10px', color: '#666' }}>X:</span>
                                        <input
                                            type="number"
                                            value={symmetryCenter.x}
                                            step={0.5}
                                            onChange={(e) => onSymmetryCenterChange({ ...symmetryCenter, x: parseFloat(e.target.value) || 0 })}
                                            style={{ width: '100%', background: '#2a2a2e', border: '1px solid #444', color: '#fff', padding: '2px 4px', fontSize: '12px' }}
                                            disabled={symmetryAxis === 'x'}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '10px', color: '#666' }}>Z:</span>
                                        <input
                                            type="number"
                                            value={symmetryCenter.z}
                                            step={0.5}
                                            onChange={(e) => onSymmetryCenterChange({ ...symmetryCenter, z: parseFloat(e.target.value) || 0 })}
                                            style={{ width: '100%', background: '#2a2a2e', border: '1px solid #444', color: '#fff', padding: '2px 4px', fontSize: '12px' }}
                                            disabled={symmetryAxis === 'z'}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => onSymmetryCenterChange({ x: gridWidth / 2, z: gridDepth / 2 })}
                                        style={{ flex: 1, padding: '2px', fontSize: '10px', background: '#333', color: '#ccc', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                                    >
                                        Center Grid
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
