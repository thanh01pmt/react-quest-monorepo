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

### Important Note on Visual vs Mathematical Convention

The **visual** actions "Turn Left" and "Turn Right" are defined from the **player's screen perspective**, which is **opposite** to the mathematical index progression:

- **Index increases (+1)**: Moves CCW in the diagram above (E→N→W→S)
- **Visual "Turn Left"**: Player sees character rotate CCW on screen = index **decreases** (-1 or +3)
- **Visual "Turn Right"**: Player sees character rotate CW on screen = index **increases** (+1)

### Turn Formulas

| Action         | Formula                | Index Progression       | Visual Effect           |
|----------------|------------------------|-------------------------|-------------------------|
| **Turn Left**  | `(direction + 3) % 4`  | E→S→W→N→E (index -1)    | CCW rotation on screen  |
| **Turn Right** | `(direction + 1) % 4`  | E→N→W→S→E (index +1)    | CW rotation on screen   |

### Examples

- Facing East (0), turn left → South (3) — robot rotates CCW, now facing down
- Facing North (1), turn right → East (0) — robot rotates CW, now facing right
- Facing South (3), turn left → East (0) — robot rotates CCW, now facing right

---

## Movement Logic

The `getNextPosition` function maps each direction index to a movement delta:

```typescript
private getNextPosition(x: number, z: number, direction: Direction): { x: number, z: number } {
  // 0=East(+X), 1=North(+Z), 2=West(-X), 3=South(-Z)
  if (direction === 0) x++;       // East = +X
  else if (direction === 1) z++;  // North = +Z
  else if (direction === 2) x--;  // West = -X
  else if (direction === 3) z--;  // South = -Z
  return { x, z };
}
```

Equivalent array form:

```typescript
const directions = [
  { x: 1, z: 0 },  // 0: East (+X)
  { x: 0, z: 1 },  // 1: North (+Z)
  { x: -1, z: 0 }, // 2: West (-X)
  { x: 0, z: -1 }, // 3: South (-Z)
];
```

---

## Visual Representation

### Robot Model (RobotCharacter.tsx)

The robot 3D model faces **+Z (North)** by default (when Y-rotation = 0). The `DIRECTION_TO_ROTATION` map converts direction index to Y-axis rotation:

```typescript
const DIRECTION_TO_ROTATION: Record<Direction, number> = {
  0: Math.PI / 2,   // East (+X): +90° from +Z
  1: 0,             // North (+Z): no rotation (default facing)
  2: -Math.PI / 2,  // West (-X): -90° from +Z
  3: -Math.PI,      // South (-Z): 180° from +Z
};
```

**Pattern**: Each index increase of 1 corresponds to a rotation decrease of π/2 (90°).

### PlayerStartRenderer (Builder Cone)

The cone in the Builder uses a `baseRotation` of `Math.PI / 2` on the X-axis, making the cone tip point towards **+X (East)** by default. The Y-rotation then adjusts to the target direction:

```typescript
const rotationMap: Record<number, number> = {
  0: 0,             // East (+X): no extra Y rotation (default after baseRotation)
  1: -Math.PI / 2,  // North (+Z): -90° Y rotation
  2: Math.PI,       // West (-X): 180° Y rotation
  3: Math.PI / 2,   // South (-Z): +90° Y rotation
};
```

---

## Three.js Rotation Convention

In Three.js with right-hand rule:

- **Positive Y-rotation**: Object rotates from +Z towards +X (CW when viewed from above)
- **Negative Y-rotation**: Object rotates from +Z towards -X (CCW when viewed from above)

| Y-Rotation | Effect on object facing +Z |
|------------|---------------------------|
| 0          | Faces +Z (North)          |
| +π/2       | Faces +X (East)           |
| +π or -π   | Faces -Z (South)          |
| -π/2       | Faces -X (West)           |

---

## Files Affected by This Standard

| File | Component | Role |
|------|-----------|------|
| `apps/map-builder-app/src/components/BuilderScene/index.tsx` | `PlayerStartRenderer` | Visual cone direction |
| `apps/map-builder-app/src/components/PropertiesPanel/PropertiesPanel.tsx` | Direction dropdown | UI labels |
| `apps/map-builder-app/src/components/QuestDetailsPanel/gameSolver.ts` | `directions[]`, `calculateTurnActions()` | Solver pathfinding |
| `packages/quest-player/src/games/maze/MazeEngine.ts` | `getNextPosition()`, `turnLeft()`, `turnRight()`, `isPath()` | Game engine |
| `packages/quest-player/src/games/maze/components/RobotCharacter.tsx` | `DIRECTION_TO_ROTATION` | Robot visual rotation |

---

## Summary

| Property | Value |
|----------|-------|
| Index 0 | East (+X, 0°) |
| Index 1 | North (+Z, 90°) |
| Index 2 | West (-X, 180°) |
| Index 3 | South (-Z, 270°) |
| Turn Left Formula | `(direction + 3) % 4` = index -1 |
| Turn Right Formula | `(direction + 1) % 4` = index +1 |
| Robot Default Facing | +Z (North) |
| Cone Default Facing | +X (East) after baseRotation |

---

## Changelog

- **2026-01-04**: Corrected Turn Left/Right formulas based on empirical testing. Turn Left = +3 (visual CCW), Turn Right = +1 (visual CW). Added Robot/Cone default facing directions and Three.js rotation convention details.
