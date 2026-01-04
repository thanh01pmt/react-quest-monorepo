# Coordinate System & Direction Standard

This document defines the **canonical coordinate system and direction convention** for the React Quest Monorepo project.

## Coordinate System (Three.js Right-Handed, Y-Up)

```
        +Y (Up)
         ^
         |
         +-------> +X (East)
        /
       v
     +Z (North)
```

- **+X**: East (Right)
- **-X**: West (Left)
- **+Z**: North (Forward, towards camera)
- **-Z**: South (Backward, away from camera)
- **+Y**: Up
- **-Y**: Down

---

## Direction Index Convention

| Index | Axis  | Direction | Movement |
|-------|-------|-----------|----------|
| `0`   | -Z    | **South** | `z--`    |
| `1`   | +X    | **East**  | `x++`    |
| `2`   | +Z    | **North** | `z++`    |
| `3`   | -X    | **West**  | `x--`    |

---

## Turn Logic

| Action     | Formula                   | Progression       |
|------------|---------------------------|-------------------|
| Turn Right | `(direction + 1) % 4`     | S→E→N→W→S         |
| Turn Left  | `(direction - 1 + 4) % 4` | S→W→N→E→S         |

---

## Movement (MazeEngine.ts & gameSolver.ts)

```typescript
// MazeEngine.ts
if (direction === 0) z--;       // South = -Z
else if (direction === 1) x++;  // East = +X
else if (direction === 2) z++;  // North = +Z
else if (direction === 3) x--;  // West = -X

// gameSolver.ts
const directions = [
  { x: 0, z: -1 },  // 0: South (-Z)
  { x: 1, z: 0 },   // 1: East (+X)
  { x: 0, z: 1 },   // 2: North (+Z)
  { x: -1, z: 0 },  // 3: West (-X)
];
```

---

## Visual Rotation

### PlayerStartRenderer (Cone)

Cone tip points **-Z (South)** after baseRotation:

```typescript
const rotationMap = {
  0: 0,             // South: no rotation
  1: -Math.PI / 2,  // East: -90°
  2: Math.PI,       // North: 180°
  3: Math.PI / 2,   // West: +90°
};
```

### RobotCharacter

Robot faces **+Z (North)** by default:

```typescript
const DIRECTION_TO_ROTATION = {
  0: Math.PI,       // South: 180°
  1: Math.PI / 2,   // East: +90°
  2: 0,             // North: no rotation
  3: -Math.PI / 2,  // West: -90°
};
```

---

## PropertiesPanel Labels

```
value="0" → ↓ South (0)
value="1" → → East (1)
value="2" → ↑ North (2)
value="3" → ← West (3)
```

---

## Summary

| Property | Value |
|----------|-------|
| Index 0 | South (-Z) |
| Index 1 | East (+X) |
| Index 2 | North (+Z) |
| Index 3 | West (-X) |
| Turn Right | `direction + 1` |
| Turn Left | `direction - 1` |
| Cone Default | -Z (South) |
| Robot Default | +Z (North) |
