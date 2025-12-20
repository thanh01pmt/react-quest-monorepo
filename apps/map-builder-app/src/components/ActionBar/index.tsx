/**
 * ActionBar Component
 * 
 * Unified action bar with primary actions accessible in both Manual and Auto modes.
 * Actions: Validate, Solve, Generate/Clear, Export, Undo/Redo
 */

import React from 'react';
import { useBuilderMode } from '../../store/builderModeContext';
import './ActionBar.css';

interface ActionBarProps {
    /** Callback to validate the current map */
    onValidate: () => void;
    /** Callback to solve the maze and show optimal path */
    onSolve: () => void;
    /** Callback to generate map (Auto mode) */
    onGenerate: () => void;
    /** Callback to clear all objects (Manual mode) */
    onClear: () => void;
    /** Callback to export JSON */
    onExport: () => void;
    /** Callback to undo */
    onUndo: () => void;
    /** Callback to redo */
    onRedo: () => void;

    /** Whether validate is disabled */
    validateDisabled?: boolean;
    /** Whether solve is disabled */
    solveDisabled?: boolean;
    /** Whether generate is disabled */
    generateDisabled?: boolean;
    /** Whether generating is in progress */
    isGenerating?: boolean;

    /** Number of undo steps available */
    undoCount?: number;
    /** Number of redo steps available */
    redoCount?: number;

    /** Show validation status icon */
    validationStatus?: 'valid' | 'warning' | 'invalid' | 'unknown';
}

export function ActionBar({
    onValidate,
    onSolve,
    onGenerate,
    onClear,
    onExport,
    onUndo,
    onRedo,
    validateDisabled = false,
    solveDisabled = false,
    generateDisabled = false,
    isGenerating = false,
    undoCount = 0,
    redoCount = 0,
    validationStatus = 'unknown',
}: ActionBarProps) {
    const { state } = useBuilderMode();
    const isAutoMode = state.mode === 'auto';

    // Determine the primary action based on mode
    const renderPrimaryAction = () => {
        if (isAutoMode) {
            return (
                <button
                    className={`action-btn primary generate-btn ${isGenerating ? 'loading' : ''}`}
                    onClick={onGenerate}
                    disabled={generateDisabled || isGenerating}
                    title="Generate map from current settings"
                >
                    <span className="btn-icon">{isGenerating ? '⏳' : '🚀'}</span>
                    <span className="btn-label">{isGenerating ? 'Generating...' : 'Generate'}</span>
                </button>
            );
        } else {
            return (
                <button
                    className="action-btn danger clear-btn"
                    onClick={onClear}
                    title="Clear all objects from map"
                >
                    <span className="btn-icon">🗑️</span>
                    <span className="btn-label">Clear All</span>
                </button>
            );
        }
    };

    // Validation status icon
    const getValidationIcon = () => {
        switch (validationStatus) {
            case 'valid': return '✅';
            case 'warning': return '⚠️';
            case 'invalid': return '❌';
            default: return '🔍';
        }
    };

    return (
        <div className="action-bar">
            {/* History Controls */}
            <div className="action-group history-group">
                <button
                    className="action-btn small"
                    onClick={onUndo}
                    disabled={undoCount === 0}
                    title={`Undo (${undoCount} steps)`}
                >
                    <span className="btn-icon">↩️</span>
                    {undoCount > 0 && <span className="count-badge">{undoCount}</span>}
                </button>
                <button
                    className="action-btn small"
                    onClick={onRedo}
                    disabled={redoCount === 0}
                    title={`Redo (${redoCount} steps)`}
                >
                    <span className="btn-icon">↪️</span>
                    {redoCount > 0 && <span className="count-badge">{redoCount}</span>}
                </button>
            </div>

            {/* Main Actions */}
            <div className="action-group main-group">
                <button
                    className={`action-btn validate-btn ${validationStatus}`}
                    onClick={onValidate}
                    disabled={validateDisabled}
                    title="Validate map structure and solvability"
                >
                    <span className="btn-icon">{getValidationIcon()}</span>
                    <span className="btn-label">Validate</span>
                </button>

                <button
                    className="action-btn solve-btn"
                    onClick={onSolve}
                    disabled={solveDisabled}
                    title="Solve maze and show optimal path"
                >
                    <span className="btn-icon">🧩</span>
                    <span className="btn-label">Solve</span>
                </button>

                {renderPrimaryAction()}
            </div>

            {/* Export Action */}
            <div className="action-group export-group">
                <button
                    className="action-btn export-btn"
                    onClick={onExport}
                    title="Export map as JSON file"
                >
                    <span className="btn-icon">💾</span>
                    <span className="btn-label">Export</span>
                </button>
            </div>
        </div>
    );
}

export default ActionBar;
