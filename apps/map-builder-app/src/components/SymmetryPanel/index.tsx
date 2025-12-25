/**
 * SymmetryPanel Component
 * 
 * Right sidebar panel for controlling symmetry mode.
 * Features:
 * - Enable/Disable toggle
 * - Axis selector (X / Z / Both)
 * - Center line inputs
 */

import React from 'react';
import { Zap, Settings, Info, ChevronUp, ChevronDown } from 'lucide-react';
import './SymmetryPanel.css';

export type SymmetryAxis = 'x' | 'z' | 'both';

interface SymmetryPanelProps {
    /** Whether symmetry mode is enabled */
    enabled: boolean;
    /** Toggle symmetry mode */
    onToggle: (enabled: boolean) => void;
    /** Current symmetry axis */
    axis: SymmetryAxis;
    /** Set symmetry axis */
    onAxisChange: (axis: SymmetryAxis) => void;
    /** Center point for symmetry */
    center: { x: number; z: number };
    /** Set center point */
    onCenterChange: (center: { x: number; z: number }) => void;
    /** Grid dimensions for validation */
    gridWidth?: number;
    gridDepth?: number;
}

export function SymmetryPanel({
    enabled,
    onToggle,
    axis,
    onAxisChange,
    center,
    onCenterChange,
    gridWidth = 14,
    gridDepth = 14,
}: SymmetryPanelProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Auto-expand when enabled
    React.useEffect(() => {
        if (enabled) {
            setIsCollapsed(false);
        }
    }, [enabled]);

    return (
        <div className={`symmetry-panel ${enabled ? 'enabled' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="symmetry-header">
                <span className="symmetry-icon"><Zap size={16} fill="currentColor" /></span>
                <span className="symmetry-title">Symmetry Mode</span>

                {enabled && (
                    <button
                        className="collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Show Options" : "Hide Options"}
                    >
                        {isCollapsed ? <Settings size={14} /> : <ChevronUp size={14} />}
                    </button>
                )}

                <label className="symmetry-toggle">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => onToggle(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {enabled && !isCollapsed && (
                <div className="symmetry-options">
                    {/* Axis Selector */}
                    <div className="option-group">
                        <label>Mirror Axis</label>
                        <div className="axis-buttons">
                            <button
                                className={`axis-btn ${axis === 'x' ? 'active' : ''}`}
                                onClick={() => onAxisChange('x')}
                                title="Horizontal line - objects mirror top/bottom"
                            >
                                ─ Horizontal
                            </button>
                            <button
                                className={`axis-btn ${axis === 'z' ? 'active' : ''}`}
                                onClick={() => onAxisChange('z')}
                                title="Vertical line - objects mirror left/right"
                            >
                                │ Vertical
                            </button>
                            <button
                                className={`axis-btn ${axis === 'both' ? 'active' : ''}`}
                                onClick={() => onAxisChange('both')}
                                title="Both axes - objects mirror in 4 quadrants"
                            >
                                ✛ Both
                            </button>
                        </div>
                    </div>

                    {/* Center Line Inputs */}
                    <div className="option-group">
                        <label>Center Line</label>
                        <div className="center-inputs">
                            {(axis === 'z' || axis === 'both') && (
                                <div className="input-row">
                                    <span className="input-label">X:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={gridWidth}
                                        step={0.5}
                                        value={center.x}
                                        onChange={(e) => onCenterChange({ ...center, x: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            )}
                            {(axis === 'x' || axis === 'both') && (
                                <div className="input-row">
                                    <span className="input-label">Z:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={gridDepth}
                                        step={0.5}
                                        value={center.z}
                                        onChange={(e) => onCenterChange({ ...center, z: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="option-group">
                        <label>Quick Set</label>
                        <div className="quick-buttons">
                            <button
                                className="quick-btn"
                                onClick={() => onCenterChange({ x: gridWidth / 2, z: gridDepth / 2 })}
                                title="Set center to middle of grid"
                            >
                                Center
                            </button>
                            <button
                                className="quick-btn"
                                onClick={() => onCenterChange({ x: gridWidth / 2 - 0.5, z: gridDepth / 2 - 0.5 })}
                                title="Set center between tiles"
                            >
                                Between Tiles
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="symmetry-info">
                        <span className="info-icon"><Info size={14} /></span>
                        <span>Objects placed will auto-mirror {
                            axis === 'x' ? 'top/bottom (across horizontal line)' :
                                axis === 'z' ? 'left/right (across vertical line)' :
                                    'in all 4 quadrants'
                        }.</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SymmetryPanel;
