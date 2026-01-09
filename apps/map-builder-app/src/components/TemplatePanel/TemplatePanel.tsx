/**
 * TemplatePanel Component
 * 
 * Main panel for Solution-Driven map generation.
 * Allows users to write or paste JavaScript code and generate maps.
 * Supports {{variable}} syntax for dynamic parameters with auto-generated sliders.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Code, Play, Eye, Copy, AlertTriangle, Sliders, Maximize2, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { generateFromCode } from '@repo/academic-map-generator';
import type { SolutionDrivenResult } from '@repo/academic-map-generator';
import { CUSTOM_PRESET } from './presets';
import type { TemplatePreset } from './presets';
import {
    getAllTemplatesAsPresets,
    getTemplatesGroupedByCategory,
    getTemplateById,
    getAvailableCategories,
    CATEGORY_INFO,
} from './templateAdapter';
import { extractVariables, resolveTemplate } from './templateVariables';
import type { TemplateVariable } from './templateVariables';
import { FullEditorDialog } from './FullEditorDialog';
import { NotebookEditor } from './NotebookEditor';
import './TemplatePanel.css';

// Types for generated output
interface GeneratedMapData {
    blocks: Array<{ x: number; y: number; z: number; model: string }>;
    items: Array<{ type: string; position: { x: number; y: number; z: number } }>;
    playerStart: { x: number; y: number; z: number; direction: number };
    finish: { x: number; y: number; z: number };
    rawActions: string[];
    gameConfig: any;
    pathCoords: Array<[number, number, number]>; // Unique path coordinates
    movementSequence: Array<[number, number, number]>; // Full sequential path (with duplicates)
    solutionConfig?: any;
    // Template metadata for auto-toolbox selection
    templateMeta?: {
        tags?: string[];
        concepts?: string[];
        category?: string;
    };
    // Quest info auto-filled from template
    questInfo?: {
        id: string;
        topic: string;
        titleKey: string;
        descriptionKey: string;
        translations: {
            vi: Record<string, string>;
            en: Record<string, string>;
        };
        hints?: {
            title: string;
            description: string;
            learningGoals?: string;
            goalDetails?: string[];
        };
    };
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

// Helper to generate task description from result
function generateTaskDescription(result: SolutionDrivenResult, locale: 'vi' | 'en'): string {
    const collectibles = result.gameConfig?.gameConfig?.collectibles || [];
    const interactibles = result.gameConfig?.gameConfig?.interactibles || [];
    const crystalCount = collectibles.filter((c: any) => c.type === 'crystal').length;
    const switchCount = interactibles.filter((i: any) => i.type === 'switch').length;

    const tasks: string[] = [];
    if (crystalCount > 0) {
        tasks.push(locale === 'vi' ? `Thu thập ${crystalCount} pha lê` : `Collect ${crystalCount} crystal${crystalCount > 1 ? 's' : ''}`);
    }
    if (switchCount > 0) {
        tasks.push(locale === 'vi' ? `Bật ${switchCount} công tắc` : `Activate ${switchCount} switch${switchCount > 1 ? 'es' : ''}`);
    }

    const reachGoal = locale === 'vi' ? 'tìm đường về đích' : 'reach the goal';
    if (tasks.length === 0) return locale === 'vi' ? 'Tìm đường về đích.' : 'Find your way to the goal.';
    return `${tasks.join(', ')} và ${reachGoal}.`;
}

// Helper to get category name from CATEGORY_INFO array
function getCategoryName(category: string | undefined, locale: 'vi' | 'en'): string {
    const catInfo = CATEGORY_INFO.find(c => c.id === category);
    if (!catInfo) return category || (locale === 'vi' ? 'Tùy chỉnh' : 'Custom');
    return locale === 'vi' ? catInfo.nameVi : catInfo.name;
}

export function TemplatePanel({ onGenerate, hasExistingMap = false }: TemplatePanelProps) {
    // State
    // Get all templates including custom preset
    const allTemplates = useMemo(() => {
        const shared = getAllTemplatesAsPresets();
        return [CUSTOM_PRESET, ...shared];
    }, []);

    // Templates grouped by category for optgroup display
    const groupedTemplates = useMemo(() => getTemplatesGroupedByCategory(), []);
    const availableCategories = useMemo(() => getAvailableCategories(), []);

    // Helper to get preset by ID from all sources
    const getPreset = useCallback((id: string): TemplatePreset | undefined => {
        if (id === 'custom') return CUSTOM_PRESET;
        return getTemplateById(id);
    }, []);

    const [selectedPresetId, setSelectedPresetId] = useState<string>('simple-for-loop');
    const [code, setCode] = useState<string>(() => {
        const preset = getTemplateById('simple-for-loop');
        return preset?.code || CUSTOM_PRESET.code;
    });
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [variableValues, setVariableValues] = useState<Record<string, number | string>>({});
    const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);

    const [isNotebookOpen, setIsNotebookOpen] = useState(false);
    const [isParamsExpanded, setIsParamsExpanded] = useState(true);

    // Extract variables from code
    const variables = useMemo(() => extractVariables(code), [code]);

    // Initialize variable values when variables change
    useEffect(() => {
        const newValues: Record<string, number | string> = {};
        variables.forEach(v => {
            newValues[v.name] = variableValues[v.name] ?? v.value;
        });
        setVariableValues(newValues);
    }, [variables]);

    // Current preset info (Moved up to be available for callbacks)
    const currentPreset = getPreset(selectedPresetId);

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
        const preset = getPreset(presetId);
        if (preset) {
            setCode(preset.code);
            setPreview(null);
            setVariableValues({}); // Reset variables
        }
    }, [getPreset]);

    // Handle code change from textarea
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
        setPreview(null);
    }, []);

    // Handle code change from string (for Monaco editor)
    const handleCodeChangeFromString = useCallback((newCode: string) => {
        setCode(newCode);
        setPreview(null);
    }, []);

    // Handle variable change - update value in code directly
    // Handle variable change - update value in code directly
    const handleVariableChange = useCallback((name: string, value: number | string) => {
        // Update the var declaration in code
        // For strings, escape if needed? Actually updateVariableValues handles it if we use it, 
        // but here we are doing regex replace manually.

        // Match number: var _N_ = 123;
        // Match string: var _S_ = 'val';

        // We construct a regex that matches EITHER number OR string assignment
        // But simpler: just locate the assignment by variable name and replace the RHS
        // We rely on the structure: var _NAME_ = VALUE;

        const isString = typeof value === 'string';
        const replacement = isString ? `'${value}'` : value;

        const pattern = new RegExp(`(var\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*)(?:\\d+|['"][^'"]*['"])(\\s*;)`, 'g');
        const newCode = code.replace(pattern, `$1${replacement}$2`);

        setCode(newCode);
        setVariableValues(prev => ({ ...prev, [name]: value }));
        setPreview(null);
    }, [code]);

    // Get effective code for EXECUTION
    // 1. Replace _PLACEHOLDER_ with slider values
    // 2. Evaluate var X = random(min, max); and replace X with result
    // 3. Remove var declarations
    const getEffectiveCode = useCallback(() => {
        let execCode = code;

        console.log('[TemplatePanel] === getEffectiveCode START ===');
        console.log('[TemplatePanel] Original code:', code);
        console.log('[TemplatePanel] Variables:', variables.map(v => v.name));
        console.log('[TemplatePanel] VariableValues:', variableValues);

        // Step 0: Remove var declarations FIRST
        // This ensures "var _MIN_STEPS_ = 3;" is removed before it becomes "var 3 = 3;" by Global Replace
        // Matches: var _NAME_ = VALUE; (including comments)
        execCode = execCode.replace(/^\s*var\s+(_[A-Z0-9_]+_)\s*=\s*(?:['"][^'"]*['"]|\d+)\s*;.*$/gm, '');
        console.log('[TemplatePanel] After Step 0 (remove var decls):', execCode);

        // Step 1: Extract FRESH values from the current code
        // This ensures we use the actual values in the code, not stale state
        const freshValues: Record<string, string | number> = {};
        for (const v of variables) {
            // Pattern to extract value: var _NAME_ = VALUE;
            // VALUE can be a number or a quoted string
            const extractPattern = new RegExp(
                `var\\s+${v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*(?:(['"])([^'"]*?)\\1|(\\d+))\\s*;`
            );
            const match = code.match(extractPattern);
            if (match) {
                if (match[2] !== undefined) {
                    // String value (group 2 from quoted string)
                    freshValues[v.name] = match[2];
                } else if (match[3] !== undefined) {
                    // Number value (group 3)
                    freshValues[v.name] = parseInt(match[3], 10);
                }
            } else {
                // Fallback to variableValues or original value
                freshValues[v.name] = variableValues[v.name] ?? v.value;
            }
        }

        console.log('[TemplatePanel] Fresh values from code:', freshValues);

        // Step 2: Replace all substitution variables with their fresh values
        // NOTE: \b doesn't work well with underscore-prefixed names like _TURN_STYLE_
        // because _ is considered a word character. We use explicit lookbehind/lookahead instead.
        for (const v of variables) {
            const value = freshValues[v.name];
            const isString = typeof value === 'string';
            const replacement = isString ? `'${value}'` : String(value);

            // Use a pattern that matches the variable name when NOT preceded/followed by word chars
            // This handles cases like: randomPattern(LEN, _INTERACTION_, _TURN_STYLE_)
            const escapedName = v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(?<![\\w])${escapedName}(?![\\w])`, 'g');
            const beforeReplace = execCode;
            execCode = execCode.replace(pattern, replacement);
            if (beforeReplace !== execCode) {
                console.log(`[TemplatePanel] Replaced ${v.name} with ${replacement}`);
            }
        }
        console.log('[TemplatePanel] After Step 2 (replace vars):', execCode);

        // Step 2: Find and evaluate "var VARNAME = random(min, max);" 
        // Store the results and replace VARNAME throughout code
        // Step 2: Parse and Remove "var VARNAME = random(...);"
        // We calculate the value, store it, THEN remove the line, THEN replace usage
        const randomVars: Record<string, number> = {};
        const randomPattern = /var\s+([A-Z][A-Z0-9_]*)\s*=\s*random\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*;/g;
        let match;

        // We need to capture all matches first because modifying string while exec leads to issues
        // Actually, we can just replace the lines with empty string AND capture the values in one pass?
        // But we need the min/max values.

        // Pass 1: Extract values
        while ((match = randomPattern.exec(execCode)) !== null) {
            const varName = match[1];
            const min = parseInt(match[2], 10);
            const max = parseInt(match[3], 10);
            randomVars[varName] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        console.log('[TemplatePanel] Random vars:', randomVars);

        // Pass 2: Remove the declarations
        execCode = execCode.replace(/var\s+[A-Z][A-Z0-9_]*\s*=\s*random\s*\(\s*\d+\s*,\s*\d+\s*\)\s*;/g, '');

        // Pass 3: Replace random var names with their computed values in the REST of the code
        for (const [varName, value] of Object.entries(randomVars)) {
            const pattern = new RegExp(`\\b${varName}\\b`, 'g');
            execCode = execCode.replace(pattern, String(value));
        }

        // Remove empty lines resulted from removals
        execCode = execCode.replace(/^\s*\n/gm, '');

        console.log('[TemplatePanel] === FINAL CODE ===');
        console.log(execCode);
        console.log('[TemplatePanel] === getEffectiveCode END ===');

        return execCode;
    }, [code, variables, variableValues]);

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
        /* 
        if (hasExistingMap) {
            const confirmed = window.confirm(
                'This will replace the current map. Continue?\n' +
                'Thao tác này sẽ thay thế map hiện tại. Tiếp tục?'
            );
            if (!confirmed) return;
        }
        */

        setIsLoading(true);

        try {
            const codeToUse = getEffectiveCode();
            const result = generateFromCode(codeToUse, {
                concept: 'sequential',
                gradeLevel: '3-5'
            });

            const mapData = convertToMapData(result);
            // Add template metadata for toolbox auto-selection
            if (currentPreset) {
                mapData.templateMeta = {
                    tags: currentPreset.tags || [],
                    concepts: currentPreset.concept ? [currentPreset.concept] : [],
                    category: currentPreset.category
                };

                // Auto-fill quest info from template
                const templateId = currentPreset.id || 'custom';
                const timestamp = Date.now();
                const uniqueId = `TEMPLATE.${currentPreset.category?.toUpperCase() || 'CUSTOM'}.${timestamp}`;
                const titleKey = `Template.${templateId}.Title`;
                const descriptionKey = `Template.${templateId}.Description`;
                const topicKey = `topic-${currentPreset.category || 'custom'}`;

                mapData.questInfo = {
                    id: uniqueId,
                    topic: topicKey,
                    titleKey,
                    descriptionKey,
                    translations: {
                        vi: {
                            [titleKey]: currentPreset.name || 'Bài tập mới',
                            [descriptionKey]: currentPreset.description || generateTaskDescription(result, 'vi'),
                            [topicKey]: getCategoryName(currentPreset.category, 'vi')
                        },
                        en: {
                            [titleKey]: currentPreset.name || 'New Exercise',
                            [descriptionKey]: currentPreset.description || generateTaskDescription(result, 'en'),
                            [topicKey]: getCategoryName(currentPreset.category, 'en')
                        }
                    },
                    // Hints extracted from template markdown
                    hints: currentPreset.hints
                };
            }
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
    }, [getEffectiveCode, hasExistingMap, onGenerate, currentPreset]);

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
                    {/* Custom Code option */}
                    <option value="custom">⭐ {CUSTOM_PRESET.name}</option>

                    {/* Grouped templates by category */}
                    {availableCategories.map(category => {
                        const categoryPresets = groupedTemplates.get(category.id) || [];
                        if (categoryPresets.length === 0) return null;
                        return (
                            <optgroup key={category.id} label={`${category.icon} ${category.nameVi}`}>
                                {categoryPresets.map(preset => (
                                    <option key={preset.id} value={preset.id}>
                                        {'⭐'.repeat(preset.difficulty)} {preset.name}
                                    </option>
                                ))}
                            </optgroup>
                        );
                    })}
                </select>
                {currentPreset && (
                    <div className="template-selector__info">
                        {/* Header: Difficulty + Category */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="template-selector__difficulty">
                                {'⭐'.repeat(currentPreset.difficulty)}
                            </span>
                            {currentPreset.category && (
                                <span className="template-selector__category-badge" style={{
                                    fontSize: '11px',
                                    color: '#aaa',
                                    border: '1px solid #444',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    {currentPreset.category === 'conditional' && '🔀 '}
                                    {currentPreset.category === 'loop' && '🔁 '}
                                    {currentPreset.category === 'function' && '📦 '}
                                    {currentPreset.category}
                                </span>
                            )}
                        </div>

                        {/* Concepts */}
                        {(currentPreset.concepts || [currentPreset.concept]).length > 0 && (
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                                <strong>Concepts: </strong>
                                {(currentPreset.concepts || [currentPreset.concept]).join(', ')}
                            </div>
                        )}

                        {/* Description */}
                        <div style={{ color: '#ccc', marginTop: '4px', fontSize: '12px' }}>
                            {currentPreset.description || currentPreset.descriptionVi}
                        </div>

                        {/* Tags */}
                        {currentPreset.tags && currentPreset.tags.length > 0 && (
                            <div className="template-selector__tags">
                                {currentPreset.tags.map(tag => (
                                    <span key={tag} className="template-selector__tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Variable Inputs */}
            {variables.length > 0 && (
                <div className={`template-variables ${isParamsExpanded ? 'template-variables--expanded' : ''}`}>
                    <button
                        className="template-variables__header"
                        onClick={() => setIsParamsExpanded(!isParamsExpanded)}
                    >
                        <div className="template-variables__header-left">
                            <Sliders size={16} />
                            <span className="template-variables__title">PARAMETERS</span>
                            <span className="template-variables__count">{variables.length}</span>
                        </div>
                        {isParamsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {isParamsExpanded && (
                        <>
                            <div className="template-variables__list">
                                {variables.map(variable => (
                                    <div key={variable.name} className="template-variables__item">
                                        <label className="template-variables__label">
                                            {variable.displayName}
                                        </label>

                                        {variable.options ? (
                                            <select
                                                className="template-variables__select"
                                                value={variableValues[variable.name] ?? variable.value}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    // Determine if original was number or string based on variable.type
                                                    // But Select values are always strings.
                                                    // If variable type is number, parse it.
                                                    if (variable.type === 'number') {
                                                        const num = parseInt(val, 10);
                                                        handleVariableChange(variable.name, num);
                                                    } else {
                                                        handleVariableChange(variable.name, val);
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#eee' }}
                                            >
                                                {variable.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : variable.type === 'string' ? (
                                            <input
                                                type="text"
                                                className="template-variables__text-input"
                                                value={variableValues[variable.name] ?? variable.value}
                                                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#eee' }}
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                className="template-variables__number-input"
                                                value={variableValues[variable.name] ?? variable.value}
                                                onChange={(e) => {
                                                    const newValue = parseInt(e.target.value, 10);
                                                    if (!isNaN(newValue) && newValue >= 0) {
                                                        handleVariableChange(variable.name, newValue);
                                                    }
                                                }}
                                                min={0}
                                                max={100}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="template-variables__hint">
                                💡 Biến với pattern _NAME_ sẽ tự động có input điều chỉnh
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Code Editor */}
            <div className="template-editor">
                <div className="template-editor__header">
                    <label className="template-editor__label">
                        Code (JavaScript)
                        {variables.length > 0 && (
                            <span className="template-editor__var-hint">
                                💡 Variables: {variables.map(v => v.name).join(', ')}
                            </span>
                        )}
                    </label>
                </div>
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

            {/* Editor Mode Buttons */}
            <div className="template-editor-modes">
                <button
                    className="template-editor-modes__btn"
                    onClick={() => setIsFullEditorOpen(true)}
                    title="Open Full Editor"
                >
                    <Maximize2 size={14} />
                    Full Editor
                </button>
                <button
                    className="template-editor-modes__btn template-editor-modes__btn--notebook"
                    onClick={() => setIsNotebookOpen(true)}
                    title="Open Notebook Editor (like Jupyter)"
                >
                    <BookOpen size={14} />
                    Notebook
                </button>
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

            {/* Full Editor Dialog */}
            <FullEditorDialog
                isOpen={isFullEditorOpen}
                onClose={() => setIsFullEditorOpen(false)}
                code={code}
                onCodeChange={handleCodeChangeFromString}
                variables={variables}
            />

            {/* Notebook Editor Dialog */}
            <NotebookEditor
                isOpen={isNotebookOpen}
                onClose={() => setIsNotebookOpen(false)}
                initialCode={code}
                onCodeChange={handleCodeChangeFromString}
            />
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
    const { gameConfig, trace, solution } = result;

    return {
        blocks: gameConfig.gameConfig.blocks.map((b: any) => ({
            x: b.position?.x ?? b.x ?? 0,
            y: b.position?.y ?? b.y ?? 0,
            z: b.position?.z ?? b.z ?? 0,
            model: b.modelKey || 'grass'
        })),
        // Combine collectibles AND interactibles into items
        items: [
            // Collectibles (crystals, keys)
            ...(gameConfig.gameConfig.collectibles || []).map((c: any) => ({
                type: c.type,
                position: {
                    x: c.position?.x ?? c.x ?? 0,
                    y: c.position?.y ?? c.y ?? 0,
                    z: c.position?.z ?? c.z ?? 0
                }
            })),
            // Interactibles (switches, portals)
            ...(gameConfig.gameConfig.interactibles || []).map((i: any) => ({
                type: i.type,
                position: {
                    x: i.position?.x ?? i.x ?? 0,
                    y: i.position?.y ?? i.y ?? 0,
                    z: i.position?.z ?? i.z ?? 0
                }
            }))
        ],
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
        rawActions: solution.rawActions,
        gameConfig: gameConfig,
        pathCoords: trace.pathCoords as Array<[number, number, number]>,
        movementSequence: trace.movementSequence as Array<[number, number, number]>, // Full sequential path
        solutionConfig: solution
    };
}

export default TemplatePanel;
