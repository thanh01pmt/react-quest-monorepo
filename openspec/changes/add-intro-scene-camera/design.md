# Design: Intro Scene Camera System

## Context

Quest Player cần hỗ trợ camera animation khi bắt đầu màn chơi 3D maze để giới thiệu tổng quan về màn chơi trước khi người dùng bắt đầu code.

## Goals

- Thêm 5 chế độ QuickShots camera animation
- Camera luôn hướng về tâm màn chơi trong suốt animation
- Smooth transition về Follow mode sau khi intro kết thúc
- Không ảnh hưởng đến các quest hiện tại (backward compatible)

## Non-Goals

- UI control để chọn intro type (sẽ do app bên ngoài xử lý)
- Cho phép skip intro bằng phím (có thể bổ sung sau)
- Custom trajectory path (chỉ hỗ trợ 5 preset)

## Decisions

### 1. IntroSceneConfig Interface

```typescript
interface IntroSceneConfig {
  enabled: boolean;
  type: 'dronie' | 'rocket' | 'circle' | 'helix' | 'boomerang';
  duration: number; // milliseconds
  
  // Type-specific parameters
  distance?: number;   // dronie
  height?: number;     // rocket, helix, boomerang
  radius?: number;     // circle, helix
  radiusX?: number;    // boomerang
  radiusZ?: number;    // boomerang
  loops?: number;      // circle, helix (default: 1)
}
```

### 2. Trajectory Functions

Mỗi trajectory function nhận:
- `t`: progress từ 0 đến 1
- `config`: IntroSceneConfig
- `mapCenter`: Vector3 tâm màn chơi
- `initialCameraPos`: Vector3 vị trí camera ban đầu

Trả về: `Vector3` vị trí camera tại thời điểm `t`

```typescript
type TrajectoryFn = (
  t: number, 
  config: IntroSceneConfig, 
  mapCenter: THREE.Vector3,
  initialPos: THREE.Vector3
) => THREE.Vector3;

const trajectories: Record<string, TrajectoryFn> = {
  dronie: (t, config, center, initial) => { ... },
  rocket: (t, config, center, initial) => { ... },
  circle: (t, config, center, initial) => { ... },
  helix: (t, config, center, initial) => { ... },
  boomerang: (t, config, center, initial) => { ... },
};
```

### 3. Animation với useFrame

Sử dụng `useFrame` từ `@react-three/fiber` để cập nhật camera position mỗi frame:

```typescript
useFrame((_, delta) => {
  if (!isPlaying) return;
  
  elapsed += delta * 1000;
  const t = Math.min(elapsed / duration, 1);
  
  const newPos = trajectoryFn(t, config, mapCenter, initialPos);
  camera.position.copy(newPos);
  camera.lookAt(mapCenter);
  
  if (t >= 1) {
    onComplete();
  }
});
```

### 4. Smooth Transition Logic

Khi intro kết thúc, `CameraRig` sẽ:
1. Lưu vị trí cuối của intro camera
2. Tính vị trí follow player
3. Lerp giữa hai vị trí trong 800ms

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Performance với map lớn | Trajectory functions đơn giản, chỉ tính toán cơ bản |
| Jerky transition | Sử dụng easing function (ease-out) cho transition |
| Config validation | Thêm default values cho tất cả optional params |

## Open Questions

1. Có cần hỗ trợ `onIntroStart` callback không? (Để app có thể show UI như "Tap to skip")
2. Có cần `pauseIntro()` và `resumeIntro()` methods không?
