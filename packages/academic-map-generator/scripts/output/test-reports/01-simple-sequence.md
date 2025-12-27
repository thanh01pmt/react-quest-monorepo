# Test Case: Simple Sequence

**ID:** `01-simple-sequence`
**Difficulty:** ⭐
**Concept:** `sequential`

> Move forward and collect crystals in a straight line

## Source Code

```javascript
moveForward();
    pickCrystal();
    moveForward();
    pickCrystal();
    moveForward();
    pickCrystal();
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 4 blocks |
| Items Placed | 3 |
| Loop Iterations | 0 |
| Total Moves | 3 |
| Total Collects | 3 |

## Map Visualization

```text
    -1  0  1  2  3  4 
    ------------------
 1 | .  .  .  .  .  . 
 0 | .  S  C  C  C  . 
-1 | .  .  .  .  .  . 
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
```

## Item Goals

- **crystal:** 3

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
  ]
]
```
