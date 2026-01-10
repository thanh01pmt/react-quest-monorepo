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

## Features
- **Grid Traversal**: Scanning a 2D space (rows and cols).
- **Conditional Logic**: Only acting on specific coordinates (Checkerboard pattern).

## Solution & Parameters

```js
// Parameters
var _MIN_SIZE_ = 2;
var _MAX_SIZE_ = 3;
var SIZE = random(_MIN_SIZE_, _MAX_SIZE_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

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
