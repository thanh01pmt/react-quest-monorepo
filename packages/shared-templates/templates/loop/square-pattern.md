---
id: square-pattern
name: "Square Pattern"
category: loop
concepts: ["repeat_n", "nested_loop"]
difficulty: 3
tags: ["for", "loop", "nested", "square", "pattern"]
author: system
version: 2
description: "Walk around a square using nested loops"
---

# Square Pattern

Use nested loops to walk around a square, collecting items along the way.

## Learning Goals
- Understand nested loops
- Use outer loop for sides
- Use inner loop for steps

## Features
- **Nested Loops**: Simulates a 2D walk using an outer loop for sides and inner loop for steps.
- **Geometric Pattern**: Generates a square or rectangular path.
- **Turns**: Demonstrates repetitive turning logic.

## Solution & Parameters

```js
// Parameters
var _MIN_SIDE_ = 3;
var _MAX_SIDE_ = 5;
var SIDE_LEN = random(_MIN_SIDE_, _MAX_SIDE_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

// Solution
// 4 sides of a square
for (let i = 0; i < 4; i++) {
  // Generate one side of the square
  // nestedLoopCompatible=true ensures start/end alignment
  randomPattern(SIDE_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
  
  // Turn at the corner
  turnRight();
}
```
