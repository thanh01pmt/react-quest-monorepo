# Test Case: Simple FOR Loop

**ID:** `02-simple-for-loop`
**Difficulty:** ⭐⭐
**Concept:** `repeat_n`

> Use a for loop to collect 5 crystals

## Source Code

```javascript
// Collect 5 crystals using a loop
    for (let i = 0; i < 5; i++) {
      moveForward();
      pickCrystal();
    }
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 6 blocks |
| Items Placed | 5 |
| Loop Iterations | 5 |
| Total Moves | 5 |
| Total Collects | 5 |

## Map Visualization

```text
    -1  0  1  2  3  4  5  6 
    ------------------------
 1 | .  .  .  .  .  .  .  . 
 0 | .  S  C  C  C  C  C  . 
-1 | .  .  .  .  .  .  .  . 
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
 7. moveForward
 8. collect
 9. moveForward
10. collect
```

## Item Goals

- **crystal:** 5

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
    4,
    1,
    0
  ],
  [
    5,
    1,
    0
  ]
]
```
