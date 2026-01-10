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
var _MIN_SIZE_ = 3;
var _MAX_SIZE_ = 4;
var SIZE = random(_MIN_SIZE_, _MAX_SIZE_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Helper function
function turnAround() {
  turnRight();
  turnRight();
}

// Solution
// We simulate the grid traversal. randomPattern is used for the *steps*.
// We control *where* items appear by checking parity and using 'noItemAt' param.
for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    
    // Checkerboard logic: collect only on "black" squares (row+col is odd)
    // If black: Allow random item (or force it). If white: No item.
    let itemCondition = 'true'; // Default no item
    if ((row + col) % 2 == 1) {
       itemCondition = 'false'; // Allow item (noItemAt=false)
    }

    // Generate 1 step. 
    // randomPattern(length, interaction, nested, turnIdx, turnDir, style, point, jump, noItemAt, seed)
    randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, itemCondition, _SEED_ + (row * SIZE) + col);
    
    // For grid movement, we might need a turn at the end of row.
    // BUT randomPattern handles linear segments. The turns are manual.
    // The inner loop handles columns.
  }
  
  // End of Row: Return to start of next row logic (Zigzag or Raster)
  // Standard template uses Raster (return to start and shift up/down) or Zigzag.
  // Let's use Zigzag for efficiency if continuous path, but the template description implies specific 2D raster feel?
  // Original used raster scan. Let's stick to valid grid movement.
  
  if (row < SIZE - 1) {
      if (row % 2 == 0) {
          turnRight(); moveForward(); turnRight(); // Move down/next
      } else {
          turnLeft(); moveForward(); turnLeft(); // Move down/next
      }
      // Note: This is simplified zigzag row transition. 
      // Genuine Raster (return to start) is harder to automate cleanly without teleports or long walks.
      // We'll update the logic to be Zigzag Grid traversal for simplicity in generator.
  }
}
```
