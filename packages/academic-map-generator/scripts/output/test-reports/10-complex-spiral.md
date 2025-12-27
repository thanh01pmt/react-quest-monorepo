# Test Case: Complex Spiral

**ID:** `10-complex-spiral`
**Difficulty:** ⭐⭐⭐⭐⭐
**Concept:** `nested_loop`

> Create a spiral pattern using nested loops

## Source Code

```javascript
// Spiral pattern - decreasing lengths
    // Length pattern: 5, 5, 4, 4, 3, 3, 2, 2, 1, 1
    
    function collectAndMove() {
      moveForward();
      pickCrystal();
    }
    
    // First arm (5 steps)
    for (let i = 0; i < 5; i++) { collectAndMove(); }
    turnRight();
    for (let i = 0; i < 5; i++) { collectAndMove(); }
    turnRight();
    
    // Second arm (4 steps)
    for (let i = 0; i < 4; i++) { collectAndMove(); }
    turnRight();
    for (let i = 0; i < 4; i++) { collectAndMove(); }
    turnRight();
    
    // Third arm (3 steps)
    for (let i = 0; i < 3; i++) { collectAndMove(); }
    turnRight();
    for (let i = 0; i < 3; i++) { collectAndMove(); }
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 25 blocks |
| Items Placed | 24 |
| Loop Iterations | 24 |
| Total Moves | 24 |
| Total Collects | 24 |

## Map Visualization

```text
    -1  0  1  2  3  4  5  6 
    ------------------------
 1 | .  .  .  .  .  .  .  . 
 0 | .  S  C  C  C  C  C  . 
-1 | .  .  C  C  C  C  C  . 
-2 | .  .  C  .  .  C  C  . 
-3 | .  .  C  .  .  C  C  . 
-4 | .  .  C  .  .  C  C  . 
-5 | .  .  C  C  C  C  C  . 
-6 | .  .  .  .  .  .  .  . 
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
11. turnRight
12. moveForward
13. collect
14. moveForward
15. collect
16. moveForward
17. collect
18. moveForward
19. collect
20. moveForward
21. collect
22. turnRight
23. moveForward
24. collect
25. moveForward
26. collect
27. moveForward
28. collect
29. moveForward
30. collect
... and 23 more actions
```

## Item Goals

- **crystal:** 24

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
  ],
  [
    5,
    1,
    -1
  ],
  [
    5,
    1,
    -2
  ],
  [
    5,
    1,
    -3
  ],
  [
    5,
    1,
    -4
  ],
  [
    5,
    1,
    -5
  ],
  [
    4,
    1,
    -5
  ],
  [
    3,
    1,
    -5
  ],
  [
    2,
    1,
    -5
  ],
  [
    1,
    1,
    -5
  ],
  [
    1,
    1,
    -4
  ],
  [
    1,
    1,
    -3
  ],
  [
    1,
    1,
    -2
  ],
  [
    1,
    1,
    -1
  ],
  [
    2,
    1,
    -1
  ],
  [
    3,
    1,
    -1
  ],
  [
    4,
    1,
    -1
  ],
  [
    4,
    1,
    -2
  ],
  [
    4,
    1,
    -3
  ],
  [
    4,
    1,
    -4
  ]
]
```
