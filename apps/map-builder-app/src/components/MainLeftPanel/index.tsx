/**
 * MainLeftPanel Component
 * 
 * Replaces the old Left Panel and ViewportToolbar.
 * Located on the left edge of the Main Viewport.
 * Contains:
 * 1. Tool Logic (Select, Build, Clean)
 * 2. Asset Library (Scrollable list of assets)
 */

import React, { useState, useRef } from 'react';
import type { BuilderMode } from '../../types';
import type { BuildableAsset, AssetGroup } from '../../types';
import { MousePointer, Hammer, Eraser, Trash2, Keyboard, ChevronDown, ChevronRight, Move } from 'lucide-react';
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
    onCenterMap?: () => void;
    onClearItems?: () => void;
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
    onCenterMap,
    onClearItems,
    onShowShortcuts,
    assetGroups,
    selectedAssetKey,
    onSelectAsset
}: MainLeftPanelProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Closed all by default
    const [isCompact, setIsCompact] = useState(false); // New Compact State
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set()); // Track broken images

    // Popover Logic for Compact Mode
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
    const [popoverTop, setPopoverTop] = useState<number>(0);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleGroupEnter = (e: React.MouseEvent, groupName: string) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        // Adjust top to stay within viewport
        const maxTop = window.innerHeight - 350; // Approximated max height of popover
        setPopoverTop(Math.min(rect.top, maxTop));
        setHoveredGroup(groupName);
    };

    const handleGroupLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredGroup(null);
        }, 150);
    };

    const handlePopoverEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };

    const handlePopoverLeave = () => {
        handleGroupLeave();
    };

    const handleImageError = (assetKey: string) => {
        setFailedImages(prev => {
            const next = new Set(prev);
            next.add(assetKey);
            return next;
        });
    };

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
        <div className={`main-left-panel ${isCompact ? 'compact' : ''}`}>
            {/* --- Tools Header --- */}
            <div className="mlp-tools-header">
                {/* Header Top: Toggle Compact */}
                <button
                    className="compact-toggle-btn"
                    onClick={() => setIsCompact(!isCompact)}
                    title={isCompact ? "Expand Panel" : "Collapse Panel"}
                >
                    {isCompact ? '»' : '«'}
                </button>
                {/* Select Mode */}
                <div className="tool-row">
                    <button
                        className={`tool-btn ${activeMode === 'navigate' || activeMode === 'build-area' ? 'active' : ''}`}
                        onClick={() => onModeChange('navigate')}
                        title="Select Mode (S) - Click to select, Shift+Drag area"
                    >
                        <span className="tool-icon"><MousePointer size={16} /></span>
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
                        <span className="tool-icon"><Hammer size={16} /></span>
                        <span className="tool-label">Build</span>
                    </button>
                </div>

                {/* Sub-tools Row */}
                {/* Sub-tools Row 1: Selection Toggle */}
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
                </div>

                {/* Sub-tools Row 2: Actions (Clean, Center, Clear) */}
                <div className="tool-row secondary" style={{ justifyContent: 'flex-end' }}>
                    {/* Clean Map */}
                    {onCleanMap && (
                        <button className="icon-btn" onClick={onCleanMap} title="Clean Map (Remove overlapping duplicates)">
                            <Eraser size={16} />
                        </button>
                    )}

                    {/* Center Map */}
                    {onCenterMap && (
                        <button className="icon-btn" onClick={onCenterMap} title="Center Map (Move all objects to grid center)">
                            <Move size={16} />
                        </button>
                    )}

                    {/* Clear Items */}
                    {onClearItems && (
                        <button className="icon-btn" onClick={onClearItems} title="Clear Items (Remove all collectibles/interactibles)">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Keyboard Shortcuts - Separate Row */}
                {onShowShortcuts && (
                    <div className="tool-row shortcuts-row">
                        <button className="shortcuts-btn" onClick={onShowShortcuts} title="Keyboard Shortcuts (?)">
                            <span className="shortcut-icon"><Keyboard size={16} /></span>
                            <span className="shortcut-text">Keyboard Shortcuts</span>
                        </button>
                    </div>
                )}
            </div>

            {/* --- Asset Library (Scrollable) --- */}
            <div className={`mlp-assets-container custom-scrollbar ${isCompact ? 'compact-list' : ''}`}>
                {assetGroups.map(group => {
                    // COMPACT MODE LAYOUT
                    if (isCompact) {
                        const repItem = group.items[0];
                        if (!repItem) return null;

                        return (
                            <div key={group.name} className="asset-group-compact">
                                {/* Representative Icon (Trigger) */}
                                <div
                                    className="group-trigger-icon"
                                    title={group.name}
                                    onMouseEnter={(e) => handleGroupEnter(e, group.name)}
                                    onMouseLeave={handleGroupLeave}
                                >
                                    <div className="rep-thumb-wrapper">
                                        {failedImages.has(repItem.key) ? (
                                            <div className="asset-text-fallback">{group.name.substring(0, 3)}</div>
                                        ) : (
                                            <img
                                                src={repItem.thumbnail}
                                                alt={group.name}
                                                className="rep-thumb"
                                                onError={() => handleImageError(repItem.key)}
                                            />
                                        )}
                                    </div>
                                    <span className="compact-group-label">{group.name}</span>
                                </div>
                            </div>
                        );
                    }

                    // NORMAL MODE LAYOUT
                    return (
                        <div key={group.name} className="asset-group">
                            <div
                                className="group-header"
                                onClick={() => toggleGroup(group.name)}
                            >
                                <span className="group-arrow">{expandedGroups.has(group.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
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
                                                {failedImages.has(asset.key) ? (
                                                    <div className="asset-text-fallback">{asset.name}</div>
                                                ) : (
                                                    <img
                                                        src={asset.thumbnail}
                                                        alt={asset.name}
                                                        className="asset-thumb"
                                                        onError={() => handleImageError(asset.key)}
                                                    />
                                                )}
                                            </div>
                                            <span className="asset-name">{asset.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* --- Independent Popover for Compact Mode --- */}
            {isCompact && hoveredGroup && (
                <div
                    className="group-popover active"
                    style={{ top: popoverTop }}
                    onMouseEnter={handlePopoverEnter}
                    onMouseLeave={handlePopoverLeave}
                >
                    {(() => {
                        const group = assetGroups.find(g => g.name === hoveredGroup);
                        if (!group) return null;
                        return (
                            <>
                                <div className="popover-header-text">{group.name}</div>
                                <div className="popover-grid">
                                    {group.items.map(asset => (
                                        <div
                                            key={asset.key}
                                            className={`asset-item ${selectedAssetKey === asset.key ? 'selected' : ''}`}
                                            onClick={() => handleAssetClick(asset)}
                                            title={asset.name}
                                        >
                                            <div className="asset-thumb-wrapper">
                                                {failedImages.has(asset.key) ? (
                                                    <div className="asset-text-fallback">{asset.name}</div>
                                                ) : (
                                                    <img
                                                        src={asset.thumbnail}
                                                        alt={asset.name}
                                                        className="asset-thumb"
                                                        onError={() => handleImageError(asset.key)}
                                                    />
                                                )}
                                            </div>
                                            <span className="asset-name">{asset.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

export default MainLeftPanel;
