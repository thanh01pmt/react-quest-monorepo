
import React, { useState, useMemo } from 'react';
import { TopologyRegistry } from '../../map-generator/TopologyRegistry';
import { PlacedObject, BuildableAsset } from '../../types';
import { PlacementService, PedagogyStrategy } from '../../map-generator/PlacementService'; // IMPORT NEW SERVICE
import { v4 as uuidv4 } from 'uuid';
import './TopologyPanel.css';

interface TopologyPanelProps {
    onGenerate: (objects: PlacedObject[], metadataUpdate?: Record<string, any>) => void;
    assetMap: Map<string, BuildableAsset>; // To look up ground/wall assets
}

export const TopologyPanel: React.FC<TopologyPanelProps> = ({ onGenerate, assetMap }) => {
    const registry = useMemo(() => TopologyRegistry.getInstance(), []);
    const placementService = useMemo(() => new PlacementService(), []); // INSTANCE
    const topologyNames = useMemo(() => registry.getAll(), [registry]);

    const [selectedTopology, setSelectedTopology] = useState<string>(topologyNames[0] || 'plus_shape');
    const [strategy, setStrategy] = useState<PedagogyStrategy>(PedagogyStrategy.NONE); // STRATEGY STATE
    const [difficulty, setDifficulty] = useState<'intro' | 'simple' | 'complex'>('simple'); // DIFFICULTY STATE
    const [params, setParams] = useState<Record<string, any>>({});

    // Reset params when topology changes (optional, or keep generic ones)
    const handleTopologyChange = (name: string) => {
        setSelectedTopology(name);
        setParams({});
        // Set defaults based on name could happen here
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
                        <div className="param-group">
                            <label>Start At Center</label>
                            <input
                                type="checkbox"
                                checked={params.start_at_center || false}
                                onChange={e => updateParam('start_at_center', e.target.checked)}
                            />
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
            default:
                return <p>No parameters for this topology.</p>;
        }
    };

    const handleGenerate = async () => {
        const topology = registry.get(selectedTopology);
        if (!topology) return;

        try {
            const { objects, pathInfo } = await placementService.generateMap({
                topology,
                params,
                strategy,
                difficulty,
                assetMap
            });

            const metadataUpdate = {
                pathInfo: {
                    ...pathInfo,
                    topology: selectedTopology,
                    params: params,
                    strategy: strategy
                }
            };

            onGenerate(objects, metadataUpdate);
        } catch (error) {
            console.error("Failed to generate map:", error);
            alert("Error generating map. See console.");
        }
    };

    return (
        <div className="topology-panel">
            <h3>Map Generator</h3>

            <div className="topology-section">
                <label>Topology</label>
                <select
                    className="topology-select"
                    value={selectedTopology}
                    onChange={e => handleTopologyChange(e.target.value)}
                >
                    {topologyNames.map(name => (
                        <option key={name} value={name}>{name.replace('_', ' ')}</option>
                    ))}
                </select>
            </div>

            <div className="topology-section">
                <label>Parameters</label>
                {renderParamInputs()}
            </div>

            <div className="topology-section">
                <label>Strategy (Pedagogy)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <select
                        className="topology-select"
                        value={strategy}
                        onChange={e => setStrategy(e.target.value as PedagogyStrategy)}
                        style={{ flex: 1 }}
                    >
                        <option value={PedagogyStrategy.NONE}>None (Random)</option>
                        <option value={PedagogyStrategy.LOOP_LOGIC}>Loop Logic</option>
                        <option value={PedagogyStrategy.FUNCTION_LOGIC}>Function Logic</option>
                    </select>
                    <select
                        className="topology-select"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value as any)}
                        style={{ flex: 0.8 }}
                    >
                        <option value="intro">Intro</option>
                        <option value="simple">Simple</option>
                        <option value="complex">Complex</option>
                    </select>
                </div>
            </div>

            <button className="generate-btn" onClick={handleGenerate}>
                Generate Map
            </button>
        </div>
    );
};
