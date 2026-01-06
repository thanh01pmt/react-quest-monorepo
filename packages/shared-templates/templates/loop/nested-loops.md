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

## Solution & Parameters

```js
// Parameters
var _MIN_ROWS_ = 2;
var _MAX_ROWS_ = 3;
var _MIN_COLS_ = 3;
var _MAX_COLS_ = 5;
var ROWS = random(_MIN_ROWS_, _MAX_ROWS_);
var COLS = random(_MIN_COLS_, _MAX_COLS_);

// Solution
// Zigzag grid pattern
moveForward();

for (let col = 0; col < COLS; col++) {
  collectItem();
  moveForward();
}

for (let row = 1; row < ROWS; row++) {
  turnRight();
  moveForward();
  turnRight();
  
  for (let col = 0; col < COLS; col++) {
    collectItem();
    moveForward();
  }
}
```
