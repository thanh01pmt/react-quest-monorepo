/**
 * BuilderControlPanel Component
 * 
 * Unified left panel container that combines:
 * - CommonControls (mode toggle, layer, theme)
 * - Mode-specific content (AssetPalette or TopologyOptions)
 * - ActionBar (validate, solve, generate, export)
 */

import React from 'react';
import { useBuilderMode } from '../../store/builderModeContext';
import { CommonControls } from '../CommonControls';
import { ActionBar } from '../ActionBar';
import { AssetPalette } from '../AssetPalette';
import { TopologyPanel } from '../TopologyPanel';
import { BuildableAsset, MapTheme, BuilderMode as OldBuilderMode, BoxDimensions, FillOptions, SelectionBounds, PlacedObject } from '../../types';
import './BuilderControlPanel.css';

interface BuilderControlPanelProps {
    // Theme props
    mapTheme: MapTheme;
    onThemeChange: (theme: MapTheme) => void;
    availableThemes?: MapTheme[];

    // Action handlers
    onValidate: () => void;
    onSolve: () => void;
    onGenerate: (objects: PlacedObject[], metadataUpdate?: Record<string, any>) => void;
    onClear: () => void;
    onExport: () => void;
    onUndo: () => void;
    onRedo: () => void;

    // Action states
    validateDisabled?: boolean;
    solveDisabled?: boolean;
    generateDisabled?: boolean;
    isGenerating?: boolean;
    undoCount?: number;
    redoCount?: number;
    validationStatus?: 'valid' | 'warning' | 'invalid' | 'unknown';

    // AssetPalette props (for manual mode)
    selectedAssetKey: string | null;
    onSelectAsset: (asset: BuildableAsset) => void;
    currentMode: OldBuilderMode;
    onModeChange: (mode: OldBuilderMode) => void;
    boxDimensions: BoxDimensions;
    onDimensionsChange: (axis: keyof BoxDimensions, value: number) => void;
    fillOptions: FillOptions;
    onFillOptionsChange: (options: FillOptions) => void;
    onSelectionAction: (action: 'fill' | 'replace' | 'delete') => void;
    selectionBounds: SelectionBounds | null;
    onSelectionBoundsChange: (bounds: SelectionBounds) => void;
    onImportMap: (file: File) => void;
    onLoadMapFromUrl: (url: string) => void;
    onShowTutorial: () => void;
    onCreateNewMap: () => void;
    getCorrectedAssetUrl: (url: string) => string;

    // TopologyPanel props (for auto mode)
    assetMap: Map<string, BuildableAsset>;
}

export function BuilderControlPanel({
    // Theme
    mapTheme,
    onThemeChange,
    availableThemes,

    // Actions
    onValidate,
    onSolve,
    onGenerate,
    onClear,
    onExport,
    onUndo,
    onRedo,

    // Action states
    validateDisabled,
    solveDisabled,
    generateDisabled,
    isGenerating,
    undoCount,
    redoCount,
    validationStatus,

    // AssetPalette props
    selectedAssetKey,
    onSelectAsset,
    currentMode,
    onModeChange,
    boxDimensions,
    onDimensionsChange,
    fillOptions,
    onFillOptionsChange,
    onSelectionAction,
    selectionBounds,
    onSelectionBoundsChange,
    onImportMap,
    onLoadMapFromUrl,
    onShowTutorial,
    onCreateNewMap,
    getCorrectedAssetUrl,

    // TopologyPanel props
    assetMap,
}: BuilderControlPanelProps) {
    const { state, setIsEditing, setLastGenerateConfig, setIsGenerating } = useBuilderMode();

    // Wrap onGenerate to update context state
    const handleGenerate = (objects: PlacedObject[], metadataUpdate?: Record<string, any>) => {
        setIsGenerating(true);
        try {
            onGenerate(objects, metadataUpdate);
            setIsEditing(true); // Enter editing mode after generate

            // Save config for potential regeneration
            if (metadataUpdate) {
                setLastGenerateConfig({
                    topology: metadataUpdate.topology || 'unknown',
                    params: metadataUpdate.topologyParams || {},
                    strategy: metadataUpdate.strategy || 'none',
                    difficulty: metadataUpdate.difficulty || 'simple',
                });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle generate button click from ActionBar
    const handleGenerateClick = () => {
        // This is a trigger - actual generation happens in TopologyPanel
        // For now, just dispatch a custom event that TopologyPanel can listen to
        const event = new CustomEvent('trigger-generate');
        window.dispatchEvent(event);
    };

    return (
        <div className="builder-control-panel">
            {/* Header */}
            <div className="panel-header">
                <h2 className="panel-title">
                    <span className="title-icon">🗺️</span>
                    Map Builder
                </h2>
            </div>

            {/* Common Controls */}
            <CommonControls
                mapTheme={mapTheme}
                onThemeChange={onThemeChange}
                availableThemes={availableThemes}
            />

            {/* Mode-Specific Content */}
            <div className="mode-content">
                {state.mode === 'manual' ? (
                    <AssetPalette
                        selectedAssetKey={selectedAssetKey}
                        onSelectAsset={onSelectAsset}
                        currentMode={currentMode}
                        onModeChange={onModeChange}
                        boxDimensions={boxDimensions}
                        onDimensionsChange={onDimensionsChange}
                        fillOptions={fillOptions}
                        onFillOptionsChange={onFillOptionsChange}
                        onSelectionAction={onSelectionAction}
                        selectionBounds={selectionBounds}
                        onSelectionBoundsChange={onSelectionBoundsChange}
                        onImportMap={onImportMap}
                        onLoadMapFromUrl={onLoadMapFromUrl}
                        onShowTutorial={onShowTutorial}
                        onCreateNewMap={onCreateNewMap}
                        getCorrectedAssetUrl={getCorrectedAssetUrl}
                    />
                ) : (
                    <TopologyPanel
                        onGenerate={handleGenerate}
                        assetMap={assetMap}
                    />
                )}
            </div>

            {/* Action Bar */}
            <ActionBar
                onValidate={onValidate}
                onSolve={onSolve}
                onGenerate={handleGenerateClick}
                onClear={onClear}
                onExport={onExport}
                onUndo={onUndo}
                onRedo={onRedo}
                validateDisabled={validateDisabled}
                solveDisabled={solveDisabled}
                generateDisabled={generateDisabled}
                isGenerating={isGenerating || state.isGenerating}
                undoCount={undoCount}
                redoCount={redoCount}
                validationStatus={validationStatus}
            />
        </div>
    );
}

export default BuilderControlPanel;
