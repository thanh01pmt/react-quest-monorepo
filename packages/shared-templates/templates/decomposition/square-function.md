---
id: decomp-square
name: "Square Function"
category: decomposition
concepts: ["function", "geometry"]
difficulty: 3
tags: ["function", "reuse", "square"]
author: system
version: 1
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
var MIN_LEN = 2;
var MAX_LEN = 4;
var LEN = random(MIN_LEN, MAX_LEN);

// Solution
function drawSide() {
  for(let i=0; i<LEN; i++) {
    collectItem();
    moveForward();
  }
  turnRight();
}

// Main logic
for(let k=0; k<4; k++) {
  drawSide();
}
```
