# Test Case: Function with Loop

**ID:** `07-function-with-loop`
**Difficulty:** ⭐⭐⭐⭐
**Concept:** `loop_function_call`

> Call a function inside a loop to create complex patterns

## Source Code

```javascript
// Define a helper function
    function collectLine() {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
    }
    
    // Use function in a loop to create zigzag
    for (let i = 0; i < 4; i++) {
      collectLine();
      turnRight();
    }
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 12 blocks |
| Items Placed | 12 |
| Loop Iterations | 4 |
| Total Moves | 12 |
| Total Collects | 12 |

## Map Visualization

```text
    -1  0  1  2  3  4 
    ------------------
 1 | .  .  .  .  .  . 
 0 | .  S  C  C  C  . 
-1 | .  C  .  .  C  . 
-2 | .  C  .  .  C  . 
-3 | .  C  C  C  C  . 
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
14. turnRight
15. moveForward
16. collect
17. moveForward
18. collect
19. moveForward
20. collect
21. turnRight
22. moveForward
23. collect
24. moveForward
25. collect
26. moveForward
27. collect
28. turnRight
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
  ],
  [
    2,
    1,
    -3
  ],
  [
    1,
    1,
    -3
  ],
  [
    0,
    1,
    -3
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
