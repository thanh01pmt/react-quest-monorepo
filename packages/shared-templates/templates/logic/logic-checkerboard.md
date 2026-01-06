---
id: logic-checkerboard
name: "Logic Checkerboard"
category: logic
concepts: ["nested_loop", "conditional", "coordinates"]
difficulty: 5
tags: ["logic", "grid", "checkerboard", "2d_array"]
author: system
version: 1
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
var _MIN_SIZE_ = 3;
var _MAX_SIZE_ = 4;
var SIZE = random(_MIN_SIZE_, _MAX_SIZE_);

// Solution
// Solution
for (let r = 0; r < SIZE; r++) {
  // Row Traversal
  for (let c = 0; c < SIZE; c++) {
    // Check if current spot has item
    if (isOnCrystal()) {
      collectItem();
    }
    
    if (c < SIZE - 1) {
      moveForward();
    }
  }
  
  // Return to start of row (Raster scan)
  turnAround();
  for(let k=0; k<SIZE-1; k++) {
    moveForward();
  }
  turnAround(); // Face right again
  
  // Move to next row if not last
  if (r < SIZE - 1) {
    turnRight();
    moveForward();
    turnLeft();
  }
}
```

**Alternative simpler logic for template**:
```js
// Solution
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    if ((r + c) % 2 == 1) {
       collectItem();
    }
    if (c < SIZE - 1) moveForward();
  }
  
  // Return to start of row (Raster scan style)
  turnAround();
  for(let k=0; k<SIZE-1; k++) moveForward();
  turnLeft();
  moveForward(); // Next row
  turnLeft();
}
```
*Refining for final Markdown*:

```js
// Parameters
var _MIN_SIZE_ = 3;
var _MAX_SIZE_ = 4;
var SIZE = random(_MIN_SIZE_, _MAX_SIZE_);

// Solution
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    if ((r + c) % 2 == 1) {
       collectItem();
    }
    if (c < SIZE - 1) moveForward();
  }
  
  // Prepare for next row (if not last)
  if (r < SIZE - 1) {
    turnAround();
    for(let k=0; k<SIZE-1; k++) moveForward();
    turnLeft();
    moveForward();
    turnLeft();
  }
}
```
