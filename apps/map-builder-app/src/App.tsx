import { useState, useMemo, useRef, useEffect, useCallback, MouseEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MainLeftPanel } from './components/MainLeftPanel';
import { BuilderScene, type SceneController } from './components/BuilderScene';
import { ViewControls } from './components/ViewControls';
import { PropertiesPanel } from './components/PropertiesPanel';
import { QuestDetailsPanel } from './components/QuestDetailsPanel';
import { Themes } from './components/PropertiesPanel/theme';
import { toolboxPresets } from './config/toolboxPresets';
import { solveMaze } from './components/QuestDetailsPanel/gameSolver';
import { JsonOutputPanel } from './components/JsonOutputPanel';
import { buildableAssetGroups } from './config/gameAssets';
import { WelcomeModal } from './components/WelcomeModal';
import { type BuildableAsset, type PlacedObject, type BuilderMode, type BoxDimensions, type FillOptions, type SelectionBounds, type MapTheme } from './types';
import { type Coord, type IPathInfo } from '@repo/academic-map-generator';
import { PlacementService, PedagogyStrategy } from '@repo/academic-map-generator';
import { TopologyPanel } from './components/TopologyPanel';
import type { HighlightItem } from './components/TopologyInspector';
import { MapInspector } from './components/MapInspector';
import { ValidationBadge } from './components/ValidationBadge';
import { BuilderModeProvider } from './store/builderModeContext';
import { useMapValidation } from './hooks/useMapValidation';
import { KeyboardShortcutsPanel } from './components/KeyboardShortcutsPanel';
import { SolutionDebugPanel } from './components/SolutionDebugPanel';
import { PlacementSelector } from './components/PlacementSelector';
import { PatternSelector } from './components/PatternSelector';
import { TemplateManager } from './components/TemplateManager';
import { PlacementVariants } from './components/PlacementVariants';
import { TemplatePanel } from './components/TemplatePanel';
import { RightPanelTabs } from './components/RightPanelTabs';
// Smart selection types
export type SelectionMode = 'box' | 'smart';
import { SelectionEngine } from './utils/SelectionEngine';
import { FloodFill } from './utils/FloodFill';
import { SymmetryMode, type SymmetryAxis } from './utils/SymmetryMode';
import { CloneEngine } from './utils/CloneEngine';
import {
  MapAnalyzer,
  type SelectableElement,
  type TemplateItemPlacement,
  type ItemPlacement,
  type SegmentPattern,
  SEGMENT_PATTERNS,
  applySegmentPattern
} from '@repo/academic-map-generator';
import { CenterToolbar } from './components/CenterToolbar';

import _ from 'lodash';
import './App.css';

const defaultAsset = buildableAssetGroups[0]?.items[0];

// Wrapper component for ValidationBadge that uses the useMapValidation hook
interface ValidationBadgeWrapperProps {
  placedObjects: PlacedObject[];
  pathInfo: IPathInfo | null;
  mode: 'manual' | 'auto';
  strategy: PedagogyStrategy;
}

function ValidationBadgeWrapper({ placedObjects, pathInfo, mode, strategy }: ValidationBadgeWrapperProps) {
  const { validationReport, status, statusMessage, validateNow, isValidating } = useMapValidation({
    placedObjects,
    pathInfo,
    mode,
    strategy,
    debounceMs: 500,
    autoValidate: true,
  });

  return (
    <ValidationBadge
      status={status}
      message={statusMessage}
      report={validationReport}
      isValidating={isValidating}
      onValidate={validateNow}
      position="top-right"
    />
  );
}

function App() {
  const [selectedAsset, setSelectedAsset] = useState<BuildableAsset | null>(defaultAsset);
  // Keyboard Shortcuts State (Moved from HelpButton)
  const [showShortcuts, setShowShortcuts] = useState(false);
  // --- START: THAY ĐỔI ĐỂ QUẢN LÝ LỊCH SỬ UNDO/REDO ---
  const [activeSidePanel, setActiveSidePanel] = useState<'topology' | 'placement' | 'template'>('topology'); // State chọn panel
  const [placementSubTab, setPlacementSubTab] = useState<'guided' | 'auto'>('guided'); // Sub-tab trong Placement panel
  const [autoPlacementMode, setAutoPlacementMode] = useState<'random' | 'academic'>('random'); // Mode trong Auto tab
  const [constraintsEnabled, setConstraintsEnabled] = useState(true); // Bật/tắt constraints trong Random mode
  const [excludeStartPos, setExcludeStartPos] = useState(true); // Không đặt items ở Start
  const [excludeEndPos, setExcludeEndPos] = useState(true); // Không đặt items ở End
  // Sidebar Visibility State
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  // Placement selector state
  const [placementSelections, setPlacementSelections] = useState<Array<{ elementId: string; itemType: 'crystal' | 'switch'; symmetric?: boolean }>>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  // Strategy and item goals for placement
  const [placementStrategy, setPlacementStrategy] = useState<PedagogyStrategy>(PedagogyStrategy.NONE);
  const [placementDifficulty, setPlacementDifficulty] = useState<'intro' | 'simple' | 'complex'>('simple');
  const [itemGoals, setItemGoals] = useState<{ crystals: number; switches: number }>({ crystals: 3, switches: 0 });
  const [activeLayer, setActiveLayer] = useState<'all' | 'ground' | 'items'>('all'); // NEW: Layer State
  const [smartSnapEnabled, setSmartSnapEnabled] = useState<boolean>(true); // NEW: Smart Snap State
  const [history, setHistory] = useState<PlacedObject[][]>([[]]); // Mảng lưu các trạng thái của placedObjects
  const [historyIndex, setHistoryIndex] = useState(0); // Con trỏ tới trạng thái hiện tại trong lịch sử
  const placedObjects = useMemo(() => history[historyIndex] || [], [history, historyIndex]);
  // --- START: SỬA LỖI ÁP DỤNG THEME NHIỀU LẦN ---
  // --- END: SỬA LỖI ÁP DỤNG THEME NHIỀU LẦN ---
  const [builderMode, setBuilderMode] = useState<BuilderMode>('build-single');
  const [sidebarWidth, setSidebarWidth] = useState(320); // State cho chiều rộng của sidebar
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({ width: 14, height: 14, depth: 14 });

  const [selectionStart, setSelectionStart] = useState<[number, number, number] | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<[number, number, number] | null>(null);

  const [fillOptions, setFillOptions] = useState<FillOptions>({ type: 'volume', pattern: 'solid', spacing: 1 });

  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);

  // --- NEW: Smart Selection States ---
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('box'); // Box or Smart selection
  const [hoverPreviewIds, setHoverPreviewIds] = useState<string[]>([]); // Preview of smart selection on hover
  const selectionEngineRef = useRef(new SelectionEngine()); // Singleton instance

  // --- NEW: Rotation States ---
  const [isRotating, setIsRotating] = useState(false);
  const [rotateSnapAngle, setRotateSnapAngle] = useState<'free' | 45 | 90>(90); // Default 90° snap

  // --- NEW: Fill Tool States ---
  const [isFillMode, setIsFillMode] = useState(false);
  const [fillPreviewPositions, setFillPreviewPositions] = useState<[number, number, number][]>([]);
  const floodFillRef = useRef(new FloodFill()); // Singleton instance

  // --- NEW: Symmetry Mode States ---
  const [symmetryEnabled, setSymmetryEnabled] = useState(false);
  const [symmetryAxis, setSymmetryAxis] = useState<'x' | 'z' | 'both'>('x');
  const [symmetryCenter, setSymmetryCenter] = useState({ x: 7, z: 7 }); // Default center
  const symmetryModeRef = useRef(new SymmetryMode());

  // --- NEW: Clone/Paste States ---
  const cloneEngineRef = useRef(new CloneEngine());
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pastePreviewPositions, setPastePreviewPositions] = useState<[number, number, number][]>([]);
  const [clipboardCount, setClipboardCount] = useState(0);

  // State mới để lưư trữ siêu dữ liệu của quest
  const [questMetadata, setQuestMetadata] = useState<Record<string, any> | null>(null);
  // SỬA LỖI: State cho theme hiện tại, được khởi tạo với theme mặc định.
  const [mapTheme, setMapTheme] = useState<MapTheme>(Themes.COMPREHENSIVE_THEMES[0]);
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false); // THÊM MỚI: State cho modal hướng dẫn
  const [lastUsedStrategy, setLastUsedStrategy] = useState<PedagogyStrategy>(PedagogyStrategy.NONE); // Track strategy for validation

  const [currentMapFileName, setCurrentMapFileName] = useState<string>('untitled-quest.json');

  // State mới để lưu trữ chuỗi JSON đang được chỉnh sửa trong panel
  const [editedJson, setEditedJson] = useState('');

  // State mới cho menu chuột phải
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    objectId: string | null;
  }>({ visible: false, x: 0, y: 0, objectId: null });
  // State mới để quản lý hiển thị menu phụ của "Đổi Asset"
  const [assetSubMenuVisible, setAssetSubMenuVisible] = useState(false);

  // --- START: SỬA LỖI HIỆU ỨNG ---
  const [isMovingObject, setIsMovingObject] = useState(false);
  // --- END: SỬA LỖI HIỆU ỨNG ---
  const [topologyHighlights, setTopologyHighlights] = useState<HighlightItem[]>([]);
  // NEW: State for realtime calculated path
  const [dynamicPathCoords, setDynamicPathCoords] = useState<[number, number, number][] | null>(null);
  const [hasUserEdit, setHasUserEdit] = useState(false); // Track if user has modified the map since load
  const sceneRef = useRef<SceneController>(null);
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref cho right-sidebar

  // --- END: LOGIC CUỘN SIDEBAR LÊN KHI CHỌN ĐỐI TƯỢNG ---

  // MOVED UP: Asset Map Helper
  const assetMap = useMemo(() => {
    const map = new Map<string, BuildableAsset>();
    buildableAssetGroups.forEach(group => {
      group.items.forEach(item => {
        map.set(item.key, item);
      });
    });
    return map;
  }, []);

  useEffect(() => {
    // Kiểm tra localStorage để xem có nên hiển thị modal không
    const shouldShowWelcome = localStorage.getItem('showWelcomeModal') !== 'false';
    if (shouldShowWelcome) {
      setIsWelcomeModalVisible(true);
    }
  }, []); // Chạy một lần duy nhất khi component mount

  useEffect(() => {
    const lastSelectedId = selectedObjectIds[selectedObjectIds.length - 1];
    // Nếu một đối tượng được chọn (và sidebar đã được render)
    if (lastSelectedId && sidebarRef.current) {
      // Cuộn sidebar lên trên cùng một cách mượt mà
      sidebarRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [selectedObjectIds]); // Chạy effect này mỗi khi selectedObjectIds thay đổi

  // --- HÀM TIỆN ÍCH MỚI: Chuẩn hóa URL cho môi trường deploy ---
  const getCorrectedAssetUrl = (url: string): string => {
    // Logic này tìm chuỗi '/public/' và lấy tất cả mọi thứ sau nó,
    // đảm bảo đường dẫn fetch luôn đúng (ví dụ: '/templates/file.json')
    // trên cả local và Netlify.
    const publicIndex = url.indexOf('/public/');
    if (publicIndex !== -1) {
      return url.substring(publicIndex + '/public'.length);
    }
    return url;
  };

  // Đóng context menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
      setAssetSubMenuVisible(false); // Cũng đóng menu phụ
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);
  // --- START: LOGIC THAY ĐỔI KÍCH THƯỚC SIDEBAR ---
  const handleResizeMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize'; // Thay đổi con trỏ chuột
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isResizingRef.current) return;
      // Tính toán chiều rộng mới, giới hạn từ 280px đến 1000px
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(Math.max(280, Math.min(newWidth, 1400)));
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default'; // Trả lại con trỏ chuột mặc định
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  // --- END: LOGIC THAY ĐỔI KÍCH THƯỚC SIDEBAR ---

  // Hàm mới để cập nhật trạng thái và lưu vào lịch sử
  const setPlacedObjectsWithHistory = useCallback((updater: PlacedObject[] | ((prev: PlacedObject[]) => PlacedObject[])) => {
    const currentObjects = history[historyIndex] || [];
    const newObjects = typeof updater === 'function' ? updater(currentObjects) : updater;

    // Tránh thêm trạng thái trùng lặp vào lịch sử
    if (JSON.stringify(newObjects) === JSON.stringify(currentObjects)) {
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newObjects);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);



  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  // Thêm phím tắt cho Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu người dùng đang gõ trong một ô input, select, hoặc textarea
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeEl.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }

      // Ctrl+C: Copy selected objects
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (selectedObjectIds.length > 0) {
          const selectedObjs = placedObjects.filter(o => selectedObjectIds.includes(o.id));
          cloneEngineRef.current.copy(selectedObjs);
          setClipboardCount(selectedObjs.length);
          console.log(`Copied ${selectedObjs.length} objects to clipboard`);
        }
      }

      // Ctrl+V: Paste mode
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (cloneEngineRef.current.hasContent()) {
          setIsPasteMode(true);
          setBuilderMode('navigate');
          console.log('Paste mode activated. Click to place.');
        }
      }


      // --- ASSET SHORTCUTS (1-4) ---
      else if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        const asset = assetMap.get('crystal');
        if (asset) {
          setSelectedAsset(asset);
          setBuilderMode('build-single');
        }
      }
      else if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        const asset = assetMap.get('switch');
        if (asset) {
          setSelectedAsset(asset);
          setBuilderMode('build-single');
        }
      }
      else if (e.key === '3' && !e.ctrlKey && !e.metaKey) {
        const asset = assetMap.get('key');
        if (asset) {
          setSelectedAsset(asset);
          setBuilderMode('build-single');
        }
      }
      else if (e.key === '4' && !e.ctrlKey && !e.metaKey) {
        const asset = assetMap.get('portal_blue');
        if (asset) {
          setSelectedAsset(asset);
          setBuilderMode('build-single');
        }
      }
      else if (e.key === '5' && !e.ctrlKey && !e.metaKey) {
        const asset = assetMap.get('player_start');
        if (asset) {
          setSelectedAsset(asset);
          setBuilderMode('build-single');
        }
      }
      else if (e.key === '6' && !e.ctrlKey && !e.metaKey) {
        const asset = assetMap.get('finish');
        if (asset) {
          setSelectedAsset(asset);
          setBuilderMode('build-single');
        }
      }

      // --- NEW: TOOL SHORTCUTS ---
      // S key: Toggle to Smart Select mode
      else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSelectionMode('smart');
      }

      // G key: Activate Move/Grab mode (switch to navigate to use gizmo)
      else if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // If objects selected, switch to navigate mode to allow gizmo interaction
        if (selectedObjectIds.length > 0) {
          setBuilderMode('navigate');
        }
      }

      // R key: Activate Rotate mode
      else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // If objects selected, switch to navigate mode for rotation
        if (selectedObjectIds.length > 0) {
          setBuilderMode('navigate');
          setIsRotating(true);
        }
      }

      // F key: Activate Fill mode
      else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsFillMode(true);
        setBuilderMode('navigate');
      }

      // Esc key: Clear selection and cancel modes
      else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedObjectIds([]);
        setHoverPreviewIds([]);
        setSelectionStart(null); // Clear area selection
        setSelectionEnd(null);
        setIsRotating(false);
        setIsFillMode(false);
        setFillPreviewPositions([]);
        setIsPasteMode(false);
        setPastePreviewPositions([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // --- DI CHUYỂN LÊN TRÊN ĐỂ SỬA LỖI ---
  const selectionBounds: SelectionBounds | null = useMemo(() => {
    if (!selectionStart || !selectionEnd) return null;
    return {
      min: [Math.min(selectionStart[0], selectionEnd[0]), Math.min(selectionStart[1], selectionEnd[1]), Math.min(selectionStart[2], selectionEnd[2]),],
      max: [Math.max(selectionStart[0], selectionEnd[0]), Math.max(selectionStart[1], selectionEnd[1]), Math.max(selectionStart[2], selectionEnd[2]),],
    };
  }, [selectionStart, selectionEnd]);

  // --- NEW: Highlight objects inside selection bounds (real-time preview) ---
  useEffect(() => {
    if (!selectionBounds) {
      // Don't clear hoverPreviewIds here - let Smart Select handle its own previews
      return;
    }

    // Find all objects inside the selection bounds
    const { min, max } = selectionBounds;
    const objectsInBounds = placedObjects.filter(obj => {
      const [x, y, z] = obj.position;
      return (
        x >= min[0] && x <= max[0] &&
        y >= min[1] && y <= max[1] &&
        z >= min[2] && z <= max[2]
      );
    });

    // Update hover preview IDs with objects inside bounds
    const idsInBounds = objectsInBounds.map(o => o.id);
    setHoverPreviewIds(idsInBounds);
  }, [selectionBounds, placedObjects]);

  // --- HÀM MỚI: Xoay một hoặc nhiều đối tượng ---
  const handleRotateObject = useCallback((objectIds: string[]) => {
    setPlacedObjectsWithHistory(prev => {
      const objectIdsSet = new Set(objectIds);
      return prev.map(obj => {
        if (objectIdsSet.has(obj.id)) {
          const newRotation: [number, number, number] = [...obj.rotation];
          newRotation[1] += Math.PI / 2; // Xoay 90 độ quanh trục Y
          return { ...obj, rotation: newRotation };
        }
        return obj;
      });
    });
  }, [setPlacedObjectsWithHistory]);

  // --- HÀM MỚI: Xoay/Lật nhóm đối tượng đã chọn ---
  // ENHANCED: Also pick up items sitting on top of ground blocks
  const handleRotateSelection = useCallback(() => {
    if (selectedObjectIds.length === 0) return;

    setPlacedObjectsWithHistory(prev => {
      // Get selected objects
      const selectedObjects = prev.filter(obj => selectedObjectIds.includes(obj.id));
      if (selectedObjects.length === 0) return prev;

      // Find ground blocks and items on top of them
      const groundBlocks = selectedObjects.filter(o =>
        o.asset.type === 'block' || o.asset.key.includes('ground')
      );

      const additionalItemIds: string[] = [];
      for (const ground of groundBlocks) {
        const [gx, gy, gz] = ground.position;
        const itemsOnTop = prev.filter(o => {
          if (selectedObjectIds.includes(o.id)) return false;
          if (o.asset.type === 'block' || o.asset.key.includes('ground')) return false;
          const [ix, iy, iz] = o.position;
          return ix === gx && iz === gz && iy > gy && iy < boxDimensions.height;
        });
        additionalItemIds.push(...itemsOnTop.map(i => i.id));
      }

      // Combine all objects to rotate
      const allIdsToRotate = new Set([...selectedObjectIds, ...additionalItemIds]);
      const allObjectsToRotate = prev.filter(obj => allIdsToRotate.has(obj.id));

      // 1. Tìm tâm của nhóm
      const minPos = [Infinity, Infinity, Infinity];
      const maxPos = [-Infinity, -Infinity, -Infinity];
      allObjectsToRotate.forEach(obj => {
        minPos[0] = Math.min(minPos[0], obj.position[0]);
        minPos[1] = Math.min(minPos[1], obj.position[1]);
        minPos[2] = Math.min(minPos[2], obj.position[2]);
        maxPos[0] = Math.max(maxPos[0], obj.position[0]);
        maxPos[1] = Math.max(maxPos[1], obj.position[1]);
        maxPos[2] = Math.max(maxPos[2], obj.position[2]);
      });
      const center = [
        (minPos[0] + maxPos[0]) / 2,
        (minPos[1] + maxPos[1]) / 2,
        (minPos[2] + maxPos[2]) / 2,
      ];

      // 2. Xoay từng đối tượng quanh tâm
      const rotatedObjects = allObjectsToRotate.map(obj => {
        const relPos = [
          obj.position[0] - center[0],
          obj.position[1] - center[1],
          obj.position[2] - center[2],
        ];

        // Xoay 90 độ quanh trục Y: (x, z) -> (z, -x)
        const newRelPos = [relPos[2], relPos[1], -relPos[0]];

        const newAbsPos: [number, number, number] = [
          Math.round(newRelPos[0] + center[0]),
          Math.round(newRelPos[1] + center[1]),
          Math.round(newRelPos[2] + center[2]),
        ];

        return { ...obj, position: newAbsPos };
      });

      // 3. Cập nhật lại mảng đối tượng
      const newPlacedObjects = prev.map(obj => rotatedObjects.find(ro => ro.id === obj.id) || obj);
      return newPlacedObjects;
    });
  }, [selectedObjectIds, boxDimensions, setPlacedObjectsWithHistory]);

  // --- HÀM MỚI: Lật nhóm đối tượng đã chọn ---
  // ENHANCED: Also pick up items sitting on top of ground blocks
  const handleFlipSelection = useCallback((axis: 'x' | 'z') => {
    if (selectedObjectIds.length === 0) return;

    setPlacedObjectsWithHistory(prev => {
      const selectedObjects = prev.filter(obj => selectedObjectIds.includes(obj.id));
      if (selectedObjects.length === 0) return prev;

      // Find ground blocks and items on top of them
      const groundBlocks = selectedObjects.filter(o =>
        o.asset.type === 'block' || o.asset.key.includes('ground')
      );

      const additionalItemIds: string[] = [];
      for (const ground of groundBlocks) {
        const [gx, gy, gz] = ground.position;
        const itemsOnTop = prev.filter(o => {
          if (selectedObjectIds.includes(o.id)) return false;
          if (o.asset.type === 'block' || o.asset.key.includes('ground')) return false;
          const [ix, iy, iz] = o.position;
          return ix === gx && iz === gz && iy > gy && iy < boxDimensions.height;
        });
        additionalItemIds.push(...itemsOnTop.map(i => i.id));
      }

      // Combine all objects to flip
      const allIdsToFlip = new Set([...selectedObjectIds, ...additionalItemIds]);
      const allObjectsToFlip = prev.filter(obj => allIdsToFlip.has(obj.id));

      // 1. Tìm tâm của nhóm
      const minPos = [Infinity, Infinity];
      const maxPos = [-Infinity, -Infinity];
      allObjectsToFlip.forEach(obj => {
        minPos[0] = Math.min(minPos[0], obj.position[0]);
        minPos[1] = Math.min(minPos[1], obj.position[2]);
        maxPos[0] = Math.max(maxPos[0], obj.position[0]);
        maxPos[1] = Math.max(maxPos[1], obj.position[2]);
      });
      const center = { x: (minPos[0] + maxPos[0]) / 2, z: (minPos[1] + maxPos[1]) / 2 };

      // 2. Lật từng đối tượng qua tâm
      const flippedObjects = allObjectsToFlip.map(obj => {
        let newPosition: [number, number, number] = [...obj.position];
        if (axis === 'x') {
          newPosition[0] = Math.round(center.x - (obj.position[0] - center.x));
        } else { // axis === 'z'
          newPosition[2] = Math.round(center.z - (obj.position[2] - center.z));
        }
        return { ...obj, position: newPosition };
      });

      // 3. Cập nhật lại mảng đối tượng
      const newPlacedObjects = prev.map(obj => flippedObjects.find(fo => fo.id === obj.id) || obj);
      return newPlacedObjects;
    });
  }, [selectedObjectIds, boxDimensions, setPlacedObjectsWithHistory]);

  // Thêm phím tắt Delete/Backspace để xóa đối tượng được chọn
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Bỏ qua nếu người dùng đang gõ trong một ô input hoặc select
      if (activeEl && ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeEl.tagName)) {
        return;
      }

      // --- Phím tắt di chuyển đối tượng ---
      if (selectedObjectIds.length > 0) {
        let moved = false;
        // TÍNH NĂNG MỚI: Di chuyển tất cả đối tượng đã chọn mà không bị giới hạn
        // Kích hoạt khi nhấn Ctrl + Shift + Mũi tên
        if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
          if (event.key === 'ArrowUp') { handleMoveAllObjectsWithoutBounds('z', -1); moved = true; }
          else if (event.key === 'ArrowDown') { handleMoveAllObjectsWithoutBounds('z', 1); moved = true; }
          else if (event.key === 'ArrowLeft') { handleMoveAllObjectsWithoutBounds('x', -1); moved = true; }
          else if (event.key === 'ArrowRight') { handleMoveAllObjectsWithoutBounds('x', 1); moved = true; }
        }
        // Logic di chuyển cũ (có giới hạn)
        else if (event.shiftKey) {
          // Khi giữ Shift, chỉ xử lý di chuyển lên/xuống (trục Y)
          if (event.key === 'ArrowUp') { handleMoveObject(selectedObjectIds, 'y', 1); moved = true; }
          else if (event.key === 'ArrowDown') { handleMoveObject(selectedObjectIds, 'y', -1); moved = true; }
        }
        else {
          // Khi không giữ Shift, xử lý di chuyển trên mặt phẳng XZ
          if (event.key === 'ArrowUp') { handleMoveObject(selectedObjectIds, 'z', -1); moved = true; }
          else if (event.key === 'ArrowDown') { handleMoveObject(selectedObjectIds, 'z', 1); moved = true; }
          else if (event.key === 'ArrowLeft') { handleMoveObject(selectedObjectIds, 'x', -1); moved = true; }
          else if (event.key === 'ArrowRight') { handleMoveObject(selectedObjectIds, 'x', 1); moved = true; }
        }

        if (moved) {
          event.preventDefault(); // Ngăn các hành vi mặc định của trình duyệt
        }
      }

      // THÊM MỚI: Phím tắt Ctrl+A để chọn tất cả
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setSelectedObjectIds(placedObjects.map(obj => obj.id));
      }

      // NEW: Ctrl+D to duplicate selection
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        handleDuplicateSelection();
      }

      // --- Ưu tiên các phím tắt cho vùng chọn (select area) ---
      if (selectionBounds) {
        const key = event.key.toLowerCase();
        if (key === 'f') {
          event.preventDefault();
          handleSelectionAction('fill');
        } else if (key === 'r') {
          event.preventDefault();
          handleSelectionAction('replace');
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          handleSelectionAction('delete');
        }
      }
      // --- Nếu không có vùng chọn, xử lý phím tắt cho đối tượng đơn lẻ ---
      else if (selectedObjectIds.length > 0) {
        if (event.key.toLowerCase() === 'c') {
          event.preventDefault();
          handleCopyObject(selectedObjectIds[selectedObjectIds.length - 1]); // Sao chép đối tượng được chọn cuối cùng
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          handleRemoveMultipleObjects(selectedObjectIds);
        } else if (event.key.toLowerCase() === 'r') {
          // THÊM MỚI: Phím tắt xoay đối tượng
          event.preventDefault();
          handleRotateSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectIds, selectionBounds, placedObjects, handleRotateSelection, handleFlipSelection]); // Added missing dependencies

  // Handler to clear only items (collectibles/interactibles)
  const handleClearItems = useCallback(() => {
    if (window.confirm('WARNING: Remove ALL collectibles and interactibles from the map?')) {
      setPlacedObjectsWithHistory((prev: PlacedObject[]) => {
        const newObjects = prev.filter((obj: PlacedObject) =>
          obj.asset.type !== 'collectible' && obj.asset.type !== 'interactible'
        );
        return newObjects;
      });
      setHasUserEdit(true);
    }
  }, [setPlacedObjectsWithHistory]);

  // --- HÀM MỚI: Clean Map (Remove Identical Duplicates) ---
  const handleCleanMap = useCallback(() => {
    if (placedObjects.length === 0) return;

    // Group objects by position key
    const positionMap = new Map<string, PlacedObject[]>();
    placedObjects.forEach(obj => {
      const key = `${obj.position[0]},${obj.position[1]},${obj.position[2]}`;
      if (!positionMap.has(key)) positionMap.set(key, []);
      positionMap.get(key)!.push(obj);
    });

    const objectsToRemove: string[] = [];

    // Check for duplicates
    positionMap.forEach((objects) => {
      if (objects.length > 1) {
        // Only remove duplicates if they share the SAME ASSET KEY
        const seenAssets = new Set<string>();
        for (const obj of objects) {
          if (seenAssets.has(obj.asset.key)) {
            objectsToRemove.push(obj.id); // Duplicate found
          } else {
            seenAssets.add(obj.asset.key);
          }
        }
      }
    });

    if (objectsToRemove.length > 0) {
      if (window.confirm(`Found ${objectsToRemove.length} duplicate objects (same asset at same position). Clean them up?`)) {
        setPlacedObjectsWithHistory(prev => prev.filter(o => !objectsToRemove.includes(o.id)));
        setHasUserEdit(true);
      }
    } else {
      alert("Map is clean! No identical duplicates found.");
    }
  }, [placedObjects]);

  // --- HÀM MỚI: Manual Center Map ---
  const handleCenterMap = useCallback(() => {
    if (placedObjects.length === 0) return;

    // 1. Calculate bounding box of current content
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    placedObjects.forEach(obj => {
      const [x, , z] = obj.position;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    // 2. Calculate center of content
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // 3. Calculate target center (grid center)
    const targetX = boxDimensions.width / 2;
    const targetZ = boxDimensions.depth / 2;

    // 4. Calculate offset (Movement Vector)
    // Round to nearest integer to keep blocks aligned to grid
    const dx = Math.round(targetX - centerX);
    const dz = Math.round(targetZ - centerZ);

    if (dx === 0 && dz === 0) {
      // alert("Map is already centered!");
      console.log("Map is already centered.");
      return;
    }

    // 5. Apply offset to all objects
    setPlacedObjectsWithHistory(prev => prev.map(obj => ({
      ...obj,
      position: [
        obj.position[0] + dx,
        obj.position[1],
        obj.position[2] + dz
      ]
    })));

    setHasUserEdit(true);
    // Optional: Log action
    console.log(`Centered map. Moved by vector [${dx}, 0, ${dz}]`);

  }, [placedObjects, boxDimensions, setPlacedObjectsWithHistory]);

  // --- HÀM MỚI: Duplicate Selection ---
  const handleDuplicateSelection = useCallback(() => {
    if (selectedObjectIds.length === 0) return;

    // Filter objects that are actually in placedObjects
    const objectsToDuplicate = placedObjects.filter(o => selectedObjectIds.includes(o.id));
    if (objectsToDuplicate.length === 0) return;

    // Helper to calculate switch ID starting point
    const switchObjects = placedObjects.filter(o => o.asset.key === 'switch');
    let maxSwitchNum = switchObjects.reduce((max, o) => {
      const num = parseInt(o.id.substring(1), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newObjects: PlacedObject[] = [];
    const newSelectedIds: string[] = [];

    for (const obj of objectsToDuplicate) {
      let newId = uuidv4();

      // Smart ID splitting for special types
      if (obj.asset.key === 'switch') {
        maxSwitchNum++;
        newId = `s${maxSwitchNum}`;
      } else if (obj.properties.type === 'portal') {
        newId = `${obj.asset.key}_${uuidv4().substring(0, 4)}`;
      }

      const newObj: PlacedObject = {
        ...obj,
        id: newId,
        properties: { ...obj.properties } // Deep copy properties
      };

      // Reset targetId for portals to avoid linking to original
      if (newObj.properties.type === 'portal') {
        newObj.properties.targetId = null;
      }

      newObjects.push(newObj);
      newSelectedIds.push(newId);
    }

    if (newObjects.length > 0) {
      setHasUserEdit(true);
      setPlacedObjectsWithHistory(prev => [...prev, ...newObjects]);
      setSelectedObjectIds(newSelectedIds);
      // Optional: Log success
      console.log(`Duplicated ${newObjects.length} objects.`);
    }
  }, [selectedObjectIds, placedObjects]);

  // --- HÀM MỚI: Nhân bản đối tượng ---
  const handleDuplicateObject = (objectId: string) => {
    const objectToDuplicate = placedObjects.find(obj => obj.id === objectId);
    if (!objectToDuplicate) return;

    // Tìm vị trí trống bên cạnh (ưu tiên +X, +Z, +Y)
    const offsets: [number, number, number][] = [[1, 0, 0], [0, 0, 1], [0, 1, 0], [-1, 0, 0], [0, 0, -1], [0, -1, 0]];
    let newPosition: [number, number, number] | null = null;

    for (const offset of offsets) {
      const potentialPos: [number, number, number] = [
        objectToDuplicate.position[0] + offset[0],
        objectToDuplicate.position[1] + offset[1],
        objectToDuplicate.position[2] + offset[2],
      ];
      const posString = potentialPos.join(',');
      if (!placedObjects.some(o => o.position.join(',') === posString)) {
        newPosition = potentialPos;
        break;
      }
    }
    if (newPosition) handleAddObject(newPosition, objectToDuplicate.asset);
  };

  // --- END: THAY ĐỔI ĐỂ QUẢN LÝ LỊCH SỬ UNDO/REDO ---



  // Placement service instance for item generation
  const placementService = useMemo(() => new PlacementService(), []);

  // --- START: LOGIC MỚI CHO VIỆC ÁP DỤNG THEME ---
  const handleThemeChange = (newTheme: MapTheme) => {
    const oldTheme = mapTheme; // Lấy theme hiện tại từ state
    const newGroundAsset = assetMap.get(newTheme.ground);
    const newObstacleAsset = assetMap.get(newTheme.obstacle);

    // Nếu không tìm thấy asset tương ứng, không thực hiện thay đổi để tránh lỗi
    if (!newGroundAsset || !newObstacleAsset) {
      console.error("Không tìm thấy asset cho theme mới. Vui lòng kiểm tra lại cấu hình assets và theme.ts.");
      return;
    }

    // Cập nhật lại toàn bộ các đối tượng trên bản đồ
    setPlacedObjectsWithHistory(prevObjects => {
      return prevObjects.map(obj => {
        // Nếu asset của đối tượng là ground của theme cũ -> đổi sang ground của theme mới
        if (obj.asset.key === oldTheme.ground) {
          return { ...obj, asset: newGroundAsset };
        }
        // Nếu asset của đối tượng là obstacle của theme cũ -> đổi sang obstacle của theme mới
        if (obj.asset.key === oldTheme.obstacle) {
          return { ...obj, asset: newObstacleAsset };
        }
        // Giữ nguyên các đối tượng khác
        return obj;
      });
    });

    setMapTheme(newTheme); // Cuối cùng, cập nhật state của theme hiện tại thành theme mới
  };

  // --- HÀM MỚI: Tự động phát hiện và thiết lập theme từ các đối tượng trên bản đồ ---
  const detectAndSetTheme = useCallback((objects: PlacedObject[]) => {
    const objectKeys = new Set(objects.map(o => o.asset.key));
    let bestMatch: MapTheme | null = null;
    let maxMatchCount = -1;

    // Duyệt qua tất cả các theme có sẵn
    for (const theme of Themes.COMPREHENSIVE_THEMES) {
      let currentMatchCount = 0;
      if (objectKeys.has(theme.ground)) currentMatchCount++;
      if (objectKeys.has(theme.obstacle)) currentMatchCount++;

      // Nếu theme này khớp hoàn hảo (cả ground và obstacle), chọn nó ngay lập tức.
      if (currentMatchCount === 2) {
        bestMatch = theme;
        break;
      }
      // Nếu không, tìm theme khớp nhiều nhất.
      if (currentMatchCount > maxMatchCount) {
        maxMatchCount = currentMatchCount;
        bestMatch = theme;
      }
    }
    // Cập nhật state nếu tìm thấy theme phù hợp.
    if (bestMatch) setMapTheme(bestMatch);
  }, []); // Hàm này không có dependencies vì nó chỉ làm việc với tham số đầu vào.
  const selectedObject = useMemo(() => {
    const lastSelectedId = selectedObjectIds[selectedObjectIds.length - 1];
    return placedObjects.find(obj => obj.id === lastSelectedId) || null;
  }, [selectedObjectIds, placedObjects]);

  const outputJsonString = useMemo(() => {
    const blocks = placedObjects.filter(o => o.asset.type === 'block').map(o => ({ modelKey: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
    const collectibles = placedObjects.filter(o => o.asset.type === 'collectible').map((o, i) => ({ id: `c${i + 1}`, type: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
    const interactibles = placedObjects.filter(o => o.asset.type === 'interactible').map(o => ({ id: o.id, ...o.properties, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));

    const finishObject = placedObjects.find(o => o.asset.key === 'finish');
    const finish = finishObject ? { x: finishObject.position[0], y: finishObject.position[1], z: finishObject.position[2] } : null;

    const startObject = placedObjects.find(o => o.asset.key === 'player_start');
    // CẢI TIẾN: Đọc hướng của người chơi từ `properties` của đối tượng,
    // thay vì gán cứng giá trị là 1. Mặc định vẫn là 1 nếu không được chỉ định.
    const players = startObject ? [{ id: "player1", start: { x: startObject.position[0], y: startObject.position[1], z: startObject.position[2], direction: parseFloat(startObject.properties?.direction) || 0 } }] : [];

    const gameConfig = { type: "maze", renderer: "3d", blocks, players, collectibles, interactibles, finish };

    // Nếu có siêu dữ liệu, kết hợp nó với gameConfig mới
    if (questMetadata) {
      const cleanMetadata = _.omit(questMetadata, ['__OVERWRITE__']);
      return JSON.stringify({ ...cleanMetadata, gameConfig }, null, 2);
    }

    // Nếu không, chỉ trả về gameConfig
    return JSON.stringify({ gameConfig }, null, 2);
  }, [placedObjects, questMetadata]);

  // Lấy danh sách các asset key đang có trên map để truyền cho ThemeSelector
  const currentMapItems = useMemo(() => {
    const itemKeys = new Set(placedObjects.map(obj => obj.asset.key));
    return Array.from(itemKeys);
  }, [placedObjects]);

  // SỬA LỖI: Tự động phát hiện theme mỗi khi danh sách đối tượng thay đổi.
  useEffect(() => {
    detectAndSetTheme(placedObjects);
  }, [placedObjects, detectAndSetTheme]);

  // Đồng bộ hóa trình soạn thảo JSON khi outputJsonString thay đổi
  useEffect(() => {
    setEditedJson(outputJsonString);
  }, [outputJsonString]);

  const handleSelectAsset = (asset: BuildableAsset) => {
    // --- LOGIC MỚI: THAY THẾ ĐỐI TƯỢNG ĐÃ CHỌN ---
    if (selectedObjectIds.length > 0) {
      setPlacedObjectsWithHistory(prev => {
        const objectIndex = prev.findIndex(obj => obj.id === selectedObjectIds[0]); // Chỉ thay thế đối tượng đầu tiên nếu chọn nhiều
        if (objectIndex === -1) return prev;

        const oldObject = prev[objectIndex];
        let finalObjects = [...prev];

        // Nếu asset mới là loại duy nhất (start/finish), xóa các asset cùng loại khác
        if (asset.key === 'finish' || asset.key === 'player_start') {
          finalObjects = finalObjects.filter(o => o.asset.key !== asset.key || o.id === oldObject.id);
        }

        // Tạo đối tượng mới để thay thế, giữ lại ID và vị trí
        const replacedObject: PlacedObject = {
          id: oldObject.id,
          position: oldObject.position,
          rotation: oldObject.rotation, // Giữ lại rotation khi thay thế
          asset: asset,
          // SỬA LỖI: Giữ lại các thuộc tính cũ và chỉ thêm các thuộc tính mặc định mới nếu chưa có.
          // Điều này đảm bảo giá trị 'direction' đã được chỉnh sửa (dưới dạng số) không bị ghi đè.
          properties: { ...asset.defaultProperties, ...oldObject.properties },
        };

        // Cập nhật đối tượng trong mảng
        const updatedIndex = finalObjects.findIndex(obj => obj.id === selectedObjectIds[0]);
        finalObjects[updatedIndex] = replacedObject;

        return finalObjects;
      });
      // Sau khi thay thế, không cần đặt selectedAsset nữa và giữ nguyên lựa chọn
      setSelectedAsset(null);
      return;
    }
    // --- KẾT THÚC LOGIC MỚI ---

    // Logic cũ: Nếu không có đối tượng nào được chọn, chuẩn bị để xây dựng
    setSelectedAsset(asset);
    setBuilderMode('build-single');
  };
  // --- START: SỬA LỖI HIỆU ỨNG ---
  // Hàm xử lý lựa chọn đối tượng mới, được gọi từ BuilderScene
  const handleSelectObject = (id: string | null, isShiftDown: boolean) => {
    // --- NEW: LAYER CHECK LOGIC ---
    if (activeLayer !== 'all' && id) {
      const obj = placedObjects.find(o => o.id === id);
      if (activeLayer === 'ground' && obj && !obj.asset.key.includes('ground')) return; // Cannot select items in ground layer
      if (activeLayer === 'items' && obj && obj.asset.key.includes('ground')) return; // Cannot select ground in items layer
    }
    // ----------------------------

    if (isShiftDown) {
      // Logic chọn nhiều đối tượng
      setSelectedObjectIds(prevIds => {
        if (!id) return prevIds; // Giữ nguyên lựa chọn nếu click ra ngoài không gian
        if (prevIds.includes(id)) {
          return prevIds.filter(prevId => prevId !== id); // Bỏ chọn nếu đã có
        } else {
          return [...prevIds, id]; // Thêm vào danh sách chọn
        }
      });
    } else {
      // Logic chọn một đối tượng
      // Bắt đầu di chuyển nếu click vào đối tượng duy nhất đã được chọn
      if (id && selectedObjectIds.length === 1 && selectedObjectIds[0] === id) {
        setIsMovingObject(true);
      } else {
        // Nếu không, chỉ chọn đối tượng đó (hoặc bỏ chọn tất cả nếu click ra ngoài)
        setSelectedObjectIds(id ? [id] : []);
        setIsMovingObject(false);

        // --- NEW: Clear area selection when clicking on empty space ---
        if (!id) {
          setSelectionStart(null);
          setSelectionEnd(null);
          setHoverPreviewIds([]); // Also clear highlight preview
        }
      }
    }
  };

  // --- HÀM MỚI: Chọn nhiều đối tượng cùng lúc (cho Select Volume) ---
  const handleSelectMultipleObjects = useCallback((ids: string[]) => {
    setSelectedObjectIds(ids);
    setIsMovingObject(false);
  }, []);

  // --- END: SỬA LỖI HIỆU ỨNG ---

  // --- NEW: SMART SELECTION HANDLERS ---
  /**
   * Handle smart selection - select all connected objects
   */
  const handleSmartSelect = useCallback((objectId: string) => {
    const engine = selectionEngineRef.current;
    const connectedIds = engine.selectConnected(objectId, placedObjects);

    // Filter by active layer
    const filteredIds = connectedIds.filter(id => {
      const obj = placedObjects.find(o => o.id === id);
      if (!obj) return false;

      if (activeLayer === 'ground') return obj.asset.key.includes('ground');
      if (activeLayer === 'items') return !obj.asset.key.includes('ground');
      return true; // 'all' layer
    });

    setSelectedObjectIds(filteredIds);
    setHoverPreviewIds([]); // Clear preview after selection
  }, [placedObjects, activeLayer]);

  /**
   * Handle hover over object for smart selection preview
   */
  const handleObjectHover = useCallback((objectId: string | null) => {
    // If we have an active area selection (Box Select), don't interfere with its highlight
    if (selectionStart && selectionEnd) {
      return; // Let the useEffect for selectionBounds handle highlighting
    }

    if (selectionMode !== 'smart' || !objectId) {
      setHoverPreviewIds([]);
      return;
    }

    const engine = selectionEngineRef.current;
    const previewIds = engine.getSelectionPreview(objectId, placedObjects);

    // Filter by layer
    const filteredIds = previewIds.filter(id => {
      const obj = placedObjects.find(o => o.id === id);
      if (!obj) return false;

      if (activeLayer === 'ground') return obj.asset.key.includes('ground');
      if (activeLayer === 'items') return !obj.asset.key.includes('ground');
      return true;
    });

    setHoverPreviewIds(filteredIds);
  }, [selectionMode, placedObjects, activeLayer, selectionStart, selectionEnd]);

  /**
   * Handle selection mode change (box vs smart)
   */
  const handleSelectionModeChange = useCallback((mode: SelectionMode) => {
    setSelectionMode(mode);
    setHoverPreviewIds([]); // Clear preview when switching modes
  }, []);

  /**
   * Handle rotation of selected objects around center
   */
  const handleRotateObjects = useCallback((angleRadians: number) => {
    if (selectedObjectIds.length === 0) return;

    // Get all selected objects
    const selectedObjs = placedObjects.filter(o => selectedObjectIds.includes(o.id));
    if (selectedObjs.length === 0) return;

    // Calculate center of selection
    const centerX = selectedObjs.reduce((sum, o) => sum + o.position[0], 0) / selectedObjs.length;
    const centerZ = selectedObjs.reduce((sum, o) => sum + o.position[2], 0) / selectedObjs.length;

    // Rotate each object around the center
    const newObjects = placedObjects.map(obj => {
      if (!selectedObjectIds.includes(obj.id)) return obj;

      // Translate to origin (relative to center)
      const relX = obj.position[0] - centerX;
      const relZ = obj.position[2] - centerZ;

      // Rotate around Y axis
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);
      const newRelX = relX * cos - relZ * sin;
      const newRelZ = relX * sin + relZ * cos;

      // Translate back and round to grid
      const newX = Math.round(centerX + newRelX);
      const newZ = Math.round(centerZ + newRelZ);

      return {
        ...obj,
        position: [newX, obj.position[1], newZ] as [number, number, number],
        rotation: [obj.rotation[0], obj.rotation[1] + angleRadians, obj.rotation[2]] as [number, number, number]
      };
    });

    setPlacedObjectsWithHistory(newObjects);
  }, [selectedObjectIds, placedObjects]);

  /**
   * Handle fill preview on hover (show positions that would be filled)
   */
  const handleFillPreview = useCallback((position: [number, number, number] | null) => {
    if (!isFillMode || !position || !selectedAsset) {
      setFillPreviewPositions([]);
      return;
    }

    const bounds = {
      min: [0, 0, 0] as [number, number, number],
      max: [boxDimensions.width - 1, boxDimensions.height - 1, boxDimensions.depth - 1] as [number, number, number]
    };

    const result = floodFillRef.current.getPreview(position, placedObjects, bounds, {
      maxTiles: 500, // Limit preview for performance
      sameYLevel: true
    });

    setFillPreviewPositions(result.positions);
  }, [isFillMode, selectedAsset, boxDimensions, placedObjects]);

  /**
   * Execute fill at position
   */
  const handleFillExecute = useCallback((position: [number, number, number]) => {
    if (!isFillMode || !selectedAsset) return;

    const bounds = {
      min: [0, 0, 0] as [number, number, number],
      max: [boxDimensions.width - 1, boxDimensions.height - 1, boxDimensions.depth - 1] as [number, number, number]
    };

    const result = floodFillRef.current.floodFillEmpty(position, placedObjects, bounds, {
      maxTiles: 2000,
      sameYLevel: true
    });

    if (result.count === 0) return;

    // Create new objects for all fill positions
    const newObjects: PlacedObject[] = result.positions.map(pos => ({
      id: `fill-${pos.join('-')}-${Date.now()}`,
      position: pos,
      rotation: [0, 0, 0] as [number, number, number],
      asset: selectedAsset,
      properties: {}
    }));

    // Add all at once (single history entry)
    setPlacedObjectsWithHistory([...placedObjects, ...newObjects]);

    // Clear fill mode after execution
    setIsFillMode(false);
    setFillPreviewPositions([]);
  }, [isFillMode, selectedAsset, boxDimensions, placedObjects, setPlacedObjectsWithHistory]);

  /**
   * Handle paste preview on hover
   */
  const handlePastePreview = useCallback((position: [number, number, number] | null) => {
    if (!isPasteMode || !position) {
      setPastePreviewPositions([]);
      return;
    }

    const preview = cloneEngineRef.current.getPreview(position);
    setPastePreviewPositions(preview);
  }, [isPasteMode]);

  /**
   * Execute paste at position
   */
  const handlePasteExecute = useCallback((position: [number, number, number]) => {
    if (!isPasteMode) return;

    const result = cloneEngineRef.current.paste(position);

    if (result.objects.length === 0) return;

    // Filter out objects that would overlap with existing ones
    const existingCoords = new Set(placedObjects.map(o => o.position.join(',')));
    const newObjects = result.objects.filter(obj => !existingCoords.has(obj.position.join(',')));

    if (newObjects.length > 0) {
      setPlacedObjectsWithHistory([...placedObjects, ...newObjects]);
      console.log(`Pasted ${newObjects.length} objects`);
    }

    // Clear paste mode after execution
    setIsPasteMode(false);
    setPastePreviewPositions([]);
  }, [isPasteMode, placedObjects, setPlacedObjectsWithHistory]);
  // --- END: SMART SELECTION HANDLERS ---



  const handleModeChange = (mode: BuilderMode) => {
    setBuilderMode(mode);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleDimensionsChange = (newDims: BoxDimensions) => setBoxDimensions(newDims);
  const handleSelectionBoundsChange = (newBounds: SelectionBounds) => { setSelectionStart(newBounds.min); setSelectionEnd(newBounds.max); };

  // --- NEW LOGIC: TỰ ĐỘNG TÍNH LẠI ĐƯỜNG ĐI ---
  const recalculatePathForObjects = (objects: PlacedObject[]) => {
    // 1. Chuẩn bị dữ liệu cho solver
    const blocks = objects.filter((o: PlacedObject) => o.asset.type === 'block').map((o: PlacedObject) => ({ modelKey: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
    const collectibles = objects.filter((o: PlacedObject) =>
      o.asset.type === 'collectible' ||
      (o.asset.key && o.asset.key.toLowerCase().includes('crystal'))
    ).map((o: PlacedObject, i: number) => ({ id: o.id, type: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));

    console.log('[DEBUG Solver] Blocks count:', blocks.length, 'Collectibles count (raw):', collectibles.length);
    const interactibles = objects.filter((o: PlacedObject) => o.asset.type === 'interactible').map((o: PlacedObject) => ({ id: o.id, type: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] }, initialState: o.properties?.initialState }));

    const finishObject = objects.find(o => o.asset.key === 'finish');
    const startObject = objects.find(o => o.asset.key === 'player_start');

    if (finishObject && startObject) {
      let finish = { x: finishObject.position[0], y: finishObject.position[1], z: finishObject.position[2] };

      // AUTO-CORRECT: If finish is placed AT ground level (Y=0), lift it to Y=1 so solver can reach it
      const blockAtFinish = blocks.find(b => b.position.x === finish.x && b.position.y === finish.y && b.position.z === finish.z);
      if (blockAtFinish) {
        console.log('[DEBUG Solver] Finish is inside block, lifting to Y+1');
        finish.y += 1;
      }

      const startPos = { x: startObject.position[0], y: startObject.position[1], z: startObject.position[2] };
      // AUTO-CORRECT: Lift start too if needed
      const blockAtStart = blocks.find(b => b.position.x === startPos.x && b.position.y === startPos.y && b.position.z === startPos.z);
      if (blockAtStart) {
        console.log('[DEBUG Solver] Start is inside block, lifting to Y+1');
        startPos.y += 1;
      }

      // Parse direction safely
      let uiDirection = 0;
      if (startObject.properties?.direction) {
        const parsed = parseInt(String(startObject.properties.direction), 10);
        if (!isNaN(parsed)) uiDirection = parsed;
      }

      // IMPORTANT: UI and Solver now use the SAME direction convention:
      // 0=East(+X), 1=North(+Z), 2=West(-X), 3=South(-Z)
      // No conversion needed anymore (the old mapping was for Python solver)
      const solverDirection = uiDirection;

      const players = [{ start: { x: startPos.x, y: startPos.y, z: startPos.z, direction: solverDirection } }];


      const gameConfig = { blocks, players, finish, collectibles, interactibles };

      // Cấu hình itemGoals cho solver
      const itemGoals: Record<string, any> = {};

      // AUTO-DETECT ITEM GOALS from collectibles
      collectibles.forEach(c => {
        // Ensure valid type (fallback to 'crystal' if missing/empty)
        const type = c.type || 'crystal';
        itemGoals[type] = (itemGoals[type] || 0) + 1;
      });
      console.log('[DEBUG Solver] Collectibles found:', collectibles.length);
      console.log('[DEBUG Solver] Generated ItemGoals:', JSON.stringify(itemGoals));

      // Đối với switch, chúng ta đếm số lượng switch cần bật (mặc định là tất cả nếu có switch)
      // Đối với switch, chúng ta đếm số lượng switch cần bật (mặc định là tất cả nếu có switch)
      const switches = interactibles.filter(i => i.type === 'switch');
      if (switches.length > 0) {
        itemGoals['switch'] = switches.length;
      }

      const solveConfig = {
        itemGoals,
        rawActions: [],
        structuredSolution: { main: [] }
      };

      // 2. Gọi hàm giải
      console.log("Auto-calculating path...");
      console.log("gameConfig:", { blocks: blocks.length, collectibles, finish, players });
      console.log("itemGoals:", itemGoals);
      // @ts-ignore - solveMaze might have slight type mismatch with strict null checks
      const result = solveMaze(gameConfig, solveConfig, { availableBlocks: [] });

      if (result && result.pathCoordinates) {
        console.log("Path recalculated!", result.pathCoordinates.length);
        // 3. Cập nhật metadata
        setQuestMetadata(prev => {
          if (!prev) return null;
          // Chuyển đổi Position {x,y,z} thành tuple [x,y,z]
          const newPathCoords = result.pathCoordinates?.map(p => [p.x, p.y, p.z]);
          return {
            ...prev,
            pathInfo: {
              ...prev.pathInfo,
              path_coords: newPathCoords
            },
            solution: {
              ...prev.solution, // Keep existing metadata
              ...result,        // Override with new solver result
              itemGoals: solveConfig.itemGoals // Explicitly save items goals used
            }
          };
        });
      } else {
        console.warn("Could not find a path including the new item.");
      }
    }
  };

  // --- AUTO-RECALCULATE PATH WHEN ITEMS CHANGE ---
  useEffect(() => {
    // Only recalculate if we have questMetadata (meaning a map was generated or loaded)
    if (!questMetadata?.pathInfo) return;

    // Get current collectibles and interactibles
    const collectibles = placedObjects.filter(o => o.asset.type === 'collectible');
    const interactibles = placedObjects.filter(o => o.asset.type === 'interactible');

    // Always recalculate, even if items = 0 (to show direct path from Start to Finish)
    console.log('[Auto-Recalc] Triggering path recalculation:', { collectibles: collectibles.length, interactibles: interactibles.length });
    recalculatePathForObjects(placedObjects);
  }, [
    // Dependency: stringified list of collectible/interactible IDs and positions
    JSON.stringify(
      placedObjects
        .filter(o => o.asset.type === 'collectible' || o.asset.type === 'interactible')
        .map(o => ({ id: o.id, pos: o.position }))
    ),
    // Also recalculate when blocks change (affects pathfinding)
    JSON.stringify(
      placedObjects
        .filter(o => o.asset.type === 'block')
        .map(o => ({ id: o.id, pos: o.position }))
    ),
    // Trigger when Start/Finish moves or changes direction
    JSON.stringify(
      placedObjects
        .filter(o => o.asset.key === 'player_start' || o.asset.key === 'finish')
        .map(o => ({ id: o.id, pos: o.position, dir: o.properties?.direction }))
    )
  ]);


  const handleAddObject = (gridPosition: [number, number, number], asset: BuildableAsset) => {
    setHasUserEdit(true); // User action -> Enable realtime path
    const coordId = gridPosition.join(',');
    if (placedObjects.some(obj => obj.position.join(',') === coordId)) return;

    // --- NEW LOGIC: SMART SNAP CHECK ---
    console.log(`Adding Object: ${coordId}, Type: ${asset.type}`);
    // Ensure we have pathInfo before checking. 
    // Relaxed Check: Only enforce if pathInfo exists AND it's a collectible/interactible.
    // Also explicitly exclude 'block' type from smart snap (walls/ground).
    if (smartSnapEnabled && questMetadata?.pathInfo && asset.type !== 'block' && asset.key !== 'player_start' && asset.key !== 'finish' && !asset.key.includes('ground') && !asset.key.includes('wall')) {
      // Use placement_coords (all walkable tiles) instead of path_coords (shortest path)
      // so users can place items anywhere on the map structure.
      const validPlacementCoords = questMetadata.pathInfo.placement_coords || [];
      const [x, y, z] = gridPosition;

      console.log(`Smart Snap Check: Pos [${x},${y},${z}] against ${validPlacementCoords.length} tiles`);

      // Additional safety for type 'special' which might slip through ?
      if (asset.type === 'collectible' || asset.type === 'interactible') {
        const isValidPlacement = validPlacementCoords.some((c: Coord) =>
          (c[0] === x && c[1] === y && c[2] === z) ||
          (c[0] === x && c[1] === y - 1 && c[2] === z)
        );
        if (!isValidPlacement) {
          console.warn("Smart Snap: Invalid placement. Item must be on a valid ground tile.");
          // Visual Feedback could be added here (e.g. toast)
          return; // Strict Snap
        }
      }
    }
    // -------------------------------

    // --- START: LOGIC MỚI ĐỂ ÁP DỤNG THEME KHI BUILD ---
    let finalAsset = asset;
    const defaultGroundAssetKey = 'ground.checker'; // Giả sử đây là ground mặc định trong palette
    const defaultObstacleAssetKey = 'wall.brick02'; // Giả sử đây là obstacle mặc định trong palette

    // Nếu asset đang được chọn là ground mặc định, hãy thay thế nó bằng ground của theme hiện tại.
    if (asset.key === defaultGroundAssetKey) {
      const themeGroundAsset = assetMap.get(mapTheme.ground);
      if (themeGroundAsset) finalAsset = themeGroundAsset;
    }
    // Nếu asset đang được chọn là obstacle mặc định, hãy thay thế nó bằng obstacle của theme hiện tại.
    else if (asset.key === defaultObstacleAssetKey) {
      const themeObstacleAsset = assetMap.get(mapTheme.obstacle);
      if (themeObstacleAsset) finalAsset = themeObstacleAsset;
    }
    // --- END: LOGIC MỚI ---

    let objectsToAdd: PlacedObject[] = [];
    let objectsToRemove: string[] = [];

    if (finalAsset.key === 'finish' || finalAsset.key === 'player_start') {
      const existing = placedObjects.find(o => o.asset.key === finalAsset.key);
      if (existing) objectsToRemove.push(existing.id);
    }

    const newObject: PlacedObject = {
      // --- LOGIC TẠO ID MỚI ---
      id: (() => {
        // Nếu là switch, tạo id dạng s1, s2, ...
        if (finalAsset.key === 'switch') {
          const switchObjects = placedObjects.filter(o => o.asset.key === 'switch');
          const maxNum = switchObjects.reduce((max, o) => {
            const num = parseInt(o.id.substring(1), 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);
          return `s${maxNum + 1}`;
        }
        // Giữ nguyên logic cũ cho portal và các đối tượng khác
        return finalAsset.defaultProperties?.type === 'portal' ? `${finalAsset.key}_${uuidv4().substring(0, 4)}` : uuidv4();
      })(),
      position: gridPosition,
      rotation: [0, 0, 0], // THÊM MỚI: Khởi tạo rotation
      asset: finalAsset, // Sử dụng finalAsset đã được kiểm tra theme
      properties: finalAsset.defaultProperties ? { ...finalAsset.defaultProperties } : {},
    };

    // SỬA LỖI: Đảm bảo 'direction' luôn là số khi tạo đối tượng player_start mới.
    // Đây là bước cuối cùng để đảm bảo tính nhất quán của kiểu dữ liệu.
    if (newObject.asset.key === 'player_start' && typeof newObject.properties.direction === 'string') {
      newObject.properties.direction = parseInt(newObject.properties.direction, 10);
    }

    objectsToAdd.push(newObject);

    if (newObject.properties.type === 'portal') {
      const sameColorPortals = placedObjects.filter(o => o.id !== newObject.id && o.properties.color === newObject.properties.color);
      const unlinkedPortal = sameColorPortals.find(p => !p.properties.targetId);
      if (unlinkedPortal) {
        unlinkedPortal.properties.targetId = newObject.id;
        newObject.properties.targetId = unlinkedPortal.id;
      }
    }

    // Cập nhật lại danh sách đối tượng
    // Fix: 'prev' is not available here. Use 'placedObjects' state directly.
    const newPlacedObjects = [...placedObjects.filter(o => !objectsToRemove.includes(o.id)), ...objectsToAdd];

    // --- SYMMETRY MODE: Add mirrored copy if enabled ---
    let finalObjects = [...newPlacedObjects];
    if (symmetryEnabled && newObject.asset.key !== 'player_start' && newObject.asset.key !== 'finish') {
      // Update symmetry config
      symmetryModeRef.current.setConfig({
        enabled: true,
        axis: symmetryAxis,
        centerX: symmetryCenter.x,
        centerZ: symmetryCenter.z
      });

      // Get mirrored positions for the new object
      const mirroredPlacements = symmetryModeRef.current.getPlacementPositions(
        gridPosition,
        newObject.rotation
      );

      // Add mirrored copies (skip first which is original)
      for (let i = 1; i < mirroredPlacements.length; i++) {
        const mirrored = mirroredPlacements[i];
        const mirroredCoordId = mirrored.position.join(',');

        // Check if position is already occupied
        if (!finalObjects.some(obj => obj.position.join(',') === mirroredCoordId)) {
          const mirroredObject: PlacedObject = {
            id: `${newObject.id}-mirror-${i}`,
            position: mirrored.position,
            rotation: mirrored.rotation,
            asset: finalAsset,
            properties: { ...newObject.properties }
          };
          finalObjects.push(mirroredObject);
        }
      }
    }

    // Path will be auto-recalculated by useEffect when placedObjects changes
    // ---------------------------------------------


    setPlacedObjectsWithHistory(finalObjects);
  };

  // Hàm mới để thêm một đối tượng đã được tạo sẵn (dùng cho Duplicate)
  const handleAddNewObject = (newObject: PlacedObject) => {
    setPlacedObjectsWithHistory(prev => [...prev, newObject]);
  };

  const handleRemoveObject = (id: string) => {
    setHasUserEdit(true);
    const objectToRemove = placedObjects.find(o => o.id === id);
    if (!objectToRemove) return;

    let newObjects = placedObjects.filter(obj => obj.id !== id);

    // Handle portal logic
    if (objectToRemove.properties.type === 'portal' && objectToRemove.properties.targetId) {
      newObjects = newObjects.map(o => {
        if (o.id === objectToRemove.properties.targetId) {
          return { ...o, properties: { ...o.properties, targetId: null } };
        }
        return o;
      });
    }

    setPlacedObjectsWithHistory(newObjects);
    setSelectedObjectIds(prevIds => prevIds.filter(prevId => prevId !== id));
    // Path will be auto-recalculated by useEffect
  };

  const handleRemoveMultipleObjects = (ids: string[]) => {
    setHasUserEdit(true);
    const objectsToRemove = placedObjects.filter(o => ids.includes(o.id));
    const newObjects = placedObjects.filter(obj => !ids.includes(obj.id));

    setPlacedObjectsWithHistory(newObjects);
    setSelectedObjectIds([]); // Clear selection
    // Path will be auto-recalculated by useEffect
  };

  const handleUpdateObject = (updatedObject: PlacedObject) => {
    setPlacedObjectsWithHistory(prev => prev.map(obj => (obj.id === updatedObject.id ? updatedObject : obj)));
  };

  const handleMoveObjectToPosition = (objectId: string, newPosition: [number, number, number]) => {
    setHasUserEdit(true);
    setPlacedObjectsWithHistory(prev => {
      const objectToMove = prev.find(o => o.id === objectId);
      if (!objectToMove) return prev;

      // --- VALIDATION ---
      const [nx, ny, nz] = newPosition;
      // 1. Kiểm tra có nằm ngoài vùng xây dựng không
      if (nx < 0 || nx >= boxDimensions.width || ny < 0 || ny >= boxDimensions.height || nz < 0 || nz >= boxDimensions.depth) {
        return prev; // Vị trí mới nằm ngoài giới hạn
      }
      // 2. Kiểm tra có va chạm với đối tượng khác không
      const newPosString = newPosition.join(',');
      if (prev.some(o => o.id !== objectId && o.position.join(',') === newPosString)) {
        return prev; // Đã có đối tượng khác ở vị trí mới
      }

      // Chỉ cập nhật nếu vị trí thực sự thay đổi
      if (objectToMove.position.join(',') === newPosString) return prev;

      return prev.map(o => o.id === objectId ? { ...o, position: newPosition } : o);
    });
  };

  // NEW: Batch move multiple objects at once (for gizmo drag)
  // This prevents race conditions by updating all positions in a single state update
  // ENHANCED: When moving ground blocks, also move items sitting on top of them
  const handleMoveObjectsBatch = useCallback((moves: Array<{ id: string; position: [number, number, number] }>) => {
    setHasUserEdit(true);
    if (moves.length === 0) return;

    setPlacedObjectsWithHistory(prev => {
      // Find all ground blocks being moved
      const groundMoves = moves.filter(m => {
        const obj = prev.find(o => o.id === m.id);
        return obj && (obj.asset.type === 'block' || obj.asset.key.includes('ground'));
      });

      // Calculate delta for each ground block
      const deltaMap = new Map<string, [number, number, number]>();
      for (const groundMove of groundMoves) {
        const obj = prev.find(o => o.id === groundMove.id);
        if (obj) {
          deltaMap.set(groundMove.id, [
            groundMove.position[0] - obj.position[0],
            groundMove.position[1] - obj.position[1],
            groundMove.position[2] - obj.position[2]
          ]);
        }
      }

      // Find items sitting on top of ground blocks being moved
      const additionalMoves: Array<{ id: string; position: [number, number, number] }> = [];
      const alreadyMovingIds = new Set(moves.map(m => m.id));

      for (const groundMove of groundMoves) {
        const groundObj = prev.find(o => o.id === groundMove.id);
        if (!groundObj) continue;

        const delta = deltaMap.get(groundMove.id);
        if (!delta) continue;

        // Find all items above this ground block (same X, Z, Y > ground.Y)
        const itemsOnTop = prev.filter(o => {
          if (alreadyMovingIds.has(o.id)) return false;
          if (o.asset.type === 'block' || o.asset.key.includes('ground')) return false;

          // Check if item is on top of this ground block
          const [gx, gy, gz] = groundObj.position;
          const [ix, iy, iz] = o.position;

          return ix === gx && iz === gz && iy > gy && iy < boxDimensions.height;
        });

        // Add these items to the moves with the same delta
        for (const item of itemsOnTop) {
          if (!alreadyMovingIds.has(item.id)) {
            alreadyMovingIds.add(item.id);
            additionalMoves.push({
              id: item.id,
              position: [
                item.position[0] + delta[0],
                item.position[1] + delta[1],
                item.position[2] + delta[2]
              ]
            });
          }
        }
      }

      // Combine original moves with additional item moves
      const allMoves = [...moves, ...additionalMoves];

      // Create a map of new positions
      const moveMap = new Map(allMoves.map(m => [m.id, m.position]));
      const movingIds = new Set(allMoves.map(m => m.id));

      // Validate all moves first
      for (const move of allMoves) {
        const [nx, ny, nz] = move.position;
        // Check bounds
        if (nx < 0 || nx >= boxDimensions.width || ny < 0 || ny >= boxDimensions.height || nz < 0 || nz >= boxDimensions.depth) {
          return prev; // One object would go out of bounds, cancel entire batch
        }
        // Check collision with non-moving objects only
        const newPosString = move.position.join(',');
        if (prev.some(o => !movingIds.has(o.id) && o.position.join(',') === newPosString)) {
          return prev; // Collision with stationary object, cancel entire batch
        }
      }

      // Check for internal collisions (two moving objects going to same position)
      const newPositions = new Set(allMoves.map(m => m.position.join(',')));
      if (newPositions.size !== allMoves.length) {
        return prev; // Two objects trying to move to same position
      }

      // All validations passed, apply all moves at once
      return prev.map(o => {
        const newPos = moveMap.get(o.id);
        if (newPos) {
          return { ...o, position: newPos };
        }
        return o;
      });
    });
  }, [boxDimensions, setPlacedObjectsWithHistory]);

  // NÂNG CẤP: Di chuyển một hoặc nhiều đối tượng theo bước
  // ENHANCED: Also move items sitting on top of ground blocks
  const handleMoveObject = (objectIds: string[], direction: 'x' | 'y' | 'z', amount: 1 | -1) => {
    setHasUserEdit(true);
    setPlacedObjectsWithHistory(prev => {
      const objectsToMove = prev.filter(o => objectIds.includes(o.id));
      if (objectsToMove.length === 0) return prev;

      const axisIndex = { x: 0, y: 1, z: 2 }[direction];

      // Find ground blocks being moved and items on top of them
      const groundBlocks = objectsToMove.filter(o =>
        o.asset.type === 'block' || o.asset.key.includes('ground')
      );

      // Find items sitting on top of ground blocks
      const additionalItemIds: string[] = [];
      for (const ground of groundBlocks) {
        const [gx, gy, gz] = ground.position;
        const itemsOnTop = prev.filter(o => {
          if (objectIds.includes(o.id)) return false; // Already selected
          if (o.asset.type === 'block' || o.asset.key.includes('ground')) return false;
          const [ix, iy, iz] = o.position;
          return ix === gx && iz === gz && iy > gy && iy < boxDimensions.height;
        });
        additionalItemIds.push(...itemsOnTop.map(i => i.id));
      }

      // Combine all IDs
      const allIdsToMove = new Set([...objectIds, ...additionalItemIds]);

      // Check collision với các đối tượng khác không nằm trong vùng chọn
      const canMove = [...allIdsToMove].every(id => {
        const obj = prev.find(o => o.id === id);
        if (!obj) return true;
        const newPos: [number, number, number] = [...obj.position];
        newPos[axisIndex] += amount;
        return !prev.some(other => !allIdsToMove.has(other.id) && other.position.join(',') === newPos.join(','));
      });

      if (!canMove) return prev; // Nếu có va chạm với đối tượng khác, hủy di chuyển.

      return prev.map(obj => {
        if (allIdsToMove.has(obj.id)) {
          const newPosition: [number, number, number] = [...obj.position];
          newPosition[axisIndex] += amount;
          return { ...obj, position: newPosition };
        }
        return obj;
      });
    });
  };

  // --- TÍNH NĂNG MỚI: Di chuyển tất cả đối tượng đã chọn mà không kiểm tra giới hạn ---
  const handleMoveAllObjectsWithoutBounds = (direction: 'x' | 'y' | 'z', amount: 1 | -1) => {
    setPlacedObjectsWithHistory(prev => {
      const objectIdsSet = new Set(selectedObjectIds);
      if (objectIdsSet.size === 0) return prev;

      const axisIndex = { x: 0, y: 1, z: 2 }[direction];

      // Thực hiện di chuyển mà không có bất kỳ validation nào
      return prev.map(obj => {
        if (objectIdsSet.has(obj.id)) {
          const newPosition: [number, number, number] = [...obj.position];
          newPosition[axisIndex] += amount;
          return { ...obj, position: newPosition };
        }
        return obj;
      });
    });
  };

  // --- HÀM MỚI: Sao chép asset của đối tượng để chuẩn bị đặt ---
  const handleCopyObject = (objectId: string) => {
    const objectToCopy = placedObjects.find(obj => obj.id === objectId);
    if (objectToCopy) {
      setSelectedAsset(objectToCopy.asset);
      setBuilderMode('build-single');       // Chuyển sang chế độ xây dựng
      setSelectedObjectIds([]);            // Bỏ chọn đối tượng gốc để tránh nhầm lẫn
    }
  };

  // --- START: LOGIC MENU CHUỘT PHẢI ---
  const handleObjectContextMenu = (event: { clientX: number, clientY: number, preventDefault: () => void }, objectId: string) => {
    event.preventDefault();
    // Nếu đối tượng chưa được chọn, hãy chọn nó. Nếu đã có trong danh sách chọn, giữ nguyên.
    if (!selectedObjectIds.includes(objectId)) {
      setSelectedObjectIds([objectId]);
    }
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      objectId: objectId,
    });
    setAssetSubMenuVisible(false); // Đảm bảo menu phụ luôn đóng khi mở menu chính
  };

  const handleContextMenuAction = (action: 'delete' | 'copy_asset' | 'duplicate') => {
    const objectId = contextMenu.objectId;
    if (!objectId) return;

    const targetObject = placedObjects.find(o => o.id === objectId);
    if (!targetObject) return;

    switch (action) {
      case 'delete':
        handleRemoveObject(objectId);
        break;
      case 'copy_asset':
        handleCopyObject(objectId);
        break;
      case 'duplicate':
        handleDuplicateObject(objectId);
        break;
    }
    // Ẩn menu sau khi thực hiện hành động
    setContextMenu(prev => ({ ...prev, visible: false }));
    setAssetSubMenuVisible(false);
  };

  // --- END: LOGIC MENU CHUỘT PHẢI ---


  const handleSelectionAction = (action: 'fill' | 'replace' | 'delete') => {
    if (!selectionBounds) return;
    if (action !== 'delete' && !selectedAsset) return;

    const { min, max } = selectionBounds;
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;

    // --- Cải tiến cho hành động 'delete' ---
    const affectedObjects: PlacedObject[] = [];
    let newPlacedObjects = [...placedObjects];

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {

          // Bỏ qua nếu không khớp với các tùy chọn fill/pattern
          if (fillOptions.type === 'shell') {
            const isShell = x === minX || x === maxX || y === minY || y === maxY || z === minZ || z === maxZ;
            if (!isShell) continue;
          }

          if (fillOptions.pattern === 'checkerboard') {
            const effectiveSpacing = fillOptions.spacing + 1;
            if ((x + y + z) % effectiveSpacing !== 0) continue;
          }

          // Tìm đối tượng hiện có tại vị trí
          const existingObjectIndex = newPlacedObjects.findIndex(obj =>
            obj && obj.position[0] === x && obj.position[1] === y && obj.position[2] === z
          );

          switch (action) {
            case 'fill':
              if (existingObjectIndex === -1 && selectedAsset) {
                affectedObjects.push({
                  id: uuidv4(),
                  position: [x, y, z],
                  rotation: [0, 0, 0], // THÊM MỚI: Khởi tạo rotation
                  asset: selectedAsset,
                  properties: selectedAsset.defaultProperties ? { ...selectedAsset.defaultProperties } : {}
                });
              }
              break;
            case 'replace':
              if (existingObjectIndex !== -1 && selectedAsset) {
                newPlacedObjects[existingObjectIndex] = {
                  ...newPlacedObjects[existingObjectIndex],
                  rotation: newPlacedObjects[existingObjectIndex].rotation || [0, 0, 0], // Giữ rotation cũ
                  asset: selectedAsset,
                  properties: selectedAsset.defaultProperties ? { ...selectedAsset.defaultProperties } : {}
                };
              }
              break;
            case 'delete':
              if (existingObjectIndex !== -1) {
                (newPlacedObjects as any[])[existingObjectIndex] = null;
              }
              break;
          }
        }
      }
    }

    // --- Logic xóa được tối ưu hóa ---
    if (action === 'delete') {
      const positionsToDelete = new Set<string>();
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          for (let z = minZ; z <= maxZ; z++) {
            if (fillOptions.type === 'shell' && !(x === minX || x === maxX || y === minY || y === maxY || z === minZ || z === maxZ)) continue;
            if (fillOptions.pattern === 'checkerboard' && (x + y + z) % (fillOptions.spacing + 1) !== 0) continue;
            positionsToDelete.add(`${x},${y},${z}`);
          }
        }
      }
      setPlacedObjectsWithHistory(prev => prev.filter(obj => !positionsToDelete.has(obj.position.join(','))));
      setSelectionStart(null);
      setSelectionEnd(null);
      return; // Kết thúc sớm để không chạy logic bên dưới
    }
    // --- Kết thúc cải tiến ---

    if (action === 'fill') {
      setPlacedObjectsWithHistory(prev => [...prev, ...affectedObjects]);
    } else if (action === 'replace') {
      setPlacedObjectsWithHistory(newPlacedObjects);
    }

    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleViewChange = (view: 'perspective' | 'top' | 'front' | 'side') => sceneRef.current?.changeView(view);

  const handleImportMap = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // RESET state when importing new map
      setHasUserEdit(false);
      setDynamicPathCoords(null);

      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        // --- LOGIC NHẬN DIỆN FORMAT ---
        let configToLoad;
        if (json.gameConfig && typeof json.gameConfig === 'object') {
          // Đây là file quest đầy đủ
          configToLoad = json.gameConfig;
          // SỬA LỖI: Giữ lại toàn bộ json làm metadata để gameConfig không bị mất
          setQuestMetadata(json);
        } else if (json.blocks || json.players) {
          // Đây có vẻ là file chỉ có gameConfig, nhưng không có key cha
          // Để nhất quán, chúng ta sẽ coi nó là file gameConfig-only
          configToLoad = json;
          setQuestMetadata({ gameConfig: json }); // Bọc nó trong một object metadata chuẩn
          setCurrentMapFileName(file.name); // Cập nhật tên file
        } else {
          throw new Error("Invalid format: JSON does not contain a recognizable 'gameConfig' object.");
        }

        const { blocks = [], collectibles = [], interactibles = [], finish, players = [] } = configToLoad;
        const newPlacedObjects: PlacedObject[] = [];

        for (const block of blocks) {
          const asset = assetMap.get(block.modelKey);
          if (asset && block.position) newPlacedObjects.push({ id: uuidv4(), asset, position: [block.position.x, block.position.y, block.position.z], rotation: [0, 0, 0], properties: {} });
        }

        for (const item of collectibles) {
          const asset = assetMap.get(item.type);
          if (asset && item.position) newPlacedObjects.push({ id: uuidv4(), asset, position: [item.position.x, item.position.y, item.position.z], rotation: [0, 0, 0], properties: {} });
        }

        for (const item of interactibles) {
          const assetKey = item.type === 'portal' ? `${item.type}_${item.color}` : item.type;
          const asset = assetMap.get(assetKey);
          if (asset && item.position) {
            const { position, ...properties } = item; // rotation không có trong file JSON cũ
            newPlacedObjects.push({ id: item.id, asset, position: [position.x, position.y, position.z], rotation: [0, 0, 0], properties });
          }
        }

        if (finish) {
          const asset = assetMap.get('finish');
          if (asset) newPlacedObjects.push({ id: uuidv4(), asset, position: [finish.x, finish.y, finish.z], rotation: [0, 0, 0], properties: {} });
        }

        if (players[0]?.start) {
          const asset = assetMap.get('player_start');
          const startPos = players[0].start;
          // SỬA LỖI: Đọc và lưu lại thuộc tính `direction` của người chơi khi import map.
          if (asset) newPlacedObjects.push({
            id: uuidv4(),
            asset,
            rotation: [0, 0, 0],
            position: [startPos.x, startPos.y, startPos.z],
            properties: { direction: parseFloat(startPos.direction) || 0 }
          });
        }

        setPlacedObjectsWithHistory(newObjects => newPlacedObjects); // Bắt đầu lịch sử mới khi import
        detectAndSetTheme(newPlacedObjects); // SỬA LỖI: Cập nhật theme sau khi import
        alert('Map imported successfully!');
      } catch (error) {
        console.error("Failed to import map:", error);
        alert(`Failed to import map: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.readAsText(file);
  };

  // --- HÀM MỚI: TẢI MAP TỪ URL TRONG THƯ MỤC PUBLIC ---
  const handleLoadMapFromUrl = async (url: string) => {
    const correctedUrl = getCorrectedAssetUrl(url); // Sử dụng hàm tiện ích mới

    try {
      const response = await fetch(correctedUrl); // Sử dụng URL đã được hiệu chỉnh
      if (!response.ok) {
        throw new Error(`Failed to fetch map: ${response.statusText}`);
      }

      // RESET state when loading new map
      setHasUserEdit(false);
      setDynamicPathCoords(null);

      const json = await response.json();

      let configToLoad;
      if (json.gameConfig && typeof json.gameConfig === 'object') {
        configToLoad = json.gameConfig;
        setCurrentMapFileName(correctedUrl.split('/').pop() || 'untitled-quest.json'); // Cập nhật tên file từ URL đã sửa
        setQuestMetadata(json); // SỬA LỖI: Giữ lại toàn bộ json
        // THÊM MỚI: Đồng bộ hóa toolbox preset sau khi set metadata
        if (json.blocklyConfig) {
          syncToolboxConfig(json.blocklyConfig);
        } else {
          // Nếu file JSON cũ không có blocklyConfig, tạo một cái mặc định
          json.blocklyConfig = {
            toolboxPresetKey: 'commands_l1_move',
            toolbox: toolboxPresets['commands_l1_move']
          };
        }
      } else if (json.blocks || json.players) {
        configToLoad = json;
        setQuestMetadata({ gameConfig: json }); // SỬA LỖI: Bọc trong metadata chuẩn
      } else {
        throw new Error("Invalid format: JSON does not contain a recognizable 'gameConfig' object.");
      }

      const { blocks = [], collectibles = [], interactibles = [], finish, players = [] } = configToLoad;
      const newPlacedObjects: PlacedObject[] = [];

      for (const block of blocks) { if (assetMap.get(block.modelKey) && block.position) newPlacedObjects.push({ id: uuidv4(), asset: assetMap.get(block.modelKey)!, position: [block.position.x, block.position.y, block.position.z], rotation: [0, 0, 0], properties: {} }); }
      for (const item of collectibles) { if (assetMap.get(item.type) && item.position) newPlacedObjects.push({ id: uuidv4(), asset: assetMap.get(item.type)!, position: [item.position.x, item.position.y, item.position.z], rotation: [0, 0, 0], properties: {} }); }
      for (const item of interactibles) {
        const assetKey = item.type === 'portal' ? `${item.type}_${item.color}` : item.type;
        const asset = assetMap.get(assetKey);
        if (asset && item.position) { const { position, ...properties } = item; newPlacedObjects.push({ id: item.id, asset, position: [position.x, position.y, position.z], rotation: [0, 0, 0], properties }); }
      }
      if (finish) { const asset = assetMap.get('finish'); if (asset) newPlacedObjects.push({ id: uuidv4(), asset, position: [finish.x, finish.y, finish.z], rotation: [0, 0, 0], properties: {} }); }
      if (players[0]?.start) {
        const asset = assetMap.get('player_start');
        const startPos = players[0].start;
        // SỬA LỖI: Đọc và lưu lại thuộc tính `direction` của người chơi khi load map từ URL.
        if (asset) newPlacedObjects.push({
          id: uuidv4(),
          asset,
          rotation: [0, 0, 0],
          position: [startPos.x, startPos.y, startPos.z],
          properties: { direction: parseFloat(startPos.direction) || 0 }
        });
      }

      setPlacedObjectsWithHistory(() => newPlacedObjects); // Bắt đầu lịch sử mới khi load map
      detectAndSetTheme(newPlacedObjects); // SỬA LỖI: Cập nhật theme sau khi load từ URL
      alert(`Map '${correctedUrl.split('/').pop()}' loaded successfully!`);

    } catch (error) {
      console.error("Failed to load map from URL:", error);
      alert(`Failed to load map from ${correctedUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // --- HÀM MỚI: CẬP NHẬT METADATA ---
  const handleMetadataChange = (path: string, value: any) => {
    setQuestMetadata(prev => {
      if (!prev) return null;

      // SỬA LỖI: Xử lý trường hợp ghi đè đặc biệt từ QuestDetailsPanel
      if (path === '__OVERWRITE__') {
        // `value` ở đây là toàn bộ đối tượng metadata mới
        return value;
      }

      // Tạo một bản sao sâu của object để tránh thay đổi trực tiếp state
      const newMeta = _.cloneDeep(prev);
      // Sử dụng lodash.set để cập nhật an toàn các đường dẫn lồng nhau
      _.set(newMeta, path, value);
      return newMeta;
    });
  };

  // --- HÀM TIỆN ÍCH MỚI: Tìm key của toolbox preset dựa trên object toolbox ---
  const findToolboxPresetKey = (toolboxObject: any): string | null => {
    if (!toolboxObject) return null;
    for (const key in toolboxPresets) {
      // Sử dụng lodash.isEqual để so sánh sâu hai object
      if (_.isEqual(toolboxPresets[key], toolboxObject)) {
        return key;
      }
    }
    return null;
  };

  // --- HÀM TIỆN ÍCH MỚI: Đồng bộ hóa toolbox và preset key ---
  const syncToolboxConfig = (config: Record<string, any>) => {
    const presetKey = findToolboxPresetKey(config.toolbox);
    // Nếu tìm thấy key, gán nó vào để dropdown hiển thị đúng.
    // Nếu không, giữ nguyên key hiện có hoặc để trống.
    if (presetKey) config.toolboxPresetKey = presetKey;
    if (!config) return;

    // Ưu tiên 1: Lấy key tường minh từ JSON (hỗ trợ cả `toolbox_preset` và `toolboxPresetKey`)
    const explicitKey = config.toolbox_preset || config.toolboxPresetKey;
    if (explicitKey && toolboxPresets[explicitKey]) {
      config.toolboxPresetKey = explicitKey; // Chuẩn hóa về một key duy nhất trong state
      config.toolbox = _.cloneDeep(toolboxPresets[explicitKey]); // Đảm bảo object toolbox khớp với key
      if (config.toolbox_preset) delete config.toolbox_preset; // Xóa key cũ để tránh dư thừa
      return;
    }

    // Ưu tiên 2: Nếu không có key tường minh, thử suy luận từ object `toolbox`
    const inferredKey = findToolboxPresetKey(config.toolbox);
    if (inferredKey) {
      config.toolboxPresetKey = inferredKey;
      return;
    }

    // Fallback: Nếu không thể xác định, đặt giá trị mặc định là Full Toolbox
    config.toolboxPresetKey = 'full_toolbox';
    config.toolbox = _.cloneDeep(toolboxPresets['full_toolbox']);
  };

  // --- AUTO-SELECT TOOLBOX FROM TEMPLATE TAGS ---
  // Maps template tags/concepts to the minimal ("vừa đủ") toolbox preset
  const getToolboxFromTemplateTags = (
    tags: string[] = [],
    concepts: string[] = [],
    category?: string
  ): string => {
    const allTags = [...tags, ...concepts, category || ''].map(t => t.toLowerCase());

    // Priority 1: Check for specific advanced features
    const hasFunction = allTags.some(t => ['function', 'procedure', 'decomposition'].includes(t));
    const hasLoop = allTags.some(t => ['loop', 'for', 'repeat', 'while', 'iteration'].includes(t));
    const hasConditional = allTags.some(t => ['if', 'conditional', 'logic', 'branch'].includes(t));
    const hasVariable = allTags.some(t => ['variable', 'var', 'counter'].includes(t));
    const hasCollect = allTags.some(t => ['collect', 'crystal', 'item'].includes(t));
    const hasSwitch = allTags.some(t => ['switch', 'toggle', 'interact'].includes(t));
    const hasTurn = allTags.some(t => ['turn', 'l-shape', 'zigzag'].includes(t));
    const hasJump = allTags.some(t => ['jump', 'hop', 'gap'].includes(t));

    // Priority 2: Map to "vừa đủ" preset based on features
    // Complex combinations → fuller presets
    if (hasFunction && hasLoop) {
      return 'loops_l3_functions_integration'; // Loops + Functions
    }
    if (hasConditional && hasLoop) {
      return 'conditionals_l2_interaction_sensing'; // Conditionals with actions
    }
    if (hasVariable) {
      return hasCollect || hasSwitch ? 'variables_l2_calculation' : 'variables_l1_basic_assignment';
    }
    if (hasFunction) {
      return hasCollect && hasSwitch ? 'functions_l4_comprehensive' :
        hasCollect ? 'functions_l2_collect_gem' :
          hasSwitch ? 'functions_l3_toggle_switch' : 'functions_l1_movement_only';
    }
    if (hasLoop) {
      return hasCollect || hasSwitch ? 'loops_l2_with_actions' : 'loops_l1_basic_movement';
    }
    if (hasConditional) {
      return 'conditionals_l1_movement_sensing';
    }

    // Sequential/basic patterns
    if (hasCollect && hasSwitch) {
      return 'commands_l6_comprehensive';
    }
    if (hasCollect) {
      return 'commands_l4_collect';
    }
    if (hasSwitch) {
      return 'commands_l5_switch';
    }
    if (hasJump) {
      return 'commands_l3_jump';
    }
    if (hasTurn) {
      return 'commands_l2_turn';
    }

    // Fallback: Full toolbox if cannot determine
    return 'full_toolbox';
  };

  // --- AUTO-FORCE RANDOM MODE ---
  // Returns true if template requires sensing logic (conditional + collect/switch)
  const shouldForceRandomMode = (
    tags: string[] = [],
    concepts: string[] = [],
    category?: string
  ): boolean => {
    const allTags = [...tags, ...concepts, category || ''].map(t => t.toLowerCase());

    // Check for sensing requirements
    const hasConditional = allTags.some(t => ['if', 'conditional', 'logic', 'sensing', 'branch'].includes(t));
    const hasInteract = allTags.some(t => ['collect', 'switch', 'crystal', 'item'].includes(t));
    const isLogicCategory = category === 'logic' || category === 'conditional';

    // Force random if:
    // 1. Explicit sensing/logic tag
    // 2. Conditional + Interaction (e.g. "If path blocked", "If on crystal")
    return hasConditional && hasInteract || isLogicCategory;
  };
  // --- HÀM TIỆN ÍCH MỚI: Trích xuất các khối lệnh có sẵn từ toolbox ---
  const getAvailableBlocksFromToolbox = (toolbox: any): string[] => {
    const allowedBlocks: Set<string> = new Set();
    if (!toolbox || !toolbox.contents) {
      return [];
    }

    // Hàm đệ quy để duyệt qua cấu trúc của toolbox
    const traverse = (contents: any[]) => {
      for (const item of contents) {
        if (item.kind === 'block' && item.type) {
          allowedBlocks.add(item.type);
        }
        // SỬA LỖI: Thêm kiểm tra cho các khối lệnh đặc biệt như hàm (PROCEDURE)
        if (item.kind === 'category' && item.custom === 'PROCEDURE') {
          allowedBlocks.add('PROCEDURE');
        }
        // THÊM MỚI: Nếu category là VARIABLE, thêm các khối biến liên quan
        if (item.kind === 'category' && item.custom === 'VARIABLE') {
          allowedBlocks.add('variables_set');
          allowedBlocks.add('variables_get');
          allowedBlocks.add('maze_repeat_variable'); // Tên tùy chỉnh cho khối lặp với biến
          allowedBlocks.add('math_change'); // Khối thay đổi biến tiêu chuẩn của Blockly
        }
        // Nếu là một category, duyệt tiếp vào contents của nó
        if (item.kind === 'category' && item.contents) {
          traverse(item.contents);
        }
      }
    };

    traverse(toolbox.contents);
    return Array.from(allowedBlocks);
  };

  // --- HÀM MỚI: RENDER LẠI MAP TỪ JSON ĐÃ CHỈNH SỬA ---
  const handleRenderEditedJson = (silent = false, preParsedJson: any = null) => {
    try {
      let json = preParsedJson ? preParsedJson : JSON.parse(editedJson);

      // --- TÍNH NĂNG MỚI: TẠO METADATA MẶC ĐỊNH NẾU CHƯA CÓ ---
      // Nếu không có metadata (trường hợp tạo map mới từ đầu), hãy tạo một bộ dữ liệu mặc định.
      if (!questMetadata && !preParsedJson) {
        const defaultId = `NEW_QUEST.${uuidv4().toUpperCase()}`;
        const defaultTitleKey = `Challenge.${defaultId}.Title`;
        const defaultDescKey = `Challenge.${defaultId}.Description`;
        const defaultToolboxKey = 'commands_l1_move'; // Chọn một toolbox mặc định

        const defaultMetadata = {
          id: defaultId,
          gameType: "maze",
          topic: "topic-title-coding_commands", // Topic mặc định
          level: 1,
          titleKey: defaultTitleKey,
          questTitleKey: defaultDescKey,
          descriptionKey: defaultDescKey,
          translations: {
            vi: { [defaultTitleKey]: "Tiêu đề mới", [defaultDescKey]: "Mô tả mới" },
            en: { [defaultTitleKey]: "New Title", [defaultDescKey]: "New Description" },
          },
          supportedEditors: ["blockly", "monaco"],
          blocklyConfig: {
            toolboxPresetKey: defaultToolboxKey, // Lưu key để hiển thị trên dropdown
            toolbox: toolboxPresets[defaultToolboxKey],
            maxBlocks: 10,
            startBlocks: '<xml><block type="maze_start" deletable="false" movable="false"></block></xml>'
          },
          // SỬA LỖI: Thêm solution object mặc định với type để pass validation
          solution: {
            type: 'reach_target',
            itemGoals: {}
          },
          // THÊM MỚI: Thêm trường sounds mặc định để đảm bảo tính toàn vẹn
          sounds: {
            "win": "/assets/maze/win.mp3",
            "fail": "/assets/maze/fail_pegman.mp3"
          },
        };
        setQuestMetadata(defaultMetadata);
        // Cập nhật json để các bước sau sử dụng metadata mới này
        json = { ...defaultMetadata, ...json };
      }

      // Nếu JSON đã được phân tích cú pháp từ trước, sử dụng nó. Nếu không, phân tích cú pháp từ state.
      let configToLoad;
      if (json.gameConfig && typeof json.gameConfig === 'object') {
        configToLoad = json.gameConfig;
        setQuestMetadata(json); // SỬA LỖI: Giữ lại toàn bộ json
        // THÊM MỚI: Đồng bộ hóa toolbox preset sau khi set metadata
        if (json.blocklyConfig) {
          syncToolboxConfig(json.blocklyConfig);
        }
      } else if (json.blocks || json.players) {
        configToLoad = json;
        setQuestMetadata({ gameConfig: json }); // SỬA LỖI: Bọc trong metadata chuẩn
      } else {
        throw new Error("Invalid format: JSON does not contain a recognizable 'gameConfig' object.");
      }

      const { blocks = [], collectibles = [], interactibles = [], finish, players = [] } = configToLoad;
      const newPlacedObjects: PlacedObject[] = [];

      for (const block of blocks) { if (assetMap.get(block.modelKey) && block.position) newPlacedObjects.push({ id: uuidv4(), asset: assetMap.get(block.modelKey)!, position: [block.position.x, block.position.y, block.position.z], rotation: [0, 0, 0], properties: {} }); }
      for (const item of collectibles) { if (assetMap.get(item.type) && item.position) newPlacedObjects.push({ id: uuidv4(), asset: assetMap.get(item.type)!, position: [item.position.x, item.position.y, item.position.z], rotation: [0, 0, 0], properties: {} }); }
      for (const item of interactibles) {
        const assetKey = item.type === 'portal' ? `${item.type}_${item.color}` : item.type;
        const asset = assetMap.get(assetKey);
        if (asset && item.position) { const { position, ...properties } = item; newPlacedObjects.push({ id: item.id, asset, position: [position.x, position.y, position.z], rotation: [0, 0, 0], properties }); }
      }
      if (finish) { const asset = assetMap.get('finish'); if (asset) newPlacedObjects.push({ id: uuidv4(), asset, position: [finish.x, finish.y, finish.z], rotation: [0, 0, 0], properties: {} }); }
      if (players[0]?.start) {
        const asset = assetMap.get('player_start');
        const startPos = players[0].start;
        // SỬA LỖI: Đọc và lưu lại thuộc tính `direction` của người chơi khi render từ JSON đã chỉnh sửa.
        if (asset) newPlacedObjects.push({
          id: uuidv4(),
          asset,
          rotation: [0, 0, 0],
          position: [startPos.x, startPos.y, startPos.z],
          properties: { direction: parseFloat(startPos.direction) || 0 }
        });
      }

      setPlacedObjectsWithHistory(() => newPlacedObjects);
      detectAndSetTheme(newPlacedObjects); // SỬA LỖI: Cập nhật theme sau khi render từ JSON
      if (!silent) alert('Map rendered successfully from JSON!');
    } catch (error) {
      console.error("Failed to render map from JSON:", error);
      alert(`Failed to render map: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // --- HÀM MỚI: LƯU (TẢI VỀ) FILE JSON ---
  const handleSaveMap = () => {
    try {
      // Đảm bảo JSON hợp lệ trước khi lưu
      JSON.parse(editedJson);

      const blob = new Blob([editedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentMapFileName; // Sử dụng tên file đã lưu
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Invalid JSON. Cannot save file. Please fix the errors in the JSON editor.\n\n${error}`);
    }
  };

  // --- HÀM MỚI: TÍCH HỢP BỘ GIẢI MÊ CUNG ---
  const handleSolveMaze = (options?: { silent?: boolean }) => {
    // SỬA LỖI: Tái cấu trúc để không cần nhấn "Render from JSON" trước khi giải.
    // Hàm này sẽ tự động tạo gameConfig mới nhất từ `placedObjects` hiện tại.
    try {
      // 1. Tạo gameConfig mới nhất từ trạng thái `placedObjects` trên màn hình.
      const blocks = placedObjects.filter(o => o.asset.type === 'block').map(o => ({ modelKey: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
      const collectibles = placedObjects.filter(o => o.asset.type === 'collectible').map((o, i) => ({ id: `c${i + 1}`, type: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
      const interactibles = placedObjects.filter(o => o.asset.type === 'interactible').map(o => ({ id: o.id, type: o.asset.key, ...o.properties, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
      const finishObject = placedObjects.find(o => o.asset.key === 'finish');
      const startObject = placedObjects.find(o => o.asset.key === 'player_start');

      // FIX: For player_start, direction is stored in properties.direction (not rotation!)
      // The visual cone uses properties.direction to determine its Y rotation
      // Direction convention: 0=East(+X), 1=North(+Z), 2=West(-X), 3=South(-Z)
      const getStartDirection = (): number => {
        if (!startObject) return 1; // Default: North (+Z)
        const dir = startObject.properties?.direction;
        if (typeof dir === 'number') return Math.round(dir) % 4;
        if (typeof dir === 'string') return Math.round(parseFloat(dir)) % 4;
        return 1; // Default: North
      };

      const players = startObject ? [{
        id: "player1",
        start: {
          x: startObject.position[0],
          y: startObject.position[1],
          z: startObject.position[2],
          // Use properties.direction directly - this matches the visual cone direction
          direction: getStartDirection()
        }
      }] : [];

      if (!finishObject) {
        alert("Lỗi: Không tìm thấy đối tượng 'Finish' trên bản đồ. Vui lòng đặt một điểm kết thúc để có thể tự động giải.");
        return;
      }
      const finish = { x: finishObject.position[0], y: finishObject.position[1], z: finishObject.position[2] };
      const currentGC = {
        ...(questMetadata?.gameConfig || {}), // Preserve existing config (mode, seed, etc.)
        type: "maze",
        renderer: "3d",
        blocks,
        players,
        collectibles,
        interactibles,
        finish
      };

      // 2. Lấy các config khác từ state
      let currentSC = questMetadata?.solution || {};
      const currentBC = _.cloneDeep(questMetadata?.blocklyConfig || {});

      // --- CẢI TIẾN CHO SOLVER ---
      // Trích xuất các khối lệnh được phép từ toolbox và thêm vào config cho solver.
      currentBC.availableBlocks = getAvailableBlocksFromToolbox(currentBC.toolbox);

      // --- START: CẬP NHẬT ITEMGOALS TỰ ĐỘNG ---
      // Đếm số lượng crystal và switch có trên bản đồ hiện tại.
      const crystalCount = currentGC.collectibles?.filter((c: any) => c.type === 'crystal').length || 0;
      const switchCount = currentGC.interactibles?.filter((i: any) => i.type === 'switch').length || 0;

      // Tạo hoặc cập nhật đối tượng itemGoals.
      const newItemGoals: Record<string, any> = {};
      if (crystalCount > 0) {
        newItemGoals.crystal = crystalCount;
      }
      if (switchCount > 0) {
        newItemGoals.switch = switchCount;
      }

      // Cập nhật solution config với itemGoals mới nhất.
      currentSC.itemGoals = newItemGoals;
      // --- END: CẬP NHẬT ITEMGOALS TỰ ĐỘNG ---

      // 3. Chạy bộ giải với gameConfig vừa được tạo.
      let solution: any = null;

      // SPECIFIC LOGIC FOR TEMPLATE GENERATOR
      // If the map is generated from a template, we trust the template's execution trace as the source of truth.
      // We do NOT want to use the generic BFS solver because it might find a different (shortcut) path 
      // or fail to match the specific pedagogical pattern (e.g. zigzag) intended by the template.
      if (questMetadata?.pathInfo?.topology === 'template_generated' && questMetadata?.rawSolution && questMetadata.rawSolution.length > 0) {
        console.log('[handleSolveMaze] Using Template-Generated Solution Trace');

        const rawActions = questMetadata.rawSolution;
        const toolboxJson = JSON.stringify(currentBC.toolbox || {});
        const hasLoops = toolboxJson.includes('controls_repeat') || toolboxJson.includes('maze_repeat');
        const hasFunctions = toolboxJson.includes('procedures_defnoreturn');

        // Build Basic Solution (Unrolled)
        const basicMain = rawActions.map((action: string) =>
          typeof action === 'string' ? { type: action.startsWith('maze_') ? action : `maze_${action}` } : action
        );

        // Build Optimal Solution (Pattern Matching if loops allowed)
        let structuredMain = [...basicMain];

        // Priority: Use pre-calculated Structured Solution (from Transpiler) if available
        if (questMetadata.structuredSolution?.main?.length > 0) {
          structuredMain = questMetadata.structuredSolution.main;
          console.log('[handleSolveMaze] Using pre-calculated structured solution from template.');
        } else if (hasLoops) {
          // Improved Pattern Matcher: Look for repeated sequences with support for Prefix/Suffix (Pre/Post-roll)
          const detectPattern = (actions: any[]) => {
            if (actions.length < 2) return null;

            let bestMatch = null;
            let maxCoverage = 0;

            // Iterate through possible start positions (Prefix length)
            for (let start = 0; start < actions.length - 1; start++) {
              // Iterate through possible pattern lengths
              // Max length is remaining space / 2
              const maxLen = Math.floor((actions.length - start) / 2);

              for (let len = 1; len <= maxLen; len++) {
                const pattern = actions.slice(start, start + len);
                const patternStr = JSON.stringify(pattern);

                let count = 1; // Start with 1 (the pattern itself)
                let currentIdx = start + len;

                // Check for subsequent repetitions
                while (currentIdx + len <= actions.length) {
                  const segment = actions.slice(currentIdx, currentIdx + len);
                  if (JSON.stringify(segment) === patternStr) {
                    count++;
                    currentIdx += len;
                  } else {
                    break;
                  }
                }

                if (count >= 2) {
                  const coverage = count * len;
                  // We want to maximize coverage.
                  // Tie-breaker: prefer shorter patterns (more repetitions)? or longer patterns (sub-loops)?
                  // Let's prefer coverage first.
                  if (coverage > maxCoverage) {
                    maxCoverage = coverage;
                    bestMatch = {
                      start,
                      len,
                      count,
                      pattern,
                      prefix: actions.slice(0, start),
                      suffix: actions.slice(start + (count * len))
                    };
                  }
                }
              }
            }
            return bestMatch;
          };

          const match = detectPattern(structuredMain);
          if (match) {
            console.log(`[handleSolveMaze] Detected Loop Pattern: ${match.count}x`, match.pattern);
            console.log(`[handleSolveMaze] Prefix: ${match.prefix.length}, Suffix: ${match.suffix.length}`);

            structuredMain = [
              ...match.prefix,
              {
                type: 'controls_repeat_ext', // Or maze_repeat
                times: match.count,
                do: match.pattern
              },
              ...match.suffix
            ];
          }
        }

        solution = {
          rawActions: rawActions,
          basicSolution: { main: basicMain, procedures: {} },
          structuredSolution: { main: structuredMain, procedures: {} },
          optimalBlocks: JSON.stringify(structuredMain).includes('repeat') ? 2 + basicMain.length / (basicMain.length > 1 ? 2 : 1) : basicMain.length, // Rough estimate
        };

      } else {
        // Fallback to Generic Solver
        solution = solveMaze(currentGC, currentSC, currentBC);
      }

      // Check if solution is valid
      if (solution && solution.rawActions) {
        // --- START: CẬP NHẬT METADATA VỚI LỜI GIẢI MỚI ---
        const newOptimalBlocks = solution.optimalBlocks || 0;
        const newMaxBlocks = Math.round(newOptimalBlocks + 5);

        // THÊM MỚI: Tạo đối tượng "lời giải cơ bản" từ rawActions.
        // Đây là một cấu trúc JSON đơn giản chỉ chứa các hành động tuần tự.
        const basicSolution = {
          // SỬA LỖI: Xử lý cả 'string' và 'Action' trong mảng rawActions.
          // Nếu là string, chuyển nó thành object. Nếu đã là object, giữ nguyên.
          main: solution.rawActions.map((action: string | { type: string }) => {
            return typeof action === 'string'
              ? { type: `maze_${action}` }
              : action;
          }),
          procedures: {}
        };

        setQuestMetadata(prev => ({
          ...prev,
          // FIX: Also update top-level rawSolution so JSON output uses correct solution
          rawSolution: solution.rawActions,
          // Cập nhật gameConfig trong metadata để JSON output được đồng bộ
          gameConfig: currentGC,
          // Cập nhật blocklyConfig với maxBlocks mới
          blocklyConfig: {
            ...(prev?.blocklyConfig || {}),
            maxBlocks: newMaxBlocks,
          },
          // Hợp nhất solution config cũ với kết quả mới từ solver
          solution: {
            ...currentSC,
            type: 'reach_target', // SỬA LỖI: Đảm bảo trường type luôn tồn tại
            ...solution,
            basicSolution: basicSolution // Lưu lời giải cơ bản vào metadata
          },
        }));
        // --- NEW: VALIDATION REPORT ---
        let report = "Validation Successful!\n- Map is solvable.";

        const strategy = questMetadata?.pathInfo?.strategy;
        if (strategy === 'loop_logic') {
          const hasLoop = JSON.stringify(solution.structuredSolution).includes('maze_repeat') || JSON.stringify(solution.structuredSolution).includes('maze_forever');
          if (!hasLoop) {
            report += "\n- WARNING: 'Loop Logic' strategy selected, but optimal solution does not use loops.";
          } else {
            report += "\n- Pedagogy Check: Loop usage confirmed.";
          }
        } else if (strategy === 'function_logic') {
          const hasFunction = JSON.stringify(solution.structuredSolution).includes('procedures');
          if (!hasFunction) {
            report += "\n- WARNING: 'Function Logic' strategy selected, but optimal solution does not use functions.";
          } else {
            report += "\n- Pedagogy Check: Function usage confirmed.";
          }
        }
        // Path visualization is handled via questMetadata.solution.pathCoordinates -> solutionPath useMemo

        if (!options?.silent) alert(report);
        // ------------------------------
      } else {
        if (!options?.silent) alert("Validation Failed: Map is unsolvable. No path found to target.");
      }
    } catch (error) {
      alert(`Validation Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // --- HÀM MỚI: Xử lý đóng modal hướng dẫn ---
  const handleCloseWelcomeModal = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('showWelcomeModal', 'false');
    }
    setIsWelcomeModalVisible(false);
  };

  // --- HÀM MỚI: TẠO MAP MỚI ---
  const handleCreateNewMap = useCallback(() => {
    // Hỏi xác nhận trước khi xóa mọi thứ
    if (window.confirm('Are you sure you want to create a new map? All unsaved progress will be lost.')) {
      setHistory([[]]);
      setHistoryIndex(0);
      setQuestMetadata(null);
      setSelectedObjectIds([]);
      setCurrentMapFileName('untitled-quest.json');
      setEditedJson(''); // Xóa cả trình soạn thảo JSON
      setMapTheme(Themes.COMPREHENSIVE_THEMES[0]); // Reset theme về mặc định
      setSelectionStart(null);
      setSelectionEnd(null);
      // RESET user edit state
      setHasUserEdit(false);
      setDynamicPathCoords(null);
    }
  }, []); // Không có dependencies vì chỉ reset state
  const handleGenerateMap = (newObjects: PlacedObject[], metadataUpdate?: Record<string, any>) => {
    // Confirm if not empty
    // FIX: Redundant confirmation removed

    // RESET user edit state for generated map
    setHasUserEdit(false);
    setDynamicPathCoords(null);

    // FIX: Reset history to start fresh with ONLY the new generated objects
    // Previously, we pushed to history then set index to 0, which caused the scene to show empty state
    setHistory([newObjects]);
    setHistoryIndex(0);

    // Update metadata if provided
    if (metadataUpdate) {
      setQuestMetadata(prev => ({
        ...prev,
        ...metadataUpdate
      }));
      // Track strategy for validation
      if (metadataUpdate.strategy) {
        setLastUsedStrategy(metadataUpdate.strategy as PedagogyStrategy);
      }
    } else {
      // If not provided, maybe clear path info?
      // setQuestMetadata(prev => ({ ...prev, pathInfo: undefined, solution: undefined }));
    }

    console.log(`[handleGenerateMap] Set ${newObjects.length} objects to scene`);
  }


  // --- SUGGEST PLACEMENT LOGIC ---

  const handleSuggestPlacement = () => {
    if (!selectionBounds) {
      alert("Please select an area on the map first (Shift + Drag).");
      return;
    }

    if (!questMetadata?.pathInfo?.path_coords) {
      alert("No path information available. Please generate a map from Topology first.");
      return;
    }

    const pathCoords: Coord[] = questMetadata.pathInfo.path_coords;
    const { min, max } = selectionBounds;

    // Filter path coords within selection
    const selectedPath = pathCoords.filter(p =>
      p[0] >= min[0] && p[0] <= max[0] &&
      // p[1] is Y (elevation), usually 0 for path, but let's be inclusive or exact?
      // Let's assume selection covers Y.
      p[2] >= min[2] && p[2] <= max[2]
    );

    if (selectedPath.length === 0) {
      alert("No path segments found in the selected area.");
      return;
    }

    // Get Strategy/Difficulty
    const strategy = questMetadata.pathInfo.strategy || PedagogyStrategy.NONE;
    const difficulty = questMetadata.pathInfo.difficulty || 'simple';

    // Generate Suggestions
    const suggestedObjects = placementService.suggestPlacement(selectedPath, {
      strategy,
      difficulty,
      assetMap
    });

    if (suggestedObjects.length === 0) {
      alert("No suitable placement found for this area/strategy.");
      return;
    }

    // Add to map
    setPlacedObjectsWithHistory(prev => {
      // Filter out items that might overlap exactly (PlacementService checks its own, but we merge with existing)
      // PlacementService.suggestPlacement checks collision against its own 'objects' list during generation.
      // But here we need to check against TOTAL map.
      // Actually, PlacementService.isOccupied only checks the 'objects' accumulator.
      // It doesn't know about 'prev' (existing map objects).

      // So we should filter suggestions that collide with 'prev'.
      const validSuggestions = suggestedObjects.filter(newObj => {
        return !prev.some(existing =>
          existing.position[0] === newObj.position[0] &&
          existing.position[1] === newObj.position[1] &&
          existing.position[2] === newObj.position[2] &&
          (existing.asset.type === 'collectible' || existing.asset.type === 'interactible' || existing.asset.type === 'block')
        );
      });

      return [...prev, ...validSuggestions];
    });

    alert(`Added ${suggestedObjects.length} items to the selected segment.`);
  };

  // NEW REF: Keep track of metadata to use in effects without triggering re-runs
  const questMetadataRef = useRef(questMetadata);
  useEffect(() => {
    questMetadataRef.current = questMetadata;
  }, [questMetadata]);

  // AUTO-SOLVE EFFECT: Trigger solver when placedObjects change (Debounced)
  useEffect(() => {
    if (placedObjects.length === 0) return;

    // Only auto-solve if in Topology (Auto validation) mode or if we want it generally active
    // The user screenshot showed "Map Inspector Auto", so we should support it.

    // Use a timeout to debounce
    const timer = setTimeout(() => {
      // We call handleSolveMaze, but we need to ensure it uses the LATEST metadata from ref
      // However, handleSolveMaze as defined currently uses 'questMetadata' from closure/render scope.
      // If we call it here, it uses the 'questMetadata' captured when this effect was created?
      // No, 'handleSolveMaze' is a const function, recreated on render?
      // No, it's defined inside the component.

      // To be safe, let's call it. Since 'solutionPath' update is crucial.
      // But to avoid 'questMetadata' dependency loop, we should probably refactor handleSolveMaze 
      // OR just acknowledge that if questMetadata changes, handleSolveMaze changes, and effect re-runs?
      // IF we add handleSolveMaze to deps.

      // Let's try calling it.
      handleSolveMaze({ silent: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [placedObjects]); // Only trigger on map content changes

  // NEW: Real-time path calculation effect
  useEffect(() => {
    if (!hasUserEdit) return; // Only verify path if user has edited the map

    // Debounce slightly to avoid too many calcs during drag
    const timer = setTimeout(() => {
      // Find start and target
      const startObj = placedObjects.find(o => o.asset.key === 'player_start');
      const targetObj = placedObjects.find(o => o.asset.key === 'finish');

      if (!startObj || !targetObj) {
        // If start/finish are missing, we explicitly return empty path to clear any stale solution
        setDynamicPathCoords([]);
        return;
      }

      // --- INTEGRATION: USE REAL GAME SOLVER (A*) TO FIND PATH ---
      // This ensures we find a path that visits all required items (collectibles/switches)
      // and updates automatically when map changes.

      // 1. Build GameConfig
      const gameConfig = {
        blocks: placedObjects.filter(o => o.asset.type === 'block' || o.asset.key.includes('ground')).map(b => ({
          position: { x: b.position[0], y: b.position[1], z: b.position[2] },
          modelKey: b.asset.key
        })),
        players: [{
          start: {
            x: startObj.position[0],
            y: startObj.position[1],
            z: startObj.position[2],
            // FIX: Read direction from properties.direction (same as handleSolveMaze)
            direction: typeof startObj.properties?.direction === 'number'
              ? Math.round(startObj.properties.direction) % 4
              : (typeof startObj.properties?.direction === 'string'
                ? Math.round(parseFloat(startObj.properties.direction)) % 4
                : 1) // Default: 1 (North/+Z based on current convention)
          }
        }],
        finish: { x: targetObj.position[0], y: targetObj.position[1], z: targetObj.position[2] },
        collectibles: placedObjects.filter(o => o.asset.type === 'collectible' || o.asset.key.includes('crystal') || o.asset.key.includes('key')).map(c => ({
          position: { x: c.position[0], y: c.position[1], z: c.position[2] },
          id: c.id,
          type: c.asset.key // Use asset key as type for simplicity
        })),
        interactibles: placedObjects.filter(o => o.asset.type === 'interactible' || o.asset.key.includes('switch')).map(i => ({
          position: { x: i.position[0], y: i.position[1], z: i.position[2] }, // Switches are on ground?
          id: i.id,
          type: 'switch',
          initialState: 'off' as 'off' // Default state
        }))
      };

      // 2. Build SolutionConfig (Compute item goals based on what is placed)
      const itemGoals: Record<string, any> = {};
      const collectibleTypes = new Set(gameConfig.collectibles?.map(c => c.type));
      collectibleTypes.forEach(type => {
        // Require collecting ALL placed items of this type
        itemGoals[type] = 'all';
      });
      if (gameConfig.interactibles && gameConfig.interactibles.length > 0) {
        itemGoals['switch'] = 'all';
      }

      const solutionConfig = {
        itemGoals,
        rawActions: [],
        structuredSolution: { main: [] }
      };

      // 3. Call Solver
      try {
        // Pass minimal blockly config if needed, or let solver use defaults
        const result = solveMaze(gameConfig, solutionConfig);

        if (result && result.pathCoordinates && result.pathCoordinates.length > 0) {
          // 4. Update Dynamic Path
          // IMPORTANT: Solver returns ground/item coordinates.
          // We need to shift Y + 1 to visualise ON TOP of blocks.
          // Also deduplicate if solver returns same pos multiple times (e.g. for turns/actions)
          // though visualization might assume point-to-point.

          const path = result.pathCoordinates.map(p => [p.x, p.y, p.z] as [number, number, number]);
          setDynamicPathCoords(path);
        } else {
          setDynamicPathCoords([]);
        }
      } catch (e) {
        console.error("Auto-solver failed:", e);
        setDynamicPathCoords([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [placedObjects]);

  const solutionPath = useMemo(() => {
    // PRIORITY 1: If user has edited the map, use real-time BFS result
    // This ensures when user breaks the path, we show no path (empty [])
    if (hasUserEdit && dynamicPathCoords !== null) {
      return dynamicPathCoords; // May be [] if no valid path
    }

    // PRIORITY 2: Pre-defined solution from Smart Solver
    if (questMetadata?.solution?.pathCoordinates) {
      return questMetadata.solution.pathCoordinates.map((p: any) => [p.x, p.y, p.z] as [number, number, number]);
    }

    // PRIORITY 3: Real-time calculated path (when no user edit yet)
    if (dynamicPathCoords !== null) return dynamicPathCoords;

    // PRIORITY 4: Topology Path (from generation)
    if (questMetadata?.pathInfo?.path_coords) {
      return questMetadata.pathInfo.path_coords as [number, number, number][];
    }
    return undefined;
  }, [hasUserEdit, questMetadata?.solution, questMetadata?.pathInfo, dynamicPathCoords]);

  // Compute selectable elements from pathInfo
  const selectableElements = useMemo((): SelectableElement[] => {
    if (!questMetadata?.pathInfo) return [];

    try {
      const pathInfo = questMetadata.pathInfo;
      const context = MapAnalyzer.fromTopology({
        start_pos: pathInfo.start_pos,
        target_pos: pathInfo.target_pos,
        path_coords: pathInfo.path_coords,
        placement_coords: pathInfo.placement_coords || [],
        metadata: pathInfo.metadata || {}
      });
      return context.selectableElements;
    } catch (e) {
      console.error('Failed to compute selectable elements:', e);
      return [];
    }
  }, [questMetadata?.pathInfo]);

  // Handle applying template placements
  const handleApplyTemplatePlacements = useCallback((placements: TemplateItemPlacement[]) => {
    if (placements.length === 0) return;

    const newObjects: PlacedObject[] = [];

    for (const placement of placements) {
      const assetKey = placement.type;
      const asset = assetMap.get(assetKey);

      if (asset) {
        newObjects.push({
          id: uuidv4(),
          asset,
          position: [placement.position[0], placement.position[1], placement.position[2]],
          rotation: [0, 0, 0],
          properties: {}
        });
      }
    }

    if (newObjects.length > 0) {
      setPlacedObjectsWithHistory(prev => {
        // Filter out existing collectibles at same positions to avoid duplicates
        const existingPositions = new Set(
          newObjects.map(o => `${o.position[0]},${o.position[1]},${o.position[2]}`)
        );
        const filtered = prev.filter(o =>
          o.asset.type !== 'collectible' ||
          !existingPositions.has(`${o.position[0]},${o.position[1]},${o.position[2]}`)
        );
        return [...filtered, ...newObjects];
      });
      alert(`Applied ${newObjects.length} items from template.`);
    }
  }, [assetMap]);

  // Handle applying guided placement selections
  const handleApplyGuidedPlacement = useCallback((selections: Array<{ elementId: string; itemType: 'crystal' | 'switch'; symmetric?: boolean }>) => {
    if (selections.length === 0) {
      alert('Please select at least one segment to place items.');
      return;
    }

    const newObjects: PlacedObject[] = [];
    const elementsMap = new Map(selectableElements.map(e => [e.id, e]));

    // Find selected pattern if any
    const selectedPattern = selectedPatternId
      ? SEGMENT_PATTERNS.find(p => p.id === selectedPatternId)
      : null;

    for (const selection of selections) {
      const element = elementsMap.get(selection.elementId);
      if (!element) continue;

      if (element.type === 'segment' && element.segment && selectedPattern) {
        // Use pattern-based placement
        const placements = applySegmentPattern(selectedPattern, element.segment);

        for (const placement of placements) {
          const assetKey = placement.type;
          const asset = assetMap.get(assetKey);
          if (asset) {
            newObjects.push({
              id: uuidv4(),
              asset,
              position: [placement.position[0], placement.position[1] + 1, placement.position[2]],
              rotation: [0, 0, 0],
              properties: {}
            });
          }
        }
      } else {
        // Fallback to simple placement (single item at center or for keypoints/positions)
        const assetKey = selection.itemType;
        const asset = assetMap.get(assetKey);
        if (!asset) continue;

        let positions: Coord[] = [];

        if (element.type === 'keypoint' || element.type === 'position') {
          if (element.position) {
            positions.push(element.position);
          }
        } else if (element.type === 'segment' && element.segment) {
          // No pattern selected - place single item at center
          const centerIdx = Math.floor(element.segment.length / 2);
          if (centerIdx > 0 && centerIdx < element.segment.length) {
            positions.push(element.segment[centerIdx]);
          }
        }

        for (const pos of positions) {
          newObjects.push({
            id: uuidv4(),
            asset,
            position: [pos[0], pos[1] + 1, pos[2]],
            rotation: [0, 0, 0],
            properties: {}
          });
        }
      }

      // Handle symmetric placement if requested
      if (selection.symmetric && element.relationships.mirrorOf) {
        const mirrorElement = elementsMap.get(element.relationships.mirrorOf);
        if (mirrorElement && mirrorElement.segment && selectedPattern) {
          const mirrorPlacements = applySegmentPattern(selectedPattern, mirrorElement.segment);
          for (const placement of mirrorPlacements) {
            const asset = assetMap.get(placement.type);
            if (asset) {
              newObjects.push({
                id: uuidv4(),
                asset,
                position: [placement.position[0], placement.position[1] + 1, placement.position[2]],
                rotation: [0, 0, 0],
                properties: {}
              });
            }
          }
        }
      }
    }

    if (newObjects.length > 0) {
      // Deduplicate by position
      const seenPositions = new Set<string>();
      const uniqueObjects = newObjects.filter(obj => {
        const key = `${obj.position[0]},${obj.position[1]},${obj.position[2]}`;
        if (seenPositions.has(key)) return false;
        seenPositions.add(key);
        return true;
      });

      setPlacedObjectsWithHistory(prev => {
        const existingPositions = new Set(
          uniqueObjects.map(o => `${o.position[0]},${o.position[1]},${o.position[2]}`)
        );
        const filtered = prev.filter(o =>
          o.asset.type !== 'collectible' ||
          !existingPositions.has(`${o.position[0]},${o.position[1]},${o.position[2]}`)
        );
        return [...filtered, ...uniqueObjects];
      });

      const patternName = selectedPattern ? ` using "${selectedPattern.name}"` : '';
      alert(`Placed ${uniqueObjects.length} items${patternName}.`);
    } else {
      alert('No valid positions found for selected elements.');
    }
  }, [assetMap, selectableElements, selectedPatternId]);

  // Handle applying items based on strategy and item goals
  const handleApplyItems = useCallback(() => {
    const pathInfo = questMetadata?.pathInfo;
    if (!pathInfo?.path_coords || pathInfo.path_coords.length === 0) {
      alert('⚠️ No path data available. Generate ground from the Topology tab first.');
      return;
    }

    // Use placement_coords (ground level) for item placement, fallback to path_coords
    // placement_coords has Y=0 (ground), path_coords may have Y=1 (on top)
    const placementCoords: Coord[] = pathInfo.placement_coords?.length > 0
      ? pathInfo.placement_coords
      : pathInfo.path_coords;

    const suggestedObjects: PlacedObject[] = [];

    // Build list of excluded positions based on checkbox settings
    // Use Y from path_coords for comparison since start/end positions match path_coords Y
    const startPos = pathInfo.start_pos;
    const targetPos = pathInfo.target_pos;
    const excludedPositions = new Set<string>();

    // Exclude at ground level (X, *, Z) regardless of Y
    if (excludeStartPos) {
      excludedPositions.add(`${startPos[0]},${startPos[2]}`); // XZ only
    }
    if (excludeEndPos) {
      excludedPositions.add(`${targetPos[0]},${targetPos[2]}`); // XZ only
    }

    // Filter available positions (excluding based on XZ settings)
    const availablePositions = placementCoords.filter(coord =>
      !excludedPositions.has(`${coord[0]},${coord[2]}`)
    );

    // Use PlacementService to get items based on strategy
    // When constraints enabled, pass the counts so service can place optimally
    // Use availablePositions (already filtered by exclude settings) instead of pathCoords
    // Pass precomputed segments from Map Analysis if available
    const precomputedSegments = pathInfo.metadata?.segments as Coord[][] | undefined;
    console.log('[handleApplyItems] Metadata segments:', precomputedSegments?.length || 'none');

    const serviceResult = placementService.suggestPlacement(availablePositions, {
      strategy: placementStrategy,
      difficulty: placementDifficulty,
      assetMap,
      constraintCounts: constraintsEnabled ? itemGoals : undefined,
      precomputedSegments: precomputedSegments
    });

    if (constraintsEnabled) {
      // Service already placed optimal items based on constraints
      suggestedObjects.push(...serviceResult);
    } else {
      // === NO CONSTRAINTS: Use all items from PlacementService ===
      suggestedObjects.push(...serviceResult);
    }

    if (suggestedObjects.length === 0) {
      alert('⚠️ No items could be placed. Try adjusting the item goals or enabling constraints.');
      return;
    }

    // Remove existing collectibles and add new ones
    setPlacedObjectsWithHistory(prev => {
      const groundOnly = prev.filter(o =>
        o.asset.type === 'block' ||
        o.asset.key === 'player_start' ||
        o.asset.key === 'finish'
      );
      return [...groundOnly, ...suggestedObjects];
    });

    // Update metadata with strategy
    setQuestMetadata(prev => ({
      ...prev,
      pathInfo: {
        ...prev?.pathInfo,
        strategy: placementStrategy
      }
    }));
    setLastUsedStrategy(placementStrategy);

    alert(`✅ Applied ${suggestedObjects.length} items${constraintsEnabled ? ' with constraints' : ' (random)'}.`);
  }, [questMetadata, placementStrategy, placementDifficulty, itemGoals, assetMap, placementService, constraintsEnabled, excludeStartPos, excludeEndPos]);

  // Handle applying items from PlacementVariants (AcademicPlacement)
  const handleApplyVariant = useCallback((items: ItemPlacement[], suggestedToolbox?: string) => {
    console.log('[handleApplyVariant] Called with items:', items);
    console.log('[handleApplyVariant] AssetMap keys:', Array.from(assetMap.keys()));
    console.log('[handleApplyVariant] Suggested toolbox:', suggestedToolbox);

    if (items.length === 0) {
      alert('⚠️ This variant has no items to place.');
      return;
    }

    // Auto-update toolbox preset if suggested (Option B)
    if (suggestedToolbox) {
      setQuestMetadata(prev => ({
        ...prev,
        blockly: {
          ...prev?.blockly,
          toolboxPreset: suggestedToolbox
        }
      }));
      console.log(`[handleApplyVariant] Auto-set toolbox preset to: ${suggestedToolbox}`);
    }

    const newObjects: PlacedObject[] = [];

    for (const item of items) {
      const assetKey = item.type;
      const asset = assetMap.get(assetKey);
      console.log(`[handleApplyVariant] Looking for "${assetKey}", found:`, asset?.key);

      if (asset) {
        // Items should be placed on top of ground (Y+1)
        const itemY = item.position.y === 0 ? 1 : item.position.y;
        newObjects.push({
          id: uuidv4(),
          asset,
          position: [item.position.x, itemY, item.position.z],
          rotation: [0, 0, 0],
          properties: {}
        });
      } else {
        console.warn(`Asset not found for item type: ${assetKey}`);
      }
    }

    console.log('[handleApplyVariant] Created newObjects:', newObjects.length);
    if (newObjects.length > 0) {
      // Keep ground blocks (blocks, player_start, finish) and replace only collectibles/items
      setPlacedObjectsWithHistory(prev => {
        // Debug: log all asset types before filtering
        console.log('[handleApplyVariant] Objects before filtering:', prev.map(o => ({
          key: o.asset.key,
          type: o.asset.type,
          name: o.asset.name
        })));

        const groundAndStructure = prev.filter(o => {
          // Keep all blocks (ground, wall, etc.)
          if (o.asset.type === 'block') return true;
          // Keep special items (player_start, finish, etc.)
          if (o.asset.type === 'special') return true;
          // Keep player start and finish markers by key (backup)
          if (o.asset.key === 'player_start' || o.asset.key === 'finish') return true;
          // Keep anything with 'ground' or 'wall' in key
          if (o.asset.key?.includes('ground') || o.asset.key?.includes('wall')) return true;
          // Remove collectibles/interactibles (crystal, gem, switch, star, etc.)
          return false;
        });

        console.log(`[handleApplyVariant] Keeping ${groundAndStructure.length} ground objects out of ${prev.length}, adding ${newObjects.length} items`);
        console.log('[handleApplyVariant] Kept objects:', groundAndStructure.map(o => o.asset.key));

        return [...groundAndStructure, ...newObjects];
      });
      alert(`✅ Applied ${newObjects.length} items from selected variant.`);
    } else {
      alert('⚠️ No items could be created from this variant. Check asset availability.');
    }
  }, [assetMap, setPlacedObjectsWithHistory]);

  // Handle suggest toolbox from PlacementVariants (Option A)
  const handleSuggestToolbox = useCallback((presetKey: string) => {
    const confirmChange = window.confirm(
      `Do you want to change the toolbox preset to "${presetKey.replace(/_/g, ' ')}"?\n\n` +
      `This will update the Blockly toolbox to include the required blocks for the selected variant.`
    );

    if (confirmChange) {
      setQuestMetadata(prev => ({
        ...prev,
        blockly: {
          ...prev?.blockly,
          toolboxPreset: presetKey
        }
      }));
      alert(`✅ Toolbox preset updated to: ${presetKey.replace(/_/g, ' ')}`);
    }
  }, []);

  return (
    <div className="app-container">

      {showLeftSidebar && (
        <div className="left-sidebar-container" style={{ width: '300px', display: 'flex', flexDirection: 'column', background: '#2a2a2e', borderRight: '1px solid #3c3c41' }}>
          <div className="sidebar-tabs" style={{ display: 'flex', borderBottom: '1px solid #3c3c41' }}>

            <button
              style={{ flex: 1, padding: '10px', background: activeSidePanel === 'topology' ? '#3c3c41' : '#2a2a2e', color: activeSidePanel === 'topology' ? '#fff' : '#888', border: 'none', cursor: 'pointer', fontWeight: activeSidePanel === 'topology' ? 'bold' : 'normal', transition: 'all 0.2s' }}
              onClick={() => setActiveSidePanel('topology')}
            >
              Topology
            </button>
            <button
              style={{ flex: 1, padding: '10px', background: activeSidePanel === 'placement' ? '#3c3c41' : '#2a2a2e', color: activeSidePanel === 'placement' ? '#fff' : '#888', border: 'none', cursor: 'pointer', fontWeight: activeSidePanel === 'placement' ? 'bold' : 'normal', transition: 'all 0.2s' }}
              onClick={() => setActiveSidePanel('placement')}
            >
              Placement
            </button>
            <button
              style={{ flex: 1, padding: '10px', background: activeSidePanel === 'template' ? '#3c3c41' : '#2a2a2e', color: activeSidePanel === 'template' ? '#fff' : '#888', border: 'none', cursor: 'pointer', fontWeight: activeSidePanel === 'template' ? 'bold' : 'normal', transition: 'all 0.2s' }}
              onClick={() => setActiveSidePanel('template')}
            >
              Template
            </button>
          </div>


          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeSidePanel === 'topology' && (
              <TopologyPanel
                onGenerate={handleGenerateMap}
                assetMap={assetMap}
                pathInfo={questMetadata?.pathInfo || null}
                onHighlightChange={setTopologyHighlights}
                boxDimensions={boxDimensions}
                placedObjects={placedObjects}
              />
            )}
            {activeSidePanel === 'placement' && (
              /* Placement Panel - Item Placement Controls with Sub-tabs */
              <div className="placement-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Sub-tabs for Guided vs Auto */}
                <div style={{ display: 'flex', borderBottom: '1px solid #3c3c41', marginBottom: '12px' }}>
                  <button
                    onClick={() => setPlacementSubTab('guided')}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: placementSubTab === 'guided' ? '#3c3c41' : 'transparent',
                      color: placementSubTab === 'guided' ? '#fff' : '#888',
                      border: 'none',
                      borderBottom: placementSubTab === 'guided' ? '2px solid #6366f1' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: placementSubTab === 'guided' ? 'bold' : 'normal',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🎯 Guided
                  </button>
                  <button
                    onClick={() => setPlacementSubTab('auto')}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: placementSubTab === 'auto' ? '#3c3c41' : 'transparent',
                      color: placementSubTab === 'auto' ? '#fff' : '#888',
                      border: 'none',
                      borderBottom: placementSubTab === 'auto' ? '2px solid #22c55e' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: placementSubTab === 'auto' ? 'bold' : 'normal',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🤖 Auto
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px' }}>
                  {/* ===== GUIDED TAB ===== */}
                  {placementSubTab === 'guided' && (
                    <>
                      {selectableElements.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#888', padding: '20px', fontSize: '13px' }}>
                          <p>⚠️ No path data available.</p>
                          <p>Generate ground from the <strong>Topology</strong> tab first.</p>
                        </div>
                      ) : (
                        <>
                          {/* Step 1: Select Pattern */}
                          <PatternSelector
                            segmentLength={
                              selectableElements
                                .filter(e => e.type === 'segment')
                                .reduce((max, e) => Math.max(max, e.segment?.length || 0), 3)
                            }
                            selectedPatternId={selectedPatternId}
                            onPatternSelect={(pattern) => setSelectedPatternId(pattern?.id || null)}
                          />

                          {/* Step 2: Select Segments */}
                          <PlacementSelector
                            elements={selectableElements}
                            onSelectionsChange={setPlacementSelections}
                            onApplyPlacement={handleApplyGuidedPlacement}
                            initialSelections={placementSelections}
                          />

                          <div style={{ height: '16px' }} />

                          {/* Templates (collapsed by default) */}
                          <TemplateManager
                            topologyType={questMetadata?.pathInfo?.metadata?.topology_type || 'unknown'}
                            selectableElements={selectableElements}
                            currentSelections={placementSelections}
                            onApplyTemplate={handleApplyTemplatePlacements}
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* ===== AUTO TAB ===== */}
                  {placementSubTab === 'auto' && (
                    <>
                      {/* Mode Selector */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button
                          onClick={() => setAutoPlacementMode('random')}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: autoPlacementMode === 'random' ? '#3b82f6' : '#3c3c41',
                            color: autoPlacementMode === 'random' ? '#fff' : '#aaa',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: autoPlacementMode === 'random' ? 'bold' : 'normal',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          🎲 Random
                        </button>
                        <button
                          onClick={() => setAutoPlacementMode('academic')}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: autoPlacementMode === 'academic' ? '#22c55e' : '#3c3c41',
                            color: autoPlacementMode === 'academic' ? '#fff' : '#aaa',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: autoPlacementMode === 'academic' ? 'bold' : 'normal',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          🧠 Academic
                        </button>
                      </div>

                      {/* ===== RANDOM MODE ===== */}
                      {autoPlacementMode === 'random' && (
                        <div className="random-mode">
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.5 }}>
                            Place items on path with optional pedagogy strategy and quantity constraints.
                          </p>

                          {/* Strategy Section */}
                          <div className="placement-section" style={{ marginBottom: '12px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '13px' }}>🎯 Strategy (Pedagogy)</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select
                                value={placementStrategy}
                                onChange={e => setPlacementStrategy(e.target.value as PedagogyStrategy)}
                                style={{ flex: 1, padding: '6px 8px', background: '#3c3c41', border: '1px solid #555', borderRadius: '4px', color: '#fff' }}
                              >
                                <option value={PedagogyStrategy.NONE}>None (Random)</option>
                                <option value={PedagogyStrategy.LOOP_LOGIC}>Loop Logic</option>
                                <option value={PedagogyStrategy.FUNCTION_LOGIC}>Function Logic</option>
                                <option value={PedagogyStrategy.WHILE_LOOP_DECREASING}>While Loop</option>
                                <option value={PedagogyStrategy.CONDITIONAL_BRANCHING}>Conditional</option>
                                <option value={PedagogyStrategy.NESTED_LOOPS}>Nested Loops</option>
                                <option value={PedagogyStrategy.PATTERN_RECOGNITION}>Pattern</option>
                              </select>
                              <select
                                value={placementDifficulty}
                                onChange={e => setPlacementDifficulty(e.target.value as any)}
                                style={{ padding: '6px 8px', background: '#3c3c41', border: '1px solid #555', borderRadius: '4px', color: '#fff' }}
                              >
                                <option value="intro">Intro</option>
                                <option value="simple">Simple</option>
                                <option value="complex">Complex</option>
                              </select>
                            </div>
                          </div>

                          {/* Constraints Toggle */}
                          <div className="placement-section" style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <h4 style={{ margin: 0, color: '#fff', fontSize: '13px' }}>📋 Constraints</h4>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={constraintsEnabled}
                                  onChange={() => setConstraintsEnabled(!constraintsEnabled)}
                                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                />
                                <span style={{ fontSize: '12px', color: constraintsEnabled ? '#3b82f6' : '#888' }}>
                                  {constraintsEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </label>
                            </div>

                            {/* Item Goals - Only shown when constraints enabled */}
                            <div style={{
                              opacity: constraintsEnabled ? 1 : 0.5,
                              pointerEvents: constraintsEnabled ? 'auto' : 'none',
                              transition: 'opacity 0.2s'
                            }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#aaa' }}>💎 Crystals</span>
                                  <input
                                    type="number"
                                    value={itemGoals.crystals}
                                    onChange={e => setItemGoals(prev => ({ ...prev, crystals: parseInt(e.target.value) || 0 }))}
                                    min={0} max={20}
                                    style={{ padding: '6px', background: '#3c3c41', border: '1px solid #555', borderRadius: '4px', color: '#fff', width: '100%' }}
                                  />
                                </label>
                                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#aaa' }}>🔘 Switches</span>
                                  <input
                                    type="number"
                                    value={itemGoals.switches}
                                    onChange={e => setItemGoals(prev => ({ ...prev, switches: parseInt(e.target.value) || 0 }))}
                                    min={0} max={10}
                                    style={{ padding: '6px', background: '#3c3c41', border: '1px solid #555', borderRadius: '4px', color: '#fff', width: '100%' }}
                                  />
                                </label>
                              </div>

                              {/* Position Exclusion Checkboxes */}
                              <div style={{ display: 'flex', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={excludeStartPos}
                                    onChange={() => setExcludeStartPos(!excludeStartPos)}
                                    style={{ width: '14px', height: '14px', accentColor: '#f97316' }}
                                  />
                                  <span style={{ fontSize: '12px', color: excludeStartPos ? '#f97316' : '#888' }}>
                                    🚫 Exclude Start
                                  </span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={excludeEndPos}
                                    onChange={() => setExcludeEndPos(!excludeEndPos)}
                                    style={{ width: '14px', height: '14px', accentColor: '#f97316' }}
                                  />
                                  <span style={{ fontSize: '12px', color: excludeEndPos ? '#f97316' : '#888' }}>
                                    🚫 Exclude End
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Apply Random Button */}
                          <button
                            onClick={handleApplyItems}
                            disabled={!questMetadata?.pathInfo?.path_coords}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              background: !questMetadata?.pathInfo?.path_coords ? '#555' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              cursor: !questMetadata?.pathInfo?.path_coords ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                          >
                            🎲 Apply Random Placement
                          </button>
                        </div>
                      )}

                      {/* ===== ACADEMIC MODE ===== */}
                      {autoPlacementMode === 'academic' && (
                        <div className="academic-mode">
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.5 }}>
                            Generate placements based on academic concepts (loops, conditionals, functions, etc.) with varying difficulty levels.
                          </p>

                          {/* Placement Variants - AI Generated Options */}
                          <PlacementVariants
                            pathInfo={questMetadata?.pathInfo || null}
                            onApplyPlacement={handleApplyVariant}
                            currentToolboxPreset={questMetadata?.blockly?.toolboxPreset || ''}
                            onSuggestToolbox={handleSuggestToolbox}
                          />
                        </div>
                      )}

                      {!questMetadata?.pathInfo?.path_coords && (
                        <div style={{ textAlign: 'center', color: '#888', padding: '20px', fontSize: '13px' }}>
                          <p>⚠️ No path data available.</p>
                          <p>Generate ground from the <strong>Topology</strong> tab first.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            {activeSidePanel === 'template' && (
              <TemplatePanel
                onGenerate={(data) => {
                  console.log('=== Template Generation Debug ===');
                  console.log('Input blocks:', data.blocks.length, 'items:', data.items.length);

                  // Convert template output to PlacedObject format
                  const newObjects: PlacedObject[] = [];

                  // Add blocks (ground layer)
                  // Note: buildGroundBlocks already sets y=0, no need to subtract
                  data.blocks.forEach((block) => {
                    const asset = assetMap.get('ground.normal') ||
                      assetMap.get('ground.checker') ||
                      buildableAssetGroups.find(g => g.name === 'Ground')?.items[0];

                    if (asset) {
                      newObjects.push({
                        id: uuidv4(),
                        asset,
                        position: [block.x, block.y, block.z] as [number, number, number], // Already y=0
                        rotation: [0, 0, 0] as [number, number, number],
                        properties: {}
                      });
                    }
                  });

                  // Add items (crystals, keys, switches)
                  // Items in trace are at y=1 (path level), need to be at y=1 (on top of ground at y=0)
                  data.items.forEach((item) => {
                    const assetKey = item.type === 'crystal' ? 'crystal' : item.type === 'key' ? 'key' : 'switch';
                    const asset = assetMap.get(assetKey);
                    if (asset) {
                      newObjects.push({
                        id: uuidv4(),
                        asset,
                        // Items should be at y=1 (on ground surface which is at y=0)
                        position: [item.position.x, item.position.y, item.position.z] as [number, number, number],
                        rotation: [0, 0, 0] as [number, number, number],
                        properties: { type: item.type }
                      });
                    }
                  });

                  // Add player start
                  const playerAsset = assetMap.get('player_start');
                  if (playerAsset) {
                    newObjects.push({
                      id: 'player_start',
                      asset: playerAsset,
                      position: [data.playerStart.x, data.playerStart.y, data.playerStart.z] as [number, number, number],
                      rotation: [0, (data.playerStart.direction || 0) * Math.PI / 2, 0] as [number, number, number],
                      properties: { type: 'player_start', direction: data.playerStart.direction }
                    });
                  }

                  // Add finish
                  const finishAsset = assetMap.get('finish');
                  if (finishAsset) {
                    newObjects.push({
                      id: 'finish',
                      asset: finishAsset,
                      position: [data.finish.x, data.finish.y, data.finish.z] as [number, number, number],
                      rotation: [0, 0, 0] as [number, number, number],
                      properties: { type: 'finish' }
                    });
                  }

                  console.log('Created PlacedObjects:', newObjects.length);
                  console.log('First object:', JSON.stringify(newObjects[0], null, 2));
                  console.log('[Template Debug] All data.items:', data.items.map(i => ({ type: i.type, pos: i.position })));

                  // Use path coordinates from trace (path level) for visualization
                  // Also include placement_coords (ground level blocks) for item placement

                  // AUTO-SELECT TOOLBOX based on template tags
                  const suggestedToolboxKey = data.templateMeta
                    ? getToolboxFromTemplateTags(
                      data.templateMeta.tags,
                      data.templateMeta.concepts,
                      data.templateMeta.category
                    )
                    : 'full_toolbox';

                  // AUTO-FORCE RANDOM MODE for sensing/logic tasks
                  // This prevents hardcoding solutions by hiding items
                  const forceRandomMode = data.templateMeta
                    ? shouldForceRandomMode(
                      data.templateMeta.tags,
                      data.templateMeta.concepts,
                      data.templateMeta.category
                    )
                    : false;

                  const newGameConfig = { ...data.gameConfig };

                  if (forceRandomMode) {
                    console.log('[Template] Auto-enforcing Random Mode for sensing task');
                    newGameConfig.mode = 'random';

                    // Count total collectibles for pool size
                    const totalCrystals = data.items.filter(i => i.type === 'crystal').length;
                    const totalSwitches = data.items.filter(i => i.type === 'switch').length;

                    // Set pool to ensure high randomness (e.g. at least 1, max total)
                    newGameConfig.itemPool = {
                      ...newGameConfig.itemPool,
                      crystal: totalCrystals > 0 ? totalCrystals : undefined
                    };
                  }

                  // Extract interactibles (switches) from generated items
                  const generatedInteractibles = data.items
                    .filter(i => i.type === 'switch')
                    .map((sw, idx) => ({
                      id: `switch_${idx}`,
                      type: 'switch' as const,
                      position: { x: sw.position.x, y: sw.position.y, z: sw.position.z },
                      initialState: 'off' as const // Default state for generated switches
                    }));

                  // Add interactibles to gameConfig
                  if (generatedInteractibles.length > 0) {
                    newGameConfig.interactibles = generatedInteractibles;
                    console.log('[Template] Generated interactibles:', generatedInteractibles.length);
                  }

                  console.log('[Template] Auto-selected toolbox:', suggestedToolboxKey, 'from tags:', data.templateMeta?.tags);

                  const metadataUpdate: Record<string, any> = {
                    rawSolution: data.rawActions,
                    solution: data.solutionConfig, // Store initial solution with ItemGoals
                    structuredSolution: data.solutionConfig?.structuredSolution, // Transpiled solution for optimal display
                    gameConfig: newGameConfig, // Apply random mode if needed
                    pathInfo: {
                      path_coords: data.pathCoords, // Path level coordinates from trace
                      placement_coords: data.blocks.map(b => [b.x, b.y, b.z] as [number, number, number]), // Ground blocks
                      start_pos: [data.playerStart.x, data.playerStart.y, data.playerStart.z] as [number, number, number],
                      target_pos: [data.finish.x, data.finish.y, data.finish.z] as [number, number, number],
                      topology: 'template_generated',
                      params: {}
                    },
                    // Auto-set blocklyConfig with suggested toolbox
                    blocklyConfig: {
                      toolboxPresetKey: suggestedToolboxKey,
                      toolbox: toolboxPresets[suggestedToolboxKey]
                    }
                  };

                  // Call handleGenerateMap which properly manages history
                  handleGenerateMap(newObjects, metadataUpdate);
                }}
                hasExistingMap={placedObjects.length > 0}
              />
            )}
          </div>
        </div>
      )}

      <div className="builder-scene-wrapper">
        {/* Sidebar Toggles */}
        <button
          className="toggle-sidebar-btn left"
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          title={showLeftSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {showLeftSidebar ? '‹' : '›'}
        </button>
        <button
          className="toggle-sidebar-btn right"
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          title={showRightSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {showRightSidebar ? '›' : '‹'}
        </button>

        {/* Center Toolbar - Floating controls over 3D scene */}
        <CenterToolbar
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          smartSnapEnabled={smartSnapEnabled}
          onToggleSmartSnap={() => setSmartSnapEnabled(prev => !prev)}
          mapTheme={mapTheme}
          onThemeChange={handleThemeChange}
          availableThemes={Themes.COMPREHENSIVE_THEMES}
          symmetryEnabled={symmetryEnabled}
          onSymmetryToggle={setSymmetryEnabled}
          symmetryAxis={symmetryAxis}
          onSymmetryAxisChange={setSymmetryAxis}
          symmetryCenter={symmetryCenter}
          onSymmetryCenterChange={setSymmetryCenter}
          gridWidth={boxDimensions.width}
          gridDepth={boxDimensions.depth}
        />



        {/* Viewport Toolbar - Mode & Tool switching */}
        {/* Viewport Toolbar - Mode & Tool switching */}
        <MainLeftPanel
          activeMode={builderMode}
          onModeChange={handleModeChange}
          selectionMode={selectionMode}
          onSelectionModeChange={handleSelectionModeChange}
          hasSelection={selectedObjectIds.length > 0}
          selectionCount={selectedObjectIds.length}
          onCleanMap={handleCleanMap}
          onCenterMap={handleCenterMap}
          onClearItems={handleClearItems}
          assetGroups={buildableAssetGroups}
          selectedAssetKey={selectedAsset?.key || null}
          onSelectAsset={handleSelectAsset}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
        <MapInspector
          placedObjects={placedObjects}
          pathInfo={questMetadata?.pathInfo}
          solutionPath={solutionPath}
          strategy={lastUsedStrategy}
          mode={activeSidePanel === 'topology' ? 'auto' : 'manual'}
        />
        {/* Solution Debug Panel - shows planned solution */}
        <SolutionDebugPanel plannedSolution={questMetadata?.plannedSolution} />
        {/* BUTTON SUGGEST PLACEMENT */}
        {selectionStart && selectionEnd && (
          <button
            onClick={handleSuggestPlacement}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '220px', // Next to Inspector (Adjusted for MainLeftPanel width)
              zIndex: 1000,
              padding: '10px 20px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}
          >
            Suggest Placement
          </button>
        )}
        <ViewControls
          onViewChange={handleViewChange}
          boxDimensions={boxDimensions}
          onDimensionsChange={handleDimensionsChange}
        />
        <BuilderScene
          ref={sceneRef}
          builderMode={builderMode}
          selectedAsset={selectedAsset}
          placedObjects={placedObjects}
          boxDimensions={boxDimensions}
          onModeChange={handleModeChange}
          onAddObject={handleAddObject}
          onRemoveObject={handleRemoveObject}
          selectionBounds={selectionBounds}
          selectionStart={selectionStart} // THÊM MỚI: Truyền prop selectionStart
          onSetSelectionStart={setSelectionStart}
          onSetSelectionEnd={setSelectionEnd}
          selectedObjectIds={selectedObjectIds}
          onMoveObject={handleMoveObjectToPosition}
          onMoveObjectsBatch={handleMoveObjectsBatch}
          onMoveObjectByStep={(objectId, dir, amt) => handleMoveObject([objectId], dir, amt)}
          onSelectObject={handleSelectObject} // THAY ĐỔI: Sử dụng hàm xử lý mới
          onSelectMultipleObjects={handleSelectMultipleObjects}
          isMovingObject={isMovingObject} // THÊM MỚI: Truyền trạng thái di chuyển xuống
          onSetIsMovingObject={setIsMovingObject} // THÊM MỚI: Cho phép Scene cập nhật trạng thái này
          onObjectContextMenu={handleObjectContextMenu}
          solutionPath={solutionPath}
          highlights={topologyHighlights}
          activeLayer={activeLayer}
          onSmartSelect={handleSmartSelect}
          onObjectHover={handleObjectHover}
          hoverPreviewIds={hoverPreviewIds}
          selectionMode={selectionMode}
          isRotating={isRotating}
          rotateSnapAngle={rotateSnapAngle}
          onRotateObjects={handleRotateObjects}
          onSetIsRotating={setIsRotating}
          isFillMode={isFillMode}
          fillPreviewPositions={fillPreviewPositions}
          onFillPreview={handleFillPreview}
          onFillExecute={handleFillExecute}
          symmetryEnabled={symmetryEnabled}
          symmetryAxis={symmetryAxis}
          symmetryCenter={symmetryCenter}
          isPasteMode={isPasteMode}
          pastePreviewPositions={pastePreviewPositions}
          onPastePreview={handlePastePreview}
          onPasteExecute={handlePasteExecute}
        />
      </div>
      {/* --- START: THÊM THANH RESIZER VÀ ÁP DỤNG WIDTH ĐỘNG --- */}
      {showRightSidebar && (
        <>
          <div
            className="resizer"
            onMouseDown={handleResizeMouseDown}
          />
          <div ref={sidebarRef} className="right-sidebar" style={{ width: `${sidebarWidth}px` }}>
            <RightPanelTabs
              selectedObjects={placedObjects.filter(obj => selectedObjectIds.includes(obj.id))}
              onUpdateObject={handleUpdateObject}
              onDeleteSelection={() => handleRemoveMultipleObjects(selectedObjectIds)}
              onAddObject={handleAddNewObject}
              onCopyAsset={handleCopyObject}
              onRotateSelection={handleRotateSelection}
              onFlipSelection={handleFlipSelection}
              onClearSelection={() => { setSelectedObjectIds([]); setSelectionStart(null); setSelectionEnd(null); }}
              metadata={questMetadata}
              onMetadataChange={handleMetadataChange}
              onSolveMaze={handleSolveMaze}
              questId={questMetadata?.id || 'untitled-quest'}
              editedJson={editedJson}
              onJsonChange={setEditedJson}
              onRender={handleRenderEditedJson}
              onSave={handleSaveMap}
              onImportMap={handleImportMap}
              onLoadMapFromUrl={handleLoadMapFromUrl}
            />
          </div>
        </>
      )}
      {/* --- END: THÊM THANH RESIZER VÀ ÁP DỤNG WIDTH ĐỘNG --- */}
      {
        contextMenu.visible && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()} // Ngăn không cho menu tự đóng khi click vào chính nó
          >
            <ul>
              <li onClick={() => handleContextMenuAction('duplicate')}>Duplicate</li>
              <li onClick={() => handleContextMenuAction('copy_asset')}>Copy</li>
              <li
                className="has-submenu"
                onMouseEnter={() => setAssetSubMenuVisible(true)}
                onMouseLeave={() => setAssetSubMenuVisible(false)}
              >
                Change Asset &raquo;
                {assetSubMenuVisible && (
                  <div className="context-menu sub-menu">
                    <ul>
                      {buildableAssetGroups.map(group => (
                        <div key={group.name}>
                          <li className="separator-header">{group.name}</li>
                          {group.items.map(asset => (
                            <li key={asset.key} onClick={() => handleSelectAsset(asset)} title={asset.name}>
                              <img
                                src={asset.thumbnail}
                                alt={asset.name}
                                className="context-menu-thumbnail"
                                // THÊM MỚI: Nếu ảnh không tải được, hiển thị ảnh fallback
                                onError={(e) => { e.currentTarget.src = '/assets/ui/unknown.png'; }}
                              />
                              <span>{asset.name}</span>
                            </li>
                          ))}
                        </div>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
              <li className="separator"></li>
              <li onClick={() => handleContextMenuAction('delete')} className="delete">Delete</li>
            </ul>
          </div>
        )
      }
      {/* --- THÊM MỚI: Render modal hướng dẫn --- */}
      {
        isWelcomeModalVisible && (
          <WelcomeModal onClose={handleCloseWelcomeModal} />
        )
      }
      {/* Help Button for Keyboard Shortcuts */}
      <KeyboardShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div >
  );
}

// Wrap App with BuilderModeProvider for unified mode state management
function AppWithProvider() {
  return (
    <BuilderModeProvider>
      <App />
    </BuilderModeProvider>
  );
}

export default AppWithProvider;