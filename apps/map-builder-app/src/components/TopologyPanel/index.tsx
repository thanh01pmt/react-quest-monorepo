/**
 * TopologyPanel Component - Refactored for Auto Mode
 * 
 * Features:
 * - Topology selection with grouped options
 * - Dynamic parameter inputs per topology
 * - Strategy (Pedagogy) selection  
 * - Academic parameters (Bloom level, Item goals)
 * - Post-generate options (Lock Ground, Regenerate Items Only)
 * - Collapsible sections for progressive disclosure
 */

import React, { useState, useMemo, useEffect } from 'react';
import { TopologyRegistry } from '@repo/academic-map-generator';
import { PlacedObject, BuildableAsset } from '../../types';
import { PlacementService, PedagogyStrategy } from '@repo/academic-map-generator';
import { useBuilderMode, GenerateConfig } from '../../store/builderModeContext';
import { v4 as uuidv4 } from 'uuid';
import { TopologyInspector, HighlightItem } from '../TopologyInspector';
import './TopologyPanel.css';

interface TopologyPanelProps {
    onGenerate: (objects: PlacedObject[], metadataUpdate?: Record<string, any>) => void;
    assetMap: Map<string, BuildableAsset>;
    pathInfo?: {
        start_pos: [number, number, number];
        target_pos: [number, number, number];
        path_coords: [number, number, number][];
        placement_coords?: [number, number, number][];
        metadata?: Record<string, any>;
    } | null;
    onHighlightChange?: (highlights: HighlightItem[]) => void;
}

export const TopologyPanel: React.FC<TopologyPanelProps> = ({ onGenerate, assetMap, pathInfo, onHighlightChange }) => {
    const registry = useMemo(() => TopologyRegistry.getInstance(), []);
    const placementService = useMemo(() => new PlacementService(), []);
    const topologyGroups = useMemo(() => registry.getGrouped(), [registry]);

    const { state, setIsEditing, setLastGenerateConfig, setIsGenerating } = useBuilderMode();

    const [selectedTopology, setSelectedTopology] = useState<string>('straight_line');
    const [params, setParams] = useState<Record<string, any>>({});

    // Collapsible section states
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['topology', 'strategy'])
    );

    // Listen for trigger-generate event from ActionBar
    useEffect(() => {
        const handleTriggerGenerate = () => {
            handleGenerate();
        };
        window.addEventListener('trigger-generate', handleTriggerGenerate);
        return () => window.removeEventListener('trigger-generate', handleTriggerGenerate);
    }, [selectedTopology, params]); // Dependencies for handleGenerate

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    const handleTopologyChange = (name: string) => {
        setSelectedTopology(name);
        setParams({});
    };

    const updateParam = (key: string, value: any) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const renderParamInputs = () => {
        switch (selectedTopology) {
            case 'plus_shape':
                return (
                    <div className="param-group">
                        <label>Arm Length</label>
                        <input
                            type="number"
                            value={params.arm_length || 5}
                            onChange={e => updateParam('arm_length', parseInt(e.target.value))}
                            min={2} max={20}
                        />
                    </div>
                );
            case 'spiral':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Turns</label>
                            <input
                                type="number"
                                value={params.num_turns || 8}
                                onChange={e => updateParam('num_turns', parseInt(e.target.value))}
                                min={2} max={20}
                            />
                        </div>
                        <div className="param-group checkbox-group">
                            <input
                                type="checkbox"
                                id="start_at_center"
                                checked={params.start_at_center || false}
                                onChange={e => updateParam('start_at_center', e.target.checked)}
                            />
                            <label htmlFor="start_at_center">Start At Center</label>
                        </div>
                    </>
                );
            case 'l_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Leg 1 Length</label>
                            <input
                                type="number"
                                value={params.leg1_length || 3}
                                onChange={e => updateParam('leg1_length', parseInt(e.target.value))}
                                min={2}
                            />
                        </div>
                        <div className="param-group">
                            <label>Leg 2 Length</label>
                            <input
                                type="number"
                                value={params.leg2_length || 3}
                                onChange={e => updateParam('leg2_length', parseInt(e.target.value))}
                                min={2}
                            />
                        </div>
                        <div className="param-group">
                            <label>Turn Direction</label>
                            <select
                                value={params.turn_direction || 'right'}
                                onChange={e => updateParam('turn_direction', e.target.value)}
                            >
                                <option value="right">Right</option>
                                <option value="left">Left</option>
                            </select>
                        </div>
                    </>
                );
            case 'grid':
                return (
                    <>
                        <div className="param-group">
                            <label>Grid Width</label>
                            <input
                                type="number"
                                value={params.grid_width || 10}
                                onChange={e => updateParam('grid_width', parseInt(e.target.value))}
                                min={3}
                            />
                        </div>
                        <div className="param-group">
                            <label>Grid Depth</label>
                            <input
                                type="number"
                                value={params.grid_depth || 10}
                                onChange={e => updateParam('grid_depth', parseInt(e.target.value))}
                                min={3}
                            />
                        </div>
                    </>
                );
            case 'star_shape':
                return (
                    <div className="param-group">
                        <label>Star Size</label>
                        <input
                            type="number"
                            value={params.star_size || 3}
                            onChange={e => updateParam('star_size', parseInt(e.target.value))}
                            min={2}
                        />
                    </div>
                );
            case 'straight_line':
                return (
                    <div className="param-group">
                        <label>Path Length</label>
                        <input
                            type="number"
                            value={params.path_length || 8}
                            onChange={e => updateParam('path_length', parseInt(e.target.value))}
                            min={3} max={20}
                        />
                    </div>
                );
            case 'zigzag':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Segments</label>
                            <input
                                type="number"
                                value={params.num_segments || 4}
                                onChange={e => updateParam('num_segments', parseInt(e.target.value))}
                                min={2} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Segment Length</label>
                            <input
                                type="number"
                                value={params.segment_length || 3}
                                onChange={e => updateParam('segment_length', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                    </>
                );
            case 't_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Stem Length</label>
                            <input
                                type="number"
                                value={params.stem_length || 4}
                                onChange={e => updateParam('stem_length', parseInt(e.target.value))}
                                min={2} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Bar Length</label>
                            <input
                                type="number"
                                value={params.bar_length || 5}
                                onChange={e => updateParam('bar_length', parseInt(e.target.value))}
                                min={3} max={9}
                            />
                        </div>
                    </>
                );
            case 'u_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Arm Length</label>
                            <input
                                type="number"
                                value={params.arm_length || 4}
                                onChange={e => updateParam('arm_length', parseInt(e.target.value))}
                                min={2} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Base Length</label>
                            <input
                                type="number"
                                value={params.base_length || 3}
                                onChange={e => updateParam('base_length', parseInt(e.target.value))}
                                min={2} max={8}
                            />
                        </div>
                    </>
                );
            case 'v_shape':
                return (
                    <div className="param-group">
                        <label>Arm Length</label>
                        <input
                            type="number"
                            value={params.arm_length || 3}
                            onChange={e => updateParam('arm_length', parseInt(e.target.value))}
                            min={2} max={6}
                        />
                    </div>
                );
            case 's_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Leg 1 Length</label>
                            <input
                                type="number"
                                value={params.leg1_length || 3}
                                onChange={e => updateParam('leg1_length', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                        <div className="param-group">
                            <label>Leg 2 Length</label>
                            <input
                                type="number"
                                value={params.leg2_length || 4}
                                onChange={e => updateParam('leg2_length', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                        <div className="param-group">
                            <label>Leg 3 Length</label>
                            <input
                                type="number"
                                value={params.leg3_length || 3}
                                onChange={e => updateParam('leg3_length', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                    </>
                );
            case 'h_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Column Length</label>
                            <input
                                type="number"
                                value={params.column_length || 4}
                                onChange={e => updateParam('column_length', parseInt(e.target.value))}
                                min={3} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Column Spacing</label>
                            <input
                                type="number"
                                value={params.column_spacing || 2}
                                onChange={e => updateParam('column_spacing', parseInt(e.target.value))}
                                min={1} max={5}
                            />
                        </div>
                    </>
                );
            case 'z_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Top Length</label>
                            <input
                                type="number"
                                value={params.top_length || 4}
                                onChange={e => updateParam('top_length', parseInt(e.target.value))}
                                min={2} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Diagonal Length</label>
                            <input
                                type="number"
                                value={params.diagonal_length || 3}
                                onChange={e => updateParam('diagonal_length', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                    </>
                );
            case 'arrow_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Shaft Length</label>
                            <input
                                type="number"
                                value={params.shaft_length || 5}
                                onChange={e => updateParam('shaft_length', parseInt(e.target.value))}
                                min={3} max={10}
                            />
                        </div>
                        <div className="param-group">
                            <label>Wing Length</label>
                            <input
                                type="number"
                                value={params.wing_length || 2}
                                onChange={e => updateParam('wing_length', parseInt(e.target.value))}
                                min={1} max={4}
                            />
                        </div>
                    </>
                );
            case 'triangle':
            case 'square':
                return (
                    <div className="param-group">
                        <label>Side Length</label>
                        <input
                            type="number"
                            value={params.side_length || 4}
                            onChange={e => updateParam('side_length', parseInt(e.target.value))}
                            min={3} max={8}
                        />
                    </div>
                );
            case 'simple_path':
                return (
                    <>
                        <div className="param-group">
                            <label>Path Length</label>
                            <input
                                type="number"
                                value={params.path_length || 6}
                                onChange={e => updateParam('path_length', parseInt(e.target.value))}
                                min={3} max={15}
                            />
                        </div>
                        <div className="param-group">
                            <label>Direction</label>
                            <select
                                value={params.direction || 'forward'}
                                onChange={e => updateParam('direction', e.target.value)}
                            >
                                <option value="forward">Forward (+Z)</option>
                                <option value="right">Right (+X)</option>
                                <option value="backward">Backward (-Z)</option>
                                <option value="left">Left (-X)</option>
                            </select>
                        </div>
                    </>
                );
            case 'staircase':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Steps</label>
                            <input
                                type="number"
                                value={params.steps || 5}
                                onChange={e => updateParam('steps', parseInt(e.target.value))}
                                min={2} max={10}
                            />
                        </div>
                        <div className="param-group">
                            <label>Step Width</label>
                            <input
                                type="number"
                                value={params.step_width || 2}
                                onChange={e => updateParam('step_width', parseInt(e.target.value))}
                                min={1} max={4}
                            />
                        </div>
                    </>
                );
            case 'plowing_field':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Rows</label>
                            <input
                                type="number"
                                value={params.rows || 4}
                                onChange={e => updateParam('rows', parseInt(e.target.value))}
                                min={2} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Row Length</label>
                            <input
                                type="number"
                                value={params.row_length || 5}
                                onChange={e => updateParam('row_length', parseInt(e.target.value))}
                                min={3} max={10}
                            />
                        </div>
                    </>
                );
            case 'ef_shape':
                return (
                    <>
                        <div className="param-group">
                            <label>Stem Length</label>
                            <input
                                type="number"
                                value={params.stem_length || 5}
                                onChange={e => updateParam('stem_length', parseInt(e.target.value))}
                                min={3} max={10}
                            />
                        </div>
                        <div className="param-group">
                            <label>Branch Length</label>
                            <input
                                type="number"
                                value={params.branch_length || 2}
                                onChange={e => updateParam('branch_length', parseInt(e.target.value))}
                                min={1} max={5}
                            />
                        </div>
                        <div className="param-group">
                            <label>Shape Type</label>
                            <select
                                value={params.num_branches || 3}
                                onChange={e => updateParam('num_branches', parseInt(e.target.value))}
                            >
                                <option value={3}>E Shape (3 branches)</option>
                                <option value={2}>F Shape (2 branches)</option>
                            </select>
                        </div>
                    </>
                );
            case 'grid_with_holes':
                return (
                    <>
                        <div className="param-group">
                            <label>Grid Width</label>
                            <input
                                type="number"
                                value={params.grid_width || 8}
                                onChange={e => updateParam('grid_width', parseInt(e.target.value))}
                                min={5} max={12}
                            />
                        </div>
                        <div className="param-group">
                            <label>Hole Chance (%)</label>
                            <input
                                type="number"
                                value={Math.round((params.hole_chance || 0.25) * 100)}
                                onChange={e => updateParam('hole_chance', parseInt(e.target.value) / 100)}
                                min={10} max={40}
                            />
                        </div>
                    </>
                );
            case 'complex_maze':
                return (
                    <div className="param-group">
                        <label>Maze Size</label>
                        <input
                            type="number"
                            value={params.maze_width || 9}
                            onChange={e => {
                                const size = parseInt(e.target.value);
                                updateParam('maze_width', size);
                                updateParam('maze_depth', size);
                            }}
                            min={5} max={15} step={2}
                        />
                    </div>
                );
            case 'spiral_3d':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Turns</label>
                            <input
                                type="number"
                                value={params.num_turns || 3}
                                onChange={e => updateParam('num_turns', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                        <div className="param-group">
                            <label>Height Per Turn</label>
                            <input
                                type="number"
                                value={params.height_per_turn || 1}
                                onChange={e => updateParam('height_per_turn', parseInt(e.target.value))}
                                min={1} max={3}
                            />
                        </div>
                    </>
                );
            case 'staircase_3d':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Flights</label>
                            <input
                                type="number"
                                value={params.num_flights || 3}
                                onChange={e => updateParam('num_flights', parseInt(e.target.value))}
                                min={2} max={6}
                            />
                        </div>
                        <div className="param-group">
                            <label>Steps Per Flight</label>
                            <input
                                type="number"
                                value={params.steps_per_flight || 4}
                                onChange={e => updateParam('steps_per_flight', parseInt(e.target.value))}
                                min={3} max={8}
                            />
                        </div>
                    </>
                );
            case 'symmetrical_islands':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Islands</label>
                            <input
                                type="number"
                                value={params.num_islands || 4}
                                onChange={e => updateParam('num_islands', parseInt(e.target.value))}
                                min={2} max={9}
                            />
                        </div>
                        <div className="param-group">
                            <label>Island Size</label>
                            <input
                                type="number"
                                value={params.island_size || 2}
                                onChange={e => updateParam('island_size', parseInt(e.target.value))}
                                min={2} max={4}
                            />
                        </div>
                    </>
                );
            case 'hub_stepped_islands':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Spokes</label>
                            <input
                                type="number"
                                value={params.num_spokes || 4}
                                onChange={e => updateParam('num_spokes', parseInt(e.target.value))}
                                min={3} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Spoke Length</label>
                            <input
                                type="number"
                                value={params.spoke_length || 3}
                                onChange={e => updateParam('spoke_length', parseInt(e.target.value))}
                                min={2} max={5}
                            />
                        </div>
                    </>
                );
            case 'interspersed_path':
                return (
                    <>
                        <div className="param-group">
                            <label>Main Path Length</label>
                            <input
                                type="number"
                                value={params.main_path_length || 9}
                                onChange={e => updateParam('main_path_length', parseInt(e.target.value))}
                                min={5} max={15}
                            />
                        </div>
                        <div className="param-group">
                            <label>Number of Branches</label>
                            <input
                                type="number"
                                value={params.num_branches || 2}
                                onChange={e => updateParam('num_branches', parseInt(e.target.value))}
                                min={1} max={5}
                            />
                        </div>
                        <div className="param-group">
                            <label>Branch Length</label>
                            <input
                                type="number"
                                value={params.branch_length || 2}
                                onChange={e => updateParam('branch_length', parseInt(e.target.value))}
                                min={1} max={4}
                            />
                        </div>
                    </>
                );
            case 'plus_shape_islands':
                return (
                    <>
                        <div className="param-group">
                            <label>Arm Length</label>
                            <input
                                type="number"
                                value={params.arm_length || 4}
                                onChange={e => updateParam('arm_length', parseInt(e.target.value))}
                                min={3} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Island Size</label>
                            <input
                                type="number"
                                value={params.island_size || 2}
                                onChange={e => updateParam('island_size', parseInt(e.target.value))}
                                min={2} max={4}
                            />
                        </div>
                    </>
                );
            case 'stepped_island_clusters':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Clusters</label>
                            <input
                                type="number"
                                value={params.num_clusters || 2}
                                onChange={e => updateParam('num_clusters', parseInt(e.target.value))}
                                min={2} max={4}
                            />
                        </div>
                        <div className="param-group">
                            <label>Islands Per Cluster</label>
                            <input
                                type="number"
                                value={params.islands_per_cluster || 2}
                                onChange={e => updateParam('islands_per_cluster', parseInt(e.target.value))}
                                min={2} max={4}
                            />
                        </div>
                    </>
                );
            case 'swift_playground_maze':
                return (
                    <>
                        <div className="param-group">
                            <label>Number of Platforms</label>
                            <input
                                type="number"
                                value={params.num_platforms || 5}
                                onChange={e => updateParam('num_platforms', parseInt(e.target.value))}
                                min={3} max={8}
                            />
                        </div>
                        <div className="param-group">
                            <label>Platform Size</label>
                            <input
                                type="number"
                                value={params.platform_size || 3}
                                onChange={e => updateParam('platform_size', parseInt(e.target.value))}
                                min={3} max={5}
                            />
                        </div>
                    </>
                );
            default:
                return <p className="no-params">No parameters for this topology.</p>;
        }
    };

    const handleGenerate = async () => {
        const topology = registry.get(selectedTopology);
        if (!topology) return;

        setIsGenerating(true);

        try {
            // Generate only ground (no items) - strategy = NONE for ground-only
            const { objects, pathInfo, plannedSolution } = await placementService.generateMap({
                topology,
                params,
                strategy: PedagogyStrategy.NONE, // No items, ground only
                difficulty: 'simple',
                assetMap
            });

            // Filter to keep only ground blocks (no collectibles/interactibles)
            const groundObjects = objects.filter(obj =>
                obj.asset.type === 'block' ||
                obj.asset.key === 'player_start' ||
                obj.asset.key === 'finish'
            );

            const config: GenerateConfig = {
                topology: selectedTopology,
                params: params,
                strategy: PedagogyStrategy.NONE,
                difficulty: 'simple',
                academicParams: { bloomLevel: 3 },
                itemGoals: { gems: 0, crystals: 0, switches: 0 }
            };

            setLastGenerateConfig(config);
            setIsEditing(true);

            const metadataUpdate = {
                strategy: PedagogyStrategy.NONE,
                pathInfo: {
                    ...pathInfo,
                    topology: selectedTopology,
                    params: params,
                    strategy: PedagogyStrategy.NONE
                },
                plannedSolution: null  // No planned solution for ground-only
            };

            onGenerate(groundObjects, metadataUpdate);
        } catch (error) {
            console.error("Failed to generate ground:", error);
            alert("Error generating ground. See console.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="topology-panel">
            {/* Post-Generate Status (visible only when editing) */}
            {state.isEditing && (
                <div className="post-generate-section">
                    <div className="post-generate-header">
                        <span className="status-indicator">✅ Generated</span>
                        <span className="status-text">Editing mode active</span>
                    </div>
                    <p className="post-generate-hint">
                        💡 After generating ground, switch to <strong>Placement</strong> tab to add items.
                    </p>
                </div>
            )}

            {/* Topology Selection */}
            <div className="collapsible-section">
                <button
                    className="section-header"
                    onClick={() => toggleSection('topology')}
                >
                    <span>🗺️ Topology</span>
                    <span className="toggle-icon">{expandedSections.has('topology') ? '▼' : '▶'}</span>
                </button>
                {expandedSections.has('topology') && (
                    <div className="section-content">
                        <select
                            className="topology-select"
                            value={selectedTopology}
                            onChange={e => handleTopologyChange(e.target.value)}
                        >
                            {topologyGroups.map(group => (
                                <optgroup key={group.category} label={group.category}>
                                    {group.items.map(name => (
                                        <option key={name} value={name}>
                                            {registry.getDisplayName(name)}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>

                        <div className="params-container">
                            <label className="params-label">Parameters</label>
                            {renderParamInputs()}
                        </div>
                    </div>
                )}

                {/* Generate Ground button */}
                <button className="generate-btn" onClick={handleGenerate} disabled={state.isGenerating}>
                    {state.isGenerating ? '⏳ Generating...' : '🚧 Generate Ground'}
                </button>

                <p className="hint-text" style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px', padding: '0 12px' }}>
                    💡 After generating ground, switch to <strong>Placement</strong> tab to add items.
                </p>
            </div>

            {/* Topology Inspector - Shows after generation */}
            {pathInfo && (
                <TopologyInspector
                    pathInfo={pathInfo}
                    onHighlightChange={onHighlightChange}
                />
            )}
        </div>
    );
};
