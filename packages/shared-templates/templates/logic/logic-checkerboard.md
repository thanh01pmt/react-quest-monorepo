---
id: logic-checkerboard
name: "Logic Checkerboard"
category: logic
concepts: ["nested_loop", "conditional", "coordinates"]
difficulty: 5
tags: ["logic", "grid", "checkerboard", "2d_array"]
author: system
version: 2
description: "Traverse a grid and interact only on 'Black' squares (checkerboard pattern)"
---

# Logic Checkerboard

Traverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.

## Academic Concept: 2D Parity
- White square: `(row + col) % 2 == 0`
- Black square: `(row + col) % 2 == 1`

## Solution & Parameters

```js
// Parameters
var _MIN_SIZE_ = 2;
var _MAX_SIZE_ = 3;
var SIZE = random(_MIN_SIZE_, _MAX_SIZE_);

// Helper function
function turnAround() {
  turnRight();
  turnRight();
}

// Solution
moveForward();

for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    // Checkerboard logic: collect only on "black" squares
    if ((row + col) % 2 == 1) {
      collectItem();
    }
    
    if (col < SIZE - 1) {
      moveForward();
    }
  }
  
  // Move to next row (if not last)
  if (row < SIZE - 1) {
    // Raster scan: return to start of row, then go up
    turnAround();
    for (let k = 0; k < SIZE - 1; k++) {
      moveForward();
    }
    turnLeft();
    moveForward();
    turnLeft();
  }
}

moveForward();
```
