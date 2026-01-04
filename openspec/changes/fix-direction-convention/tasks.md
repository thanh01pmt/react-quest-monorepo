# Tasks for fix-direction-convention

## 1. Fix MazeEngine Direction Logic

- [ ] 1.1 Fix `getNextPosition()` in `MazeEngine.ts` to use correct axis mapping:
  ```typescript
  // Current (WRONG):
  if (direction === 0) z--;  // Should be +X
  else if (direction === 1) x++;  // Should be +Z
  else if (direction === 2) z++;  // Should be -X
  else if (direction === 3) x--;  // Should be -Z
  
  // Fixed:
  if (direction === 0) x++;       // East = +X
  else if (direction === 1) z++;  // North = +Z
  else if (direction === 2) x--;  // West = -X
  else if (direction === 3) z--;  // South = -Z
  ```

- [ ] 1.2 Fix `turnLeft()` and `turnRight()` in `MazeEngine.ts`:
  ```typescript
  // Current (WRONG):
  turnLeft: direction - 1
  turnRight: direction + 1
  
  // Fixed (match COORDINATE_SYSTEM.md):
  turnLeft: (direction + 1) % 4     // CCW: E→N→W→S→E
  turnRight: (direction + 3) % 4    // CW: E→S→W→N→E
  ```

## 2. Fix RobotCharacter Rotation

- [ ] 2.1 Fix `DIRECTION_TO_ROTATION` in `RobotCharacter.tsx`:
  ```typescript
  // Current (WRONG - 90° offset):
  0: Math.PI,       // 180°
  1: Math.PI / 2,   // 90°
  2: 0,             // 0°
  3: -Math.PI / 2,  // -90°
  
  // Fixed (match COORDINATE_SYSTEM.md & PlayerStartRenderer):
  0: Math.PI / 2,   // East (+X): +90°
  1: 0,             // North (+Z): 0°
  2: -Math.PI / 2,  // West (-X): -90°
  3: Math.PI,       // South (-Z): 180°
  ```

## 3. Fix gameSolver Turn Logic (REVIEW NEEDED)

- [ ] 3.1 Review `gameSolver.ts` turn logic at lines 1444, 1459
  - Currently uses `+1` for turnRight, `-1` for turnLeft
  - This is **OPPOSITE** to COORDINATE_SYSTEM.md
  - Need to determine: Should gameSolver also be fixed, or is it correct in its own context?

## 4. Update Documentation

- [ ] 4.1 Update `COORDINATE_SYSTEM.md` to add `RobotCharacter.tsx` to "Files Affected" section

## 5. Verification

- [ ] 5.1 Run existing tests: `pnpm test` in quest-player package
- [ ] 5.2 Manual test: Create a simple maze in Builder, export JSON, play in react-quest-app - verify robot moves in correct direction
- [ ] 5.3 Verify turn animations match turn direction names
