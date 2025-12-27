/**
 * TemplatePanel Component
 * 
 * Main panel for Solution-Driven map generation.
 * Allows users to write or paste JavaScript code and generate maps.
 * Supports {{variable}} syntax for dynamic parameters with auto-generated sliders.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Code, Play, Eye, Copy, AlertTriangle, Sliders, Shuffle } from 'lucide-react';
import { generateFromCode } from '@repo/academic-map-generator';
import type { SolutionDrivenResult } from '@repo/academic-map-generator';
import { TEMPLATE_PRESETS, getPresetById } from './presets';
import { extractVariables, resolveTemplate, hasVariables } from './templateVariables';
import type { TemplateVariable } from './templateVariables';
import './TemplatePanel.css';

// Types for generated output
interface GeneratedMapData {
    blocks: Array<{ x: number; y: number; z: number; model: string }>;
    items: Array<{ type: string; position: { x: number; y: number; z: number } }>;
    playerStart: { x: number; y: number; z: number; direction: number };
    finish: { x: number; y: number; z: number };
    rawActions: string[];
    gameConfig: any;
    pathCoords: Array<[number, number, number]>; // Path level coordinates for visualization
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
    const [variableValues, setVariableValues] = useState<Record<string, number>>({});
    const [autoRandom, setAutoRandom] = useState(false);

    // Extract variables from code
    const variables = useMemo(() => extractVariables(code), [code]);

    // Initialize variable values when variables change
    useEffect(() => {
        const newValues: Record<string, number> = {};
        variables.forEach(v => {
            newValues[v.name] = variableValues[v.name] ?? v.defaultValue;
        });
        setVariableValues(newValues);
    }, [variables]);

    // Get resolved code (with variables replaced)
    const resolvedCode = useMemo(() => {
        return resolveTemplate(code, variableValues);
    }, [code, variableValues]);

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
            setVariableValues({}); // Reset variables
        }
    }, []);

    // Handle code change
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
        setPreview(null);
    }, []);

    // Handle variable change
    const handleVariableChange = useCallback((name: string, value: number) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
        setPreview(null);
    }, []);

    // Randomize all variables
    const randomizeVariables = useCallback(() => {
        const newValues: Record<string, number> = {};
        variables.forEach(v => {
            newValues[v.name] = Math.floor(Math.random() * (v.max - v.min + 1)) + v.min;
        });
        setVariableValues(newValues);
        setPreview(null);
        return newValues;
    }, [variables]);

    // Handle range change (update min/max in script)
    const handleRangeChange = useCallback((varName: string, newMin: number, newMax: number) => {
        // Find and update the variable declaration in code
        const regex = new RegExp(`\\{\\{${varName}(?::[^}]+)?\\}\\}`, 'g');
        const currentVar = variables.find(v => v.name === varName);
        if (!currentVar) return;

        const currentValue = variableValues[varName] ?? currentVar.defaultValue;
        const clampedValue = Math.min(Math.max(currentValue, newMin), newMax);

        const newCode = code.replace(regex, `{{${varName}:${newMin}-${newMax}:${clampedValue}}}`);
        console.log('Range change:', varName, newMin, newMax, 'New code:', newCode);
        setCode(newCode);
        setVariableValues(prev => ({ ...prev, [varName]: clampedValue }));
        setPreview(null);
    }, [code, variables, variableValues]);

    // Get effective code (with auto-random if enabled)
    const getEffectiveCode = useCallback(() => {
        if (autoRandom && variables.length > 0) {
            const randomValues = randomizeVariables();
            return resolveTemplate(code, randomValues);
        }
        return resolvedCode;
    }, [autoRandom, variables, code, resolvedCode, randomizeVariables]);

    // Generate preview
    const handlePreview = useCallback(() => {
        try {
            const codeToUse = getEffectiveCode();
            const result = generateFromCode(codeToUse, {
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
    }, [getEffectiveCode]);

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
            const codeToUse = getEffectiveCode();
            const result = generateFromCode(codeToUse, {
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
    }, [getEffectiveCode, hasExistingMap, onGenerate]);

    // Copy JSON
    const handleCopyJson = useCallback(() => {
        try {
            const codeToUse = getEffectiveCode();
            const result = generateFromCode(codeToUse, {
                concept: 'sequential',
                gradeLevel: '3-5'
            });
            navigator.clipboard.writeText(JSON.stringify(result.gameConfig, null, 2));
            alert('JSON copied to clipboard!');
        } catch (err) {
            alert('Failed to copy: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    }, [getEffectiveCode]);

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

            {/* Variable Sliders */}
            {variables.length > 0 && (
                <div className="template-variables">
                    <div className="template-variables__header">
                        <Sliders size={14} />
                        <span>Parameters ({variables.length})</span>
                        <label className="template-variables__auto">
                            <input
                                type="checkbox"
                                checked={autoRandom}
                                onChange={(e) => setAutoRandom(e.target.checked)}
                            />
                            <Shuffle size={12} />
                            <span>Random</span>
                        </label>
                    </div>
                    {!autoRandom && (
                        <div className="template-variables__list">
                            {variables.map(variable => (
                                <div key={variable.name} className="template-variables__item">
                                    <label className="template-variables__label">
                                        {variable.displayName}
                                        <span className="template-variables__value">
                                            {variableValues[variable.name] ?? variable.defaultValue}
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        className="template-variables__slider"
                                        min={variable.min}
                                        max={variable.max}
                                        value={variableValues[variable.name] ?? variable.defaultValue}
                                        onChange={(e) => handleVariableChange(variable.name, parseInt(e.target.value, 10))}
                                    />
                                    <div className="template-variables__range-editable">
                                        <input
                                            type="number"
                                            className="template-variables__range-input"
                                            key={`min-${variable.name}-${variable.min}`}
                                            defaultValue={variable.min}
                                            onBlur={(e) => {
                                                const newMin = parseInt(e.target.value, 10);
                                                if (!isNaN(newMin) && newMin >= 1 && newMin < variable.max) {
                                                    handleRangeChange(variable.name, newMin, variable.max);
                                                } else {
                                                    e.target.value = String(variable.min);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            title="Min value"
                                        />
                                        <span className="template-variables__range-separator">—</span>
                                        <input
                                            type="number"
                                            className="template-variables__range-input"
                                            key={`max-${variable.name}-${variable.max}`}
                                            defaultValue={variable.max}
                                            onBlur={(e) => {
                                                const newMax = parseInt(e.target.value, 10);
                                                if (!isNaN(newMax) && newMax > variable.min && newMax <= 100) {
                                                    handleRangeChange(variable.name, variable.min, newMax);
                                                } else {
                                                    e.target.value = String(variable.max);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            title="Max value"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {autoRandom && (
                        <div className="template-variables__auto-info">
                            🎲 Giá trị sẽ được random trong khoảng cho phép khi Generate
                        </div>
                    )}
                </div>
            )}

            {/* Code Editor */}
            <div className="template-editor">
                <label className="template-editor__label">
                    Code (JavaScript)
                    {variables.length > 0 && (
                        <span className="template-editor__var-hint">
                            💡 Variables: {variables.map(v => v.name).join(', ')}
                        </span>
                    )}
                </label>
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
    const { gameConfig, trace } = result;

    return {
        blocks: gameConfig.gameConfig.blocks.map((b: any) => ({
            x: b.position?.x ?? b.x ?? 0,
            y: b.position?.y ?? b.y ?? 0,
            z: b.position?.z ?? b.z ?? 0,
            model: b.modelKey || 'grass'
        })),
        items: gameConfig.gameConfig.collectibles.map((c: any) => ({
            type: c.type,
            position: {
                x: c.position?.x ?? c.x ?? 0,
                y: c.position?.y ?? c.y ?? 0,
                z: c.position?.z ?? c.z ?? 0
            }
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
        gameConfig: gameConfig,
        pathCoords: trace.pathCoords as Array<[number, number, number]>
    };
}

export default TemplatePanel;
