# Test Case: Nested FOR Loops

**ID:** `06-nested-for-loops`
**Difficulty:** ⭐⭐⭐⭐
**Concept:** `nested_loop`

> Create a grid pattern using nested loops

## Source Code

```javascript
// Draw a 3x4 grid using nested loops
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        moveForward();
        pickCrystal();
      }
      // Move to next row
      turnRight();
      moveForward();
      turnRight();
    }
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 10 blocks |
| Items Placed | 12 |
| Loop Iterations | 15 |
| Total Moves | 15 |
| Total Collects | 12 |

## Map Visualization

```text
    -1  0  1  2  3  4  5 
    ---------------------
 1 | .  .  .  .  .  .  . 
 0 | .  S  C  C  C  C  . 
-1 | .  C  C  C  C  E  . 
-2 | .  .  .  .  .  .  . 
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
 9. turnRight
10. moveForward
11. turnRight
12. moveForward
13. collect
14. moveForward
15. collect
16. moveForward
17. collect
18. moveForward
19. collect
20. turnRight
21. moveForward
22. turnRight
23. moveForward
24. collect
25. moveForward
26. collect
27. moveForward
28. collect
29. moveForward
30. collect
... and 3 more actions
```

## Item Goals

- **crystal:** 12

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
    4,
    1,
    -1
  ],
  [
    3,
    1,
    -1
  ],
  [
    2,
    1,
    -1
  ],
  [
    1,
    1,
    -1
  ],
  [
    0,
    1,
    -1
  ]
]
```
