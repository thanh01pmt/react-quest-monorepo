# Test Case: FOR Loop with Turns

**ID:** `03-for-loop-with-turns`
**Difficulty:** ⭐⭐
**Concept:** `repeat_n`

> Collect crystals while turning to create an L-shape

## Source Code

```javascript
// Move forward and turn to create L-shape
    for (let i = 0; i < 3; i++) {
      moveForward();
      pickCrystal();
    }
    turnRight();
    for (let i = 0; i < 3; i++) {
      moveForward();
      pickCrystal();
    }
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 7 blocks |
| Items Placed | 6 |
| Loop Iterations | 6 |
| Total Moves | 6 |
| Total Collects | 6 |

## Map Visualization

```text
    -1  0  1  2  3  4 
    ------------------
 1 | .  .  .  .  .  . 
 0 | .  S  C  C  C  . 
-1 | .  .  .  .  C  . 
-2 | .  .  .  .  C  . 
-3 | .  .  .  .  C  . 
-4 | .  .  .  .  .  . 
```

**Legend:** S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch, P=Portal

## Raw Actions

```
 1. moveForward
 2. collect
 3. moveForward
 4. collect
 5. moveForward
 6. collect
 7. turnRight
 8. moveForward
 9. collect
10. moveForward
11. collect
12. moveForward
13. collect
```

## Item Goals

- **crystal:** 6

## Path Coordinates

```json
[
  [
    0,
    1,
    0
  ],
  [
    1,
    1,
    0
  ],
  [
    2,
    1,
    0
  ],
  [
    3,
    1,
    0
  ],
  [
    3,
    1,
    -1
  ],
  [
    3,
    1,
    -2
  ],
  [
    3,
    1,
    -3
  ]
]
```
