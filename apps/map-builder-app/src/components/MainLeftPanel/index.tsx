/**
 * MainLeftPanel Component
 * 
 * Replaces the old Left Panel and ViewportToolbar.
 * Located on the left edge of the Main Viewport.
 * Contains:
 * 1. Tool Logic (Select, Build, Clean)
 * 2. Asset Library (Scrollable list of assets)
 */

import React, { useState } from 'react';
import type { BuilderMode } from '../../types';
import type { BuildableAsset, AssetGroup } from '../../types';
import './MainLeftPanel.css';

export type SelectionMode = 'box' | 'smart';

interface MainLeftPanelProps {
    // Tools
    activeMode: BuilderMode;
    onModeChange: (mode: BuilderMode) => void;
    selectionMode: SelectionMode;
    onSelectionModeChange: (mode: SelectionMode) => void;
    hasSelection: boolean;
    selectionCount?: number;
    onCleanMap?: () => void;
    onShowShortcuts?: () => void;

    // Assets
    assetGroups: AssetGroup[];
    selectedAssetKey: string | null;
    onSelectAsset: (asset: BuildableAsset) => void;
}

export function MainLeftPanel({
    activeMode,
    onModeChange,
    selectionMode,
    onSelectionModeChange,
    hasSelection,
    selectionCount = 0,
    onCleanMap,
    onShowShortcuts,
    assetGroups,
    selectedAssetKey,
    onSelectAsset
}: MainLeftPanelProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(assetGroups.map(g => g.name))); // Open all by default

    const toggleGroup = (groupName: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(groupName)) {
            newSet.delete(groupName);
        } else {
            newSet.add(groupName);
        }
        setExpandedGroups(newSet);
    };

    // Correct handling of Build Mode
    // If user selects an asset, we usually want to be in 'build-single' mode.
    const handleAssetClick = (asset: BuildableAsset) => {
        onSelectAsset(asset);
        if (activeMode !== 'build-single') {
            onModeChange('build-single');
        }
    };

    return (
        <div className="main-left-panel">
            {/* --- Tools Header --- */}
            <div className="mlp-tools-header">
                {/* Select Mode */}
                <div className="tool-row">
                    <button
                        className={`tool-btn ${activeMode === 'navigate' || activeMode === 'build-area' ? 'active' : ''}`}
                        onClick={() => onModeChange('navigate')}
                        title="Select Mode (S) - Click to select, Shift+Drag area"
                    >
                        <span className="tool-icon">👆</span>
                        <span className="tool-label">Select</span>
                        {hasSelection && selectionCount > 0 && (
                            <span className="tool-badge">{selectionCount}</span>
                        )}
                    </button>
                    {/* Build Mode */}
                    <button
                        className={`tool-btn ${activeMode === 'build-single' ? 'active' : ''}`}
                        onClick={() => onModeChange('build-single')}
                        title="Build Mode (B) - Place objects"
                    >
                        <span className="tool-icon">🧱</span>
                        <span className="tool-label">Build</span>
                    </button>
                </div>

                {/* Sub-tools Row */}
                <div className="tool-row secondary">
                    {/* Selection Type Toggle */}
                    <div className="toggle-pill" title="Selection Mode">
                        <button
                            className={selectionMode === 'box' ? 'active' : ''}
                            onClick={() => onSelectionModeChange('box')}
                        >
                            Box
                        </button>
                        <button
                            className={selectionMode === 'smart' ? 'active' : ''}
                            onClick={() => onSelectionModeChange('smart')}
                        >
                            Smart
                        </button>
                    </div>

                    {/* Clean Map */}
                    {onCleanMap && (
                        <button className="icon-btn" onClick={onCleanMap} title="Clean Map (Remove overlapping duplicates)">
                            🧹
                        </button>
                    )}

                    {/* Keyboard Shortcuts */}
                    {onShowShortcuts && (
                        <button className="icon-btn help-btn" onClick={onShowShortcuts} title="Keyboard Shortcuts (?)">
                            ?
                        </button>
                    )}
                </div>
            </div>

            {/* --- Asset Library (Scrollable) --- */}
            <div className="mlp-assets-container custom-scrollbar">
                {assetGroups.map(group => (
                    <div key={group.name} className="asset-group">
                        <div
                            className="group-header"
                            onClick={() => toggleGroup(group.name)}
                        >
                            <span className="group-arrow">{expandedGroups.has(group.name) ? '▼' : '▶'}</span>
                            <span className="group-name">{group.name}</span>
                        </div>

                        {expandedGroups.has(group.name) && (
                            <div className="group-content">
                                {group.items.map(asset => (
                                    <div
                                        key={asset.key}
                                        className={`asset-item ${selectedAssetKey === asset.key ? 'selected' : ''}`}
                                        onClick={() => handleAssetClick(asset)}
                                        title={asset.name}
                                    >
                                        <div className="asset-thumb-wrapper">
                                            <img
                                                src={asset.thumbnail}
                                                alt={asset.name}
                                                className="asset-thumb"
                                                onError={(e) => { e.currentTarget.src = '/assets/ui/unknown.png'; }}
                                            />
                                        </div>
                                        <span className="asset-name">{asset.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MainLeftPanel;
