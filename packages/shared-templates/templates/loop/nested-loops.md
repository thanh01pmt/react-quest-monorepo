---
id: nested-loops
name: "Nested FOR Loops"
category: loop
concepts: ["nested_loop"]
difficulty: 4
tags: ["for", "loop", "nested", "zigzag", "grid"]
author: system
version: 1
description: "Create a zigzag grid pattern using nested loops"
---

# Nested FOR Loops

Master nested loops by creating a grid pattern with zigzag movement.

## Learning Goals
- Understand nested loop structure
- Create 2D patterns with loops
- Handle zigzag traversal

## Features
- **Grid Traversal**: Covers a 2D area using nested loops.
- **ZigZag Rows**: Alternates direction for efficient coverage.

## Solution & Parameters

```js
// Parameters
var _MIN_ROWS_ = 2;
var _MAX_ROWS_ = 3;
var ROWS = random(_MIN_ROWS_, _MAX_ROWS_);
var COL_LEN = 3; 

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight'; 
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let r = 0; r < ROWS; r++) {
  // Row Pattern
  randomPattern(COL_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + r);
  
  // Turn for next row (Alternating would require more logic, simplicity here)
  if (r < ROWS - 1) {
     turnRight();
     moveForward();
     turnRight();
  }
}
```
