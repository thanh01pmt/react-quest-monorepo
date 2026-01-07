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

## Solution & Parameters

```js
// Parameters
var _MIN_LEN_ = 2;
var _MAX_LEN_ = 3;
var LEN = random(_MIN_LEN_, _MAX_LEN_);

// Solution
function drawSide() {
  for (let i = 0; i < LEN; i++) {
    collectItem();
    moveForward();
  }
  turnRight();
}

// Main logic - draw 3 sides with turns
moveForward();

for (let k = 0; k < 3; k++) {
  drawSide();
}

// Final side without turn (exit path)
for (let i = 0; i < LEN; i++) {
  collectItem();
  moveForward();
}

moveForward();
```
