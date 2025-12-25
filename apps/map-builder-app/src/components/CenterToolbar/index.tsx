/**
 * CenterToolbar Component
 * 
 * Floating toolbar positioned over the 3D scene containing global controls:
 * - Layer selector (All/Ground/Items)
 * - Smart Snap toggle
 * - Symmetry Mode (Integrated)
 * - Theme selector
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapTheme } from '../../types';
import type { SymmetryAxis } from '../../utils/SymmetryMode';
import { Zap, Settings } from 'lucide-react';
import './CenterToolbar.css';

interface CenterToolbarProps {
    // Layer control
    activeLayer: 'all' | 'ground' | 'items';
    onLayerChange: (layer: 'all' | 'ground' | 'items') => void;

    // Smart Snap control
    smartSnapEnabled: boolean;
    onToggleSmartSnap: () => void;

    // Symmetry control (NEW)
    symmetryEnabled: boolean;
    onSymmetryToggle: (enabled: boolean) => void;
    symmetryAxis: SymmetryAxis;
    onSymmetryAxisChange: (axis: SymmetryAxis) => void;
    symmetryCenter: { x: number; z: number };
    onSymmetryCenterChange: (center: { x: number; z: number }) => void;
    gridWidth?: number;
    gridDepth?: number;

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
    symmetryEnabled,
    onSymmetryToggle,
    symmetryAxis,
    onSymmetryAxisChange,
    symmetryCenter,
    onSymmetryCenterChange,
    gridWidth = 14,
    gridDepth = 14,
}: CenterToolbarProps) {
    const [showSymmetrySettings, setShowSymmetrySettings] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);

    // Convert availableThemes to options
    const themeOptions = availableThemes
        ? availableThemes.map(t => ({
            theme: t,
            displayName: t.ground.replace('ground.', '').charAt(0).toUpperCase() +
                t.ground.replace('ground.', '').slice(1)
        }))
        : defaultThemeOptions;

    const currentThemeKey = `${mapTheme.ground}-${mapTheme.obstacle}`;

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

    return (
        <div className="center-toolbar">
            {/* Layer Selector */}
            <div className="toolbar-group">
                <label className="toolbar-label">Layer:</label>
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
                    <span className="checkbox-label"><Zap size={12} fill="currentColor" /> Smart Snap</span>
                </label>
            </div>

            {/* Symmetry Toggle & Settings */}
            <div className="toolbar-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label className="toolbar-checkbox" title="Mirror object placement">
                        <input
                            type="checkbox"
                            checked={symmetryEnabled}
                            onChange={(e) => {
                                onSymmetryToggle(e.target.checked);
                                if (e.target.checked) setShowSymmetrySettings(true);
                            }}
                        />
                        <span className="checkbox-label" style={{ color: symmetryEnabled ? '#00ff88' : 'inherit' }}>
                            <Zap size={12} fill="currentColor" /> Sym
                        </span>
                    </label>
                    {symmetryEnabled && (
                        <button
                            ref={settingsButtonRef}
                            onClick={() => setShowSymmetrySettings(!showSymmetrySettings)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '10px',
                                padding: '2px 4px',
                                opacity: showSymmetrySettings ? 1 : 0.7,
                                marginLeft: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Symmetry Settings"
                        >
                            <Settings size={12} />
                        </button>
                    )}
                </div>

                {/* Symmetry Setting Popover */}
                {showSymmetrySettings && (
                    <div
                        ref={popoverRef}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '12px',
                            background: '#1e1e24',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            padding: '12px',
                            width: '240px',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}
                    >
                        <h4 style={{ margin: 0, fontSize: '11px', color: '#888', textTransform: 'uppercase', textAlign: 'center' }}>Symmetry Settings</h4>

                        {/* Axis */}
                        <div>
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
                                        style={{ width: '100%', background: '#2a2a2e', border: '1px solid #444', color: '#fff', padding: '2px 4px', fontSize: '12px', borderRadius: '4px' }}
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
                                        style={{ width: '100%', background: '#2a2a2e', border: '1px solid #444', color: '#fff', padding: '2px 4px', fontSize: '12px', borderRadius: '4px' }}
                                        disabled={symmetryAxis === 'z'}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex' }}>
                                <button
                                    onClick={() => onSymmetryCenterChange({ x: gridWidth / 2, z: gridDepth / 2 })}
                                    style={{ flex: 1, padding: '4px', fontSize: '10px', background: '#333', color: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Reset to Grid Center
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                            Objects placed will match across the selected axis.
                        </div>
                    </div>
                )}
            </div>

            {/* Theme Selector */}
            <div className="toolbar-group">
                <label className="toolbar-label">Theme:</label>
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
