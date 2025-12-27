# Test Case: Square Pattern

**ID:** `04-square-pattern`
**Difficulty:** ⭐⭐⭐
**Concept:** `repeat_n`

> Create a square pattern by repeating move-turn sequence

## Source Code

```javascript
// Draw a square - repeat 4 times
    for (let side = 0; side < 4; side++) {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
      turnRight();
    }
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 8 blocks |
| Items Placed | 8 |
| Loop Iterations | 4 |
| Total Moves | 8 |
| Total Collects | 8 |

## Map Visualization

```text
    -1  0  1  2  3 
    ---------------
 1 | .  .  .  .  . 
 0 | .  S  C  C  . 
-1 | .  C  .  C  . 
-2 | .  C  C  C  . 
-3 | .  .  .  .  . 
```

**Legend:** S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch, P=Portal

## Raw Actions

```
 1. moveForward
 2. collect
 3. moveForward
 4. collect
 5. turnRight
 6. moveForward
 7. collect
 8. moveForward
 9. collect
10. turnRight
11. moveForward
12. collect
13. moveForward
14. collect
15. turnRight
16. moveForward
17. collect
18. moveForward
19. collect
20. turnRight
```

## Item Goals

- **crystal:** 8

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
    2,
    1,
    -1
  ],
  [
    2,
    1,
    -2
  ],
  [
    1,
    1,
    -2
  ],
  [
    0,
    1,
    -2
  ],
  [
    0,
    1,
    -1
  ]
]
```
