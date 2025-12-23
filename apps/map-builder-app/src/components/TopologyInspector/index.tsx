/**
 * TopologyInspector - Displays analyzed topology data from MapAnalyzer
 * 
 * Shows segments, keypoints, and positions with ability to highlight them
 * in the 3D scene with different colors.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    MapAnalyzer,
    type PlacementContext,
    type PathSegment,
    type PrioritizedCoord,
    type MapMetrics,
    type Vector3,
    type SpecialPoint,
    type Area,
    type Connector,
    type PathRelation,
    type Pattern
} from '@repo/academic-placer';
import './TopologyInspector.css';

interface TopologyInspectorProps {
    pathInfo: {
        start_pos: [number, number, number];
        target_pos: [number, number, number];
        path_coords: [number, number, number][];
        placement_coords?: [number, number, number][];
        metadata?: Record<string, any>;
    } | null;
    onHighlightChange?: (highlights: HighlightItem[]) => void;
}

export interface HighlightItem {
    id: string;
    type: 'segment' | 'keypoint' | 'position' | 'area' | 'relation';
    color: string;
    positions: Vector3[];
}

// Available colors for highlighting
const HIGHLIGHT_COLORS = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#f97316', // orange
    '#a855f7', // purple
    '#ec4899', // pink
    '#eab308', // yellow
    '#06b6d4', // cyan
    '#ef4444', // red
];

export function TopologyInspector({ pathInfo, onHighlightChange }: TopologyInspectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [context, setContext] = useState<PlacementContext | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Analyze topology when pathInfo changes
    const analyze = useCallback(() => {
        if (!pathInfo?.path_coords || pathInfo.path_coords.length === 0) {
            setError('No path data available');
            return;
        }

        try {
            // Convert pathInfo to GameConfig format
            const blocks = pathInfo.path_coords.map((coord, i) => ({
                modelKey: `block_${i}`,
                position: { x: coord[0], y: coord[1], z: coord[2] }
            }));

            const gameConfig = {
                type: pathInfo.metadata?.topology_type || 'unknown',
                blocks,
                players: [{
                    id: 'player1',
                    start: {
                        x: pathInfo.start_pos[0],
                        y: pathInfo.start_pos[1],
                        z: pathInfo.start_pos[2],
                        direction: 0
                    }
                }],
                finish: {
                    x: pathInfo.target_pos[0],
                    y: pathInfo.target_pos[1],
                    z: pathInfo.target_pos[2]
                }
            };

            const analyzer = new MapAnalyzer({ gameConfig });
            const result = analyzer.analyze();
            setContext(result);
            setError(null);
        } catch (e) {
            console.error('Failed to analyze topology:', e);
            setError('Analysis failed. Check console.');
        }
    }, [pathInfo]);

    // Toggle item selection
    const toggleItem = useCallback((id: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Build highlight items from selected items
    const highlights = useMemo(() => {
        if (!context) return [];

        const items: HighlightItem[] = [];
        let colorIndex = 0;

        // Add selected points from Tier 1
        context.points.forEach((point, i) => {
            const id = `point_${i}`;
            if (selectedItems.has(id)) {
                items.push({
                    id,
                    type: 'keypoint',
                    color: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                    positions: [point.coord]
                });
                colorIndex++;
            }
        });

        // Add selected segments from Tier 3
        context.segments.forEach(seg => {
            if (selectedItems.has(seg.id)) {
                items.push({
                    id: seg.id,
                    type: 'segment',
                    color: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                    positions: seg.points
                });
                colorIndex++;
            }
        });

        // Add selected positions from Tier 4 prioritizedCoords
        context.prioritizedCoords.forEach((coord, i) => {
            const id = `coord_${i}`;
            if (selectedItems.has(id)) {
                items.push({
                    id,
                    type: 'position',
                    color: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                    positions: [coord.position]
                });
                colorIndex++;
            }
        });

        // Add selected areas from Tier 1
        context.areas.forEach((area) => {
            if (selectedItems.has(area.id)) {
                items.push({
                    id: area.id,
                    type: 'area',
                    color: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                    positions: area.blocks // All blocks in the area
                });
                colorIndex++;
            }
        });

        // Add selected relations from Tier 1
        context.relations.forEach((rel, i) => {
            const id = `rel_${i}`;
            if (selectedItems.has(id)) {
                const positions: Vector3[] = [];

                // Try to find segments by ID (handle both original and merged IDs)
                const seg1 = context.segments.find(s =>
                    s.id === rel.path1Id || s.id.includes(rel.path1Id) || rel.path1Id.includes(s.id)
                );
                const seg2 = context.segments.find(s =>
                    s.id === rel.path2Id || s.id.includes(rel.path2Id) || rel.path2Id.includes(s.id)
                );

                if (seg1 && seg1.points.length > 0) {
                    positions.push(seg1.points[Math.floor(seg1.points.length / 2)]);
                }
                if (seg2 && seg2.points.length > 0) {
                    positions.push(seg2.points[Math.floor(seg2.points.length / 2)]);
                }

                // Fallback: if we have axis/center metadata, use those
                if (positions.length < 2 && rel.metadata) {
                    if (rel.metadata.center) {
                        positions.push(rel.metadata.center);
                    }
                    if (rel.metadata.axis) {
                        positions.push(rel.metadata.axis);
                    }
                }

                // If still no positions, use first two segments as approximation
                if (positions.length < 2 && context.segments.length >= 2) {
                    const s1 = context.segments[0];
                    const s2 = context.segments[1];
                    if (s1.points.length > 0) positions.push(s1.points[Math.floor(s1.points.length / 2)]);
                    if (s2.points.length > 0 && positions.length < 2) positions.push(s2.points[Math.floor(s2.points.length / 2)]);
                }

                if (positions.length >= 2) {
                    items.push({
                        id,
                        type: 'relation',
                        color: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                        positions
                    });
                    colorIndex++;
                }
            }
        });

        return items;
    }, [context, selectedItems]);

    // Notify parent of highlight changes
    React.useEffect(() => {
        onHighlightChange?.(highlights);
    }, [highlights, onHighlightChange]);

    // Track pathInfo version to detect new generation
    const pathInfoKey = useMemo(() => {
        if (!pathInfo) return '';
        return JSON.stringify({
            start: pathInfo.start_pos,
            target: pathInfo.target_pos,
            length: pathInfo.path_coords.length,
            // Use first and last coords as fingerprint
            first: pathInfo.path_coords[0],
            last: pathInfo.path_coords[pathInfo.path_coords.length - 1]
        });
    }, [pathInfo]);

    // Auto-analyze when pathInfo changes (new generation)
    React.useEffect(() => {
        if (pathInfo && pathInfoKey) {
            // Reset context when pathInfo changes to trigger re-analyze
            setContext(null);
            setSelectedItems(new Set());
            setError(null);
            // Auto-analyze after reset
            setTimeout(() => {
                if (pathInfo?.path_coords?.length > 0) {
                    analyze();
                }
            }, 100);
        }
    }, [pathInfoKey]); // Only trigger on pathInfo change

    return (
        <div className="topology-inspector">
            <button
                className="inspector-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span>🔍 Topology Inspector</span>
                <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && (
                <div className="inspector-content">
                    {/* Refresh button */}
                    <button className="refresh-btn" onClick={analyze}>
                        🔄 Analyze
                    </button>

                    {error && (
                        <div className="inspector-error">{error}</div>
                    )}

                    {context && (
                        <>
                            {/* Metrics Summary */}
                            <div className="metrics-section">
                                <h4>📊 Summary</h4>
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <span className="metric-label">Blocks</span>
                                        <span className="metric-value">{context.metrics.totalBlocks}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Points (T1)</span>
                                        <span className="metric-value">{context.points.length}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Segments (T3)</span>
                                        <span className="metric-value">{context.segments.length}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Patterns (T2)</span>
                                        <span className="metric-value">{context.patterns.length}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Priority Coords (T4)</span>
                                        <span className="metric-value">{context.prioritizedCoords.length}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Size</span>
                                        <span className="metric-value">{context.metrics.estimatedSize}</span>
                                    </div>
                                </div>
                                {context.metrics.detectedTopology && (
                                    <div className="detected-topology">
                                        🗺️ Detected: <strong>{context.metrics.detectedTopology}</strong>
                                    </div>
                                )}
                            </div>

                            {/* ===== TIER 1: Geometric Decomposition ===== */}
                            <div className="tier-section">
                                <h3 className="tier-header">Tier 1: Geometric Decomposition</h3>

                                {/* Points */}
                                <div className="points-section">
                                    <h4>📍 Special Points ({context.points.length})</h4>
                                    <div className="items-list">
                                        {context.points.slice(0, 10).map((point, i) => {
                                            const id = `point_${i}`;
                                            return (
                                                <label key={id} className="item-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(id)}
                                                        onChange={() => toggleItem(id)}
                                                    />
                                                    <span className="item-info">
                                                        <span className={`point-type type-${point.type}`}>
                                                            {point.type}
                                                        </span>
                                                        <span className="item-meta">
                                                            ({point.coord.x}, {point.coord.y}, {point.coord.z}) • {point.connectedSegments.length} segs
                                                        </span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                        {context.points.length > 10 && (
                                            <div className="more-items">+{context.points.length - 10} more points</div>
                                        )}
                                    </div>
                                </div>

                                {/* Areas */}
                                {context.areas.length > 0 && (
                                    <div className="areas-section">
                                        <h4>🔲 Areas ({context.areas.length})</h4>
                                        <div className="items-list">
                                            {context.areas.map((area, i) => (
                                                <label key={area.id} className="item-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(area.id)}
                                                        onChange={() => toggleItem(area.id)}
                                                        style={{
                                                            accentColor: selectedItems.has(area.id)
                                                                ? HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]
                                                                : undefined
                                                        }}
                                                    />
                                                    <span className="item-info">
                                                        <span className="item-name">{area.id}</span>
                                                        <span className="item-meta">{area.blocks.length} blocks • center: ({area.center.x.toFixed(1)}, {area.center.y.toFixed(1)}, {area.center.z.toFixed(1)})</span>
                                                    </span>
                                                    {selectedItems.has(area.id) && (
                                                        <span
                                                            className="color-dot"
                                                            style={{ backgroundColor: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] }}
                                                        />
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Connectors */}
                                {context.connectors.length > 0 && (
                                    <div className="connectors-section">
                                        <h4>🔗 Connectors ({context.connectors.length})</h4>
                                        <div className="items-list">
                                            {context.connectors.map(conn => (
                                                <div key={conn.id} className="item-row compact">
                                                    <span className="item-name">{conn.fromArea} → {conn.toArea}</span>
                                                    <span className="item-meta">{conn.path.length} path pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Relations */}
                                {context.relations.length > 0 && (
                                    <div className="relations-section">
                                        <h4>⚖️ Relations ({context.relations.length})</h4>
                                        <div className="items-list">
                                            {context.relations.slice(0, 8).map((rel, i) => {
                                                const id = `rel_${i}`;
                                                return (
                                                    <label key={id} className="item-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(id)}
                                                            onChange={() => toggleItem(id)}
                                                            style={{
                                                                accentColor: selectedItems.has(id)
                                                                    ? HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]
                                                                    : undefined
                                                            }}
                                                        />
                                                        <span className="item-info">
                                                            <span className={`relation-type type-${rel.type}`}>{rel.type}</span>
                                                            <span className="item-meta">{rel.path1Id} ↔ {rel.path2Id}</span>
                                                        </span>
                                                        {selectedItems.has(id) && (
                                                            <span
                                                                className="color-dot"
                                                                style={{ backgroundColor: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] }}
                                                            />
                                                        )}
                                                    </label>
                                                );
                                            })}
                                            {context.relations.length > 8 && (
                                                <div className="more-items">+{context.relations.length - 8} more relations</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== TIER 2: Patterns ===== */}
                            {context.patterns.length > 0 && (
                                <div className="tier-section">
                                    <h3 className="tier-header">Tier 2: Pattern Extrapolation</h3>
                                    <div className="patterns-section">
                                        <h4>🔄 Patterns ({context.patterns.length})</h4>
                                        <div className="items-list">
                                            {context.patterns.map((pattern) => (
                                                <div key={pattern.id} className="pattern-item">
                                                    <span className={`pattern-type type-${pattern.type}`}>
                                                        {pattern.type}
                                                    </span>
                                                    <span className="pattern-meta">
                                                        {pattern.repetitions}x • {pattern.unitElements.length} elements
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== TIER 3: Filtered Segments ===== */}
                            <div className="tier-section">
                                <h3 className="tier-header">Tier 3: Length Filtering</h3>
                                <div className="segments-section">
                                    <h4>📏 Merged Segments ({context.segments.length})</h4>
                                    <div className="items-list">
                                        {context.segments.map((seg, i) => (
                                            <label key={seg.id} className="item-row">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(seg.id)}
                                                    onChange={() => toggleItem(seg.id)}
                                                    style={{
                                                        accentColor: selectedItems.has(seg.id)
                                                            ? HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]
                                                            : undefined
                                                    }}
                                                />
                                                <span className="item-info">
                                                    <span className="item-name">{seg.id}</span>
                                                    <span className="item-meta">
                                                        {seg.points.length} pts • L={seg.length.toFixed(1)} • {seg.plane || '3d'}
                                                    </span>
                                                </span>
                                                {selectedItems.has(seg.id) && (
                                                    <span
                                                        className="color-dot"
                                                        style={{ backgroundColor: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] }}
                                                    />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Positions */}
                                <div className="positions-section">
                                    <h4>📍 Priority Positions ({context.prioritizedCoords.length}) <span className="tier-label">(Tier 4)</span></h4>
                                    <div className="items-list">
                                        {context.prioritizedCoords.slice(0, 15).map((coord, i) => {
                                            const id = `coord_${i}`;
                                            return (
                                                <label key={id} className="item-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(id)}
                                                        onChange={() => toggleItem(id)}
                                                    />
                                                    <span className="item-info">
                                                        <span className={`priority-badge priority-${coord.category}`}>
                                                            {coord.category}
                                                        </span>
                                                        <span className="item-meta">
                                                            ({coord.position.x}, {coord.position.y}, {coord.position.z})
                                                        </span>
                                                    </span>
                                                    <span className="priority-score">P{coord.priority}</span>
                                                </label>
                                            );
                                        })}
                                        {context.prioritizedCoords.length > 15 && (
                                            <div className="more-items">
                                                +{context.prioritizedCoords.length - 15} more positions
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!context && !error && (
                        <div className="empty-state">
                            Click "Analyze" to inspect topology structure
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TopologyInspector;

