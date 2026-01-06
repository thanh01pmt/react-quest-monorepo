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
var MIN_ROWS = 2;
var MAX_ROWS = 3;
var MIN_COLS = 3;
var MAX_COLS = 5;
var ROWS = random(MIN_ROWS, MAX_ROWS);
var COLS = random(MIN_COLS, MAX_COLS);

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

moveForward();
```
