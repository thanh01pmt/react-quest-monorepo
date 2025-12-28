/**
 * NotebookEditor Component
 * 
 * A Jupyter-like notebook editor for template code.
 * Supports markdown cells for documentation and code cells with execution.
 */

import React, { useState, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
    Play, Plus, Trash2, ChevronUp, ChevronDown,
    FileText, Code, CheckCircle, AlertCircle, X,
    GripVertical, Eye, Loader2
} from 'lucide-react';
import { generateFromCode } from '@repo/academic-map-generator';
import './NotebookEditor.css';

// Types
export interface NotebookCell {
    id: string;
    type: 'markdown' | 'code';
    content: string;
    output?: CellOutput;
    isCollapsed?: boolean;
}

export interface CellOutput {
    success: boolean;
    message?: string;
    metrics?: {
        pathLength: number;
        itemCount: number;
        loopIterations: number;
    };
    asciiMap?: string;
    error?: string;
}

interface NotebookEditorProps {
    isOpen: boolean;
    onClose: () => void;
    initialCode: string;
    onCodeChange: (code: string) => void;
}

// Generate unique ID
const generateId = () => `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Parse code into cells (split by markdown comments)
function parseCodeToCells(code: string): NotebookCell[] {
    const cells: NotebookCell[] = [];
    const lines = code.split('\n');
    let currentCell: NotebookCell | null = null;
    let inMarkdown = false;

    for (const line of lines) {
        // Check for markdown block start: /* or /**
        if (line.trim().startsWith('/*') && !line.trim().startsWith('/**')) {
            // Save previous cell
            if (currentCell && currentCell.content.trim()) {
                cells.push(currentCell);
            }
            // Start markdown cell
            currentCell = {
                id: generateId(),
                type: 'markdown',
                content: line.replace(/^\/\*+\s*/, '').replace(/\*+\/\s*$/, '')
            };
            inMarkdown = !line.trim().endsWith('*/');
        } else if (inMarkdown) {
            // Continue markdown
            if (line.trim().endsWith('*/')) {
                currentCell!.content += '\n' + line.replace(/\*+\/\s*$/, '');
                inMarkdown = false;
            } else {
                currentCell!.content += '\n' + line.replace(/^\s*\*\s?/, '');
            }
        } else if (line.trim().startsWith('//') && !currentCell) {
            // Single line comment as markdown
            cells.push({
                id: generateId(),
                type: 'markdown',
                content: line.replace(/^\/\/\s*/, '')
            });
        } else if (line.trim().startsWith('//') && currentCell?.type === 'markdown') {
            // Continue markdown with single line comments
            currentCell.content += '\n' + line.replace(/^\/\/\s*/, '');
        } else {
            // Code line
            if (!currentCell || currentCell.type === 'markdown') {
                if (currentCell && currentCell.content.trim()) {
                    cells.push(currentCell);
                }
                currentCell = {
                    id: generateId(),
                    type: 'code',
                    content: line
                };
            } else {
                currentCell.content += '\n' + line;
            }
        }
    }

    // Push last cell
    if (currentCell && currentCell.content.trim()) {
        cells.push(currentCell);
    }

    // If no cells, create default
    if (cells.length === 0) {
        cells.push({
            id: generateId(),
            type: 'markdown',
            content: '# Template Notebook\n\nWrite your code below and run each cell.'
        });
        cells.push({
            id: generateId(),
            type: 'code',
            content: 'moveForward();\ncollectItem();'
        });
    }

    return cells;
}

// Convert cells back to code string
function cellsToCode(cells: NotebookCell[]): string {
    return cells.map(cell => {
        if (cell.type === 'markdown') {
            // Convert markdown to comment
            const lines = cell.content.split('\n');
            if (lines.length === 1) {
                return `// ${cell.content}`;
            }
            return `/*\n${lines.map(l => ' * ' + l).join('\n')}\n */`;
        }
        return cell.content;
    }).join('\n\n');
}

// Simple markdown renderer
function renderMarkdown(content: string): React.ReactNode {
    const lines = content.split('\n');
    return lines.map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
            return <h4 key={i} className="notebook-md-h4">{line.slice(4)}</h4>;
        }
        if (line.startsWith('## ')) {
            return <h3 key={i} className="notebook-md-h3">{line.slice(3)}</h3>;
        }
        if (line.startsWith('# ')) {
            return <h2 key={i} className="notebook-md-h2">{line.slice(2)}</h2>;
        }
        // Bold
        const boldRegex = /\*\*(.+?)\*\*/g;
        const withBold = line.replace(boldRegex, '<strong>$1</strong>');
        // Code inline
        const codeRegex = /`(.+?)`/g;
        const withCode = withBold.replace(codeRegex, '<code>$1</code>');
        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={i} dangerouslySetInnerHTML={{ __html: withCode.slice(2) }} />;
        }
        // Empty line
        if (!line.trim()) {
            return <br key={i} />;
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: withCode }} />;
    });
}

export function NotebookEditor({ isOpen, onClose, initialCode, onCodeChange }: NotebookEditorProps) {
    const [cells, setCells] = useState<NotebookCell[]>(() => parseCodeToCells(initialCode));
    const [runningCellId, setRunningCellId] = useState<string | null>(null);
    const [editingMarkdownId, setEditingMarkdownId] = useState<string | null>(null);

    // Sync code back to parent
    const syncCode = useCallback((newCells: NotebookCell[]) => {
        const code = cellsToCode(newCells);
        onCodeChange(code);
    }, [onCodeChange]);

    // Update cell content
    const updateCell = useCallback((id: string, content: string) => {
        setCells(prev => {
            const newCells = prev.map(c => c.id === id ? { ...c, content } : c);
            syncCode(newCells);
            return newCells;
        });
    }, [syncCode]);

    // Add cell
    const addCell = useCallback((afterId: string, type: 'markdown' | 'code') => {
        setCells(prev => {
            const index = prev.findIndex(c => c.id === afterId);
            const newCell: NotebookCell = {
                id: generateId(),
                type,
                content: type === 'markdown' ? '# New Section' : '// New code\n'
            };
            const newCells = [...prev.slice(0, index + 1), newCell, ...prev.slice(index + 1)];
            syncCode(newCells);
            return newCells;
        });
    }, [syncCode]);

    // Delete cell
    const deleteCell = useCallback((id: string) => {
        setCells(prev => {
            if (prev.length <= 1) return prev; // Keep at least one cell
            const newCells = prev.filter(c => c.id !== id);
            syncCode(newCells);
            return newCells;
        });
    }, [syncCode]);

    // Move cell
    const moveCell = useCallback((id: string, direction: 'up' | 'down') => {
        setCells(prev => {
            const index = prev.findIndex(c => c.id === id);
            if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) {
                return prev;
            }
            const newCells = [...prev];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            [newCells[index], newCells[swapIndex]] = [newCells[swapIndex], newCells[index]];
            syncCode(newCells);
            return newCells;
        });
    }, [syncCode]);

    // Run cell
    const runCell = useCallback((id: string) => {
        setRunningCellId(id);

        // Get all code up to and including this cell
        const cellIndex = cells.findIndex(c => c.id === id);
        const codeCells = cells.slice(0, cellIndex + 1).filter(c => c.type === 'code');
        const fullCode = codeCells.map(c => c.content).join('\n');

        setTimeout(() => {
            try {
                const result = generateFromCode(fullCode, {
                    concept: 'sequential',
                    gradeLevel: '3-5'
                });

                // Update cell with output
                setCells(prev => prev.map(c => {
                    if (c.id === id) {
                        return {
                            ...c,
                            output: {
                                success: true,
                                message: '✓ Cell executed successfully',
                                metrics: {
                                    pathLength: result.metadata.pathLength,
                                    itemCount: result.metadata.itemCount,
                                    loopIterations: result.trace.loopIterations
                                },
                                asciiMap: generateAsciiPreview(result)
                            }
                        };
                    }
                    return c;
                }));
            } catch (err) {
                setCells(prev => prev.map(c => {
                    if (c.id === id) {
                        return {
                            ...c,
                            output: {
                                success: false,
                                error: err instanceof Error ? err.message : 'Execution failed'
                            }
                        };
                    }
                    return c;
                }));
            } finally {
                setRunningCellId(null);
            }
        }, 100);
    }, [cells]);

    // Run all cells
    const runAllCells = useCallback(() => {
        const codeCells = cells.filter(c => c.type === 'code');
        if (codeCells.length > 0) {
            runCell(codeCells[codeCells.length - 1].id);
        }
    }, [cells, runCell]);

    if (!isOpen) return null;

    return (
        <div className="notebook-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="notebook-dialog">
                {/* Header */}
                <div className="notebook-header">
                    <div className="notebook-title">
                        <FileText size={18} />
                        <span>Template Notebook</span>
                    </div>
                    <div className="notebook-toolbar">
                        <button
                            className="notebook-toolbar-btn"
                            onClick={() => addCell(cells[cells.length - 1]?.id || '', 'markdown')}
                            title="Add Markdown Cell"
                        >
                            <Plus size={14} />
                            <FileText size={14} />
                        </button>
                        <button
                            className="notebook-toolbar-btn"
                            onClick={() => addCell(cells[cells.length - 1]?.id || '', 'code')}
                            title="Add Code Cell"
                        >
                            <Plus size={14} />
                            <Code size={14} />
                        </button>
                        <div className="notebook-toolbar-divider" />
                        <button
                            className="notebook-toolbar-btn notebook-toolbar-btn--primary"
                            onClick={runAllCells}
                            title="Run All Cells"
                        >
                            <Play size={14} />
                            Run All
                        </button>
                    </div>
                    <button className="notebook-close" onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Cells */}
                <div className="notebook-cells">
                    {cells.map((cell, index) => (
                        <div key={cell.id} className={`notebook-cell notebook-cell--${cell.type}`}>
                            {/* Cell toolbar */}
                            <div className="notebook-cell__toolbar">
                                <div className="notebook-cell__type">
                                    {cell.type === 'markdown' ? (
                                        <><FileText size={12} /> MD</>
                                    ) : (
                                        <><Code size={12} /> [{index + 1}]</>
                                    )}
                                </div>
                                <div className="notebook-cell__actions">
                                    {cell.type === 'code' && (
                                        <button
                                            className="notebook-cell__action notebook-cell__action--run"
                                            onClick={() => runCell(cell.id)}
                                            disabled={runningCellId === cell.id}
                                            title="Run Cell (Shift+Enter)"
                                        >
                                            {runningCellId === cell.id ? (
                                                <Loader2 size={14} className="spinning" />
                                            ) : (
                                                <Play size={14} />
                                            )}
                                        </button>
                                    )}
                                    {cell.type === 'markdown' && (
                                        <button
                                            className="notebook-cell__action"
                                            onClick={() => setEditingMarkdownId(
                                                editingMarkdownId === cell.id ? null : cell.id
                                            )}
                                            title={editingMarkdownId === cell.id ? "Preview" : "Edit"}
                                        >
                                            {editingMarkdownId === cell.id ? <Eye size={14} /> : <Code size={14} />}
                                        </button>
                                    )}
                                    <button
                                        className="notebook-cell__action"
                                        onClick={() => moveCell(cell.id, 'up')}
                                        disabled={index === 0}
                                        title="Move Up"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        className="notebook-cell__action"
                                        onClick={() => moveCell(cell.id, 'down')}
                                        disabled={index === cells.length - 1}
                                        title="Move Down"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    <button
                                        className="notebook-cell__action notebook-cell__action--delete"
                                        onClick={() => deleteCell(cell.id)}
                                        disabled={cells.length <= 1}
                                        title="Delete Cell"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Cell content */}
                            <div className="notebook-cell__content">
                                {cell.type === 'markdown' ? (
                                    editingMarkdownId === cell.id ? (
                                        <textarea
                                            className="notebook-cell__markdown-edit"
                                            value={cell.content}
                                            onChange={(e) => updateCell(cell.id, e.target.value)}
                                            placeholder="# Write markdown here..."
                                        />
                                    ) : (
                                        <div
                                            className="notebook-cell__markdown-preview"
                                            onClick={() => setEditingMarkdownId(cell.id)}
                                        >
                                            {renderMarkdown(cell.content)}
                                        </div>
                                    )
                                ) : (
                                    <Editor
                                        height={Math.max(80, Math.min(300, cell.content.split('\n').length * 20))}
                                        defaultLanguage="javascript"
                                        theme="vs-dark"
                                        value={cell.content}
                                        onChange={(value) => updateCell(cell.id, value || '')}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            wordWrap: 'on',
                                            automaticLayout: true,
                                            tabSize: 2,
                                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                                            overviewRulerBorder: false,
                                            hideCursorInOverviewRuler: true,
                                            renderLineHighlight: 'none',
                                            lineDecorationsWidth: 0,
                                            lineNumbersMinChars: 3
                                        }}
                                    />
                                )}
                            </div>

                            {/* Cell output */}
                            {cell.output && (
                                <div className={`notebook-cell__output ${cell.output.success ? 'success' : 'error'}`}>
                                    <div className="notebook-cell__output-header">
                                        {cell.output.success ? (
                                            <><CheckCircle size={14} /> Output</>
                                        ) : (
                                            <><AlertCircle size={14} /> Error</>
                                        )}
                                    </div>
                                    {cell.output.error ? (
                                        <pre className="notebook-cell__output-error">{cell.output.error}</pre>
                                    ) : (
                                        <>
                                            {cell.output.metrics && (
                                                <div className="notebook-cell__output-metrics">
                                                    <span>Path: {cell.output.metrics.pathLength}</span>
                                                    <span>Items: {cell.output.metrics.itemCount}</span>
                                                    <span>Loops: {cell.output.metrics.loopIterations}</span>
                                                </div>
                                            )}
                                            {cell.output.asciiMap && (
                                                <pre className="notebook-cell__output-ascii">{cell.output.asciiMap}</pre>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Add cell buttons (between cells) */}
                            <div className="notebook-cell__add-row">
                                <button
                                    className="notebook-cell__add-btn"
                                    onClick={() => addCell(cell.id, 'markdown')}
                                    title="Add Markdown Below"
                                >
                                    <Plus size={12} /> MD
                                </button>
                                <button
                                    className="notebook-cell__add-btn"
                                    onClick={() => addCell(cell.id, 'code')}
                                    title="Add Code Below"
                                >
                                    <Plus size={12} /> Code
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="notebook-footer">
                    <div className="notebook-footer-info">
                        {cells.filter(c => c.type === 'code').length} code cells, {cells.filter(c => c.type === 'markdown').length} markdown cells
                    </div>
                    <button className="notebook-footer-btn" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

// Generate ASCII preview
function generateAsciiPreview(result: any): string {
    const { trace } = result;
    const pathCoords = trace.pathCoords;
    const items = trace.items || [];
    const startPosition = trace.startPosition;
    const endPosition = trace.endPosition;

    if (!pathCoords || pathCoords.length === 0) return 'No path generated';

    const xs = pathCoords.map((c: number[]) => c[0]);
    const zs = pathCoords.map((c: number[]) => c[2]);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;

    const pathSet = new Set(pathCoords.map((c: number[]) => `${c[0]},${c[2]}`));
    const itemMap = new Map<string, string>();
    items.forEach((item: any) => {
        itemMap.set(`${item.position[0]},${item.position[2]}`, item.type);
    });
    const startKey = `${startPosition[0]},${startPosition[2]}`;
    const endKey = `${endPosition[0]},${endPosition[2]}`;

    const lines: string[] = [];
    for (let z = maxZ; z >= minZ; z--) {
        let row = '';
        for (let x = minX; x <= maxX; x++) {
            const key = `${x},${z}`;
            if (key === startKey) row += 'S ';
            else if (key === endKey) row += 'E ';
            else if (itemMap.has(key)) row += 'C ';
            else if (pathSet.has(key)) row += '█ ';
            else row += '· ';
        }
        lines.push(row);
    }
    return lines.join('\n');
}

export default NotebookEditor;
