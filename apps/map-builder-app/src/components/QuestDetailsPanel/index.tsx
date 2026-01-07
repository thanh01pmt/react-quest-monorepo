import { useState, useEffect } from 'react';
import _ from 'lodash';
import './QuestDetailsPanel.css';
import { BlocklyModal } from '../PropertiesPanel/BlocklyModal';
import '../PropertiesPanel/BlocklyModal.css';
import { toolboxPresets } from '../../config/toolboxPresets';
import {
  ClipboardList, Puzzle, Target, FolderOpen, Save, Globe,
  ChevronDown, ChevronRight, CheckCircle, AlertTriangle,
  RefreshCw, FileText, Pencil, FileJson, ExternalLink, Settings
} from 'lucide-react';
import { syncToPlayer, getPlayerUrl, setPlayerUrl as savePlayerUrl, isLocalSync } from '../../services/PlayerSyncService';

interface QuestDetailsPanelProps {
  metadata: Record<string, any> | null;
  onMetadataChange: (path: string, value: any) => void;
  onSolveMaze: () => void;
  onImportMap: (file: File) => void;
  onLoadMapFromUrl?: (url: string) => void;
}

// Helper để lấy giá trị lồng sâu trong object
const getDeepValue = (obj: any, path: string) => {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
};

// ============================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
  badgeColor?: 'green' | 'orange' | 'red' | 'blue';
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
  badgeColor = 'blue'
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section ${isOpen ? 'open' : 'closed'}`}>
      <button
        className="section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="section-icon">{icon}</span>
        <span className="section-title">{title}</span>
        {badge !== undefined && (
          <span className={`section-badge badge-${badgeColor}`}>{badge}</span>
        )}
        <span className="section-toggle">{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

// ============================================================
// JSON TO XML CONVERTER (giữ nguyên logic cũ)
// ============================================================
const jsonToXml = (structuredSolution: any): string => {
  const doc = document.implementation.createDocument(null, 'xml', null);

  const jsonToXmlRecursive = (actions: any[], parent: Element): Element | null => {
    let lastBlock: Element | null = null;

    actions.forEach(action => {
      const block = doc.createElement('block');

      if (action.type === 'CALL' && action.name) {
        block.setAttribute('type', 'procedures_callnoreturn');
        const mutation = doc.createElement('mutation');
        mutation.setAttribute('name', action.name);
        block.appendChild(mutation);
      } else {
        block.setAttribute('type', action.type);
      }

      // Handle different block types
      if (action.type === 'maze_turn') {
        const field = doc.createElement('field');
        field.setAttribute('name', 'DIR');
        field.textContent = action.direction;
        block.appendChild(field);
      } else if (action.type === 'maze_repeat' || action.type === 'maze_for') {
        const value = doc.createElement('value');
        value.setAttribute('name', 'TIMES');

        if (typeof action.times === 'object' && action.times !== null && action.times.type) {
          jsonToXmlRecursive([action.times], value);
        } else {
          const shadow = doc.createElement('shadow');
          shadow.setAttribute('type', 'math_number');
          const field = doc.createElement('field');
          field.setAttribute('name', 'NUM');
          field.textContent = action.times?.toString() || '1';
          shadow.appendChild(field);
          value.appendChild(shadow);
        }
        block.appendChild(value);

        // Support both 'do' (transpiler output) and 'actions' (legacy format) for loop body
        const loopBody = action.do || action.actions;
        if (loopBody && loopBody.length > 0) {
          const statement = doc.createElement('statement');
          statement.setAttribute('name', 'DO');
          jsonToXmlRecursive(loopBody, statement);
          block.appendChild(statement);
        }
      } else if (action.type === 'maze_forever') {
        const statement = doc.createElement('statement');
        statement.setAttribute('name', 'DO');
        const foreverBody = action.do || action.actions || [];
        jsonToXmlRecursive(foreverBody, statement);
        block.appendChild(statement);
      } else if (action.type === 'procedures_callnoreturn') {
        const mutation = doc.createElement('mutation');
        mutation.setAttribute('name', action.mutation.name);
        block.appendChild(mutation);
      }

      if (lastBlock) {
        const next = doc.createElement('next');
        next.appendChild(block);
        lastBlock.appendChild(next);
      } else {
        parent.appendChild(block);
      }
      lastBlock = block;
    });

    return lastBlock;
  };

  const startBlock = doc.createElement('block');
  startBlock.setAttribute('type', 'maze_start');
  startBlock.setAttribute('deletable', 'false');
  startBlock.setAttribute('movable', 'false');

  if (structuredSolution.main && structuredSolution.main.length > 0) {
    const mainStatement = doc.createElement('statement');
    mainStatement.setAttribute('name', 'DO');
    jsonToXmlRecursive(structuredSolution.main, mainStatement);
    startBlock.appendChild(mainStatement);
  }
  doc.documentElement.appendChild(startBlock);

  if (structuredSolution.procedures) {
    let yOffset = 100;
    for (const procName in structuredSolution.procedures) {
      const procActions = structuredSolution.procedures[procName];
      const procBlock = doc.createElement('block');
      procBlock.setAttribute('type', 'procedures_defnoreturn');
      procBlock.setAttribute('x', '400');
      procBlock.setAttribute('y', yOffset.toString());

      const field = doc.createElement('field');
      field.setAttribute('name', 'NAME');
      field.textContent = procName;
      procBlock.appendChild(field);

      if (procActions && procActions.length > 0) {
        const procStatement = doc.createElement('statement');
        procStatement.setAttribute('name', 'STACK');
        jsonToXmlRecursive(procActions, procStatement);
        procBlock.appendChild(procStatement);
      }

      doc.documentElement.appendChild(procBlock);
      yOffset += 150;
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
};

// Normalize actions
const normalizeActions = (actions: any[]): any[] => {
  if (!Array.isArray(actions)) return [];
  return actions.map(action => {
    if (!action || typeof action !== 'object') return action;
    if (action.type === 'maze_turnLeft' || action.type === 'turnLeft') {
      return { type: 'maze_turn', direction: 'turnLeft' };
    }
    if (action.type === 'maze_turnRight' || action.type === 'turnRight') {
      return { type: 'maze_turn', direction: 'turnRight' };
    }
    if (action.type === 'maze_toggleSwitch') {
      return { type: 'maze_toggle_switch' };
    }
    if (action.actions && Array.isArray(action.actions)) {
      return { ...action, actions: normalizeActions(action.actions) };
    }
    return action;
  });
};

const normalizeSolution = (solution: any) => {
  if (!solution) return {};
  const newSolution = _.cloneDeep(solution);
  if (newSolution.basicSolution && newSolution.basicSolution.main) {
    newSolution.basicSolution.main = normalizeActions(newSolution.basicSolution.main);
  }
  return newSolution;
};

// Count blocks in XML
const countBlocksInXml = (xml: string): number => {
  if (!xml) return 0;
  const matches = xml.match(/<block /g);
  return matches ? matches.length : 0;
};

// Count actions in solution
const countActions = (solution: any): number => {
  if (!solution?.rawActions) return 0;
  return Array.isArray(solution.rawActions) ? solution.rawActions.length : 0;
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export function QuestDetailsPanel({ metadata, onMetadataChange, onSolveMaze, onImportMap, onLoadMapFromUrl }: QuestDetailsPanelProps) {
  const [isBlocklyModalOpen, setBlocklyModalOpen] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [mapList, setMapList] = useState<Record<string, unknown> | null>(null);

  // Player Sync State
  const [playerUrl, setPlayerUrl] = useState(getPlayerUrl());
  const [showPlayerUrlConfig, setShowPlayerUrlConfig] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  // Solution tabs: 'raw' | 'basic' | 'optimal'
  const [solutionTab, setSolutionTab] = useState<'raw' | 'basic' | 'optimal'>('raw');
  // Cache hash to avoid re-solving when path/placement haven't changed
  const [lastSolveHash, setLastSolveHash] = useState<string>('');

  // Local state for editable fields
  const [localRawActions, setLocalRawActions] = useState('');
  const [localBasicSolution, setLocalBasicSolution] = useState('');
  const [localStructuredSolution, setLocalStructuredSolution] = useState('');

  // Load map list from project on mount
  useEffect(() => {
    // Use ** to match JSON files in all subdirectories
    const mapFiles = import.meta.glob('/public/maps/**/*.json', { eager: true });
    setMapList(mapFiles);
  }, []);

  // Handle complex changes
  const handleComplexChange = (...updates: { path: string; value: any }[]) => {
    if (!metadata) return;
    const newMetadata = _.cloneDeep(metadata);
    updates.forEach(({ path, value }) => {
      _.set(newMetadata, path, value);
    });
    onMetadataChange('__OVERWRITE__', newMetadata);
  };

  // Compute hash for path/placement coords to detect changes
  const computePathHash = (): string => {
    const pathInfo = metadata?.pathInfo;
    if (!pathInfo) return '';
    const pathCoords = pathInfo.path_coords || [];
    const placementCoords = pathInfo.placement_coords || [];
    const startPos = pathInfo.start_pos || [];
    const targetPos = pathInfo.target_pos || [];
    return JSON.stringify({ pathCoords, placementCoords, startPos, targetPos });
  };

  // Wrap onSolveMaze with loading state and cache check
  const handleSolve = async (forceResolve = false) => {
    const currentHash = computePathHash();

    // Check cache - skip if no changes
    if (!forceResolve && currentHash && currentHash === lastSolveHash) {
      console.log('Path unchanged - using cached solution');
      return;
    }

    setIsSolving(true);
    try {
      // Use setTimeout to allow UI to update before blocking operation
      await new Promise(resolve => setTimeout(resolve, 50));
      onSolveMaze();
      // Update cache hash after successful solve
      setLastSolveHash(currentHash);
    } finally {
      setIsSolving(false);
    }
  };

  // Sync local state with metadata
  useEffect(() => {
    if (metadata) {
      const normalizedSolution = normalizeSolution(metadata.solution);
      const solution = normalizedSolution || { rawActions: [], structuredSolution: {}, basicSolution: {} };
      setLocalBasicSolution(JSON.stringify(solution.basicSolution || {}, null, 2));
      setLocalRawActions(JSON.stringify(solution.rawActions || [], null, 2));
      setLocalStructuredSolution(JSON.stringify(solution.structuredSolution || {}, null, 2));
    } else {
      setLocalBasicSolution('');
      setLocalRawActions('');
      setLocalStructuredSolution('');
    }
  }, [metadata]);

  // Compile JSON to XML
  const handleCompileToXml = (jsonSource: string, sourceName: string) => {
    try {
      if (!jsonSource || jsonSource.trim() === '') {
        alert(`Error: ${sourceName} (JSON) is empty.`);
        return;
      }
      const structuredSolution = JSON.parse(jsonSource);
      if (!structuredSolution || !Array.isArray(structuredSolution.main)) {
        alert('Error: Data must have a "main" array.');
        return;
      }
      const finalXml = jsonToXml(structuredSolution);
      handleComplexChange({ path: 'blocklyConfig.startBlocks', value: finalXml });
      alert('Start Blocks created successfully!');
    } catch (error) {
      console.error("Error compiling JSON to XML:", error);
      alert(`Error: Could not parse ${sourceName}.\n\n${error}`);
    }
  };

  // File import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportMap(e.target.files[0]);
    }
  };

  // Empty state
  if (!metadata) {
    return (
      <aside className="quest-details-panel empty-state">
        <div className="empty-state-content">
          <span className="empty-icon"><ClipboardList size={48} /></span>
          <p>Import a Quest file to edit details.</p>
          <label className="import-btn primary">
            <span className="icon"><FolderOpen size={16} /></span> Import JSON Map
            <input type="file" accept=".json" onChange={handleFileChange} hidden />
          </label>

          {/* Load from Project */}
          {onLoadMapFromUrl && mapList && Object.keys(mapList).length > 0 && (
            <div className="field-row" style={{ marginTop: '16px', width: '100%' }}>
              <label style={{ marginBottom: '8px', display: 'block' }}>Or load from Project:</label>
              <select
                className="custom-select"
                onChange={(e) => {
                  const mapPath = e.target.value;
                  if (mapPath) {
                    // Remove /public prefix - Vite serves public folder at root
                    const correctedPath = mapPath.replace(/^\/public/, '');
                    onLoadMapFromUrl(correctedPath);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                style={{ width: '100%' }}
              >
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

  // Computed values
  const titleKey = metadata.titleKey || '';
  const descriptionKey = metadata.questTitleKey || metadata.descriptionKey || '';
  const blockCount = countBlocksInXml(getDeepValue(metadata, 'blocklyConfig.startBlocks') || '');
  const actionCount = countActions(metadata.solution);
  const hasSolution = actionCount > 0;
  const toolboxPresetKey = getDeepValue(metadata, 'blocklyConfig.toolboxPresetKey') || '';

  return (
    <aside className="quest-details-panel" key={metadata.id}>
      {/* Blockly Modal */}
      {isBlocklyModalOpen && (
        <BlocklyModal
          initialXml={getDeepValue(metadata, 'blocklyConfig.startBlocks') || ''}
          onClose={() => setBlocklyModalOpen(false)}
          onSave={(newXml) => {
            handleComplexChange({ path: 'blocklyConfig.startBlocks', value: newXml });
            setBlocklyModalOpen(false);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* QUEST INFO SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection title="Quest Info" icon={<ClipboardList size={16} />} defaultOpen={true}>
        <div className="field-row">
          <label>ID</label>
          <input
            type="text"
            value={metadata.id || ''}
            onChange={(e) => handleComplexChange({ path: 'id', value: e.target.value })}
          />
        </div>
        <div className="field-row">
          <label>Level</label>
          <input
            type="number"
            value={metadata.level || 0}
            onChange={(e) => handleComplexChange({ path: 'level', value: parseInt(e.target.value, 10) || 0 })}
          />
        </div>

        {/* Translations Toggle */}
        {(titleKey || descriptionKey) && (
          <div className="sub-section">
            <button
              className="toggle-btn"
              onClick={() => setShowTranslations(!showTranslations)}
            >
              <Globe size={14} /> Translations {showTranslations ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {showTranslations && (
              <div className="translations-grid">
                <div className="field-row">
                  <label>Title (VI)</label>
                  <input
                    type="text"
                    value={metadata?.translations?.vi?.[titleKey] || ''}
                    onChange={(e) => handleComplexChange({ path: `translations.vi.${titleKey}`, value: e.target.value })}
                  />
                </div>
                <div className="field-row">
                  <label>Title (EN)</label>
                  <input
                    type="text"
                    value={metadata?.translations?.en?.[titleKey] || ''}
                    onChange={(e) => handleComplexChange({ path: `translations.en.${titleKey}`, value: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* GAME MODE SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Game Mode"
        icon={<Settings size={16} />}
        defaultOpen={false}
        badge={getDeepValue(metadata, 'gameConfig.mode') === 'random' ? '🎲 Random' : undefined}
        badgeColor="blue"
      >
        <div className="field-row">
          <label>Item Mode</label>
          <select
            className="custom-select"
            value={getDeepValue(metadata, 'gameConfig.mode') || 'fixed'}
            onChange={(e) => handleComplexChange({ path: 'gameConfig.mode', value: e.target.value })}
          >
            <option value="fixed">Fixed (Default)</option>
            <option value="random">Random (Hide items each run)</option>
          </select>
        </div>

        {getDeepValue(metadata, 'gameConfig.mode') === 'random' && (
          <>
            <div className="info-box" style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid #8b5cf6',
              borderRadius: '6px',
              padding: '8px',
              marginTop: '8px',
              fontSize: '12px',
              color: '#c4b5fd'
            }}>
              <span style={{ marginRight: '6px' }}>🎲</span>
              <strong>Random Mode:</strong> Each run will hide a random number of items.
              Player must use sensors to find items.
            </div>

            <div className="field-row" style={{ marginTop: '12px' }}>
              <label>Max Crystals (Pool)</label>
              <input
                type="number"
                min={1}
                value={getDeepValue(metadata, 'gameConfig.itemPool.crystal') || metadata?.gameConfig?.collectibles?.length || 0}
                onChange={(e) => handleComplexChange({
                  path: 'gameConfig.itemPool.crystal',
                  value: parseInt(e.target.value, 10) || 1
                })}
              />
            </div>
            <small style={{ color: '#888', fontSize: '11px' }}>
              Each run selects [50%, 100%) of this count
            </small>
          </>
        )}
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* BLOCKLY CONFIG SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Blockly Config"
        icon={<Puzzle size={16} />}
        defaultOpen={true}
        badge={blockCount > 0 ? `${blockCount} blocks` : undefined}
        badgeColor="blue"
      >
        <div className="field-row">
          <label>Toolbox Preset</label>
          <select
            className="custom-select"
            value={toolboxPresetKey}
            onChange={(e) => {
              const presetKey = e.target.value;
              const selectedToolbox = toolboxPresets[presetKey];
              if (selectedToolbox) {
                handleComplexChange(
                  { path: 'blocklyConfig.toolboxPresetKey', value: presetKey },
                  { path: 'blocklyConfig.toolbox', value: selectedToolbox }
                );
              }
            }}
          >
            <option value="" disabled>-- Select toolbox --</option>
            {Object.keys(toolboxPresets).map(key => (
              <option key={key} value={key}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <label>Max Blocks</label>
          <input
            type="number"
            value={getDeepValue(metadata, 'blocklyConfig.maxBlocks') || ''}
            onChange={(e) => handleComplexChange({ path: 'blocklyConfig.maxBlocks', value: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* SOLUTION SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Solution"
        icon={<Target size={16} />}
        defaultOpen={true}
        badge={hasSolution ? <span><CheckCircle size={12} className="inline-icon" /> Solved</span> : <span><AlertTriangle size={12} className="inline-icon" /> Not solved</span>}
        badgeColor={hasSolution ? 'green' : 'orange'}
      >
        {/* Gen Raw Action button - primary action */}
        <button
          className={`action-btn primary full-width ${isSolving ? 'loading' : ''}`}
          onClick={() => handleSolve(false)}
          disabled={isSolving}
        >
          {isSolving ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            <><RefreshCw size={16} /> Gen Raw Action</>
          )}
        </button>

        {/* Solution summary */}
        {hasSolution && (
          <div className="solution-summary">
            <div className="summary-item">
              <span className="label">Steps:</span>
              <span className="value">{actionCount}</span>
            </div>
            <div className="summary-item">
              <span className="label">Type:</span>
              <span className="value">{metadata.solution?.type || 'standard'}</span>
            </div>
          </div>
        )}

        {/* Gen Basic/Optimal Solution buttons */}
        <div className="button-group">
          <button
            className="action-btn secondary"
            onClick={() => handleCompileToXml(localBasicSolution, 'Basic Solution')}
            disabled={!localBasicSolution || localBasicSolution === '{}'}
          >
            Gen Basic Solution
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleCompileToXml(localStructuredSolution, 'Structured Solution')}
            disabled={!localStructuredSolution || localStructuredSolution === '{}'}
          >
            Gen Optimal Solution
          </button>
        </div>

        {/* Edit Start Blocks */}
        <div className="action-row" style={{ marginTop: '8px' }}>
          <button
            className="action-btn primary"
            onClick={() => setBlocklyModalOpen(true)}
          >
            <><Pencil size={14} /> Edit Start Blocks</>
          </button>
          {blockCount > 0 && (
            <span className="info-text">{blockCount} blocks</span>
          )}
        </div>

        {/* Solution Tabs */}
        <div className="solution-tabs" style={{ marginTop: '12px' }}>
          <div className="tab-buttons" style={{ display: 'flex', borderBottom: '1px solid #444' }}>
            <button
              className={`tab-btn ${solutionTab === 'raw' ? 'active' : ''}`}
              onClick={() => setSolutionTab('raw')}
              style={{
                flex: 1,
                padding: '8px',
                background: solutionTab === 'raw' ? '#3c3c41' : 'transparent',
                border: 'none',
                color: solutionTab === 'raw' ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '12px',
                borderBottom: solutionTab === 'raw' ? '2px solid #6366f1' : 'none'
              }}
            >
              Raw Action
            </button>
            <button
              className={`tab-btn ${solutionTab === 'basic' ? 'active' : ''}`}
              onClick={() => setSolutionTab('basic')}
              style={{
                flex: 1,
                padding: '8px',
                background: solutionTab === 'basic' ? '#3c3c41' : 'transparent',
                border: 'none',
                color: solutionTab === 'basic' ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '12px',
                borderBottom: solutionTab === 'basic' ? '2px solid #6366f1' : 'none'
              }}
            >
              Basic
            </button>
            <button
              className={`tab-btn ${solutionTab === 'optimal' ? 'active' : ''}`}
              onClick={() => setSolutionTab('optimal')}
              style={{
                flex: 1,
                padding: '8px',
                background: solutionTab === 'optimal' ? '#3c3c41' : 'transparent',
                border: 'none',
                color: solutionTab === 'optimal' ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '12px',
                borderBottom: solutionTab === 'optimal' ? '2px solid #6366f1' : 'none'
              }}
            >
              Optimal
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content" style={{ marginTop: '8px' }}>
            {solutionTab === 'raw' && (
              <textarea
                className="json-editor"
                value={localRawActions}
                onChange={(e) => setLocalRawActions(e.target.value)}
                onBlur={() => {
                  if (localRawActions.trim()) {
                    try {
                      const parsed = JSON.parse(localRawActions);
                      handleComplexChange({ path: 'solution.rawActions', value: parsed });
                    } catch (error) {
                      console.warn("Invalid JSON", error);
                    }
                  }
                }}
                rows={8}
                style={{ width: '100%', resize: 'vertical' }}
              />
            )}

            {solutionTab === 'basic' && (
              <textarea
                className="json-editor"
                value={localBasicSolution}
                onChange={(e) => setLocalBasicSolution(e.target.value)}
                onBlur={() => {
                  if (localBasicSolution.trim()) {
                    try {
                      const parsed = JSON.parse(localBasicSolution);
                      handleComplexChange({ path: 'solution.basicSolution', value: parsed });
                    } catch (error) {
                      console.warn("Invalid JSON", error);
                    }
                  }
                }}
                rows={8}
                style={{ width: '100%', resize: 'vertical' }}
              />
            )}

            {solutionTab === 'optimal' && (
              <textarea
                className="json-editor"
                value={localStructuredSolution}
                onChange={(e) => setLocalStructuredSolution(e.target.value)}
                onBlur={() => {
                  if (localStructuredSolution.trim()) {
                    try {
                      const parsed = JSON.parse(localStructuredSolution);
                      handleComplexChange({ path: 'solution.structuredSolution', value: parsed });
                    } catch (error) {
                      console.warn("Invalid JSON", error);
                    }
                  }
                }}
                rows={8}
                style={{ width: '100%', resize: 'vertical' }}
              />
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* IMPORT/EXPORT SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection title="Import / Export" icon={<FileJson size={16} />} defaultOpen={false}>
        <div className="button-group vertical">
          <label className="action-btn secondary full-width">
            <span className="icon"><FolderOpen size={16} /></span> Import JSON Map
            <input type="file" accept=".json" onChange={handleFileChange} hidden />
          </label>
          <button
            className="action-btn secondary full-width"
            onClick={() => {
              const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${metadata.id || 'quest'}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <span className="icon"><Save size={16} /></span> Export Quest JSON
          </button>

          {/* Send to Player */}
          <button
            className="action-btn primary full-width"
            onClick={() => {
              setSyncStatus({ type: 'idle' });
              const result = syncToPlayer(metadata, playerUrl);
              if (result.success) {
                setSyncStatus({ type: 'success', message: 'Quest sent to Player!' });
                setTimeout(() => setSyncStatus({ type: 'idle' }), 3000);
              } else {
                setSyncStatus({ type: 'error', message: result.error });
              }
            }}
          >
            <span className="icon"><ExternalLink size={16} /></span> Send to Player
          </button>

          {/* Sync Status Feedback */}
          {syncStatus.type !== 'idle' && (
            <div className={`sync-status ${syncStatus.type}`}>
              {syncStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* Player URL Config Toggle */}
          <button
            className="toggle-btn"
            onClick={() => setShowPlayerUrlConfig(!showPlayerUrlConfig)}
            style={{ marginTop: '8px' }}
          >
            <Settings size={14} /> Player URL {showPlayerUrlConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {showPlayerUrlConfig && (
            <div className="field-row" style={{ marginTop: '8px' }}>
              <input
                type="text"
                value={playerUrl}
                onChange={(e) => setPlayerUrl(e.target.value)}
                onBlur={() => savePlayerUrl(playerUrl)}
                placeholder="http://localhost:5173"
                style={{ fontSize: '12px' }}
              />
              <small style={{ color: '#888', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                🌐 URL mode (query param)
              </small>
            </div>
          )}
        </div>

        {/* Load from Project */}
        {onLoadMapFromUrl && mapList && Object.keys(mapList).length > 0 && (
          <div className="field-row" style={{ marginTop: '12px' }}>
            <label>Load from Project:</label>
            <select
              className="custom-select"
              onChange={(e) => {
                const mapPath = e.target.value;
                if (mapPath) {
                  // Remove /public prefix - Vite serves public folder at root
                  const correctedPath = mapPath.replace(/^\/public/, '');
                  onLoadMapFromUrl(correctedPath);
                  e.target.value = "";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Choose a map --</option>
              {Object.keys(mapList).map(path => (
                <option key={path} value={path}>{path.split('/').pop()}</option>
              ))}
            </select>
          </div>
        )}
      </CollapsibleSection>
    </aside>
  );
}
