/**
 * AssetPalette Component - Refactored for Manual Mode
 * 
 * Streamlined version focused on:
 * - Asset selection (grouped blocks/items)
 * - Placement mode switching
 * - Selection tools (area selection, fill, replace, delete)
 * - Build area dimensions
 * 
 * Removed (moved to other components):
 * - Import/Export buttons → ActionBar
 * - Layer selector → CommonControls
 * - Smart Snap → CommonControls
 * - Theme selector → CommonControls
 */

import { useRef, useState, useEffect } from 'react';
import { buildableAssetGroups } from '../../config/gameAssets';
import { type BuildableAsset, type BuilderMode, type BoxDimensions, type FillOptions, type SelectionBounds } from '../../types';
import type { SelectionMode } from '../../App'; // Import from App
import './AssetPalette.css';

interface AssetPaletteProps {
  selectedAssetKey: string | null;
  onSelectAsset: (asset: BuildableAsset) => void;
  currentMode: BuilderMode;
  onModeChange: (mode: BuilderMode) => void;
  boxDimensions: BoxDimensions;
  onDimensionsChange: (axis: keyof BoxDimensions, value: number) => void;
  fillOptions: FillOptions;
  onFillOptionsChange: (options: FillOptions) => void;
  onSelectionAction: (action: 'fill' | 'replace' | 'delete') => void;
  selectionBounds: SelectionBounds | null;
  onSelectionBoundsChange: (bounds: SelectionBounds) => void;
  // Smart selection
  selectionMode?: SelectionMode;
  onSelectionModeChange?: (mode: SelectionMode) => void;
  onImportMap: (file: File) => void;
  onLoadMapFromUrl: (url: string) => void;
  onShowTutorial: () => void;
  onCreateNewMap: () => void;
  getCorrectedAssetUrl: (url: string) => string;
}

const DimensionInputRow = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
  <div className="dimension-input">
    <label>{label}</label>
    <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value, 10) || 0)} />
  </div>
);

export function AssetPalette({
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
  selectionMode = 'box', // Default to box selection
  onSelectionModeChange,
  onImportMap,
  onLoadMapFromUrl,
  onShowTutorial,
  onCreateNewMap,
  getCorrectedAssetUrl
}: AssetPaletteProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mapList, setMapList] = useState<Record<string, unknown> | null>(null);
  const [templateList, setTemplateList] = useState<Record<string, unknown> | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Blocks']));

  // Load map and template lists
  useEffect(() => {
    const mapFiles = import.meta.glob('/public/maps/*.json', { eager: true });
    setMapList(mapFiles);
    const templateFiles = import.meta.glob('/public/templates/*.json', { eager: true });
    setTemplateList(templateFiles);
  }, []);

  const handleMapSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mapPath = e.target.value;
    if (mapPath) {
      onLoadMapFromUrl(mapPath);
      e.target.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportMap(file);
    }
    event.target.value = '';
  };

  const handleBoundChange = (bound: 'min' | 'max', axisIndex: number, value: number) => {
    if (!selectionBounds) return;
    const newBounds = JSON.parse(JSON.stringify(selectionBounds)) as SelectionBounds;
    newBounds[bound][axisIndex] = value;
    if (newBounds.min[axisIndex] > newBounds.max[axisIndex]) {
      if (bound === 'min') newBounds.max[axisIndex] = value;
      else newBounds.min[axisIndex] = value;
    }
    onSelectionBoundsChange(newBounds);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <aside className="asset-palette">
      {/* NOTE: Placement Mode moved to ViewportToolbar for better accessibility */}

      {/* Selection Controls */}
      {selectionBounds && (
        <div className="palette-section selection-section">
          <h3 className="section-title">📐 Selection Volume</h3>
          <div className="selection-inputs">
            <div className="corner-inputs">
              <h4>Min Corner</h4>
              <DimensionInputRow label="X" value={selectionBounds.min[0]} onChange={val => handleBoundChange('min', 0, val)} />
              <DimensionInputRow label="Y" value={selectionBounds.min[1]} onChange={val => handleBoundChange('min', 1, val)} />
              <DimensionInputRow label="Z" value={selectionBounds.min[2]} onChange={val => handleBoundChange('min', 2, val)} />
            </div>
            <div className="corner-inputs">
              <h4>Max Corner</h4>
              <DimensionInputRow label="X" value={selectionBounds.max[0]} onChange={val => handleBoundChange('max', 0, val)} />
              <DimensionInputRow label="Y" value={selectionBounds.max[1]} onChange={val => handleBoundChange('max', 1, val)} />
              <DimensionInputRow label="Z" value={selectionBounds.max[2]} onChange={val => handleBoundChange('max', 2, val)} />
            </div>
          </div>

          <div className="selection-actions">
            <button className="action-btn fill-btn" onClick={() => onSelectionAction('fill')}>
              <span>🔲</span> Fill
            </button>
            <button className="action-btn replace-btn" onClick={() => onSelectionAction('replace')}>
              <span>🔄</span> Replace
            </button>
            <button className="action-btn delete-btn" onClick={() => onSelectionAction('delete')}>
              <span>🗑️</span> Delete
            </button>
          </div>

          <div className="fill-options">
            <h4>Fill Options</h4>
            <div className="fill-options-row">
              <label>Type:</label>
              <select value={fillOptions.type} onChange={e => onFillOptionsChange({ ...fillOptions, type: e.target.value as FillOptions['type'] })}>
                <option value="volume">Volume</option>
                <option value="shell">Shell</option>
              </select>
            </div>
            <div className="fill-options-row">
              <label>Pattern:</label>
              <select value={fillOptions.pattern} onChange={e => onFillOptionsChange({ ...fillOptions, pattern: e.target.value as FillOptions['pattern'] })}>
                <option value="solid">Solid</option>
                <option value="checkerboard">Checkerboard</option>
              </select>
            </div>
            {fillOptions.pattern === 'checkerboard' && (
              <div className="fill-options-row">
                <label>Spacing:</label>
                <input
                  type="number"
                  min="0"
                  value={fillOptions.spacing}
                  onChange={e => onFillOptionsChange({ ...fillOptions, spacing: Math.max(0, parseInt(e.target.value, 10)) })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build Area Dimensions */}
      <div className="palette-section">
        <h3 className="section-title">📏 Build Area</h3>
        <div className="build-area-inputs">
          <DimensionInputRow label="Width" value={boxDimensions.width} onChange={val => onDimensionsChange('width', val)} />
          <DimensionInputRow label="Height" value={boxDimensions.height} onChange={val => onDimensionsChange('height', val)} />
          <DimensionInputRow label="Depth" value={boxDimensions.depth} onChange={val => onDimensionsChange('depth', val)} />
        </div>
      </div>

      {/* Asset Groups */}
      <div className="palette-section assets-section">
        <h3 className="section-title">🎨 Manual</h3>
        {buildableAssetGroups.map(group => (
          <div key={group.name} className="asset-group">
            <button
              className="group-header"
              onClick={() => toggleGroup(group.name)}
            >
              <span className="group-name">{group.name}</span>
              <span className="group-toggle">{expandedGroups.has(group.name) ? '▼' : '▶'}</span>
            </button>
            {expandedGroups.has(group.name) && (
              <div className="asset-grid">
                {group.items.map(item => (
                  <button
                    key={item.key}
                    className={`asset-item ${selectedAssetKey === item.key ? 'active' : ''}`}
                    onClick={() => onSelectAsset(item)}
                    title={item.name}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions (collapsed by default) */}
      <div className="palette-section quick-actions-section">
        <h3 className="section-title">⚡ Quick Actions</h3>
        <div className="quick-actions">
          <button onClick={onShowTutorial} className="quick-btn">
            📖 Manual
          </button>
          <button onClick={handleImportClick} className="quick-btn">
            📥 Import
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Load from project */}
        {mapList && Object.keys(mapList).length > 0 && (
          <div className="load-from-project">
            <label>Load from Project:</label>
            <select onChange={handleMapSelect} defaultValue="">
              <option value="" disabled>-- Choose a map --</option>
              {Object.keys(mapList).map(path => (
                <option key={path} value={path}>{path.split('/').pop()}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </aside>
  );
}