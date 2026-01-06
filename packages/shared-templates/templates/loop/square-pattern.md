---
id: square-pattern
name: "Square Pattern"
category: loop
concepts: ["repeat_n", "nested_loop"]
difficulty: 3
tags: ["for", "loop", "nested", "square", "pattern"]
author: system
version: 1
description: "Walk around a square using nested loops"
---

# Square Pattern

Use nested loops to walk around a square, collecting items along the way.

## Learning Goals
- Understand nested loops
- Use outer loop for sides
- Use inner loop for steps

## Solution & Parameters

```js
// Parameters
var MIN_SIDE = 2;
var MAX_SIDE = 4;
var SIDE = random(MIN_SIDE, MAX_SIDE);

// Solution
// Square pattern
moveForward();

for (let side = 0; side < 4; side++) {
  for (let step = 0; step < SIDE; step++) {
    collectItem();
    moveForward();
  }
  turnRight();
}

moveForward();
```
