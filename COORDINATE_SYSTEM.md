# Coordinate System & Direction Convention

This document defines the **canonical coordinate system and direction convention** for the React Quest Monorepo project. All components (Builder, Player, Solver) follow this standard.

---

## Three.js Coordinate System (Right-Handed, Y-Up)

```
        +Y (Up)
         ^
         |
         +-------> +X (West)
        /
       v
     +Z (North)
```

| Axis | Direction |
|------|-----------|
| +X | **West** |
| -X | **East** |
| +Z | **North** |
| -Z | **South** |
| +Y | Up |
| -Y | Down |

---

## Direction Index Convention

| Index | Movement | Axis | Label |
|-------|----------|------|-------|
| `0` | z-- | -Z | **South** |
| `1` | x++ | +X | **West** |
| `2` | z++ | +Z | **North** |
| `3` | x-- | -X | **East** |

---

## Turn Logic

```typescript
turnRight = (direction + 1) % 4
turnLeft  = (direction - 1 + 4) % 4
```

| Start | turnRight | turnLeft |
|-------|-----------|----------|
| South (0) | West (1) | East (3) |
| West (1) | North (2) | South (0) |
| North (2) | East (3) | West (1) |
| East (3) | South (0) | North (2) |

---

## Implementation Details

### MazeEngine.ts (Player)

```typescript
private getNextPosition(x, z, direction) {
  if (direction === 0) z--;      // South (-Z)
  else if (direction === 1) x++; // West (+X)
  else if (direction === 2) z++; // North (+Z)
  else if (direction === 3) x--; // East (-X)
  return { x, z };
}
```

### gameSolver.ts (Builder)

```typescript
const directions = [
  { x: 0, z: -1 },  // 0: South (-Z)
  { x: 1, z: 0 },   // 1: West (+X)
  { x: 0, z: 1 },   // 2: North (+Z)
  { x: -1, z: 0 },  // 3: East (-X)
];
```

### RobotCharacter.tsx (Player Visual)

Robot model faces **+Z (North)** by default:

```typescript
const DIRECTION_TO_ROTATION = {
  0: Math.PI,       // South: 180°
  1: Math.PI / 2,   // West: +90°
  2: 0,             // North: 0° (default)
  3: -Math.PI / 2,  // East: -90°
};
```

### PlayerStartRenderer (Builder Cone Visual)

Cone points **+X (West)** after baseRotation:

```typescript
const rotationMap = {
  0: Math.PI / 2,   // South (-Z): +90°
  1: 0,             // West (+X): 0° (default)
  2: -Math.PI / 2,  // North (+Z): -90°
  3: Math.PI,       // East (-X): 180°
};
```

### PropertiesPanel.tsx (Builder UI)

```tsx
<option value="0">South (0)</option>
<option value="1">West (1)</option>
<option value="2">North (2)</option>
<option value="3">East (3)</option>
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `packages/quest-player/src/games/maze/MazeEngine.ts` | Game engine movement |
| `packages/quest-player/src/games/maze/components/RobotCharacter.tsx` | Robot visual rotation |
| `apps/map-builder-app/src/components/BuilderScene/index.tsx` | Cone visual rotation |
| `apps/map-builder-app/src/components/PropertiesPanel/PropertiesPanel.tsx` | Direction dropdown |
| `apps/map-builder-app/src/components/QuestDetailsPanel/gameSolver.ts` | Pathfinding solver |

---

## Summary

| Property | Value |
|----------|-------|
| Index 0 | South (-Z) |
| Index 1 | West (+X) |
| Index 2 | North (+Z) |
| Index 3 | East (-X) |
| turnRight | `+1` |
| turnLeft | `-1` |
| Robot Default | +Z (North) |
| Cone Default | +X (West) |

---

*Last updated: 2026-01-05*
