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
  // Controlled mode for accordion behavior
  isOpen?: boolean;
  onToggle?: () => void;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
  badgeColor = 'blue',
  isOpen: controlledIsOpen,
  onToggle
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Use controlled or uncontrolled mode
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const handleToggle = onToggle || (() => setInternalOpen(!internalOpen));

  return (
    <div className={`collapsible-section ${isOpen ? 'open' : 'closed'}`}>
      <button
        className="section-header"
        onClick={handleToggle}
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

  // Accordion state: only one section open at a time
  type SectionId = 'questInfo' | 'gameMode' | 'blocklyConfig' | 'solution' | 'importExport' | null;
  const [openSection, setOpenSection] = useState<SectionId>(null);

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

  // Auto-sync Max Blocks (Optimal + 3)
  useEffect(() => {
    const isAuto = getDeepValue(metadata, 'blocklyConfig.autoMaxBlocks') !== false;
    if (isAuto && localStructuredSolution && localStructuredSolution !== '{}') {
      const count = (localStructuredSolution.match(/"type":/g) || []).length;
      if (count > 0) {
        const target = count + 3;
        if (getDeepValue(metadata, 'blocklyConfig.maxBlocks') !== target) {
          handleComplexChange({ path: 'blocklyConfig.maxBlocks', value: target });
        }
      }
    }
  }, [localStructuredSolution, getDeepValue(metadata, 'blocklyConfig.autoMaxBlocks')]);



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
          basicSolution={localBasicSolution}
          optimalSolution={localStructuredSolution}
        />
      )}

      {/* ============================================================ */}
      {/* QUEST INFO SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Quest Info"
        icon={<ClipboardList size={16} />}
        isOpen={openSection === 'questInfo'}
        onToggle={() => setOpenSection(openSection === 'questInfo' ? null : 'questInfo')}
      >
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

        {/* Map Content Summary */}
        <div className="sub-section" style={{ marginTop: '12px' }}>
          <div className="info-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '6px'
          }}>
            <div className="info-item">
              <span style={{ fontSize: '11px', color: '#888' }}>Crystals</span>
              <strong style={{ fontSize: '16px', color: '#fbbf24' }}>
                {metadata.gameConfig?.collectibles?.filter((c: any) => c.type === 'crystal').length || 0}
              </strong>
            </div>
            <div className="info-item">
              <span style={{ fontSize: '11px', color: '#888' }}>Keys</span>
              <strong style={{ fontSize: '16px', color: '#3b82f6' }}>
                {metadata.gameConfig?.collectibles?.filter((c: any) => c.type === 'key').length || 0}
              </strong>
            </div>
            <div className="info-item">
              <span style={{ fontSize: '11px', color: '#888' }}>Switches</span>
              <strong style={{ fontSize: '16px', color: '#8b5cf6' }}>
                {metadata.gameConfig?.interactibles?.filter((i: any) => i.type === 'switch').length || 0}
              </strong>
            </div>
            <div className="info-item">
              <span style={{ fontSize: '11px', color: '#888' }}>Portals</span>
              <strong style={{ fontSize: '16px', color: '#06b6d4' }}>
                {metadata.gameConfig?.interactibles?.filter((i: any) => i.type === 'portal').length || 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Generated Task Description */}
        <div className="field-row" style={{ marginTop: '12px' }}>
          <label>Task (Auto)</label>
          <div style={{
            fontSize: '12px',
            color: '#c4b5fd',
            padding: '8px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '4px',
            border: '1px solid #6366f1'
          }}>
            {(() => {
              const collectibles = metadata.gameConfig?.collectibles || [];
              const interactibles = metadata.gameConfig?.interactibles || [];
              const crystalCount = collectibles.filter((c: any) => c.type === 'crystal').length;
              const keyCount = collectibles.filter((c: any) => c.type === 'key').length;
              const switchCount = interactibles.filter((i: any) => i.type === 'switch').length;

              const tasks: string[] = [];
              if (crystalCount > 0) tasks.push(`Thu thập ${crystalCount} pha lê`);
              if (keyCount > 0) tasks.push(`Thu thập ${keyCount} chìa khóa`);
              if (switchCount > 0) tasks.push(`Bật ${switchCount} công tắc`);

              if (tasks.length === 0) return 'Tìm đường về đích.';
              return `${tasks.join(', ')} và tìm đường về đích.`;
            })()}
          </div>
        </div>

        {/* Hints Section - Student Guidance */}
        <div className="sub-section" style={{ marginTop: '12px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#c4b5fd',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            💡 Hints (Student Guidance)
          </div>
          <div className="field-row">
            <label>Title</label>
            <input
              type="text"
              value={metadata?.hints?.title || ''}
              onChange={(e) => handleComplexChange({ path: 'hints.title', value: e.target.value })}
              placeholder="e.g., Palindrome Path"
            />
          </div>
          <div className="field-row">
            <label>Description</label>
            <textarea
              value={metadata?.hints?.description || ''}
              onChange={(e) => handleComplexChange({ path: 'hints.description', value: e.target.value })}
              placeholder="Main hint for students..."
              rows={2}
              style={{ resize: 'vertical', width: '100%' }}
            />
          </div>
          <div className="field-row">
            <label>Learning Goals</label>
            <input
              type="text"
              value={metadata?.hints?.learningGoals || ''}
              onChange={(e) => handleComplexChange({ path: 'hints.learningGoals', value: e.target.value })}
              placeholder="e.g., Recognize repeating patterns"
            />
          </div>
          {/* Show goal details if present */}
          {metadata?.hints?.goalDetails && metadata.hints.goalDetails.length > 0 && (
            <div style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '4px',
              padding: '6px 8px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px'
            }}>
              {metadata.hints.goalDetails.map((detail: string, idx: number) => (
                <div key={idx}>• {detail}</div>
              ))}
            </div>
          )}
        </div>

        {/* Translations Toggle */}
        <div className="sub-section">
          <button
            className="toggle-btn"
            onClick={() => setShowTranslations(!showTranslations)}
          >
            <Globe size={14} /> Translations {showTranslations ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showTranslations && (
            <div className="translations-grid">
              {/* Topic */}
              <div className="field-row">
                <label>Topic</label>
                <input
                  type="text"
                  value={metadata?.topic || ''}
                  onChange={(e) => handleComplexChange({ path: 'topic', value: e.target.value })}
                  placeholder="topic-title-..."
                />
              </div>

              {/* Title (VI) */}
              <div className="field-row">
                <label>Title (VI)</label>
                <input
                  type="text"
                  value={metadata?.translations?.vi?.[titleKey] || ''}
                  onChange={(e) => handleComplexChange({ path: `translations.vi.${titleKey}`, value: e.target.value })}
                  placeholder="Tiêu đề bài tập"
                />
              </div>

              {/* Title (EN) */}
              <div className="field-row">
                <label>Title (EN)</label>
                <input
                  type="text"
                  value={metadata?.translations?.en?.[titleKey] || ''}
                  onChange={(e) => handleComplexChange({ path: `translations.en.${titleKey}`, value: e.target.value })}
                  placeholder="Exercise Title"
                />
              </div>

              {/* Description (VI) */}
              <div className="field-row">
                <label>Description (VI)</label>
                <textarea
                  value={metadata?.translations?.vi?.[descriptionKey] || ''}
                  onChange={(e) => handleComplexChange({ path: `translations.vi.${descriptionKey}`, value: e.target.value })}
                  placeholder="Mô tả nhiệm vụ chi tiết..."
                  rows={3}
                  style={{ resize: 'vertical', width: '100%' }}
                />
              </div>

              {/* Description (EN) */}
              <div className="field-row">
                <label>Description (EN)</label>
                <textarea
                  value={metadata?.translations?.en?.[descriptionKey] || ''}
                  onChange={(e) => handleComplexChange({ path: `translations.en.${descriptionKey}`, value: e.target.value })}
                  placeholder="Detailed task description..."
                  rows={3}
                  style={{ resize: 'vertical', width: '100%' }}
                />
              </div>

              {/* Topic Title (VI) */}
              {metadata?.topic && (
                <>
                  <div className="field-row">
                    <label>Topic Title (VI)</label>
                    <input
                      type="text"
                      value={metadata?.translations?.vi?.[metadata.topic] || ''}
                      onChange={(e) => handleComplexChange({ path: `translations.vi.${metadata.topic}`, value: e.target.value })}
                      placeholder="Tên chủ đề"
                    />
                  </div>
                  <div className="field-row">
                    <label>Topic Title (EN)</label>
                    <input
                      type="text"
                      value={metadata?.translations?.en?.[metadata.topic] || ''}
                      onChange={(e) => handleComplexChange({ path: `translations.en.${metadata.topic}`, value: e.target.value })}
                      placeholder="Topic Name"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* GAME MODE SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Game Mode"
        icon={<Settings size={16} />}
        isOpen={openSection === 'gameMode'}
        onToggle={() => setOpenSection(openSection === 'gameMode' ? null : 'gameMode')}
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
        isOpen={openSection === 'blocklyConfig'}
        onToggle={() => setOpenSection(openSection === 'blocklyConfig' ? null : 'blocklyConfig')}
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
          <div className="field-row-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label>Max Blocks</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getDeepValue(metadata, 'blocklyConfig.autoMaxBlocks') === false && localStructuredSolution && (localStructuredSolution.match(/"type":/g) || []).length > 0 && (
                <span
                  style={{ fontSize: '10px', color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}
                  title="Click to apply Optimal Block count"
                  onClick={() => {
                    const count = (localStructuredSolution.match(/"type":/g) || []).length;
                    if (count > 0) handleComplexChange({ path: 'blocklyConfig.maxBlocks', value: count });
                  }}
                >
                  Opt: {(localStructuredSolution.match(/"type":/g) || []).length}
                </span>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: '#888' }}>
                <input
                  type="checkbox"
                  checked={getDeepValue(metadata, 'blocklyConfig.autoMaxBlocks') !== false}
                  onChange={(e) => {
                    const isAuto = e.target.checked;
                    const changes: { path: string, value: any }[] = [{ path: 'blocklyConfig.autoMaxBlocks', value: isAuto }];

                    // Instant update if turning ON
                    if (isAuto && localStructuredSolution) {
                      const count = (localStructuredSolution.match(/"type":/g) || []).length;
                      if (count > 0) {
                        changes.push({ path: 'blocklyConfig.maxBlocks', value: count + 3 });
                      }
                    }
                    handleComplexChange(...changes);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Auto (+3)
              </label>
            </div>
          </div>
          <input
            type="number"
            value={getDeepValue(metadata, 'blocklyConfig.maxBlocks') || ''}
            disabled={getDeepValue(metadata, 'blocklyConfig.autoMaxBlocks') !== false}
            onChange={(e) => handleComplexChange({ path: 'blocklyConfig.maxBlocks', value: parseInt(e.target.value, 10) || 0 })}
            className={getDeepValue(metadata, 'blocklyConfig.autoMaxBlocks') !== false ? 'disabled-input' : ''}
          />
        </div>
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* SOLUTION SECTION */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Solution"
        icon={<Target size={16} />}
        isOpen={openSection === 'solution'}
        onToggle={() => setOpenSection(openSection === 'solution' ? null : 'solution')}
        badge={hasSolution ? (metadata.solution?.type || 'Standard') : <span><AlertTriangle size={12} className="inline-icon" /> Not solved</span>}
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
            <><RefreshCw size={16} /> Calculate Solution</>
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
      <CollapsibleSection
        title="Import / Export"
        icon={<FileJson size={16} />}
        isOpen={openSection === 'importExport'}
        onToggle={() => setOpenSection(openSection === 'importExport' ? null : 'importExport')}
      >
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
        <div className="button-group vertical">
          <button
            className="action-btn secondary full-width"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => handleFileChange(e as any);
              input.click();
            }}
          >
            <span className="icon"><FolderOpen size={16} /></span> Import JSON Map
          </button>
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
      </CollapsibleSection>
    </aside>
  );
}
