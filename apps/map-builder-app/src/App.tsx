import { useState, useMemo, useRef, useEffect, useCallback, MouseEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssetPalette } from './components/AssetPalette';
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
import { type Coord, type IPathInfo } from './map-generator/types';
import { PlacementService, PedagogyStrategy } from './map-generator/PlacementService';
import { TopologyPanel } from './components/TopologyPanel';
import type { HighlightItem } from './components/TopologyInspector';
import { MapInspector } from './components/MapInspector';
import { ValidationBadge } from './components/ValidationBadge';
import { BuilderModeProvider } from './store/builderModeContext';
import { useMapValidation } from './hooks/useMapValidation';
import { HelpButton } from './components/HelpButton';
import { SolutionDebugPanel } from './components/SolutionDebugPanel';
import { PlacementSelector } from './components/PlacementSelector';
import { TemplateManager } from './components/TemplateManager';
import { PlacementVariants } from './components/PlacementVariants';
import {
  MapAnalyzer,
  type SelectableElement,
  type TemplateItemPlacement,
  type ItemPlacement
} from '@repo/academic-placer';
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
  // --- START: THAY ĐỔI ĐỂ QUẢN LÝ LỊCH SỬ UNDO/REDO ---
  const [isPaletteVisible, setIsPaletteVisible] = useState(true); // State để quản lý hiển thị palette
  const [activeSidePanel, setActiveSidePanel] = useState<'assets' | 'topology' | 'placement'>('assets'); // State chọn panel
  // Placement selector state
  const [placementSelections, setPlacementSelections] = useState<Array<{ elementId: string; itemType: 'crystal' | 'switch' | 'gem'; symmetric?: boolean }>>([]);
  // Strategy and item goals for placement
  const [placementStrategy, setPlacementStrategy] = useState<PedagogyStrategy>(PedagogyStrategy.NONE);
  const [placementDifficulty, setPlacementDifficulty] = useState<'intro' | 'simple' | 'complex'>('simple');
  const [itemGoals, setItemGoals] = useState<{ gems: number; crystals: number; switches: number }>({ gems: 3, crystals: 0, switches: 0 });
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

  // State mới để lưu trữ siêu dữ liệu của quest
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
  const sceneRef = useRef<SceneController>(null);
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref cho right-sidebar

  // --- START: LOGIC CUỘN SIDEBAR LÊN KHI CHỌN ĐỐI TƯỢNG ---
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

  const togglePalette = () => {
    setIsPaletteVisible(!isPaletteVisible);
  };

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
  const handleRotateSelection = useCallback(() => {
    if (selectedObjectIds.length === 0) return;

    setPlacedObjectsWithHistory(prev => {
      const selectedObjects = prev.filter(obj => selectedObjectIds.includes(obj.id));
      if (selectedObjects.length === 0) return prev;

      // 1. Tìm tâm của nhóm
      const minPos = [Infinity, Infinity, Infinity];
      const maxPos = [-Infinity, -Infinity, -Infinity];
      selectedObjects.forEach(obj => {
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
      const rotatedObjects = selectedObjects.map(obj => {
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
  }, [selectedObjectIds, setPlacedObjectsWithHistory]);

  // --- HÀM MỚI: Lật nhóm đối tượng đã chọn ---
  const handleFlipSelection = useCallback((axis: 'x' | 'z') => {
    if (selectedObjectIds.length === 0) return;

    setPlacedObjectsWithHistory(prev => {
      const selectedObjects = prev.filter(obj => selectedObjectIds.includes(obj.id));
      if (selectedObjects.length === 0) return prev;

      // 1. Tìm tâm của nhóm
      const minPos = [Infinity, Infinity];
      const maxPos = [-Infinity, -Infinity];
      selectedObjects.forEach(obj => {
        minPos[0] = Math.min(minPos[0], obj.position[0]);
        minPos[1] = Math.min(minPos[1], obj.position[2]);
        maxPos[0] = Math.max(maxPos[0], obj.position[0]);
        maxPos[1] = Math.max(maxPos[1], obj.position[2]);
      });
      const center = { x: (minPos[0] + maxPos[0]) / 2, z: (minPos[1] + maxPos[1]) / 2 };

      // 2. Lật từng đối tượng qua tâm
      const flippedObjects = selectedObjects.map(obj => {
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
  }, [selectedObjectIds, setPlacedObjectsWithHistory]);

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
  }, [selectedObjectIds, selectionBounds, placedObjects, handleRotateSelection]); // Thêm handleRotateObject và selectionBounds vào dependencies

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

  const assetMap = useMemo(() => {
    const map = new Map<string, BuildableAsset>();
    buildableAssetGroups.forEach(group => {
      group.items.forEach(item => {
        map.set(item.key, item);
      });
    });
    return map;
  }, []);

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
      }
    }
  };
  // --- END: SỬA LỖI HIỆU ỨNG ---



  const handleModeChange = (mode: BuilderMode) => {
    setBuilderMode(mode);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleDimensionsChange = (axis: keyof BoxDimensions, value: number) => setBoxDimensions(prev => ({ ...prev, [axis]: Math.max(1, value) }));
  const handleSelectionBoundsChange = (newBounds: SelectionBounds) => { setSelectionStart(newBounds.min); setSelectionEnd(newBounds.max); };

  const handleAddObject = (gridPosition: [number, number, number], asset: BuildableAsset) => {
    const coordId = gridPosition.join(',');
    if (placedObjects.some(obj => obj.position.join(',') === coordId)) return;

    // --- NEW LOGIC: SMART SNAP CHECK ---
    console.log(`Adding Object: ${coordId}, Type: ${asset.type}`);
    // Ensure we have pathInfo before checking. 
    // Relaxed Check: Only enforce if pathInfo exists AND it's a collectible/interactible.
    // Also explicitly exclude 'block' type from smart snap (walls/ground).
    if (smartSnapEnabled && questMetadata?.pathInfo && asset.type !== 'block' && asset.key !== 'player_start' && asset.key !== 'finish' && !asset.key.includes('ground') && !asset.key.includes('wall')) {
      const pathCoords = questMetadata.pathInfo.path_coords || [];
      const [x, y, z] = gridPosition;

      // Additional safety for type 'special' which might slip through ?
      if (asset.type === 'collectible' || asset.type === 'interactible') {
        const isOnPath = pathCoords.some((c: Coord) => c[0] === x && c[1] === y && c[2] === z);
        if (!isOnPath) {
          console.warn("Smart Snap: Invalid placement. Item must be on path.");
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

    setPlacedObjectsWithHistory(prev => [...prev.filter(o => !objectsToRemove.includes(o.id)), ...objectsToAdd]);
  };

  // Hàm mới để thêm một đối tượng đã được tạo sẵn (dùng cho Duplicate)
  const handleAddNewObject = (newObject: PlacedObject) => {
    setPlacedObjectsWithHistory(prev => [...prev, newObject]);
  };

  const handleRemoveObject = (id: string) => {
    setPlacedObjectsWithHistory(prev => {
      const objectToRemove = prev.find(o => o.id === id);
      const newObjects = prev.filter(obj => obj.id !== id);
      if (objectToRemove?.properties.type === 'portal' && objectToRemove.properties.targetId) {
        const partner = newObjects.find(o => o.id === objectToRemove.properties.targetId);
        if (partner) partner.properties.targetId = null;
      }
      return newObjects;
    });
    // SỬA LỖI: Cập nhật logic để xóa ID khỏi mảng lựa chọn
    setSelectedObjectIds(prevIds => prevIds.filter(prevId => prevId !== id));
  };

  const handleRemoveMultipleObjects = (ids: string[]) => {
    setPlacedObjectsWithHistory(prev => prev.filter(obj => !ids.includes(obj.id)));
    setSelectedObjectIds([]); // Xóa tất cả lựa chọn
  };

  const handleUpdateObject = (updatedObject: PlacedObject) => {
    setPlacedObjectsWithHistory(prev => prev.map(obj => (obj.id === updatedObject.id ? updatedObject : obj)));
  };

  const handleMoveObjectToPosition = (objectId: string, newPosition: [number, number, number]) => {
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

  // NÂNG CẤP: Di chuyển một hoặc nhiều đối tượng theo bước
  const handleMoveObject = (objectIds: string[], direction: 'x' | 'y' | 'z', amount: 1 | -1) => {
    setPlacedObjectsWithHistory(prev => {
      const objectsToMove = prev.filter(o => objectIds.includes(o.id));
      if (objectsToMove.length === 0) return prev;

      const axisIndex = { x: 0, y: 1, z: 2 }[direction];
      const objectIdsSet = new Set(objectIds);

      // --- THAY ĐỔI: Loại bỏ kiểm tra giới hạn bản đồ khi di chuyển bằng phím tắt ---
      // Logic mới sẽ chỉ kiểm tra va chạm với các đối tượng khác không nằm trong vùng chọn.
      // Điều này cho phép di chuyển tự do các đối tượng ra ngoài ranh giới.
      const canMove = objectsToMove.every(obj => {
        const newPos: [number, number, number] = [...obj.position];
        newPos[axisIndex] += amount;
        return !prev.some(other => !objectIdsSet.has(other.id) && other.position.join(',') === newPos.join(','));
      });

      if (!canMove) return prev; // Nếu có va chạm với đối tượng khác, hủy di chuyển.

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

    // Fallback: Nếu không thể xác định, đặt giá trị mặc định
    config.toolboxPresetKey = 'commands_l1_move';
    config.toolbox = _.cloneDeep(toolboxPresets['commands_l1_move']);
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
  const handleSolveMaze = () => {
    // SỬA LỖI: Tái cấu trúc để không cần nhấn "Render from JSON" trước khi giải.
    // Hàm này sẽ tự động tạo gameConfig mới nhất từ `placedObjects` hiện tại.
    try {
      // 1. Tạo gameConfig mới nhất từ trạng thái `placedObjects` trên màn hình.
      const blocks = placedObjects.filter(o => o.asset.type === 'block').map(o => ({ modelKey: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
      const collectibles = placedObjects.filter(o => o.asset.type === 'collectible').map((o, i) => ({ id: `c${i + 1}`, type: o.asset.key, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
      const interactibles = placedObjects.filter(o => o.asset.type === 'interactible').map(o => ({ id: o.id, type: o.asset.key, ...o.properties, position: { x: o.position[0], y: o.position[1], z: o.position[2] } }));
      const finishObject = placedObjects.find(o => o.asset.key === 'finish');
      const startObject = placedObjects.find(o => o.asset.key === 'player_start');
      const players = startObject ? [{ id: "player1", start: { x: startObject.position[0], y: startObject.position[1], z: startObject.position[2], direction: parseFloat(startObject.properties?.direction) || 0 } }] : [];

      if (!finishObject) {
        alert("Lỗi: Không tìm thấy đối tượng 'Finish' trên bản đồ. Vui lòng đặt một điểm kết thúc để có thể tự động giải.");
        return;
      }
      const finish = { x: finishObject.position[0], y: finishObject.position[1], z: finishObject.position[2] };
      const currentGC = { type: "maze", renderer: "3d", blocks, players, collectibles, interactibles, finish };

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
      const solution = solveMaze(currentGC, currentSC, currentBC);

      if (solution && solution.rawActions) {
        // --- START: CẬP NHẬT METADATA VỚI LỜI GIẢI MỚI ---
        const newOptimalBlocks = solution.optimalBlocks || 0;
        const newMaxBlocks = newOptimalBlocks + 5;

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
        alert(report);
        // ------------------------------
      } else {
        alert("Validation Failed: Map is unsolvable. No path found to target.");
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
    }
  }, []); // Không có dependencies vì chỉ reset state
  const handleGenerateMap = (newObjects: PlacedObject[], metadataUpdate?: Record<string, any>) => {
    // Confirm if not empty
    if (placedObjects.length > 0 && !window.confirm("Generating a new map will replace current objects. Continue?")) {
      return;
    }

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

  const solutionPath = useMemo(() => {
    // Priority 1: Solver Path
    if (questMetadata?.solution?.pathCoordinates) {
      return questMetadata.solution.pathCoordinates.map((p: any) => [p.x, p.y, p.z] as [number, number, number]);
    }
    // Priority 2: Topology Path
    if (questMetadata?.pathInfo?.path_coords) {
      return questMetadata.pathInfo.path_coords as [number, number, number][];
    }
    return null;
  }, [questMetadata]);

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

  // Handle applying items based on strategy and item goals
  const handleApplyItems = useCallback(() => {
    const pathInfo = questMetadata?.pathInfo;
    if (!pathInfo?.path_coords || pathInfo.path_coords.length === 0) {
      alert('⚠️ No path data available. Generate ground from the Topology tab first.');
      return;
    }

    const pathCoords: Coord[] = pathInfo.path_coords;

    // Use PlacementService to suggest placements based on strategy
    const suggestedObjects = placementService.suggestPlacement(pathCoords, {
      strategy: placementStrategy,
      difficulty: placementDifficulty,
      assetMap
    });

    // Add additional items based on item goals
    const existingCrystals = suggestedObjects.filter(o => o.asset.key === 'crystal').length;
    const existingSwitches = suggestedObjects.filter(o => o.asset.key === 'switch').length;
    const existingGems = suggestedObjects.filter(o => o.asset.key === 'gem').length;

    // Find available positions (not start, not finish, not already occupied)
    const usedPositions = new Set([
      ...suggestedObjects.map(o => `${o.position[0]},${o.position[1]},${o.position[2]}`),
      ...placedObjects.filter(o => o.asset.type !== 'collectible').map(o => `${o.position[0]},${o.position[1]},${o.position[2]}`)
    ]);

    const startPos = pathInfo.start_pos;
    const targetPos = pathInfo.target_pos;
    usedPositions.add(`${startPos[0]},${startPos[1]},${startPos[2]}`);
    usedPositions.add(`${targetPos[0]},${targetPos[1]},${targetPos[2]}`);

    const availablePositions = pathCoords.filter(coord =>
      !usedPositions.has(`${coord[0]},${coord[1]},${coord[2]}`)
    );

    // Add crystals if needed
    const crystalsNeeded = Math.max(0, itemGoals.crystals - existingCrystals);
    const crystalAsset = assetMap.get('crystal');
    if (crystalAsset && crystalsNeeded > 0) {
      for (let i = 0; i < Math.min(crystalsNeeded, availablePositions.length); i++) {
        const pos = availablePositions.shift()!;
        suggestedObjects.push({
          id: uuidv4(),
          asset: crystalAsset,
          position: [pos[0], pos[1], pos[2]],
          rotation: [0, 0, 0],
          properties: {}
        });
      }
    }

    // Add switches if needed
    const switchesNeeded = Math.max(0, itemGoals.switches - existingSwitches);
    const switchAsset = assetMap.get('switch');
    if (switchAsset && switchesNeeded > 0) {
      for (let i = 0; i < Math.min(switchesNeeded, availablePositions.length); i++) {
        const pos = availablePositions.shift()!;
        suggestedObjects.push({
          id: uuidv4(),
          asset: switchAsset,
          position: [pos[0], pos[1], pos[2]],
          rotation: [0, 0, 0],
          properties: {}
        });
      }
    }

    // Add gems if needed (using gem or alternate asset)
    const gemsNeeded = Math.max(0, itemGoals.gems - existingGems);
    const gemAsset = assetMap.get('gem') || assetMap.get('crystal'); // Fallback
    if (gemAsset && gemsNeeded > 0) {
      for (let i = 0; i < Math.min(gemsNeeded, availablePositions.length); i++) {
        const pos = availablePositions.shift()!;
        suggestedObjects.push({
          id: uuidv4(),
          asset: gemAsset,
          position: [pos[0], pos[1], pos[2]],
          rotation: [0, 0, 0],
          properties: {}
        });
      }
    }

    if (suggestedObjects.length === 0) {
      alert('⚠️ No items could be placed. Try adjusting the item goals or strategy.');
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

    alert(`✅ Applied ${suggestedObjects.length} items using ${placementStrategy || 'random'} strategy.`);
  }, [questMetadata, placementStrategy, placementDifficulty, itemGoals, assetMap, placedObjects, placementService]);

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
      {isPaletteVisible && (
        <div className="left-sidebar-container" style={{ width: '300px', display: 'flex', flexDirection: 'column', background: '#2a2a2e', borderRight: '1px solid #3c3c41' }}>
          <div className="sidebar-tabs" style={{ display: 'flex', borderBottom: '1px solid #3c3c41' }}>
            <button
              style={{ flex: 1, padding: '10px', background: activeSidePanel === 'assets' ? '#3c3c41' : '#2a2a2e', color: activeSidePanel === 'assets' ? '#fff' : '#888', border: 'none', cursor: 'pointer', fontWeight: activeSidePanel === 'assets' ? 'bold' : 'normal', transition: 'all 0.2s' }}
              onClick={() => setActiveSidePanel('assets')}
            >
              Assets
            </button>
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
          </div>


          <div style={{ padding: '10px', background: '#333', borderBottom: '1px solid #3c3c41' }}>
            {/* Hide Layer filter in Topology tab since it only handles Ground */}
            {activeSidePanel !== 'topology' && (
              <>
                <label style={{ marginRight: '10px', fontWeight: 'bold', color: '#fff' }}>Layer:</label>
                <select value={activeLayer} onChange={(e) => setActiveLayer(e.target.value as any)} style={{ background: '#3c3c41', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px' }}>
                  <option value="all">All</option>
                  <option value="ground">Ground</option>
                  <option value="items">Items</option>
                </select>
              </>
            )}
            <label style={{ marginLeft: activeSidePanel === 'topology' ? '0' : '10px', color: '#ccc' }}>
              <input type="checkbox" checked={smartSnapEnabled} onChange={e => setSmartSnapEnabled(e.target.checked)} style={{ accentColor: '#007bff' }} /> Smart Snap
            </label>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeSidePanel === 'assets' ? (
              <AssetPalette
                selectedAssetKey={selectedAsset?.key || null}
                onSelectAsset={handleSelectAsset}
                currentMode={builderMode}
                onModeChange={handleModeChange}
                boxDimensions={boxDimensions}
                onDimensionsChange={handleDimensionsChange}
                fillOptions={fillOptions}
                onFillOptionsChange={setFillOptions}
                onSelectionAction={handleSelectionAction}
                selectionBounds={selectionBounds}
                onSelectionBoundsChange={handleSelectionBoundsChange}
                // SỬa LỖI: Truyền hàm tiện ích mới vào AssetPalette
                getCorrectedAssetUrl={getCorrectedAssetUrl}
                onLoadMapFromUrl={handleLoadMapFromUrl} // Truyền hàm mới vào
                onShowTutorial={() => setIsWelcomeModalVisible(true)} // THÊM MỚI: Prop để mở lại modal
                onCreateNewMap={handleCreateNewMap} // THÊM MỚI: Prop để tạo map mới
                onImportMap={handleImportMap}
              />
            ) : activeSidePanel === 'topology' ? (
              <TopologyPanel
                onGenerate={handleGenerateMap}
                assetMap={assetMap}
                pathInfo={questMetadata?.pathInfo || null}
                onHighlightChange={setTopologyHighlights}
              />
            ) : (
              /* Placement Panel - Item Placement Controls */
              <div style={{ padding: '12px' }} className="placement-panel">
                {/* Strategy Section */}
                <div className="placement-section">
                  <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '13px' }}>🎯 Strategy (Pedagogy)</h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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

                {/* Item Goals Section */}
                <div className="placement-section">
                  <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '13px' }}>📊 Item Goals</h4>
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
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#aaa' }}>💠 Gems</span>
                      <input
                        type="number"
                        value={itemGoals.gems}
                        onChange={e => setItemGoals(prev => ({ ...prev, gems: parseInt(e.target.value) || 0 }))}
                        min={0} max={20}
                        style={{ padding: '6px', background: '#3c3c41', border: '1px solid #555', borderRadius: '4px', color: '#fff', width: '100%' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Apply Items Button */}
                <button
                  onClick={handleApplyItems}
                  disabled={!questMetadata?.pathInfo?.path_coords}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    marginTop: '8px',
                    background: !questMetadata?.pathInfo?.path_coords ? '#555' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
                  🎲 Apply Items
                </button>

                <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '12px 0' }} />

                {/* Place Items Section */}
                <PlacementSelector
                  elements={selectableElements}
                  onSelectionsChange={setPlacementSelections}
                  initialSelections={placementSelections}
                />
                <div style={{ height: '12px' }} />

                {/* Placement Variants - AI Generated Options */}
                <PlacementVariants
                  pathInfo={questMetadata?.pathInfo || null}
                  onApplyPlacement={handleApplyVariant}
                  currentToolboxPreset={questMetadata?.blockly?.toolboxPreset || ''}
                  onSuggestToolbox={handleSuggestToolbox}
                />
                <div style={{ height: '12px' }} />

                {/* Template Manager */}
                <TemplateManager
                  topologyType={questMetadata?.pathInfo?.metadata?.topology_type || 'unknown'}
                  selectableElements={selectableElements}
                  currentSelections={placementSelections}
                  onApplyTemplate={handleApplyTemplatePlacements}
                />

                {selectableElements.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#888', padding: '20px', fontSize: '13px' }}>
                    <p>⚠️ No path data available.</p>
                    <p>Generate ground from the <strong>Topology</strong> tab first.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
      }
      <div className="builder-scene-wrapper">
        <button onClick={togglePalette} className={`toggle-palette-btn ${!isPaletteVisible ? 'closed' : ''}`}>
          {isPaletteVisible ? '‹' : '›'}
        </button>
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
              left: '200px', // Next to Inspector
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
        <ViewControls onViewChange={handleViewChange} />
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
          onMoveObjectByStep={(objectId, dir, amt) => handleMoveObject([objectId], dir, amt)}
          onSelectObject={handleSelectObject} // THAY ĐỔI: Sử dụng hàm xử lý mới
          isMovingObject={isMovingObject} // THÊM MỚI: Truyền trạng thái di chuyển xuống
          onSetIsMovingObject={setIsMovingObject} // THÊM MỚI: Cho phép Scene cập nhật trạng thái này
          onObjectContextMenu={handleObjectContextMenu}
          solutionPath={solutionPath}
          highlights={topologyHighlights}
        />
      </div>
      {/* --- START: THÊM THANH RESIZER VÀ ÁP DỤNG WIDTH ĐỘNG --- */}
      <div
        className="resizer"
        onMouseDown={handleResizeMouseDown}
      />
      <div ref={sidebarRef} className="right-sidebar" style={{ width: `${sidebarWidth}px` }}>
        <PropertiesPanel
          selectedObjects={placedObjects.filter(obj => selectedObjectIds.includes(obj.id))}
          onUpdateObject={handleUpdateObject}
          onDeleteSelection={() => handleRemoveMultipleObjects(selectedObjectIds)}
          onAddObject={handleAddNewObject} // Thêm prop onAddObject
          onCopyAsset={handleCopyObject} // Thêm prop onCopyAsset
          currentMapItems={currentMapItems} // Prop cho theme
          mapTheme={mapTheme} // Prop cho theme
          onThemeChange={handleThemeChange} // Prop cho theme
          onRotateSelection={handleRotateSelection}
          onFlipSelection={handleFlipSelection}
          onClearSelection={() => { setSelectedObjectIds([]); setSelectionStart(null); setSelectionEnd(null); }}
        />
        {/* --- COMPONENT MỚI ĐƯỢC THÊM VÀO --- */}
        <QuestDetailsPanel
          metadata={questMetadata}
          onMetadataChange={handleMetadataChange}
          onSolveMaze={handleSolveMaze} // SỬA ĐỔI: Truyền hàm giải không cần tham số
        />
        <JsonOutputPanel
          questId={questMetadata?.id || 'untitled-quest'}
          editedJson={editedJson}
          onJsonChange={setEditedJson}
          onRender={handleRenderEditedJson}
        //onSave={handleSaveMap} // Bỏ ghi chú dòng này để kích hoạt lại nút Save
        />
      </div>
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
      <HelpButton />
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