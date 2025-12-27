# Test Case: Simple Function

**ID:** `05-simple-function`
**Difficulty:** ⭐⭐⭐
**Concept:** `procedure_simple`

> Define a function and call it multiple times

## Source Code

```javascript
// Define a reusable function
    function collectTwo() {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
    }
    
    // Call the function 3 times with turns
    collectTwo();
    turnRight();
    collectTwo();
    turnRight();
    collectTwo();
```

## Execution Summary

| Metric | Value |
|--------|-------|
| Path Length | 7 blocks |
| Items Placed | 6 |
| Loop Iterations | 0 |
| Total Moves | 6 |
| Total Collects | 6 |

## Map Visualization

```text
    -1  0  1  2  3 
    ---------------
 1 | .  .  .  .  . 
 0 | .  S  C  C  . 
-1 | .  .  .  C  . 
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
  ]
]
```
