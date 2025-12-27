/**
 * TemplatePanel Component
 * 
 * Main panel for Solution-Driven map generation.
 * Allows users to write or paste JavaScript code and generate maps.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Code, Play, Eye, Copy, AlertTriangle } from 'lucide-react';
import { generateFromCode } from '@repo/academic-map-generator';
import type { SolutionDrivenResult } from '@repo/academic-map-generator';
import { TEMPLATE_PRESETS, getPresetById } from './presets';
import type { TemplatePreset } from './presets';
import './TemplatePanel.css';

// Types for generated output
interface GeneratedMapData {
    blocks: Array<{ x: number; y: number; z: number; model: string }>;
    items: Array<{ type: string; position: { x: number; y: number; z: number } }>;
    playerStart: { x: number; y: number; z: number; direction: number };
    finish: { x: number; y: number; z: number };
    rawActions: string[];
    gameConfig: any;
}

interface PreviewResult {
    success: boolean;
    error?: string;
    metrics?: {
        pathLength: number;
        itemCount: number;
        loopIterations: number;
    };
    asciiMap?: string;
}

export interface TemplatePanelProps {
    onGenerate: (data: GeneratedMapData) => void;
    hasExistingMap?: boolean;
}

export function TemplatePanel({ onGenerate, hasExistingMap = false }: TemplatePanelProps) {
    // State
    const [selectedPresetId, setSelectedPresetId] = useState<string>('simple-for-loop');
    const [code, setCode] = useState<string>(getPresetById('simple-for-loop')?.code || '');
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load code from localStorage on mount
    useEffect(() => {
        const savedCode = localStorage.getItem('templatePanel.code');
        const savedPreset = localStorage.getItem('templatePanel.preset');
        if (savedCode) {
            setCode(savedCode);
        }
        if (savedPreset) {
            setSelectedPresetId(savedPreset);
        }
    }, []);

    // Save code to localStorage
    useEffect(() => {
        localStorage.setItem('templatePanel.code', code);
        localStorage.setItem('templatePanel.preset', selectedPresetId);
    }, [code, selectedPresetId]);

    // Line numbers
    const lineNumbers = useMemo(() => {
        const lines = code.split('\n');
        return lines.map((_, i) => i + 1).join('\n');
    }, [code]);

    // Handle preset change
    const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = e.target.value;
        setSelectedPresetId(presetId);
        const preset = getPresetById(presetId);
        if (preset) {
            setCode(preset.code);
            setPreview(null);
        }
    }, []);

    // Handle code change
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
        setPreview(null);
    }, []);

    // Generate preview
    const handlePreview = useCallback(() => {
        try {
            const result = generateFromCode(code, {
                concept: 'sequential',
                gradeLevel: '3-5'
            });

            setPreview({
                success: true,
                metrics: {
                    pathLength: result.metadata.pathLength,
                    itemCount: result.metadata.itemCount,
                    loopIterations: result.trace.loopIterations
                },
                asciiMap: generateAsciiMap(result)
            });
        } catch (err) {
            setPreview({
                success: false,
                error: err instanceof Error ? err.message : 'Failed to parse code'
            });
        }
    }, [code]);

    // Generate map
    const handleGenerate = useCallback(() => {
        // Confirm if existing map
        if (hasExistingMap) {
            const confirmed = window.confirm(
                'This will replace the current map. Continue?\n' +
                'Thao tác này sẽ thay thế map hiện tại. Tiếp tục?'
            );
            if (!confirmed) return;
        }

        setIsLoading(true);

        try {
            const result = generateFromCode(code, {
                concept: 'sequential',
                gradeLevel: '3-5'
            });

            const mapData = convertToMapData(result);
            onGenerate(mapData);

            // Update preview
            setPreview({
                success: true,
                metrics: {
                    pathLength: result.metadata.pathLength,
                    itemCount: result.metadata.itemCount,
                    loopIterations: result.trace.loopIterations
                },
                asciiMap: generateAsciiMap(result)
            });

        } catch (err) {
            setPreview({
                success: false,
                error: err instanceof Error ? err.message : 'Failed to generate map'
            });
        } finally {
            setIsLoading(false);
        }
    }, [code, hasExistingMap, onGenerate]);

    // Copy JSON
    const handleCopyJson = useCallback(() => {
        try {
            const result = generateFromCode(code, {
                concept: 'sequential',
                gradeLevel: '3-5'
            });
            navigator.clipboard.writeText(JSON.stringify(result.gameConfig, null, 2));
            alert('JSON copied to clipboard!');
        } catch (err) {
            alert('Failed to copy: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    }, [code]);

    // Current preset info
    const currentPreset = getPresetById(selectedPresetId);

    return (
        <div className={`template-panel ${isLoading ? 'template-panel--loading' : ''}`}>
            {/* Header */}
            <div className="template-panel__header">
                <Code className="template-panel__header-icon" size={18} />
                <h3>Template Generator</h3>
            </div>

            {/* Selector */}
            <div className="template-selector">
                <label className="template-selector__label">Select Template</label>
                <select
                    className="template-selector__dropdown"
                    value={selectedPresetId}
                    onChange={handlePresetChange}
                >
                    {TEMPLATE_PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>
                            {'⭐'.repeat(preset.difficulty)} {preset.name}
                        </option>
                    ))}
                </select>
                {currentPreset && (
                    <div className="template-selector__info">
                        <span className="template-selector__difficulty">
                            {'⭐'.repeat(currentPreset.difficulty)}
                        </span>
                        <span className="template-selector__concept">
                            {currentPreset.concept}
                        </span>
                        <span>{currentPreset.descriptionVi}</span>
                    </div>
                )}
            </div>

            {/* Code Editor */}
            <div className="template-editor">
                <label className="template-editor__label">Code (JavaScript)</label>
                <div className="template-editor__wrapper">
                    <div className="template-editor__lines">{lineNumbers}</div>
                    <textarea
                        className="template-editor__textarea"
                        value={code}
                        onChange={handleCodeChange}
                        placeholder="// Enter your code here..."
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="template-preview">
                <label className="template-preview__label">Preview</label>
                <div className="template-preview__content">
                    {preview ? (
                        preview.success ? (
                            <>
                                <div className="template-preview__metrics">
                                    <div className="template-preview__metric">
                                        <span className="template-preview__metric-value">
                                            {preview.metrics?.pathLength || 0}
                                        </span>
                                        <span className="template-preview__metric-label">Blocks</span>
                                    </div>
                                    <div className="template-preview__metric">
                                        <span className="template-preview__metric-value">
                                            {preview.metrics?.itemCount || 0}
                                        </span>
                                        <span className="template-preview__metric-label">Items</span>
                                    </div>
                                    <div className="template-preview__metric">
                                        <span className="template-preview__metric-value">
                                            {preview.metrics?.loopIterations || 0}
                                        </span>
                                        <span className="template-preview__metric-label">Loops</span>
                                    </div>
                                </div>
                                {preview.asciiMap && (
                                    <div className="template-preview__ascii">{preview.asciiMap}</div>
                                )}
                            </>
                        ) : (
                            <div className="template-preview__error">
                                <div className="template-preview__error-title">
                                    <AlertTriangle size={14} style={{ marginRight: 4 }} />
                                    Error
                                </div>
                                {preview.error}
                            </div>
                        )
                    ) : (
                        <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 20 }}>
                            Click "Preview" to see the result
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="template-actions">
                <button
                    className="template-actions__btn template-actions__btn--secondary"
                    onClick={handlePreview}
                    disabled={!code.trim()}
                >
                    <Eye size={16} />
                    Preview
                </button>
                <button
                    className="template-actions__btn template-actions__btn--primary"
                    onClick={handleGenerate}
                    disabled={!code.trim() || isLoading}
                >
                    <Play size={16} />
                    Generate Map
                </button>
            </div>

            {/* Copy Button */}
            <button
                className="template-actions__btn template-actions__btn--secondary"
                onClick={handleCopyJson}
                disabled={!code.trim()}
                style={{ marginTop: 8 }}
            >
                <Copy size={16} />
                Copy JSON
            </button>
        </div>
    );
}

// === Helper Functions ===

function generateAsciiMap(result: SolutionDrivenResult): string {
    const { pathCoords, items, startPosition, endPosition } = result.trace;

    if (pathCoords.length === 0) return 'No path generated';

    const xs = pathCoords.map(c => c[0]);
    const zs = pathCoords.map(c => c[2]);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;

    const pathSet = new Set(pathCoords.map(c => `${c[0]},${c[2]}`));
    const itemMap = new Map<string, string>();
    items.forEach(item => {
        itemMap.set(`${item.position[0]},${item.position[2]}`, item.type);
    });
    const startKey = `${startPosition[0]},${startPosition[2]}`;
    const endKey = `${endPosition[0]},${endPosition[2]}`;

    const lines: string[] = [];

    for (let z = maxZ; z >= minZ; z--) {
        let row = '';
        for (let x = minX; x <= maxX; x++) {
            const key = `${x},${z}`;
            const isStart = key === startKey;
            const isEnd = key === endKey;
            const item = itemMap.get(key);
            const isPath = pathSet.has(key);

            if (isStart) {
                row += 'S ';
            } else if (isEnd && !item) {
                row += 'E ';
            } else if (item) {
                const symbols: Record<string, string> = {
                    'crystal': 'C',
                    'key': 'K',
                    'switch': 'W'
                };
                row += (symbols[item] || '?') + ' ';
            } else if (isPath) {
                row += '█ ';
            } else {
                row += '. ';
            }
        }
        lines.push(row);
    }

    lines.push('');
    lines.push('S=Start E=End █=Path C=Crystal');

    return lines.join('\n');
}

function convertToMapData(result: SolutionDrivenResult): GeneratedMapData {
    const { gameConfig } = result;

    return {
        blocks: gameConfig.gameConfig.blocks.map((b: any) => ({
            x: b.x,
            y: b.y,
            z: b.z,
            model: 'grass'
        })),
        items: gameConfig.gameConfig.collectibles.map((c: any) => ({
            type: c.type,
            position: { x: c.x, y: c.y, z: c.z }
        })),
        playerStart: {
            x: gameConfig.gameConfig.players[0].start.x,
            y: gameConfig.gameConfig.players[0].start.y,
            z: gameConfig.gameConfig.players[0].start.z,
            direction: gameConfig.gameConfig.players[0].start.direction
        },
        finish: {
            x: gameConfig.gameConfig.finish.x,
            y: gameConfig.gameConfig.finish.y,
            z: gameConfig.gameConfig.finish.z
        },
        rawActions: result.solution.rawActions,
        gameConfig: gameConfig
    };
}

export default TemplatePanel;
