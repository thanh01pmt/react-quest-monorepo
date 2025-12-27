# Test Case: Multiple Functions

**ID:** `09-multiple-functions`
**Difficulty:** ⭐⭐⭐⭐⭐
**Concept:** `procedure_compose`

> Define and use multiple functions together

## Source Code

```javascript
// Helper function to move and collect
    function step() {
      moveForward();
      pickCrystal();
    }
    
    // Function to do a row
    function doRow() {
      step();
      step();
      step();
    }
    
    // Function to turn to next row
    function nextRow() {
      turnRight();
      moveForward();
      turnRight();
    }
    
    // Main logic
    doRow();
    nextRow();
    doRow();
    nextRow();
    doRow();
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 8 blocks |
| Items Placed | 9 |
| Loop Iterations | 0 |
| Total Moves | 11 |
| Total Collects | 9 |

## Map Visualization

```text
    -1  0  1  2  3  4 
    ------------------
 1 | .  .  .  .  .  . 
 0 | .  S  C  C  C  . 
-1 | .  C  C  C ██  . 
-2 | .  .  .  .  .  . 
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
 9. turnRight
10. moveForward
11. collect
12. moveForward
13. collect
14. moveForward
15. collect
16. turnRight
17. moveForward
18. turnRight
19. moveForward
20. collect
21. moveForward
22. collect
23. moveForward
24. collect
```

## Item Goals

- **crystal:** 9

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
