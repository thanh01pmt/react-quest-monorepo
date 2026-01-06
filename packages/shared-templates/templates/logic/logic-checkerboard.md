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
// Simple snake traversal Logic
for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    
    // Check Parity
    if ((row + col) % 2 == 1) {
      collectItem();
    }
    
    if (col < SIZE - 1) {
      moveForward();
    }
  }
  
  // Turn for next row (Snake pattern simplified for template)
  if (row < SIZE - 1) {
    turnRight();
    moveForward();
    turnRight();
    moveForward(); // Re-align (This mimics snake return or creates a simple raster scan with flyback if we don't snake perfectly. For specific "Snake", we need logic to alternate turns. Let's keep it simple: Raster Scan - walk back)
    turnAround(); 
    // Wait, Raster Scan with walk back is safer for solution generator without snaking logic complexity
    // ACTUALLY: Let's use clean Move/Turn logic for grid
  }
}

// NOTE: The above logic for turns is tricky in 1D code. 
// Let's us a simpler "Row Clearing" function approach to ensure valid path.
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
