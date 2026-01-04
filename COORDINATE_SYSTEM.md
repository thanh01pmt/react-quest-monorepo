# Coordinate System & Direction Standard

This document defines the **canonical coordinate system and direction convention** for the React Quest Monorepo project. All components (Builder, Player, Solver) MUST adhere to this standard.

## Coordinate System (Three.js Right-Handed, Y-Up)

```
        +Y (Up)
         ^
         |
         |
         +-------> +X (East/Right)
        /
       /
      v
    +Z (North/Forward - towards camera in default view)
```

- **+X**: Right / East
- **-X**: Left / West
- **+Y**: Up
- **-Y**: Down
- **+Z**: Forward / North (towards the viewer in a top-down camera looking at -Y)
- **-Z**: Backward / South

---

## Direction Index Convention (Mathematical CCW from +X)

Directions are stored as integer indices `0-3`. Angles are measured **counter-clockwise (CCW)** from the positive X-axis when viewed from above (+Y).

| Index | Direction | Axis | Angle (CCW from +X) | Arrow |
|-------|-----------|------|---------------------|-------|
| `0`   | **East**  | +X   | 0°                  | →     |
| `1`   | **North** | +Z   | 90°                 | ↑     |
| `2`   | **West**  | -X   | 180°                | ←     |
| `3`   | **South** | -Z   | 270°                | ↓     |

---

## Rotation / Turning Logic

When viewed from above (looking down along -Y axis), the direction indices progress **counter-clockwise**.

```
       North (1)
          ↑
          |
West (2) ←─┼─→ East (0)
          |
          ↓
       South (3)
```

### Turn Formulas

| Action       | Formula                        | Description                     |
|--------------|--------------------------------|---------------------------------|
| **Turn Left**  | `(direction + 1) % 4`          | CCW rotation (E→N→W→S→E)        |
| **Turn Right** | `(direction + 3) % 4` or `(direction - 1 + 4) % 4` | CW rotation (E→S→W→N→E) |

### Examples

- Facing East (0), turn left → North (1)
- Facing North (1), turn right → East (0)
- Facing South (3), turn left → East (0)

---

## Movement Logic

The `directions` array maps each index to a movement delta:

```typescript
const directions = [
  { x: 1, z: 0 },  // 0: East (+X)
  { x: 0, z: 1 },  // 1: North (+Z)
  { x: -1, z: 0 }, // 2: West (-X)
  { x: 0, z: -1 }, // 3: South (-Z)
];
```

To calculate the next position after moving forward:

```typescript
const dir = directions[currentDirection];
nextX = currentX + dir.x;
nextZ = currentZ + dir.z;
```

---

## Visual Representation (PlayerStartRenderer)

The `PlayerStartRenderer` cone uses a `baseRotation` of `Math.PI / 2` (90°) on the X-axis to make the cone tip point forward (+Z by default). An additional Y-axis rotation aligns it with the target direction:

```typescript
const rotationMap: Record<number, number> = {
  0: 0,             // East (+X): no extra Y rotation needed after base
  1: Math.PI / 2,   // North (+Z): +90° Y rotation
  2: Math.PI,       // West (-X): 180° Y rotation
  3: -Math.PI / 2   // South (-Z): -90° Y rotation
};
```

> **Note:** The exact `rotationMap` values depend on the `baseRotation` setting. The above assumes the cone initially points along +X after `baseRotation`.

---

## Files Affected by This Standard

| File | Component | Role |
|------|-----------|------|
| `apps/map-builder-app/src/components/BuilderScene/index.tsx` | `PlayerStartRenderer` | Visual cone direction |
| `apps/map-builder-app/src/components/PropertiesPanel/PropertiesPanel.tsx` | Direction dropdown | UI labels |
| `apps/map-builder-app/src/components/QuestDetailsPanel/gameSolver.ts` | `directions[]`, `calculateTurnActions()` | Solver pathfinding |
| `packages/quest-player/src/games/maze/MazeEngine.ts` | `getNextPosition()`, `turnLeft()`, `turnRight()`, `isPath()` | Game engine |

---

## Summary

- **Index 0 = East (+X, 0°)**
- **Index 1 = North (+Z, 90°)**
- **Index 2 = West (-X, 180°)**
- **Index 3 = South (-Z, 270°)**
- **Turn Left = +1 (CCW)**
- **Turn Right = -1 / +3 (CW)**
