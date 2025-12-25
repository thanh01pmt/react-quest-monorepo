/**
 * MapInspector Component - Upgraded for Unified Validation
 * 
 * Works in both Manual and Auto modes:
 * - Manual mode: Uses traced path from usePathTracer
 * - Auto mode: Uses pathInfo from generator
 * 
 * Shows: Path Steps, Items, Complexity, Validation Status
 */

import React, { useMemo, useState } from 'react';
import { PlacedObject } from '../../types';
import { validateMap, ValidationReport } from '@repo/academic-map-generator';
import { PedagogyStrategy } from '@repo/academic-map-generator';
import { ValidationReportComponent } from '../ValidationReport';
import { usePathTracer, TracedPath } from '../../hooks/usePathTracer';
import { BuilderMode } from '../../store/builderModeContext';
import { IPathInfo } from '@repo/academic-map-generator';

interface MapInspectorProps {
    placedObjects: PlacedObject[];
    pathInfo?: IPathInfo | null;
    solutionPath?: [number, number, number][];
    strategy?: PedagogyStrategy;
    mode?: BuilderMode;
}

export const MapInspector: React.FC<MapInspectorProps> = ({
    placedObjects,
    pathInfo,
    solutionPath,
    strategy = PedagogyStrategy.NONE,
    mode = 'manual'
}) => {
    const [showValidation, setShowValidation] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Use path tracer for manual mode
    const tracedPath = usePathTracer(placedObjects);

    // Get effective path based on mode
    const effectivePath = useMemo(() => {
        if (mode === 'auto' && solutionPath && solutionPath.length > 0) {
            return solutionPath;
        }
        if (mode === 'auto' && pathInfo?.path_coords) {
            return pathInfo.path_coords;
        }
        // Manual mode: use traced path
        return tracedPath.path;
    }, [mode, solutionPath, pathInfo, tracedPath.path]);

    // Build effective pathInfo for validation
    const effectivePathInfo = useMemo((): IPathInfo | null => {
        if (mode === 'auto' && pathInfo) {
            return pathInfo;
        }

        // Manual mode: construct from traced path
        if (!tracedPath.startFound || !tracedPath.finishFound) {
            return null;
        }

        const startObj = placedObjects.find(
            obj => obj.asset.key === 'player_start'
        );
        const finishObj = placedObjects.find(
            obj => obj.asset.key === 'finish' || obj.asset.key === 'goal'
        );

        if (!startObj || !finishObj) return null;

        return {
            start_pos: startObj.position as [number, number, number],
            target_pos: finishObj.position as [number, number, number],
            path_coords: tracedPath.path,
            placement_coords: tracedPath.path.slice(1, -1),
            obstacles: [],
            metadata: { mode: 'manual' },
        };
    }, [mode, pathInfo, tracedPath, placedObjects]);

    // Compute stats
    const stats = useMemo(() => {
        const items = placedObjects.filter(
            o => o.asset.type === 'collectible' || o.asset.type === 'interactible'
        );

        const pathLength = effectivePath.length;
        const complexity = Math.round((pathLength * 0.1) + (items.length * 0.5));

        return {
            itemCount: items.length,
            pathLength: pathLength,
            complexity,
            accessibleItems: mode === 'manual' ? tracedPath.accessibleItems.length : items.length,
            hasStart: mode === 'manual' ? tracedPath.startFound : !!pathInfo?.start_pos,
            hasFinish: mode === 'manual' ? tracedPath.finishFound : !!pathInfo?.target_pos,
            isReachable: mode === 'manual' ? tracedPath.isReachable : !!pathInfo,
        };
    }, [placedObjects, effectivePath, mode, tracedPath, pathInfo]);

    // Validation report
    const validationReport: ValidationReport | null = useMemo(() => {
        if (!effectivePathInfo) return null;

        return validateMap({
            objects: placedObjects,
            pathInfo: effectivePathInfo,
            strategy,
            logicType: strategy
        });
    }, [placedObjects, effectivePathInfo, strategy]);

    // Validation status
    const validationStatus = useMemo(() => {
        // Check for missing elements first
        if (!stats.hasStart) {
            return { icon: '⚠️', label: 'No Start', color: '#f59e0b' };
        }
        if (!stats.hasFinish) {
            return { icon: '⚠️', label: 'No Finish', color: '#f59e0b' };
        }
        if (!stats.isReachable) {
            return { icon: '❌', label: 'No Path', color: '#ef4444' };
        }

        if (!validationReport) {
            return { icon: '⚪', label: 'Unknown', color: '#666' };
        }
        if (validationReport.isValid) {
            return { icon: '✅', label: 'Valid', color: '#22c55e' };
        }
        if (validationReport.tier1.passed && validationReport.tier2.passed) {
            return { icon: '⚠️', label: 'Minor Issues', color: '#f59e0b' };
        }
        if (validationReport.tier1.passed) {
            return { icon: '⚠️', label: 'Strategy Issue', color: '#f59e0b' };
        }
        return { icon: '❌', label: 'Invalid', color: '#ef4444' };
    }, [validationReport, stats]);

    // Mode indicator
    const modeLabel = mode === 'auto' ? '⚡ Auto' : '🔧 Manual';

    if (isMinimized) {
        return (
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: 'rgba(30, 30, 30, 0.95)',
                color: '#eee',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                zIndex: 900,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid #444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }} onClick={() => setIsMinimized(false)} title="Click to expand inspector">

                {/* Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#888' }}>👣</span>
                    <strong style={{ color: stats.pathLength > 0 ? '#4caf50' : '#888' }}>{stats.pathLength}</strong>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #444', paddingLeft: '12px' }}>
                    <span style={{ color: '#2196f3' }}>💎</span>
                    <strong>{stats.itemCount}</strong>
                </div>

                {/* Validation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #444', paddingLeft: '12px' }}>
                    <span>{validationStatus.icon}</span>
                    <span style={{ color: validationStatus.color }}>{validationStatus.label}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: 'rgba(30, 30, 30, 0.95)',
                color: '#eee',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                zIndex: 900,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                minWidth: '180px',
                border: '1px solid #444'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    borderBottom: '1px solid #555',
                    paddingBottom: '4px'
                }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>Map Inspector</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: '11px',
                            color: mode === 'auto' ? '#22c55e' : '#3b82f6',
                            background: mode === 'auto' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}>
                            {modeLabel}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                padding: '0 4px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Minimize"
                        >
                            －
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Path Steps:</span>
                    <strong style={{ color: stats.pathLength > 0 ? '#4caf50' : '#666' }}>
                        {stats.pathLength || '—'}
                    </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Items:</span>
                    <strong style={{ color: '#2196f3' }}>
                        {stats.itemCount}
                        {mode === 'manual' && stats.accessibleItems !== stats.itemCount && (
                            <span style={{ color: '#f59e0b', fontSize: '11px' }}>
                                {' '}({stats.accessibleItems} accessible)
                            </span>
                        )}
                    </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Complexity:</span>
                    <strong style={{ color: '#ff9800' }}>{stats.complexity}</strong>
                </div>

                {/* Validation Status */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #555',
                        paddingTop: '8px',
                        cursor: validationReport ? 'pointer' : 'default',
                        opacity: validationReport ? 1 : 0.7
                    }}
                    onClick={() => validationReport && setShowValidation(!showValidation)}
                >
                    <span>Validation:</span>
                    <span style={{
                        color: validationStatus.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>{validationStatus.icon}</span>
                        <strong>{validationStatus.label}</strong>
                    </span>
                </div>

                {validationReport && (
                    <div style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#888',
                        textAlign: 'center'
                    }}>
                        Click to {showValidation ? 'hide' : 'show'} details
                    </div>
                )}
            </div>

            {/* Validation Report Modal */}
            {showValidation && validationReport && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '220px',
                    maxWidth: '400px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    zIndex: 950
                }}>
                    <ValidationReportComponent
                        report={validationReport}
                        onClose={() => setShowValidation(false)}
                    />
                </div>
            )}
        </>
    );
}
