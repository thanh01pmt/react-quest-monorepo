---
id: decomp-flower
name: "Flower Pattern"
category: decomposition
concepts: ["function", "geometry", "nested_loop"]
difficulty: 5
tags: ["function", "pattern", "radial"]
author: system
version: 1
description: "Draw petals around a center point"
---

# Flower Pattern

A radial pattern where the code draws a "petal" and returns to center.

## Academic Concept: Radial Symmetry / Reset State
- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.

## Solution & Parameters

```js
// Parameters
var _MIN_LEN_ = 2;
var _MAX_LEN_ = 3;
var LEN = random(_MIN_LEN_, _MAX_LEN_);

// Solution
function drawPetal() {
  // Go out
  for(var i=0; i<LEN; i++) { 
    moveForward(); 
    collectItem(); 
  }
  // Return
  turnAround();
  for(var i=0; i<LEN; i++) { 
    moveForward(); 
  }
  // Face next direction (90 deg rot)
  turnAround();
  turnRight();
}

// Main
for(var k=0; k<4; k++) {
  drawPetal();
}
```
