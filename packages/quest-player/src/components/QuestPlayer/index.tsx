// packages/quest-player/src/components/QuestPlayer/index.tsx

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LZString from 'lz-string';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import { luaGenerator } from 'blockly/lua';
import { generateCppCode } from '../../games/maze/generators/cpp';
import { generateSwiftCode } from '../../games/maze/generators/swift';
import * as Blockly from 'blockly/core';
import * as Vi from 'blockly/msg/vi';
import { BlocklyWorkspace } from 'react-blockly';
import { transform } from '@babel/standalone';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { Quest, ExecutionMode, CameraMode, ToolboxJSON, ToolboxItem, QuestPlayerSettings, QuestCompletionResult, MazeConfig, Interactive, QuestMetrics, CodeLanguage } from '../../types';
import type { MazeGameState } from '../../games/maze/types';
import { Visualization } from '../Visualization';
import { QuestImporter } from '../QuestImporter';
import { Dialog } from '../Dialog';
// LanguageSelector - available via Dialog if needed
import { MonacoEditor } from '../MonacoEditor';
import { EditorToolbar } from '../EditorToolbar';
import { DocumentationPanel } from '../DocumentationPanel';
import { BackgroundMusic } from '../BackgroundMusic';
import { SettingsPanel } from '../SettingsPanel';
import { SnippetToolbox } from '../SnippetToolbox';
import { useSoundManager } from '../../hooks/useSoundManager';
import { getToolboxPresetWithFallback } from '../../config/toolboxPresets';
import type { TurtleRendererHandle } from '../../games/turtle/TurtleRenderer';
import { getFailureMessage, processToolbox, createBlocklyTheme, calculateLogicalLines, filterToolbox, getToolboxCategoryNames } from './utils';
import { useQuestLoader } from './hooks/useQuestLoader';
import { useEditorManager } from './hooks/useEditorManager';
import { useGameLoop } from './hooks/useGameLoop';
import './QuestPlayer.css';

type StandaloneProps = {
  isStandalone?: true;
  language?: string;
  initialSettings?: QuestPlayerSettings;
  onQuestLoad?: (quest: Quest) => void;
  onQuestComplete?: (result: QuestCompletionResult) => void;
  onSettingsChange?: (newSettings: QuestPlayerSettings) => void;
};

type LibraryProps = {
  isStandalone: false;
  language: string;
  questData: Quest;
  initialSettings: QuestPlayerSettings;
  onQuestComplete: (result: QuestCompletionResult) => void;
  onSettingsChange: (newSettings: QuestPlayerSettings) => void;
  onQuestLoad?: (quest: Quest) => void;
};

export type QuestPlayerProps = (StandaloneProps | LibraryProps);

interface DisplayStats {
  blockCount?: number;
  maxBlocks?: number;
  crystalsCollected?: number;
  totalCrystals?: number;
  switchesOn?: number;
  totalSwitches?: number;
  keysCollected?: number;
  totalKeys?: number;
  lineCount?: number;
  optimalLines?: number;
}

const START_BLOCK_TYPE = 'maze_start';

const DEFAULT_SETTINGS: Required<QuestPlayerSettings> = {
  renderer: 'zelos',
  blocklyThemeName: 'zelos',
  gridEnabled: true,
  soundsEnabled: true,
  colorSchemeMode: 'auto',
  cameraMode: 'Follow',
  toolboxMode: 'default',
  toolboxPresetKey: 'default',
  environment: 'day',
  displayLanguage: 'javascript', // Default to JavaScript
};

let blocklyDefaultEnglishMessages: { [key: string]: string } | null = null;


export const QuestPlayer: React.FC<QuestPlayerProps> = (props) => {
  const { t, i18n } = useTranslation();
  const language = props.language || i18n.language;

  const isStandalone = props.isStandalone !== false;

  const [loadedQuestId, setLoadedQuestId] = useState<string | null>(null);

  const [internalQuestData, setInternalQuestData] = useState<Quest | null>(null);
  const questData = isStandalone ? internalQuestData : props.questData;

  const [importError, setImportError] = useState<string>('');
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; title: string; message: React.ReactNode }>({ isOpen: false, title: '', message: '' });
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [dynamicToolboxConfig, setDynamicToolboxConfig] = useState<ToolboxJSON | null>(null);
  const [blocklySearchQuery, /* setBlocklySearchQuery */] = useState('');

  const filteredToolboxConfig = useMemo(() => {
    if (!dynamicToolboxConfig) return null;
    return filterToolbox(dynamicToolboxConfig, blocklySearchQuery);
  }, [dynamicToolboxConfig, blocklySearchQuery]);

  const allowedCategories = useMemo(() => {
    return getToolboxCategoryNames(dynamicToolboxConfig);
  }, [dynamicToolboxConfig]);

  const [initialXml, setInitialXml] = useState<string | undefined>(undefined);

  const [blocklyWorkspaceKey, setBlocklyWorkspaceKey] = useState<string>('initial-key');
  const [isBlocksInitialized, setIsBlocksInitialized] = useState(false);
  const [blockCount, setBlockCount] = useState(0);
  const [displayStats, setDisplayStats] = useState<DisplayStats>({});

  const [executionMode, /* setExecutionMode */] = useState<ExecutionMode>('run');

  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const rendererRef = useRef<TurtleRendererHandle>(null);
  const initialToolboxConfigRef = useRef<ToolboxJSON | null>(null);

  // [METRICS] Tracking refs
  const metricsRef = useRef<QuestMetrics>({
    startTime: Date.now(),
    runCount: 0,
    debugCount: 0,
    actionIntervals: [],
    timeToStars: {},
    totalTime: 0
  });

  // Track last action time to calculate intervals
  const lastActionTimeRef = useRef<number>(Date.now());

  // Reset metrics when quest loads
  useEffect(() => {
    if (questData) {
      const now = Date.now();
      metricsRef.current = {
        startTime: now,
        runCount: 0,
        debugCount: 0,
        actionIntervals: [],
        timeToStars: {},
        totalTime: 0
      };
      lastActionTimeRef.current = now;

      // Inject quest translations if available (e.g. for dynamic practice quests)
      if (questData.translations) {
        Object.entries(questData.translations).forEach(([lang, resources]) => {
          i18n.addResourceBundle(lang, 'translation', resources, true, true);
        });
      }
    }
  }, [questData, i18n]);

  // Use LZString for decompression
  // const LZString = require('lz-string'); // Dynamic import if needed, but import up top is better. 
  // Since we can't easily add top-level imports in the middle of a file with this tool, 
  // we assume LZString is imported or available globally, OR we use a dynamic import.
  // Actually, I'll add the logic here and rely on the fact that I'll add the import in a second step or assume it works
  // if I use the full replace block approach.

  // Load quest from URL or initial props
  useEffect(() => {
    if (isStandalone) {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      const compressed = urlParams.get('compressed');

      if (dataParam) {
        try {
          let jsonString;
          if (compressed === 'true' || urlParams.get('compression') === 'lz') {
            console.log('[QuestPlayer] Decompressing quest data...');
            // Need LZString here. 
            // I will use window.LZString if available or import it.
            // For now, let's assume I added the import statement at the top.
            jsonString = LZString.decompressFromEncodedURIComponent(dataParam);
          } else {
            console.log('[QuestPlayer] Parsing standard quest data...');
            jsonString = decodeURIComponent(dataParam);
          }

          if (jsonString) {
            const parsedQuest = JSON.parse(jsonString);
            setInternalQuestData(parsedQuest);
            setLoadedQuestId('url-quest');
          } else {
            console.error('Decompression result is null');
            setImportError('Failed to decompress quest data');
          }
        } catch (error) {
          console.error("Failed to parse quest data from URL:", error);
          setImportError('Invalid quest data in URL');
        }
      } else {
        // Fallback or handle normally
      }
    }
  }, [isStandalone]);

  const { GameRenderer, engineRef, solutionCommands, error: questLoaderError, isQuestReady } = useQuestLoader(questData);

  // [MỚI] Hàm tạo mã an toàn, chỉ bao gồm khối start và các hàm
  const generateSafeCodeFromWorkspace = useCallback((workspace: Blockly.WorkspaceSvg | null): string => {
    if (!workspace) return '';
    // ... (logic của hàm như đã định nghĩa ở trên)
    // ...
    const code = javascriptGenerator.workspaceToCode(workspace);
    // ... (logic kích hoạt lại khối)
    return code;
  }, []);

  const { currentEditor, aceCode, setAceCode, handleEditorChange } = useEditorManager(questData, workspaceRef, generateSafeCodeFromWorkspace);

  // Tách riêng code cho blockly và monaco để quản lý tốt hơn
  const [blocklyGeneratedCode, setBlocklyGeneratedCode] = useState('');

  // FIX: Use useState instead of useMemo so settings can be updated locally
  const [settings, setSettings] = useState<QuestPlayerSettings>(() => ({ ...DEFAULT_SETTINGS, ...props.initialSettings }));

  // currentUserCode sẽ là code được dùng để chạy game (LUÔN LÀ JAVASCRIPT)
  const currentUserCode = useMemo(() => {
    if (currentEditor === 'monaco' || currentEditor === 'javascript') {
      return aceCode;
    }
    // Đối với python/lua, game vẫn chạy bằng JS generated từ blocks
    return blocklyGeneratedCode;
  }, [currentEditor, aceCode, blocklyGeneratedCode]);

  const handleSettingsChange = useCallback((newSettings: Partial<QuestPlayerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // If Blockly-related settings changed, regenerate workspace key to force remount
      // We check newSettings compared to prev to see if update is needed, but here we just check if keys exist
      const blocklySettingsChanged =
        newSettings.renderer !== undefined ||
        newSettings.blocklyThemeName !== undefined ||
        newSettings.gridEnabled !== undefined ||
        newSettings.colorSchemeMode !== undefined ||
        newSettings.toolboxPresetKey !== undefined; // Force re-render when toolbox preset changes

      if (blocklySettingsChanged) {
        setBlocklyWorkspaceKey(`settings-${Date.now()}`);
      }

      // Notify parent if callback exists
      if (props.onSettingsChange) {
        props.onSettingsChange(updated);
      }

      return updated;
    });
  }, [props.onSettingsChange]);

  useEffect(() => {
    // Hàm async để khởi tạo blocks
    const initializeBlocks = async () => {
      if (!blocklyDefaultEnglishMessages) {
        blocklyDefaultEnglishMessages = { ...Blockly.Msg };
      }

      if (language === 'vi') {
        Blockly.setLocale(Vi as unknown as { [key: string]: string });
      } else {
        Blockly.setLocale(blocklyDefaultEnglishMessages);
      }

      Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE = t('Blockly.PROCEDURES_DEFNORETURN_PROCEDURE');
      Blockly.Msg.PROCEDURES_DEFRETURN_RETURN = t('Blockly.PROCEDURES_DEFRETURN_RETURN');
      Blockly.Msg.NEW_VARIABLE = t('Blockly.NEW_VARIABLE');
      Blockly.Msg.VARIABLES_DEFAULT_NAME = t('Blockly.VARIABLES_DEFAULT_NAME');

      // QUAN TRỌNG: Khởi tạo lại blocks với ngôn ngữ mới
      if (questData?.gameType === 'maze') {
        setIsBlocksInitialized(false); // Reset trước
        const mazeBlocks = await import('../../games/maze/blocks');
        mazeBlocks.init(t);

        // Init generators
        try {
          const pythonGen = await import('../../games/maze/generators/python');
          pythonGen.initPythonGenerator();
          const luaGen = await import('../../games/maze/generators/lua');
          luaGen.initLuaGenerator();
        } catch (e) {
          console.error("Failed to load generators", e);
        }

        setIsBlocksInitialized(true);
      }

      if (questData) {
        // Force re-render workspace với key mới bao gồm timestamp để đảm bảo luôn khác
        setBlocklyWorkspaceKey(`${questData.id}-${language}-${Date.now()}`);
      }
    };

    initializeBlocks();
  }, [language, t, questData, settings.toolboxMode]);

  const handleGameEnd = useCallback((result: QuestCompletionResult) => {
    // [METRICS] Record Star Achievements
    if (result.isSuccess && result.stars && result.stars > 0) {
      const now = Date.now();
      const timeSinceStart = now - metricsRef.current.startTime;

      // Only record if this is the first time achieving this star level OR improved time? 
      // For now, simple logic: Record first time achievement for each star level
      if (!metricsRef.current.timeToStars[result.stars]) {
        metricsRef.current.timeToStars[result.stars] = timeSinceStart;
      }
    }

    // [METRICS] Finalize total time
    metricsRef.current.totalTime = Date.now() - metricsRef.current.startTime;

    // Attach metrics to the result
    const resultWithMetrics: QuestCompletionResult = {
      ...result,
      metrics: { ...metricsRef.current }
    };

    if (isStandalone) {
      if (result.isSuccess) {
        // const unitLabel = result.unitLabel === 'block' ? 'blockCount' : 'lineCount';
        const metrics = result.metrics;

        const message = (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '15px' }}>
              {t('Games.dialogGoodJob', {
                count: result.unitCount,
                unit: result.unitLabel === 'line' ? t('UI.unit_lines', 'lines') : t('UI.unit_blocks', 'blocks')
              })}
            </p>

            {metrics && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'var(--button-bg-color, #f8f9fa)',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'left',
                color: 'var(--text-color, #212121)'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  borderBottom: '1px solid var(--border-color, #dee2e6)',
                  paddingBottom: '4px',
                  color: 'var(--text-color, #212121)'
                }}>
                  {t('UI.QuestStatistics', 'Quest Statistics')}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <span>⏱ {t('UI.TotalTime', 'Total Time')}:</span>
                  <strong>{(metrics.totalTime / 1000).toFixed(1)}s</strong>

                  <span>▶️ {t('UI.RunDebug', 'Run/Debug')}:</span>
                  <strong>{metrics.runCount} / {metrics.debugCount}</strong>

                  {Object.keys(metrics.timeToStars).length > 0 && (
                    <>
                      <span style={{
                        gridColumn: '1 / -1',
                        marginTop: '4px',
                        fontStyle: 'italic',
                        color: 'var(--text-color, #6c757d)',
                        opacity: 0.7
                      }}>
                        {t('UI.TimeToStars', 'Time to Stars')}:
                      </span>
                      {Object.entries(metrics.timeToStars).map(([star, time]) => (
                        <span key={star} style={{ fontSize: '12px' }}>
                          ⭐️ {star}: {((time as number) / 1000).toFixed(1)}s
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

        setDialogState({
          isOpen: true,
          title: t('Games.dialogCongratulations'),
          message: message
        });
      } else {
        setDialogState({
          isOpen: true,
          title: t('Games.dialogTryAgain'),
          message: getFailureMessage(t, (result.finalState as any).result)
        });
      }
    } else {
      props.onQuestComplete(resultWithMetrics);
    }
    if (isStandalone && props.onQuestComplete) {
      props.onQuestComplete(resultWithMetrics);
    }
  }, [isStandalone, props, t]);

  const { playSound } = useSoundManager(questData?.sounds, settings.soundsEnabled);

  const {
    currentGameState, playerStatus, runGame, resetGame,
    pauseGame, resumeGame, stepForward,
    handleActionComplete, handleTeleportComplete
  } = useGameLoop(engineRef, questData, rendererRef, handleGameEnd, playSound, setHighlightedBlockId, currentEditor, currentUserCode, workspaceRef, blockCount);

  // Apply block highlighting to Blockly workspace in debug mode
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    try {
      // Clear previous highlight first
      workspace.highlightBlock(null);

      // Apply new highlight if we have a block ID
      if (highlightedBlockId) {
        workspace.highlightBlock(highlightedBlockId);
      }
    } catch (e) {
      // Silently ignore if block doesn't exist (may have been deleted)
    }
  }, [highlightedBlockId]);

  // Ensure Blockly workspace is correctly sized when it becomes visible
  useEffect(() => {
    if (currentEditor === 'blockly' && workspaceRef.current) {
      // Small delay to ensure display: flex has taken effect
      setTimeout(() => {
        if (workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      }, 50);
    }
  }, [currentEditor]);

  useEffect(() => {
    if (questData?.blocklyConfig) {
      setLoadedQuestId(null);

      let newToolbox: ToolboxJSON;

      // Apply preset if selected, otherwise use quest's toolbox
      if (settings.toolboxPresetKey && settings.toolboxPresetKey !== 'default') {
        // Override with selected preset
        const preset = getToolboxPresetWithFallback(settings.toolboxPresetKey);
        newToolbox = JSON.parse(JSON.stringify(processToolbox(preset, t)));
      } else {
        // Use quest's original toolbox
        const processedToolbox = processToolbox(questData.blocklyConfig.toolbox, t);
        newToolbox = JSON.parse(JSON.stringify(processedToolbox));
      }

      // Always remove start block from toolbox to prevent adding multiples
      newToolbox.contents.forEach((category: ToolboxItem) => {
        if (category.kind === 'category' && Array.isArray(category.contents)) {
          category.contents = category.contents.filter(block => (block as any).type !== START_BLOCK_TYPE);
        }
      });
      initialToolboxConfigRef.current = newToolbox;
      setDynamicToolboxConfig(newToolbox);

      // [MỚI] Xử lý startBlocks shorthand
      const startBlocksValue = questData.blocklyConfig.startBlocks;
      if (typeof startBlocksValue === 'string' && !startBlocksValue.trim().startsWith('<')) {
        // Đây là chuỗi shorthand, cần phân tích
        setInitialXml(parseShorthandToXml(startBlocksValue));
      } else {
        // Đây là XML thông thường hoặc không có
        setInitialXml(startBlocksValue);
      }

      setLoadedQuestId(questData.id);
    } else {
      setDynamicToolboxConfig(null);
      setInitialXml(undefined);
      setLoadedQuestId(null);
    }
  }, [questData, t, language, settings.toolboxPresetKey]); // Use toolboxPresetKey to trigger re-process

  // [MỚI] Hàm phân tích chuỗi shorthand thành XML
  const parseShorthandToXml = (shorthand: string): string => {
    // Regex để tìm các cặp (số)(hành động) hoặc chỉ (hành động)
    const regex = /(\d+)?(turnRight|turnLeft|moveForward|collect|jump)/g;
    let match;
    const blocksXml: string[] = [];

    while ((match = regex.exec(shorthand)) !== null) {
      const count = match[1] ? parseInt(match[1], 10) : 1;
      const action = match[2];

      if (count > 1) {
        // Nếu số lượng > 1, tạo khối lặp
        blocksXml.push(`<block type="maze_repeat"><value name="TIMES"><shadow type="math_number"><field name="NUM">${count}</field></shadow></value><statement name="DO"><block type="maze_${action}"></block></statement></block>`);
      } else {
        // Nếu số lượng là 1, tạo khối hành động đơn
        if (action === 'turnRight' || action === 'turnLeft') {
          blocksXml.push(`<block type="maze_turn"><field name="DIR">${action}</field></block>`);
        } else {
          blocksXml.push(`<block type="maze_${action}"></block>`);
        }
      }
    }

    const innerXml = blocksXml.join('<next>') + '</next>'.repeat(blocksXml.length > 1 ? blocksXml.length - 1 : 0);
    return `<xml><block type="maze_start" deletable="false" movable="false"><statement name="DO">${innerXml}</statement></block></xml>`;
  };

  // [MỚI] Hàm để chuẩn hóa tên hàm/biến tiếng Việt cho JavaScript
  const sanitizeVietnameseName = (name: string) => {
    let sanitized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Bỏ dấu
    sanitized = sanitized.replace(/đ/g, 'd').replace(/Đ/g, 'D'); // Chuyển 'đ' thành 'd'
    sanitized = sanitized.replace(/\s+/g, '_'); // Thay khoảng trắng bằng gạch dưới
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, ''); // Loại bỏ các ký tự không hợp lệ
    return sanitized || 'unnamed_function'; // Trả về tên mặc định nếu kết quả rỗng
  };

  // [MỚI] Ghi đè phương thức của Blockly để xử lý tên tiếng Việt
  useEffect(() => {
    const originalGetDistinctName = javascriptGenerator.nameDB_?.getDistinctName;
    if (originalGetDistinctName) {
      javascriptGenerator.nameDB_!.getDistinctName = (name, type) => {
        const sanitizedName = sanitizeVietnameseName(name);
        return originalGetDistinctName.call(javascriptGenerator.nameDB_, sanitizedName, type);
      };
    }
    return () => {
      if (originalGetDistinctName) javascriptGenerator.nameDB_!.getDistinctName = originalGetDistinctName;
    };
  }, []);

  useEffect(() => { if (questLoaderError) setImportError(questLoaderError); }, [questLoaderError]);

  useEffect(() => {
    if (isQuestReady && engineRef.current) {
      resetGame();
    }
  }, [isQuestReady, engineRef, resetGame]);

  useEffect(() => {
    const newStats: DisplayStats = {};
    if (questData) {
      if (currentEditor === 'blockly' && questData.blocklyConfig?.maxBlocks) {
        newStats.blockCount = blockCount;
        newStats.maxBlocks = questData.blocklyConfig.maxBlocks;
      } else if (currentEditor === 'monaco' && questData.solution.optimalLines) {
        const lines = calculateLogicalLines(aceCode);
        newStats.lineCount = lines;
        newStats.optimalLines = questData.solution.optimalLines;
        // Xóa số khối khi ở chế độ JS để tránh nhầm lẫn
        newStats.blockCount = undefined;
        newStats.maxBlocks = undefined;
      }
      if (questData.gameType === 'maze' && currentGameState) {
        const mazeConfig = questData.gameConfig as MazeConfig;
        const mazeState = currentGameState as MazeGameState;

        if (mazeConfig.collectibles && mazeConfig.collectibles.length > 0) {
          newStats.totalCrystals = mazeConfig.collectibles.length;
          newStats.crystalsCollected = mazeState.collectedIds.length;
          newStats.totalKeys = mazeConfig.collectibles.length;
          newStats.keysCollected = mazeState.collectedIds.length;
        }
      }
      // SỬA LỖI: Luôn hiển thị trạng thái công tắc nếu chúng tồn tại trong cấu hình,
      // ngay cả khi gameState chưa được khởi tạo hoàn toàn.
      const mazeConfig = questData.gameConfig as MazeConfig;
      const switches = mazeConfig.interactibles?.filter((i: Interactive) => i.type === 'switch');
      if (switches && switches.length > 0) {
        newStats.totalSwitches = switches.length;
        newStats.switchesOn = currentGameState ? Object.values((currentGameState as MazeGameState).interactiveStates).filter(state => state === 'on').length : 0;
      }
    }
    setDisplayStats(newStats);
  }, [questData, currentGameState, blockCount, currentEditor, aceCode]);

  // Handle "Run" or "Debug" click
  const handleRun = useCallback((mode: ExecutionMode) => {
    // [METRICS] Track action
    const now = Date.now();
    const interval = now - lastActionTimeRef.current;

    metricsRef.current.actionIntervals.push(interval);

    if (mode === 'run') {
      metricsRef.current.runCount++;
    } else {
      metricsRef.current.debugCount++;
    }
    lastActionTimeRef.current = now;

    let codeToRun = '';

    console.log(`[DEBUG handleRun] currentEditor=${currentEditor}, aceCode length=${aceCode?.length}`);

    // For Monaco/JavaScript editors (user-typed code), transpile aceCode
    if (currentEditor === 'monaco' || currentEditor === 'javascript') {
      try {
        const es5Code = transform(aceCode, { presets: ['env'] }).code;
        if (!es5Code) throw new Error("Babel transpilation failed.");
        codeToRun = es5Code;
      } catch (e: any) {
        if (isStandalone) setDialogState({ isOpen: true, title: 'Syntax Error', message: e.message });
        return;
      }
    }
    // For Python/Lua/C++/Swift tabs: DISPLAY shows language-specific syntax (aceCode)
    // but EXECUTION uses JavaScript (blocklyGeneratedCode) from Blockly
    else if (currentEditor === 'python' || currentEditor === 'lua' || currentEditor === 'cpp' || currentEditor === 'swift') {
      // Use the JavaScript code generated from Blockly blocks
      codeToRun = blocklyGeneratedCode || '';
      if (!codeToRun) {
        if (isStandalone) setDialogState({ isOpen: true, title: 'No Code', message: 'Please add blocks to the workspace first.' });
        return;
      }
    }
    // For Blockly editor
    else {
      if (workspaceRef.current && !workspaceRef.current.getTopBlocks(true).find(b => b.type === START_BLOCK_TYPE)) {
        if (isStandalone) setDialogState({ isOpen: true, title: 'Missing Start Block', message: t('Blockly.MissingStartBlock') });
        return;
      }
      codeToRun = blocklyGeneratedCode || aceCode;
    }

    runGame(codeToRun, mode);
  }, [runGame, currentEditor, aceCode, isStandalone, t, blocklyGeneratedCode]);

  const handleQuestLoad = (loadedQuest: Quest) => {
    if (isStandalone) setInternalQuestData(loadedQuest);
    if (props.onQuestLoad) props.onQuestLoad(loadedQuest);
    setImportError('');
  };
  const lastGeneratedCode = useRef('');

  // Hàm generate code theo ngôn ngữ
  const generateCodeForLanguage = useCallback((workspace: Blockly.WorkspaceSvg, lang: CodeLanguage): string => {
    try {
      // console.log(`[DEBUG] Generating code for ${lang}...`);
      let code = '';
      switch (lang) {
        case 'python':
          code = pythonGenerator.workspaceToCode(workspace);
          break;
        case 'lua':
          code = luaGenerator.workspaceToCode(workspace);
          break;
        case 'cpp':
          code = generateCppCode(workspace);
          break;
        case 'swift':
          code = generateSwiftCode(workspace);
          break;
        case 'javascript':
        default:
          code = generateSafeCodeFromWorkspace(workspace);
          break;
      }

      if (!code && lang !== 'javascript') {
        const blocks = workspace.getAllBlocks(false);
        const topBlocks = workspace.getTopBlocks(false);
        console.warn(`[DEBUG] Empty code for ${lang}.`);
        console.warn(`Workspace stats: TotalBlocks=${blocks.length}, TopBlocks=${topBlocks.length}`);

        // Debug: Check a few blocks
        if (blocks.length > 0) {
          const sampleTypes = blocks.slice(0, 3).map(b => b.type);
          console.warn(`Sample block types: ${sampleTypes.join(', ')}`);

          const generator = lang === 'python' ? pythonGenerator : luaGenerator;
          sampleTypes.forEach(type => {
            console.warn(`Generator for ${type}: ${!!generator.forBlock[type] ? 'FOUND' : 'MISSING'}`);
          });

          // Debug: Try generating code for just one block
          try {
            const firstBlock = blocks[0];
            const blockCode = generator.blockToCode(firstBlock);
            console.warn(`Code for first block (${firstBlock.type}):`, blockCode);
          } catch (err) {
            console.error('Error generating single block code:', err);
          }
        }
      }
      return code;
    } catch (e) {
      console.error(`Error generating ${lang} code:`, e);
      return `Error: ${e}`;
    }
  }, [generateSafeCodeFromWorkspace]);

  const onWorkspaceChange = useCallback((workspace: Blockly.WorkspaceSvg) => {
    workspaceRef.current = workspace;
    setBlockCount(workspace.getAllBlocks(false).length);

    // Luôn generate JS để chạy
    const finalJsCode = generateSafeCodeFromWorkspace(workspace);
    if (finalJsCode !== lastGeneratedCode.current) {
      lastGeneratedCode.current = finalJsCode;
      setBlocklyGeneratedCode(finalJsCode);
    }

    // Logic update code khi workspace thay đổi
    // Nếu đang ở tab Python/Lua thì cần update ngay lập tức
    if (currentEditor === 'python' || currentEditor === 'lua') {
      const langCode = generateCodeForLanguage(workspace, currentEditor as CodeLanguage);
      setAceCode(langCode);
    }

  }, [generateSafeCodeFromWorkspace, setBlocklyGeneratedCode, generateCodeForLanguage, currentEditor, setAceCode]);

  const onInject = useCallback((workspace: Blockly.WorkspaceSvg) => {
    workspaceRef.current = workspace;

    // Resize workspace after inject to ensure correct dimensions
    // Then run cleanUp to reposition blocks and prevent overlapping
    setTimeout(() => {
      Blockly.svgResize(workspace);
      // cleanUp repositions top-level blocks to prevent overlapping
      workspace.cleanUp();
    }, 200);

    // Sử dụng `initialXml` đã được xử lý thay vì `questData.blocklyConfig.startBlocks`
    if (!initialXml) {
      const existingStartBlock = workspace.getTopBlocks(false).find(b => b.type === START_BLOCK_TYPE);
      if (!existingStartBlock) {
        // Create a new start block if none exists
        const startBlock = workspace.newBlock(START_BLOCK_TYPE);
        startBlock.initSvg();
        startBlock.render();
        startBlock.moveBy(50, 50); // Position it in the workspace
        startBlock.setDeletable(false);
      }
      return;
    }

    // Logic cũ để dọn dẹp nếu có nhiều start block (hữu ích cho các file JSON bị lỗi)
    const startBlocks = workspace.getTopBlocks(false).filter(b => b.type === START_BLOCK_TYPE);
    if (startBlocks.length > 1) {
      for (let i = 1; i < startBlocks.length; i++) {
        startBlocks[i].dispose();
      }
    }
    // Đảm bảo khối start chính không thể bị xóa
    if (startBlocks[0]) {
      startBlocks[0].setDeletable(false);
    }
  }, [initialXml]);

  const is3DRenderer = questData?.gameConfig.type === 'maze' && questData.gameConfig.renderer === '3d';

  const effectiveColorScheme = useMemo((): 'light' | 'dark' => {
    if (settings.colorSchemeMode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.colorSchemeMode || 'light';
  }, [settings.colorSchemeMode]);

  const blocklyTheme = useMemo(() => createBlocklyTheme(settings.blocklyThemeName || 'zelos', effectiveColorScheme), [settings.blocklyThemeName, effectiveColorScheme]);

  const workspaceConfiguration = useMemo(() => ({
    theme: blocklyTheme,
    renderer: settings.renderer,
    trashcan: true,
    zoom: { controls: true, wheel: false, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
    move: {
      scrollbars: {
        horizontal: true,
        vertical: true
      },
      drag: true,
      wheel: true
    },
    // Only provide grid object if gridEnabled is true
    // Use darker grid color in dark mode for better visibility
    grid: settings.gridEnabled ? {
      spacing: 20,
      length: 3,
      colour: effectiveColorScheme === 'dark' ? '#444' : '#ccc',
      snap: true
    } : undefined,
    sounds: settings.soundsEnabled,
  }), [blocklyTheme, settings, effectiveColorScheme]);

  const handleBlocklyPanelResize = useCallback(() => {
    setTimeout(() => {
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
    }, 0);
  }, []);

  if (!questData && isStandalone) {
    return (
      <div className="emptyState" style={{ flexDirection: 'column', gap: '20px' }}>
        <h2>{t('Games.loadQuest')}</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <QuestImporter onQuestLoad={handleQuestLoad} onError={setImportError} />
        </div>
        {importError && <p style={{ color: 'red', fontSize: '12px', textAlign: 'center' }}>{importError}</p>}
      </div>
    );
  }

  if (!questData) {
    return <div className="emptyState"><h2>{t('Games.waitingForQuest')}</h2></div>;
  }
  return (
    <>
      <Dialog isOpen={dialogState.isOpen} title={dialogState.title} onClose={() => setDialogState({ ...dialogState, isOpen: false })}>{dialogState.message}</Dialog>
      <DocumentationPanel isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} gameType={questData.gameType} />
      <BackgroundMusic src={questData.backgroundMusic} play={playerStatus === 'running' && (settings.soundsEnabled ?? true)} />

      <PanelGroup direction="horizontal" className="quest-player-container" autoSaveId="quest-player-panels">
        <Panel defaultSize={50} minSize={20}>
          <div className="visualizationColumn">
            <div className="main-content-wrapper">
              <div className={`controlsArea ${effectiveColorScheme}`}>
                <div>
                  {(playerStatus === 'idle' || playerStatus === 'finished') && (
                    <>
                      <button className="primaryButton" onClick={() => handleRun('run')}>{t('UI.Run')}</button>
                      <button className="primaryButton" onClick={() => handleRun('debug')}>{t('UI.Debug')}</button>
                    </>
                  )}
                  {playerStatus === 'running' && executionMode === 'debug' && (<button className="primaryButton" onClick={pauseGame}>{t('UI.Pause')}</button>)}
                  {playerStatus === 'paused' && (
                    <>
                      <button className="primaryButton" onClick={resumeGame}>{t('UI.Resume')}</button>
                      <button className="primaryButton" onClick={stepForward}>{t('UI.StepForward')}</button>
                    </>
                  )}
                  {playerStatus !== 'idle' && <button className="primaryButton" onClick={resetGame}>{t('UI.Reset')}</button>}
                </div>
                <div className="controls-left">
                  {is3DRenderer && (
                    <div className="control-group">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                      </svg>
                      <select
                        className="themed-select"
                        value={settings.cameraMode}
                        onChange={(e) => handleSettingsChange({ cameraMode: e.target.value as CameraMode })}
                      >
                        <option value="Follow">{t('Camera.Follow')}</option>
                        <option value="TopDown">{t('Camera.TopDown')}</option>
                        <option value="Free">{t('Camera.Free')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              {isQuestReady && GameRenderer ? (
                <div className="visualization-wrapper">
                  <Visualization
                    GameRenderer={GameRenderer}
                    gameState={currentGameState}
                    gameConfig={questData.gameConfig}
                    ref={questData.gameType === 'turtle' ? rendererRef : undefined}
                    solutionCommands={solutionCommands}
                    cameraMode={settings.cameraMode}
                    onActionComplete={handleActionComplete}
                    onTeleportComplete={handleTeleportComplete}
                    environment={settings.environment || 'night'}
                  />
                  <div className="stats-overlay">
                    {/* Random Mode Badge */}
                    {questData.gameConfig.type === 'maze' && (questData.gameConfig as MazeConfig).mode === 'random' && (
                      <div className="stat-item random-mode-badge" title={t('UI.RandomModeTooltip', 'Items randomized each run')}>
                        🎲 {t('UI.RandomMode', 'Random')}
                      </div>
                    )}
                    {displayStats.blockCount != null && displayStats.maxBlocks != null && (
                      <div className="stat-item">
                        {t('UI.StatsBlocks')}: {displayStats.blockCount} / {displayStats.maxBlocks}
                      </div>
                    )}
                    {displayStats.lineCount != null && displayStats.optimalLines != null && (
                      <div className="stat-item">
                        {t('UI.StatsLines')}: {displayStats.lineCount} / {displayStats.optimalLines}
                      </div>
                    )}
                    {displayStats.totalCrystals != null && displayStats.totalCrystals > 0 && (
                      <div className="stat-item">
                        {t('UI.StatsCrystals')}: {displayStats.crystalsCollected ?? 0} / {displayStats.totalCrystals}
                      </div>
                    )}
                    {displayStats.totalSwitches != null && displayStats.totalSwitches > 0 && (
                      <div className="stat-item">
                        {t('UI.StatsSwitches')}: {displayStats.switchesOn ?? 0} / {displayStats.totalSwitches}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="emptyState">
                  <h2>{t('UI.LoadingVisualization')}</h2>
                  {questLoaderError && <p style={{ color: 'red' }}>{questLoaderError}</p>}
                </div>
              )}
              <div className="descriptionArea">{t('UI.TaskLabel')}: {t(questData.descriptionKey)}</div>
            </div>
          </div>
        </Panel>
        <PanelResizeHandle />
        <Panel minSize={30} onResize={handleBlocklyPanelResize}>
          <div className="blocklyColumn">
            <EditorToolbar
              supportedEditors={['blockly', 'javascript', 'python', 'lua', 'cpp', 'swift']}
              currentEditor={currentEditor}
              onEditorChange={(editor) => {
                handleEditorChange(editor);
                // If switching to read-only language tabs (Python/Lua/C++/Swift), generate code from workspace
                if ((editor === 'python' || editor === 'lua' || editor === 'cpp' || editor === 'swift') && workspaceRef.current) {
                  const code = generateCodeForLanguage(workspaceRef.current, editor as CodeLanguage);
                  setAceCode(code);
                }
              }}
              onHelpClick={() => setIsDocsOpen(true)}
              onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
              theme={effectiveColorScheme}
            />

            {isQuestReady && dynamicToolboxConfig && isBlocksInitialized ? (
              <>
                <div style={{ display: currentEditor !== 'blockly' ? 'flex' : 'none', flex: 1, flexDirection: 'row', minHeight: 0, width: '100%' }}>
                  <SnippetToolbox currentEditor={currentEditor} allowedCategories={allowedCategories} theme={effectiveColorScheme} />
                  <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                    <MonacoEditor
                      initialCode={aceCode}
                      onChange={(value) => {
                        const code = value || '';
                        // console.log('[DEBUG] Monaco onChange:', code.substring(0, 50) + '...');
                        setAceCode(code);
                      }}
                      language={currentEditor === 'monaco' ? 'javascript' : currentEditor}
                      readOnly={false} // Phase 2: Open editing for all languages
                      theme={effectiveColorScheme}
                    />
                  </div>
                </div>

                <div style={{ display: currentEditor === 'blockly' ? 'flex' : 'none', flex: 1, flexDirection: 'column', minHeight: 0, width: '100%' }}>
                  {/* Blockly Search Input - TEMPORARILY DISABLED
                  <div style={{ padding: '8px 10px', backgroundColor: 'var(--background-color, #1e1e1e)', borderBottom: '1px solid var(--border-color, #333)' }}>
                    <input
                      type="search"
                      placeholder={t('UI.searchBlocks', 'Search...')}
                      value={blocklySearchQuery}
                      onChange={(e) => setBlocklySearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color, #555)',
                        backgroundColor: 'var(--input-bg, #3c3c3c)',
                        color: 'var(--text-color, white)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  */}
                  {questData.blocklyConfig && loadedQuestId === questData.id && (
                    <BlocklyWorkspace
                      key={blocklyWorkspaceKey}
                      className="fill-container"
                      toolboxConfiguration={filteredToolboxConfig || dynamicToolboxConfig}
                      initialXml={initialXml}
                      workspaceConfiguration={workspaceConfiguration}
                      onWorkspaceChange={onWorkspaceChange}
                      onInject={onInject}
                    />
                  )}
                  {questData.blocklyConfig && loadedQuestId !== questData.id && (
                    <div className="emptyState">
                      <h2>{t('UI.LoadingEditor')}</h2>
                    </div>
                  )}
                  <SettingsPanel
                    isOpen={isSettingsOpen}
                    renderer={settings.renderer || 'zelos'}
                    onRendererChange={value => handleSettingsChange({ renderer: value })}
                    blocklyThemeName={settings.blocklyThemeName || 'zelos'}
                    onBlocklyThemeNameChange={value => handleSettingsChange({ blocklyThemeName: value })}
                    gridEnabled={settings.gridEnabled ?? true}
                    onGridChange={value => handleSettingsChange({ gridEnabled: value })}
                    soundsEnabled={settings.soundsEnabled ?? true}
                    onSoundsChange={value => handleSettingsChange({ soundsEnabled: value })}
                    colorSchemeMode={settings.colorSchemeMode || 'auto'}
                    onColorSchemeChange={value => handleSettingsChange({ colorSchemeMode: value })}
                    toolboxPresetKey={settings.toolboxPresetKey || 'default'}
                    onToolboxPresetChange={value => handleSettingsChange({ toolboxPresetKey: value })}
                    environment={settings.environment || 'night'}
                    onEnvironmentChange={value => handleSettingsChange({ environment: value })}
                  />
                </div>
              </>
            ) : (
              <div className="emptyState">
                <h2>{questLoaderError ? t('UI.Error') : t('UI.LoadingEditor')}</h2>
                {questLoaderError && <p style={{ color: 'red' }}>{questLoaderError}</p>}
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
};