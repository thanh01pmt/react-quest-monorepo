---
id: decomp-square
name: "Square Function"
category: decomposition
concepts: ["function", "geometry"]
difficulty: 3
tags: ["function", "reuse", "square"]
author: system
version: 2
description: "Use a 'Side' function to draw a square"
---

# Square Function

Decompose the square into 4 identical sides.

## Academic Concept: Decomposition
- Complex Task: Draw Square
- Sub-Task: Draw Line + Turn
- Composition: Repeat(Sub-Task, 4)

## Features
- **Component Reuse**: Defines `drawSide` once and uses it multiple times.
- **Decomposition**: Solves a complex problem (Square) by solving a simpler one (Side) first.

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
function drawSide() {
  // Generate one side of the square
  randomPattern(LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
  
  // Turn to prepare for next side
  turnRight();
}

// Main: Draw 4 sides
for (let k = 0; k < 4; k++) {
  drawSide();
}
```
