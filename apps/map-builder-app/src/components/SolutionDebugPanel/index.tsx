/**
 * SolutionDebugPanel - Displays the planned solution for debugging
 * 
 * Features:
 * - Collapsible panel
 * - Shows path, raw actions, structured solution
 * - Copy to clipboard functionality
 */

import React, { useState } from 'react';
import { PlannedSolution } from '@repo/academic-map-generator/generator';

interface SolutionDebugPanelProps {
    plannedSolution?: PlannedSolution | null;
}

export const SolutionDebugPanel: React.FC<SolutionDebugPanelProps> = ({ plannedSolution }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'pattern' | 'path' | 'actions' | 'structured'>('summary');

    if (!plannedSolution) {
        return null;
    }

    const handleCopy = () => {
        const text = JSON.stringify(plannedSolution, null, 2);
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const formatPath = (path: [number, number, number][]) => {
        return path.map((p, i) => `${i}: (${p[0]}, ${p[1]}, ${p[2]})`).join('\n');
    };

    const formatActions = (actions: string[]) => {
        return actions.map((a, i) => `${i + 1}. ${a}`).join('\n');
    };

    const formatStructured = (structured: any) => {
        if (!structured) return 'No structured solution';
        return JSON.stringify(structured, null, 2);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '340px',  // After left sidebar
            background: 'rgba(30, 30, 30, 0.95)',
            color: '#eee',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            border: '1px solid #444',
            zIndex: 1000,
            minWidth: isExpanded ? '380px' : '180px',
            maxWidth: '450px',
            transition: 'all 0.2s ease'
        }}>
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isExpanded ? '1px solid #444' : 'none',
                    background: 'rgba(60, 60, 60, 0.5)',
                    borderRadius: isExpanded ? '8px 8px 0 0' : '8px'
                }}
            >
                <span style={{ fontWeight: 600, color: '#fff' }}>
                    🧩 Planned Solution
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '11px',
                        color: '#22c55e',
                        background: 'rgba(34, 197, 94, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        {plannedSolution.path.length} steps
                    </span>
                    <span style={{ fontSize: '12px' }}>
                        {isExpanded ? '▼' : '▶'}
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ padding: '12px' }}>
                    {/* Summary Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        marginBottom: '12px',
                        fontSize: '12px'
                    }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px 8px', borderRadius: '4px' }}>
                            <div style={{ color: '#888', fontSize: '10px' }}>Logic Type</div>
                            <div style={{ color: '#3b82f6', fontWeight: 500 }}>
                                {plannedSolution.metadata.logic_type}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '6px 8px', borderRadius: '4px' }}>
                            <div style={{ color: '#888', fontSize: '10px' }}>Items Placed</div>
                            <div style={{ color: '#a855f7', fontWeight: 500 }}>
                                {plannedSolution.itemPlacements.length}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px 8px', borderRadius: '4px' }}>
                            <div style={{ color: '#888', fontSize: '10px' }}>Path Length</div>
                            <div style={{ color: '#22c55e', fontWeight: 500 }}>
                                {plannedSolution.metadata.path_length}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '6px 8px', borderRadius: '4px' }}>
                            <div style={{ color: '#888', fontSize: '10px' }}>Optimal Blocks</div>
                            <div style={{ color: '#f97316', fontWeight: 500 }}>
                                {plannedSolution.metadata.optimal_blocks}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '8px',
                        borderBottom: '1px solid #444',
                        paddingBottom: '8px'
                    }}>
                        {(['summary', 'pattern', 'path', 'actions', 'structured'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    background: activeTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                    color: activeTab === tab ? '#fff' : '#888',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                    }}>
                        {activeTab === 'summary' && (
                            <div style={{ lineHeight: 1.6 }}>
                                <div><strong>Strategy:</strong> {plannedSolution.metadata.planning_strategy}</div>
                                <div><strong>Logic:</strong> {plannedSolution.metadata.logic_type}</div>
                                <div><strong>Path:</strong> {plannedSolution.path.length} steps</div>
                                <div><strong>Actions:</strong> {plannedSolution.rawActions.length}</div>
                                <div><strong>Items:</strong></div>
                                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                    {plannedSolution.itemPlacements.map((item, i) => (
                                        <li key={i} style={{ color: '#888' }}>
                                            {item.type} @ ({item.position[0]}, {item.position[1]}, {item.position[2]})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {activeTab === 'pattern' && (
                            <div style={{ lineHeight: 1.6 }}>
                                <div><strong>Planning Strategy:</strong> {plannedSolution.metadata.planning_strategy}</div>

                                {/* Pattern Matches */}
                                <div style={{ marginTop: '8px' }}><strong>Matched Patterns:</strong></div>
                                {(plannedSolution as any).patternMatches?.length > 0 ? (
                                    <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                        {(plannedSolution as any).patternMatches.map((pm: any, i: number) => (
                                            <li key={i} style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#22c55e', fontWeight: 500 }}>
                                                    Seg {pm.segment_index}: {pm.pattern?.id}
                                                </span>
                                                <div style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>
                                                    → Actions: {pm.expected_actions?.slice(0, 5).join(', ')}
                                                    {pm.expected_actions?.length > 5 ? '...' : ''}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#a855f7', marginLeft: '8px' }}>
                                                    → Items: {pm.item_placements?.map((p: any) => p.type).join(', ') || 'none'}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ color: '#888', marginLeft: '16px' }}>No pattern matches</div>
                                )}

                                {/* Detected Patterns from metadata */}
                                {plannedSolution.metadata?.detected_patterns?.length > 0 && (
                                    <>
                                        <div style={{ marginTop: '8px' }}><strong>All Pattern IDs:</strong></div>
                                        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                            {plannedSolution.metadata.detected_patterns.map((p: string, i: number) => (
                                                <li key={i} style={{ color: '#3b82f6' }}>{p}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {/* Procedures */}
                                {Object.keys((plannedSolution.structuredSolution as any)?.procedures || {}).length > 0 && (
                                    <>
                                        <div style={{ marginTop: '8px' }}><strong>Extracted Procedures:</strong></div>
                                        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                            {Object.keys((plannedSolution.structuredSolution as any).procedures).map((name, i) => (
                                                <li key={i} style={{ color: '#a855f7' }}>{name}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}
                        {activeTab === 'path' && (
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {formatPath(plannedSolution.path)}
                            </pre>
                        )}
                        {activeTab === 'actions' && (
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {formatActions(plannedSolution.rawActions)}
                            </pre>
                        )}
                        {activeTab === 'structured' && (
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {formatStructured(plannedSolution.structuredSolution)}
                            </pre>
                        )}
                    </div>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '6px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        📋 Copy Full JSON
                    </button>
                </div>
            )}
        </div>
    );
};
