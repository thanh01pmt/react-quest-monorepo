# Change: Fix Direction Convention in Quest Player

## Why

The `quest-player` package (MazeEngine.ts, RobotCharacter.tsx) uses a direction convention that is **90° offset and has inverted turn logic** compared to the documented standard in `COORDINATE_SYSTEM.md`. This causes maps created in Builder to behave incorrectly when played.

## What Changes

- **MazeEngine.ts**: Fix `getNextPosition()` to use correct axis mapping, and fix `turnLeft()`/`turnRight()` formulas
- **RobotCharacter.tsx**: Fix `DIRECTION_TO_ROTATION` map to match documented standard
- **COORDINATE_SYSTEM.md**: Update "Files Affected" section to ensure completeness

> [!IMPORTANT]
> This is a **BREAKING CHANGE** for existing quest JSON files that were tuned to work with the old (incorrect) convention. However, since Builder already uses the correct convention, fixing Player will align the two.

## Impact

- **Specs**: quest-player/maze-engine capability (if exists)
- **Code**:
  - `packages/quest-player/src/games/maze/MazeEngine.ts` (getNextPosition, turnLeft, turnRight)
  - `packages/quest-player/src/games/maze/components/RobotCharacter.tsx` (DIRECTION_TO_ROTATION)
  - `COORDINATE_SYSTEM.md` (documentation update)

## Discrepancy Analysis

### Turn Logic

| Component | Turn Left | Turn Right | Match Doc? |
|-----------|-----------|------------|------------|
| **COORDINATE_SYSTEM.md** | `+1` (CCW) | `-1` (CW) | ✓ Reference |
| **MazeEngine.ts** | `-1` | `+1` | ❌ Inverted |
| **gameSolver.ts** | `-1` | `+1` | ❌ Inverted |

### Direction Index → Movement

| Index | Doc Standard | MazeEngine Actual |
|-------|--------------|-------------------|
| 0 (East) | +X: `{x:1, z:0}` | -Z: `z--` ❌ |
| 1 (North) | +Z: `{x:0, z:1}` | +X: `x++` ❌ |
| 2 (West) | -X: `{x:-1, z:0}` | +Z: `z++` ❌ |
| 3 (South) | -Z: `{x:0, z:-1}` | -X: `x--` ❌ |

### Visual Rotation

| Index | Doc Standard | RobotCharacter Actual |
|-------|--------------|----------------------|
| 0 (East) | +π/2 → faces +X | π → faces -Z ❌ |
| 1 (North) | 0 → faces +Z | +π/2 → faces +X ❌ |
| 2 (West) | -π/2 → faces -X | 0 → faces +Z ❌ |
| 3 (South) | π → faces -Z | -π/2 → faces -X ❌ |
