---
id: decomp-flower
name: "Flower Pattern"
category: decomposition
concepts: ["function", "geometry", "nested_loop"]
difficulty: 5
tags: ["function", "pattern", "radial"]
author: system
version: 2
description: "Draw petals around a center point"
---

# Flower Pattern

A radial pattern where the code draws a "petal" and returns to center.

## Academic Concept: Radial Symmetry / Reset State
- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.

## Features
- **Functional Decomposition**: Breaks down a complex shape into a repeatable `drawPetal` function.
- **State Restoration**: Crucial concept where the function must return the agent to the starting position/orientation to allow looping.

## Solution & Parameters

```js
// Parameters
var _MIN_LEN_ = 3;
var _MAX_LEN_ = 5;
var LEN = random(_MIN_LEN_, _MAX_LEN_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
function turnAround() {
  turnRight();
  turnRight();
}

function drawPetal() {
  // Go out: Use randomPattern to generate the petal "stem"
  randomPattern(LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
  
  // Return to center
  turnAround();
  // Retrace steps (simple move forward loop to return, matching length)
  // Note: We don't use randomPattern for *retracing* blindly unless we want new items. 
  // For simplicity, we just walk back.
  for (let i = 0; i < LEN; i++) {
     moveForward();
  }
  
  // Face next petal direction (total 180 turned + 90 turn = 270 relative to start, or effectively 90 right)
  turnAround();
  turnRight();
}

// Draw 4 petals
for (let k = 0; k < 4; k++) {
  drawPetal();
}
```
