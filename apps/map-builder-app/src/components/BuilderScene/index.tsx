import { Suspense, useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle, Dispatch, SetStateAction } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber/dist/declarations/src/core/events';
import { Grid, useGLTF, CameraControls, GizmoHelper, GizmoViewport, Line, Outlines, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { buildableAssetGroups } from '../../config/gameAssets';
import type { BuildableAsset, PlacedObject, BuilderMode, BoxDimensions, SelectionBounds, AssetGroup } from '../../types';
import { BoundingBox } from '../BoundingBox';
import { SelectionBox } from '../SelectionBox';
import { SelectionHighlight } from '../PropertiesPanel/SelectionHighlight';
import type { HighlightItem } from '../TopologyInspector';
import { TransformGizmo, type GizmoAxis } from '../TransformGizmo';
import { RotateGizmo, type SnapAngle } from '../RotateGizmo';

const TILE_SIZE = 2;

export type SceneController = {
  changeView: (view: 'perspective' | 'top' | 'front' | 'side') => void;
};

interface BuilderSceneProps {
  builderMode: BuilderMode;
  selectedAsset: BuildableAsset | null;
  placedObjects: PlacedObject[];
  boxDimensions: BoxDimensions;
  onModeChange: (mode: BuilderMode) => void;
  onAddObject: (position: [number, number, number], asset: BuildableAsset) => void;
  onRemoveObject: (id: string) => void;
  selectionBounds: SelectionBounds | null;
  selectionStart: [number, number, number] | null; // THÊM MỚI: Định nghĩa prop selectionStart
  onSetSelectionStart: (pos: [number, number, number] | null) => void;
  onSetSelectionEnd: Dispatch<SetStateAction<[number, number, number] | null>>;
  selectedObjectIds: string[];
  onSelectObject: (id: string | null, isShiftDown: boolean) => void;
  onMoveObject: (objectId: string, newPosition: [number, number, number]) => void;
  onMoveObjectsBatch?: (moves: Array<{ id: string; position: [number, number, number] }>) => void;
  onSelectMultipleObjects?: (ids: string[]) => void;
  onMoveObjectByStep: (objectId: string, direction: 'x' | 'y' | 'z', amount: 1 | -1) => void;
  onObjectContextMenu: (event: { clientX: number, clientY: number, preventDefault: () => void }, objectId: string) => void;
  // --- START: SỬA LỖI HIỆU ỨNG ---
  isMovingObject: boolean;
  onSetIsMovingObject: (isMoving: boolean) => void;
  // --- END: SỬA LỖI HIỆU ỨNG ---
  solutionPath?: [number, number, number][] | null;
  highlights?: HighlightItem[]; // Topology Inspector highlights
  activeLayer: 'all' | 'ground' | 'items'; // NEW: Active layer for dimming
  // Smart Selection Props
  onSmartSelect?: (objectId: string) => void;
  onObjectHover?: (objectId: string | null) => void;
  hoverPreviewIds?: string[];
  selectionMode?: 'box' | 'smart';
  // Rotation Props
  isRotating?: boolean;
  rotateSnapAngle?: SnapAngle;
  onRotateObjects?: (angleRadians: number) => void;
  onSetIsRotating?: (isRotating: boolean) => void;
  // Fill Tool Props
  isFillMode?: boolean;
  fillPreviewPositions?: [number, number, number][];
  onFillPreview?: (position: [number, number, number] | null) => void;
  onFillExecute?: (position: [number, number, number]) => void;
  // Symmetry Props
  symmetryEnabled?: boolean;
  symmetryAxis?: 'x' | 'z' | 'both';
  symmetryCenter?: { x: number; z: number };
  // Paste Tool Props
  isPasteMode?: boolean;
  pastePreviewPositions?: [number, number, number][];
  onPastePreview?: (position: [number, number, number] | null) => void;
  onPasteExecute?: (position: [number, number, number]) => void;
}

// Separate component for player_start to ensure proper re-rendering
function PlayerStartRenderer({ direction, material }: { direction: number, material?: THREE.Material }) {
  // Convention: 0=South(-Z), 1=West(+X), 2=North(+Z), 3=East(-X)
  const rotationMap: Record<number, number> = {
    0: Math.PI / 2,   // South (-Z): +90° from default
    1: 0,             // West (+X): no rotation (cone default points +X)
    2: -Math.PI / 2,  // North (+Z): -90° from default
    3: Math.PI,       // East (-X): 180° from default
  };

  const baseRotation = Math.PI / 2;
  const yRotation = rotationMap[direction] ?? 0;

  // Use key to force complete remount when direction changes
  // Fix rotation order: Yaw (Y) then Pitch (X)
  return (
    <group key={direction} rotation={[0, yRotation, 0]}>
      <group rotation={[baseRotation, 0, 0]}>
        {/* Main Cone Body */}
        <mesh material={material} position={[0, 0, 0]}>
          <coneGeometry args={[0.4, 0.8, 8]} />
          {!material && <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.6} />}
        </mesh>

        {/* Base Cylinder */}
        <mesh position={[0, -0.4, 0]} material={material}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          {!material && <meshStandardMaterial color="#FFA500" roughness={0.5} metalness={0.3} />}
        </mesh>
      </group>
    </group>
  );
}

// --- COMPONENT MỚI ĐỂ RENDER ASSET ---
const AssetRenderer = ({ asset, properties, material }: { asset: BuildableAsset, properties?: Record<string, any>, material?: THREE.Material }) => {
  // Special rendering for player_start with directional indicator
  if (asset.key === 'player_start') {
    const direction = properties?.direction ?? 0; // 0=East, 1=North, 2=West, 3=South
    return <PlayerStartRenderer direction={direction} material={material} />;
  }

  // Render mô hình GLB nếu có đường dẫn
  if (asset.path) {
    const { scene } = useGLTF(asset.path);
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    if (material) {
      clonedScene.traverse((child: any) => {
        if (child.isMesh) child.material = material;
      });
    }
    return <primitive object={clonedScene} />;
  }

  // Render hình khối cơ bản
  const color = properties?.color || '#ffffffff';

  switch (asset.primitiveShape) {
    case 'torus':
      return (
        <mesh material={material}>
          <torusGeometry args={[0.5, 0.2, 16, 48]} />
          {!material && <meshStandardMaterial color={color} roughness={0.5} metalness={0.5} />}
        </mesh>
      );
    case 'cone':
      return (
        <mesh material={material}>
          <coneGeometry args={[0.6, 1.2, 32]} />
          {!material && <meshStandardMaterial color={"gold"} roughness={0.3} metalness={0.8} />}
        </mesh>
      );
    // Có thể thêm các hình khác ở đây
    default:
      return (
        <mesh material={material}>
          <boxGeometry args={[1, 1, 1]} />
          {!material && <meshStandardMaterial color={"magenta"} />}
        </mesh>
      );
  }
};

// --- START: THÊM LOGIC LỚP PHỦ KHI CHỌN ---
// Tạo một vật liệu (material) mới cho lớp phủ.
// Màu vàng, bán trong suốt và không bị ảnh hưởng bởi ánh sáng.
const selectionOverlayMaterial = new THREE.MeshBasicMaterial({
  color: '#ff5500',   // SỬA LỖI: Mã màu hex phải có 6 chữ số. Độ trong suốt được xử lý bởi 'opacity'.
  opacity: 0.6,     // Tăng độ đậm của lớp phủ
  transparent: true,
  depthWrite: false // Render xuyên qua các vật thể khác để đảm bảo luôn thấy
});

// Hover preview material (Yellow, semi-transparent)
const hoverPreviewMaterial = new THREE.MeshBasicMaterial({
  color: '#ffff00',
  opacity: 0.4,
  transparent: true,
  depthTest: false,
  depthWrite: false
});

// Fill preview material (Green, semi-transparent)
const fillPreviewMaterial = new THREE.MeshBasicMaterial({
  color: '#00ff88',
  opacity: 0.5,
  transparent: true,
  depthTest: false,
  depthWrite: false
});

// Paste preview material (Cyan, semi-transparent)
const pastePreviewMaterial = new THREE.MeshBasicMaterial({
  color: '#00ccff',
  opacity: 0.5,
  transparent: true,
  depthTest: false,
  depthWrite: false
});

function PlacedAsset({ object, isSelected, isHovered, onContextMenu, activeLayer, isPreview }: {
  object: PlacedObject;
  isSelected: boolean;
  isHovered: boolean;
  onContextMenu: (e: ThreeEvent<MouseEvent>) => void;
  activeLayer: 'all' | 'ground' | 'items';
  isPreview?: boolean; // New prop for smart select preview
}) {
  const worldPosition: [number, number, number] = [
    object.position[0] * TILE_SIZE + TILE_SIZE / 2,
    object.position[1] * TILE_SIZE + TILE_SIZE / 2,
    object.position[2] * TILE_SIZE + TILE_SIZE / 2
  ];

  return (
    <group
      position={worldPosition}
      rotation={object.rotation}
      scale={TILE_SIZE}
      userData={{ isPlacedObject: true, id: object.id }}
      onContextMenu={onContextMenu}
    >
      <AssetRenderer
        key={object.asset.key === 'player_start' ? `${object.id}-${object.properties.direction}` : object.id}
        asset={object.asset}
        properties={object.properties}
      />

      {/* Dimming overlay for inactive layers */}
      {activeLayer !== 'all' && (
        (activeLayer === 'ground' && !object.asset.key.includes('ground')) ||
        (activeLayer === 'items' && object.asset.key.includes('ground'))
      ) && (
          <mesh scale={[1.01, 1.01, 1.01]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="black" opacity={0.6} transparent depthWrite={false} />
          </mesh>
        )}

      {/* --- THAY ĐỔI: Logic hiển thị hiệu ứng chọn và hover --- */}
      {/* Selection Overlay */}
      {isSelected && (
        <group scale={[1.02, 1.02, 1.02]}>
          <AssetRenderer asset={object.asset} material={selectionOverlayMaterial} properties={object.properties} />
        </group>
      )}

      {/* Hover Outlines (show only if not selected) */}
      {!isSelected && isHovered && <Outlines thickness={0.03} color="#66aaff" />}

      {/* Smart Select Preview Overlay */}
      {isPreview && !isSelected && (
        <group scale={[1.03, 1.03, 1.03]}>
          <AssetRenderer asset={object.asset} material={hoverPreviewMaterial} properties={object.properties} />
        </group>
      )}
    </group>
  );
}

function RollOverMesh({ selectedAsset }: { selectedAsset: BuildableAsset | null }) {
  if (!selectedAsset) return null;

  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true, depthWrite: false });

  return (
    <group scale={TILE_SIZE}>
      <AssetRenderer asset={selectedAsset} material={material} />
    </group>
  );
}

const PortalConnections = ({ objects }: { objects: PlacedObject[] }) => {
  const portalPairs = useMemo(() => {
    const pairs: [PlacedObject, PlacedObject][] = [];
    const portals = objects.filter(o => o.properties.type === 'portal' && o.properties.targetId);
    const processed = new Set<string>();

    for (const portal of portals) {
      if (processed.has(portal.id)) continue;
      const target = portals.find(p => p.id === portal.properties.targetId);
      if (target && !processed.has(target.id)) {
        pairs.push([portal, target]);
        processed.add(portal.id);
        processed.add(target.id);
      }
    }
    return pairs;
  }, [objects]);

  return (
    <>
      {portalPairs.map(([p1, p2]) => {
        const startPos = new THREE.Vector3(...p1.position).multiplyScalar(TILE_SIZE).addScalar(TILE_SIZE / 2);
        const endPos = new THREE.Vector3(...p2.position).multiplyScalar(TILE_SIZE).addScalar(TILE_SIZE / 2);
        return <Line key={`${p1.id}-${p2.id}`} points={[startPos, endPos]} color={p1.properties.color || "white"} lineWidth={2} dashed dashSize={0.5} gapSize={0.2} />;
      })}
    </>
  );
};

const SolutionOverlay = ({ path }: { path: [number, number, number][] }) => {
  if (!path || path.length < 2) return null;
  const points = useMemo(() => path.map(p => new THREE.Vector3(
    p[0] * TILE_SIZE + TILE_SIZE / 2,
    p[1] * TILE_SIZE + TILE_SIZE / 2 + 0.1, // Slightly above ground
    p[2] * TILE_SIZE + TILE_SIZE / 2
  )), [path]);

  return (
    <Line
      points={points}
      color="#00ff00"
      lineWidth={3}
      opacity={0.8}
      transparent
      depthTest={false} // Always show on top
    />
  );
};

// Topology Inspector Highlights - render segments and positions with colors
const HighlightLines = ({ highlights }: { highlights: HighlightItem[] }) => {
  if (!highlights || highlights.length === 0) return null;

  return (
    <>
      {highlights.map(highlight => {
        if (highlight.type === 'segment' && highlight.positions.length >= 2) {
          // Render line for segments
          const points = highlight.positions.map(p => new THREE.Vector3(
            p.x * TILE_SIZE + TILE_SIZE / 2,
            p.y * TILE_SIZE + TILE_SIZE / 2 + 0.5, // Slightly above blocks
            p.z * TILE_SIZE + TILE_SIZE / 2
          ));
          return (
            <Line
              key={highlight.id}
              points={points}
              color={highlight.color}
              lineWidth={4}
              opacity={0.9}
              transparent
              depthTest={false}
            />
          );
        } else if (highlight.type === 'position' && highlight.positions.length > 0) {
          // Render spheres for positions
          return highlight.positions.map((pos, i) => (
            <Sphere
              key={`${highlight.id}-${i}`}
              args={[0.4, 16, 16]}
              position={[
                pos.x * TILE_SIZE + TILE_SIZE / 2,
                pos.y * TILE_SIZE + TILE_SIZE / 2 + 0.5,
                pos.z * TILE_SIZE + TILE_SIZE / 2
              ]}
            >
              <meshBasicMaterial color={highlight.color} opacity={0.8} transparent depthTest={false} />
            </Sphere>
          ));
        } else if (highlight.type === 'keypoint' && highlight.positions.length > 0) {
          // Render larger cubes with wireframe for keypoints (Tier 1 Special Points)
          return highlight.positions.map((pos, i) => (
            <group
              key={`${highlight.id}-${i}`}
              position={[
                pos.x * TILE_SIZE + TILE_SIZE / 2,
                pos.y * TILE_SIZE + TILE_SIZE / 2 + 0.5,
                pos.z * TILE_SIZE + TILE_SIZE / 2
              ]}
            >
              {/* Inner solid sphere */}
              <Sphere args={[0.5, 16, 16]}>
                <meshBasicMaterial color={highlight.color} opacity={0.6} transparent depthTest={false} />
              </Sphere>
              {/* Outer ring to make it more visible */}
              <mesh>
                <torusGeometry args={[0.6, 0.08, 8, 32]} />
                <meshBasicMaterial color={highlight.color} opacity={0.9} transparent depthTest={false} />
              </mesh>
            </group>
          ));
        } else if (highlight.type === 'area' && highlight.positions.length > 0) {
          // Render small cubes at each block position to show area extent
          return highlight.positions.map((pos, i) => (
            <mesh
              key={`${highlight.id}-${i}`}
              position={[
                pos.x * TILE_SIZE + TILE_SIZE / 2,
                pos.y * TILE_SIZE + TILE_SIZE / 2 + 0.1, // Slightly above
                pos.z * TILE_SIZE + TILE_SIZE / 2
              ]}
            >
              <boxGeometry args={[TILE_SIZE * 0.9, 0.2, TILE_SIZE * 0.9]} />
              <meshBasicMaterial color={highlight.color} opacity={0.5} transparent depthTest={false} />
            </mesh>
          ));
        } else if (highlight.type === 'relation' && highlight.positions.length >= 2) {
          // Render dashed line between segment midpoints to show relation
          const points = highlight.positions.map(p => new THREE.Vector3(
            p.x * TILE_SIZE + TILE_SIZE / 2,
            p.y * TILE_SIZE + TILE_SIZE / 2 + 1.0, // Above blocks
            p.z * TILE_SIZE + TILE_SIZE / 2
          ));
          return (
            <Line
              key={highlight.id}
              points={points}
              color={highlight.color}
              lineWidth={3}
              opacity={0.9}
              transparent
              dashed
              dashSize={0.5}
              gapSize={0.3}
              depthTest={false}
            />
          );
        }
        return null;
      })}
    </>
  );
};

const SceneContent = (props: BuilderSceneProps & { cameraControlsRef: React.RefObject<CameraControls | null> }) => {
  const { camera, raycaster, scene } = useThree();
  const [pointer, setPointer] = useState(new THREE.Vector2(99, 99));
  const rollOverMeshRef = useRef<THREE.Group>(null!);
  const [isShiftDown, setIsShiftDown] = useState(false); // <-- THÊM LẠI: Theo dõi phím Shift
  const [isSpaceDown, setIsSpaceDown] = useState(false); // <-- THAY ĐỔI: Theo dõi phím Space
  const [isAltDown, setIsAltDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // Dùng cho chọn vùng
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null); // State cho hiệu ứng hover
  // Ref mới để lưu trạng thái bắt đầu kéo (vị trí đối tượng và vị trí chuột)
  const placedObjectsGroupRef = useRef<THREE.Group>(null!); // Ref cho group chứa các đối tượng
  const dragStartRef = useRef<{ objectPos: [number, number, number], mousePos: { x: number, y: number }, originalPositions?: Array<{ id: string, pos: [number, number, number] }> } | null>(null);

  const {

    builderMode, selectedAsset, placedObjects, boxDimensions, onModeChange,
    isMovingObject, onSetIsMovingObject, selectionStart,
    onAddObject, onRemoveObject, selectionBounds, onSetSelectionStart, onSetSelectionEnd, cameraControlsRef, selectedObjectIds, onSelectObject, onMoveObject, onMoveObjectsBatch, onSelectMultipleObjects, onMoveObjectByStep, onObjectContextMenu,
    solutionPath,
    highlights, // Destructure highlights prop
    activeLayer, // NEW: Destructure activeLayer for dimming feature
    onSmartSelect,
    onObjectHover,
    hoverPreviewIds,
    selectionMode,
    isRotating,
    rotateSnapAngle,
    onRotateObjects,
    onSetIsRotating,
    isFillMode,
    fillPreviewPositions,
    onFillPreview,
    onFillExecute,
    symmetryEnabled,
    symmetryAxis,
    symmetryCenter,
    isPasteMode,
    pastePreviewPositions,
    onPastePreview,
    onPasteExecute
  } = props;


  const plane = useMemo(() => new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ visible: false, depthWrite: false, name: 'ground_plane' })
  ), []);

  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (controls) {
      controls.enabled = true;

      const ROTATE_ACTION = 1;
      const TRUCK_ACTION = 2;
      const NO_ACTION = 0;

      // --- LOGIC ĐIỀU HƯỚNG THEO NGỮ CẢNH (CẬP NHẬT) ---
      if (builderMode === 'build-area' || selectedObjectIds.length > 0 || isShiftDown) {
        // KHI Ở CHẾ ĐỘ CHỌN VÙNG, KHI CÓ ĐỐI TƯỢNG ĐƯỢC CHỌN, hoặc KHI GIỮ SHIFT:
        // Dành chuột trái cho tương tác (chọn vùng, di chuyển đối tượng, Shift+Drag area).
        controls.mouseButtons.left = NO_ACTION;
        // Dùng chuột phải để điều hướng.
      } else if (builderMode === 'build-single') {
        // KHI Ở CHẾ ĐỘ BUILD: Dành chuột trái để đặt khối.
        controls.mouseButtons.left = NO_ACTION;
      } else {
        // CHẾ ĐỘ NAVIGATE MẶC ĐỊNH: Dùng chuột trái để điều hướng.
        controls.mouseButtons.left = isSpaceDown ? TRUCK_ACTION : ROTATE_ACTION;
      }
      // Áp dụng cho tất cả các chế độ: Chuột phải dùng để xoay hoặc pan.
      controls.mouseButtons.right = isSpaceDown ? TRUCK_ACTION : ROTATE_ACTION;

      // Giữ nguyên các nút khác nếu cần
      controls.mouseButtons.middle = THREE.MOUSE.DOLLY;
    }
  }, [builderMode, cameraControlsRef, isSpaceDown, isShiftDown, selectedObjectIds]); // Thêm isShiftDown vào dependencies

  const boundingBoxPosition = useMemo((): [number, number, number] => [
    (boxDimensions.width * TILE_SIZE) / 2,
    (boxDimensions.height * TILE_SIZE) / 2,
    (boxDimensions.depth * TILE_SIZE) / 2,
  ], [boxDimensions]);

  const getGridPositionFromIntersection = (intersect: THREE.Intersection): [number, number, number] | null => {
    if (!intersect.face) return null;
    const newPosVec = new THREE.Vector3().copy(intersect.point).add(intersect.face.normal);
    return [
      Math.floor(newPosVec.x / TILE_SIZE),
      Math.floor(newPosVec.y / TILE_SIZE),
      Math.floor(newPosVec.z / TILE_SIZE)
    ];
  };

  // --- HÀM MỚI: Tính toán vị trí lưới cho việc lựa chọn (selection) ---
  const getGridPositionForSelection = (intersect: THREE.Intersection): [number, number, number] | null => {
    // Nếu con trỏ chuột trúng một đối tượng đã đặt, chúng ta muốn chọn chính đối tượng đó.
    // Vì vậy, chúng ta trừ đi một nửa vector pháp tuyến của mặt bị trúng để lấy vị trí bên trong khối.
    if (intersect.object.name !== 'ground_plane' && intersect.face) {
      let posVec = new THREE.Vector3().copy(intersect.point).sub(intersect.face.normal.clone().multiplyScalar(0.1));
      // Hạn chế không cho tọa độ Y nhỏ hơn 0
      if (posVec.y < 0) posVec.y = 0;
      return [Math.floor(posVec.x / TILE_SIZE), Math.floor(posVec.y / TILE_SIZE), Math.floor(posVec.z / TILE_SIZE)];
    }

    // Nếu con trỏ chuột trúng mặt phẳng đất, chúng ta tính toán như bình thường.
    const posVec = new THREE.Vector3().copy(intersect.point);
    return [Math.floor(posVec.x / TILE_SIZE), Math.floor(posVec.y / TILE_SIZE), Math.floor(posVec.z / TILE_SIZE)];
  };
  // --- KẾT THÚC HÀM MỚI ---

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftDown(true); // <-- THÊM LẠI: Lắng nghe phím Shift
      if (event.code === 'Space') setIsSpaceDown(true); // <-- THAY ĐỔI: Lắng nghe phím Space
      if (event.key === 'Alt') setIsAltDown(true); // Bắt sự kiện nhấn Alt
      if (event.key.toLowerCase() === 'b') onModeChange('build-single');
      // S = Select mode (navigate with selection capabilities)
      if (event.key.toLowerCase() === 's') onModeChange('navigate');
      if (event.key === 'Escape') {
        // Nếu đang có đối tượng được chọn, Esc sẽ bỏ chọn.
        // Nếu không, Esc sẽ chuyển về chế độ Navigate.
        if (selectedObjectIds.length > 0) {
          onSelectObject(null, false);
        } else {
          onModeChange('navigate');
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftDown(false); // <-- THÊM LẠI: Lắng nghe phím Shift
      if (event.code === 'Space') setIsSpaceDown(false); // <-- THAY ĐỔI: Lắng nghe phím Space
      if (event.key === 'Alt') setIsAltDown(false); // Bắt sự kiện nhả Alt
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onModeChange, onSelectObject, selectedObjectIds]); // Thêm selectedObjectIds vào dependencies

  useFrame(() => {
    // Luôn cập nhật raycaster theo con trỏ chuột
    raycaster.setFromCamera(pointer, camera);

    // Logic cho RollOverMesh (con trỏ build)
    if (builderMode === 'build-single' && rollOverMeshRef.current) {
      const intersects = raycaster.intersectObjects([plane, ...placedObjectsGroupRef.current.children], true);
      const intersect = intersects.find(i => i.object.name !== 'RollOverMesh');

      if (intersect?.face) {
        const newPos = new THREE.Vector3().copy(intersect.point).add(intersect.face.normal)
          .divideScalar(TILE_SIZE).floor().multiplyScalar(TILE_SIZE).addScalar(TILE_SIZE / 2);
        if (!rollOverMeshRef.current.position.equals(newPos)) {
          rollOverMeshRef.current.position.copy(newPos);
        }
        rollOverMeshRef.current.visible = true;
      } else {
        rollOverMeshRef.current.visible = false;
      }
    } else if (rollOverMeshRef.current) {
      rollOverMeshRef.current.visible = false;
    }
  });
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    // --- LOGIC MỚI: Xử lý hiệu ứng Hover ---
    // Chỉ chạy khi không kéo/di chuyển đối tượng để tránh xung đột
    if (!isDragging && !isMovingObject) {
      raycaster.setFromCamera(event.pointer, camera);
      const intersects = raycaster.intersectObjects(placedObjectsGroupRef.current.children, true);
      const firstIntersect = intersects[0];

      let hoveredObject: THREE.Object3D | null | undefined = firstIntersect?.object;
      while (hoveredObject && !hoveredObject.userData.id) {
        hoveredObject = hoveredObject.parent;
      }

      // Cập nhật state nếu đối tượng hover thay đổi
      const newHoverId = hoveredObject?.userData.id || null;
      if (newHoverId !== hoveredObjectId) {
        setHoveredObjectId(newHoverId);
      }

      // Trigger Smart Select Hover
      if (selectionMode === 'smart' && onObjectHover) {
        onObjectHover(newHoverId);
      }

      // Trigger Fill Preview on empty area hover
      if (isFillMode && onFillPreview) {
        raycaster.setFromCamera(event.pointer, camera);
        const intersects = raycaster.intersectObjects([plane], true);
        const intersect = intersects[0];
        if (intersect) {
          const gridPos: [number, number, number] = [
            Math.floor(intersect.point.x / TILE_SIZE),
            Math.floor(intersect.point.y / TILE_SIZE),
            Math.floor(intersect.point.z / TILE_SIZE)
          ];
          onFillPreview(gridPos);
        } else {
          onFillPreview(null);
        }
      }

      // Trigger Paste Preview on hover
      if (isPasteMode && onPastePreview) {
        raycaster.setFromCamera(event.pointer, camera);
        const intersects = raycaster.intersectObjects([plane], true);
        const intersect = intersects[0];
        if (intersect) {
          const gridPos: [number, number, number] = [
            Math.floor(intersect.point.x / TILE_SIZE),
            Math.floor(intersect.point.y / TILE_SIZE),
            Math.floor(intersect.point.z / TILE_SIZE)
          ];
          onPastePreview(gridPos);
        } else {
          onPastePreview(null);
        }
      }
    }

    // Luôn cập nhật vị trí con trỏ để useFrame có thể sử dụng
    setPointer(event.pointer);

    // --- Logic kéo chọn vùng ---
    // UPDATED: Support Shift+Drag area selection in BOTH navigate and build-area modes
    const canAreaSelect = (builderMode === 'build-area' || (builderMode === 'navigate' && isShiftDown));
    if (canAreaSelect && isDragging && selectionStart) {
      // KHI KHÔNG GIỮ ALT: Kéo trên mặt phẳng XZ như bình thường.
      raycaster.setFromCamera(event.pointer, camera);
      const intersects = raycaster.intersectObjects([plane, ...placedObjectsGroupRef.current.children], true);
      const intersect = intersects.find(i => i.object.name !== 'RollOverMesh');
      if (intersect) {
        let gridPos = getGridPositionForSelection(intersect);
        if (gridPos && gridPos[1] < 0) gridPos[1] = 0;
        // Cập nhật điểm cuối với tọa độ X và Z mới, giữ nguyên Y.
        if (gridPos) onSetSelectionEnd(prev => prev ? [gridPos![0], prev[1], gridPos![2]] : gridPos);
      }
    }
    // --- Logic di chuyển đối tượng ---
    if (isMovingObject && selectedObjectIds.length === 1 && dragStartRef.current) {
      if (isShiftDown) {
        // --- LOGIC SNAP DỌC (TRỤC Y) ---
        const deltaY = dragStartRef.current.mousePos.y - event.clientY; // Kéo lên -> deltaY dương
        const PIXELS_PER_UNIT = 30; // Độ nhạy: cần kéo 30px để di chuyển 1 ô
        const unitsToMove = Math.round(deltaY / PIXELS_PER_UNIT);

        const newY = dragStartRef.current.objectPos[1] + unitsToMove;
        const finalPos: [number, number, number] = [dragStartRef.current.objectPos[0], newY, dragStartRef.current.objectPos[2]];

        onMoveObject(selectedObjectIds[0], finalPos);
      } else {
        // --- LOGIC SNAP TRÊN MẶT PHẲNG (XZ) ---
        raycaster.setFromCamera(event.pointer, camera);
        const intersects = raycaster.intersectObjects([plane], true);
        const intersect = intersects[0];
        if (intersect) {
          const newGridPos = getGridPositionFromIntersection(intersect);
          // Giữ nguyên trục Y của đối tượng hiện tại khi kéo trên mặt phẳng
          if (newGridPos) {
            const finalPos: [number, number, number] = [newGridPos[0], dragStartRef.current.objectPos[1], newGridPos[2]];
            onMoveObject(selectedObjectIds[0], finalPos);
          }
        }
      }
    }
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    // Không cần kiểm tra phím đặc biệt ở đây nữa vì chuột trái đã được tách riêng

    if (event.button !== 0) return;
    raycaster.setFromCamera(event.pointer, camera);
    const objectsToIntersect = [plane, ...placedObjectsGroupRef.current.children];
    // --- THAY ĐỔI: Đảm bảo raycaster nhắm vào cả mặt phẳng và các đối tượng đã đặt ---
    const intersects = raycaster.intersectObjects(objectsToIntersect, true);
    // Lọc ra đối tượng rollover để tránh click vào chính nó
    const intersect = intersects.find(i => i.object.name !== 'RollOverMesh');

    // --- FILL MODE: Execute fill on click ---
    if (isFillMode && onFillExecute && intersect) {
      const gridPos: [number, number, number] = [
        Math.floor(intersect.point.x / TILE_SIZE),
        Math.floor(intersect.point.y / TILE_SIZE),
        Math.floor(intersect.point.z / TILE_SIZE)
      ];
      onFillExecute(gridPos);
      return; // Don't process further
    }

    // --- PASTE MODE: Execute paste on click ---
    if (isPasteMode && onPasteExecute && intersect) {
      const gridPos: [number, number, number] = [
        Math.floor(intersect.point.x / TILE_SIZE),
        Math.floor(intersect.point.y / TILE_SIZE),
        Math.floor(intersect.point.z / TILE_SIZE)
      ];
      onPasteExecute(gridPos);
      return; // Don't process further
    }

    // --- START: LOGIC CLICK ĐÃ ĐƯỢC TÁI CẤU TRÚC ---
    // 1. Luôn xác định đối tượng được click.
    let clickedObjectForSelection: THREE.Object3D | null | undefined = intersect?.object;
    while (clickedObjectForSelection && !clickedObjectForSelection.userData.id) {
      clickedObjectForSelection = clickedObjectForSelection.parent;
    }
    const clickedId = clickedObjectForSelection?.userData.id || null;

    // 2. Chỉ chọn đối tượng nếu KHÔNG phải chế độ build-single (hoặc nếu click vào chính đối tượng đã chọn để di chuyển?)
    // Trong chế độ build, click là để đặt khối, không phải chọn.
    if (builderMode !== 'build-single') {
      onSelectObject(clickedId, isShiftDown);

      // 3. Nếu App.tsx quyết định bắt đầu di chuyển, chúng ta lưu lại vị trí ban đầu.
      const objectToMove = clickedId ? placedObjects.find(o => o.id === clickedId) : null;
      if (objectToMove) {
        dragStartRef.current = { objectPos: objectToMove.position, mousePos: { x: event.clientX, y: event.clientY } };
      }
    }
    // --- END: LOGIC CLICK ĐÃ ĐƯỢC TÁI CẤU TRÚC ---

    if (!intersect) return;
    const gridPosition = getGridPositionFromIntersection(intersect);
    if (!gridPosition) return;

    if (builderMode === 'build-single') {
      if (selectedAsset) {
        const [x, y, z] = gridPosition;
        if (x >= 0 && x < boxDimensions.width && y >= 0 && y < boxDimensions.height && z >= 0 && z < boxDimensions.depth) {
          onAddObject(gridPosition, selectedAsset);
        }
      }
    } else if (builderMode === 'build-area' || (builderMode === 'navigate' && isShiftDown)) {
      // --- UPDATED: Support Shift+Drag area selection in navigate mode ---
      let startPos: [number, number, number] | null = null;

      // Ưu tiên 1: Nếu click trúng một đối tượng, lấy vị trí của đối tượng đó làm điểm bắt đầu.
      const clickedObject = clickedId ? placedObjects.find(o => o.id === clickedId) : null;
      if (clickedObject) {
        startPos = clickedObject.position;
      } else {
        // Ưu tiên 2: Nếu không, lấy vị trí trên lưới như bình thường.
        startPos = getGridPositionForSelection(intersect);
      }

      if (!startPos) return;

      setIsDragging(true);
      onSetSelectionStart(startPos);
      onSetSelectionEnd(startPos);

      // --- SMART SELECT LOGIC (only when not area selecting) ---
      if (selectionMode === 'smart' && onSmartSelect && clickedId && !isShiftDown) {
        onSmartSelect(clickedId);
        return;
      }
    } else if (builderMode === 'navigate') {
      // --- Normal navigate mode: Smart select on click ---
      if (selectionMode === 'smart' && onSmartSelect && clickedId) {
        onSmartSelect(clickedId);
      }
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      setIsDragging(false);
      // ENHANCED: Commit area selection on drag end
      // If we are in 'navigate' (Shift+Drag) or 'build-area', and we have a selection box,
      // we should select the objects inside it.
      if ((builderMode === 'build-area' || (builderMode === 'navigate' && isShiftDown)) && selectionStart) {
        // Update valid selection
        if (onSelectMultipleObjects) {
          onSelectMultipleObjects(hoverPreviewIds || []);
        }

        // Only clear the box if in 'navigate' mode (Marquee Tool behavior)
        // In 'build-area' mode, we keep the box for Fill/Edit operations
        if (builderMode === 'navigate') {
          onSetSelectionStart(null);
          onSetSelectionEnd(null);
        }
      }
    }
    if (isMovingObject) {
      onSetIsMovingObject(false); // Cập nhật state ở App.tsx
      dragStartRef.current = null; // Xóa trạng thái khi nhả chuột
      // Logic để "commit" vị trí mới vào history có thể được thêm ở đây nếu cần
    }

    // --- THAY ĐỔI: Logic xóa đối tượng bằng Shift + Click chuột phải ---
    // Đổi từ isSpaceDown sang isShiftDown để tránh xung đột với điều hướng
    if (event.button === 2 && isShiftDown && builderMode === 'build-single') {
      raycaster.setFromCamera(event.pointer, camera);
      const objectsToIntersect = scene.children.filter(c => c.userData.isPlacedObject);
      const intersects = raycaster.intersectObjects(objectsToIntersect, true);
      const intersect = intersects.find(i => i.object.name !== 'RollOverMesh');

      if (intersect) {
        let objectToRemove = intersect.object;
        while (objectToRemove.parent && !objectToRemove.userData.id) objectToRemove = objectToRemove.parent;
        if (objectToRemove.userData.isPlacedObject) onRemoveObject(objectToRemove.userData.id);
      }
    }
  };

  return (
    <>
      <Grid position={[0, -0.01, 0]} args={[100, 100]} cellSize={TILE_SIZE} cellThickness={1} cellColor="#6f6f6f" sectionSize={10} sectionThickness={1.5} sectionColor="#2c89d7" fadeDistance={150} fadeStrength={1} infiniteGrid />
      <BoundingBox dimensions={boxDimensions} position={boundingBoxPosition} />

      {/* Symmetry Axis Lines */}
      {symmetryEnabled && symmetryCenter && (
        <group>
          {/* X axis line (horizontal at centerZ) */}
          {(symmetryAxis === 'x' || symmetryAxis === 'both') && (
            <Line
              points={[
                [0, 0.1, symmetryCenter.z * TILE_SIZE],
                [boxDimensions.width * TILE_SIZE, 0.1, symmetryCenter.z * TILE_SIZE]
              ]}
              color="#00ff88"
              lineWidth={3}
              dashed
              dashSize={0.5}
              gapSize={0.3}
            />
          )}
          {/* Z axis line (vertical at centerX) */}
          {(symmetryAxis === 'z' || symmetryAxis === 'both') && (
            <Line
              points={[
                [symmetryCenter.x * TILE_SIZE, 0.1, 0],
                [symmetryCenter.x * TILE_SIZE, 0.1, boxDimensions.depth * TILE_SIZE]
              ]}
              color="#00ff88"
              lineWidth={3}
              dashed
              dashSize={0.5}
              gapSize={0.3}
            />
          )}
          {/* Center point indicator for 'both' mode */}
          {symmetryAxis === 'both' && (
            <mesh position={[symmetryCenter.x * TILE_SIZE, 0.2, symmetryCenter.z * TILE_SIZE]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
          )}
        </group>
      )}

      {selectionBounds && <SelectionBox bounds={selectionBounds} />}
      <group ref={rollOverMeshRef}>
        <RollOverMesh selectedAsset={selectedAsset} />
      </group>
      <group ref={placedObjectsGroupRef}>
        {placedObjects.map(obj => <Suspense key={obj.id} fallback={null}><PlacedAsset
          object={obj}
          isSelected={selectedObjectIds.includes(obj.id)}
          isHovered={obj.id === hoveredObjectId}
          activeLayer={activeLayer}
          onContextMenu={(e) => {
            e.stopPropagation();
            onObjectContextMenu(e.nativeEvent, obj.id);
          }}
          isPreview={hoverPreviewIds?.includes(obj.id)}
        /></Suspense>)}
      </group>
      <PortalConnections objects={placedObjects} />

      {/* Transform Gizmo - Show when objects are selected */}
      {selectedObjectIds.length >= 1 && (() => {
        // Get all selected objects
        const selectedObjs = placedObjects.filter(o => selectedObjectIds.includes(o.id));
        if (selectedObjs.length === 0) return null;

        // Calculate center position of all selected objects
        const centerX = selectedObjs.reduce((sum, o) => sum + o.position[0], 0) / selectedObjs.length;
        const centerY = selectedObjs.reduce((sum, o) => sum + o.position[1], 0) / selectedObjs.length;
        const centerZ = selectedObjs.reduce((sum, o) => sum + o.position[2], 0) / selectedObjs.length;

        const gizmoPosition: [number, number, number] = [
          centerX * TILE_SIZE + TILE_SIZE / 2,
          centerY * TILE_SIZE + TILE_SIZE / 2,
          centerZ * TILE_SIZE + TILE_SIZE / 2,
        ];

        return (
          <TransformGizmo
            position={gizmoPosition}
            scale={2}
            onDragStart={() => {
              onSetIsMovingObject(true);
              // Store original positions of all selected objects
              dragStartRef.current = {
                objectPos: [0, 0, 0],
                mousePos: { x: 0, y: 0 },
                originalPositions: selectedObjs.map(o => ({ id: o.id, pos: [...o.position] as [number, number, number] }))
              };
            }}
            onDrag={(axis, delta) => {
              if (!axis || !dragStartRef.current?.originalPositions) return;

              // Calculate grid delta from original position
              // Note: delta is already snapped by TransformGizmo
              const gridDelta = Math.round(delta / TILE_SIZE);

              // Build batch of all moves at once
              const moves: Array<{ id: string; position: [number, number, number] }> = [];

              dragStartRef.current.originalPositions.forEach(({ id, pos }) => {
                const newPos: [number, number, number] = [...pos];
                if (axis === 'x') newPos[0] = pos[0] + gridDelta;
                if (axis === 'y') newPos[1] = pos[1] + gridDelta;
                if (axis === 'z') newPos[2] = pos[2] + gridDelta;
                moves.push({ id, position: newPos });
              });

              // Move ALL objects in a single batch update
              if (onMoveObjectsBatch) {
                onMoveObjectsBatch(moves);
              } else {
                // Fallback to individual moves if batch not available
                moves.forEach(m => onMoveObject(m.id, m.position));
              }
            }}
            onDragEnd={() => {
              onSetIsMovingObject(false);
              dragStartRef.current = null;
            }}
          />
        );
      })()}

      {/* Rotate Gizmo - Show when rotation mode is active */}
      {isRotating && selectedObjectIds.length >= 1 && (() => {
        const selectedObjs = placedObjects.filter(o => selectedObjectIds.includes(o.id));
        if (selectedObjs.length === 0) return null;

        // Calculate center position
        const centerX = selectedObjs.reduce((sum, o) => sum + o.position[0], 0) / selectedObjs.length;
        const centerY = selectedObjs.reduce((sum, o) => sum + o.position[1], 0) / selectedObjs.length;
        const centerZ = selectedObjs.reduce((sum, o) => sum + o.position[2], 0) / selectedObjs.length;

        const gizmoPosition: [number, number, number] = [
          centerX * TILE_SIZE + TILE_SIZE / 2,
          centerY * TILE_SIZE + TILE_SIZE / 2 + 0.5, // Slightly above
          centerZ * TILE_SIZE + TILE_SIZE / 2,
        ];

        return (
          <RotateGizmo
            position={gizmoPosition}
            scale={2}
            snapAngle={rotateSnapAngle}
            onRotateStart={() => onSetIsRotating?.(true)}
            onRotate={(angle) => onRotateObjects?.(angle)}
            onRotateEnd={() => onSetIsRotating?.(false)}
          />
        );
      })()}

      {/* Fill Preview - Show positions that would be filled */}
      {isFillMode && fillPreviewPositions && fillPreviewPositions.length > 0 && (
        <group>
          {fillPreviewPositions.map((pos, idx) => (
            <mesh
              key={`fill-preview-${idx}`}
              position={[
                pos[0] * TILE_SIZE + TILE_SIZE / 2,
                pos[1] * TILE_SIZE + TILE_SIZE / 2,
                pos[2] * TILE_SIZE + TILE_SIZE / 2
              ]}
              scale={TILE_SIZE * 0.95}
            >
              <boxGeometry args={[1, 1, 1]} />
              <primitive object={fillPreviewMaterial} attach="material" />
            </mesh>
          ))}
          {/* Show count badge */}
          <group position={[
            fillPreviewPositions[0][0] * TILE_SIZE + TILE_SIZE / 2,
            fillPreviewPositions[0][1] * TILE_SIZE + TILE_SIZE + 1,
            fillPreviewPositions[0][2] * TILE_SIZE + TILE_SIZE / 2
          ]}>
            {/* Count indicator sphere */}
            <mesh>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
          </group>
        </group>
      )}

      {/* Paste Preview - Show positions that would be pasted */}
      {isPasteMode && pastePreviewPositions && pastePreviewPositions.length > 0 && (
        <group>
          {pastePreviewPositions.map((pos, idx) => (
            <mesh
              key={`paste-preview-${idx}`}
              position={[
                pos[0] * TILE_SIZE + TILE_SIZE / 2,
                pos[1] * TILE_SIZE + TILE_SIZE / 2,
                pos[2] * TILE_SIZE + TILE_SIZE / 2
              ]}
              scale={TILE_SIZE * 0.9}
            >
              <boxGeometry args={[1, 1, 1]} />
              <primitive object={pastePreviewMaterial} attach="material" />
            </mesh>
          ))}
          {/* Count indicator */}
          <group position={[
            pastePreviewPositions[0][0] * TILE_SIZE + TILE_SIZE / 2,
            pastePreviewPositions[0][1] * TILE_SIZE + TILE_SIZE + 1,
            pastePreviewPositions[0][2] * TILE_SIZE + TILE_SIZE / 2
          ]}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshBasicMaterial color="#00ccff" />
            </mesh>
          </group>
        </group>
      )}

      {solutionPath && <SolutionOverlay path={solutionPath} />}
      {highlights && highlights.length > 0 && <HighlightLines highlights={highlights} />}
      <primitive object={plane} onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerOut={() => setPointer(new THREE.Vector2(99, 99))} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ff2060', '#20ff60', '#2060ff']} labelColor="white" />
      </GizmoHelper>
    </>
  );
};

export const BuilderScene = forwardRef<SceneController, BuilderSceneProps>((props, ref) => {
  const cameraControlsRef = useRef<CameraControls | null>(null);

  useImperativeHandle(ref, () => ({
    changeView: (view) => {
      const controls = cameraControlsRef.current;
      if (!controls) return;
      const { width, height, depth } = props.boxDimensions;
      const centerX = (width * TILE_SIZE) / 2;
      const centerY = (height * TILE_SIZE) / 2;
      const centerZ = (depth * TILE_SIZE) / 2;
      const distance = Math.max(width, height, depth) * TILE_SIZE * 1.5;

      switch (view) {
        case 'top': controls.setLookAt(centerX, distance, centerZ, centerX, centerY, centerZ, true); break;
        case 'front': controls.setLookAt(centerX, centerY, distance, centerX, centerY, centerZ, true); break;
        case 'side': controls.setLookAt(distance, centerY, centerZ, centerX, centerY, centerZ, true); break;
        case 'perspective':
        default: controls.setLookAt(centerX + 15, centerY + 20, centerZ + 25, centerX, centerY, centerZ, true); break;
      }
    },
  }));

  return (
    <Canvas shadows camera={{ position: [15, 20, 25], fov: 60 }} onCreated={({ scene }) => { scene.add(new THREE.AmbientLight(0.5)); }}>
      <color attach="background" args={['#1e1e1e']} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <Suspense fallback={null}>
        <SceneContent {...props} cameraControlsRef={cameraControlsRef} />
      </Suspense>
      <CameraControls ref={cameraControlsRef} makeDefault />
    </Canvas>
  );
});

// useGLTF.preload is only for glb/gltf files
const pathsToPreload = buildableAssetGroups
  .flatMap((g: AssetGroup) => g.items.map((i: BuildableAsset) => i.path))
  .filter((path): path is string => !!path);

useGLTF.preload(pathsToPreload);