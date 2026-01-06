---
id: for-with-turns
name: "FOR Loop with Turns"
category: loop
concepts: ["repeat_n"]
difficulty: 2
tags: ["for", "loop", "turn", "l-shape"]
author: system
version: 1
description: "Create an L-shape path using loops with turns"
---

# FOR Loop with Turns

Combine FOR loops with turning to create more complex paths.

## Learning Goals
- Use multiple FOR loops
- Combine loops with turn commands
- Create L-shaped paths

## Solution & Parameters

```js
// Parameters
var _MIN_SEGMENT1_ = 2;
var _MAX_SEGMENT1_ = 4;
var _MIN_SEGMENT2_ = 2;
var _MAX_SEGMENT2_ = 4;
var SEGMENT1 = random(_MIN_SEGMENT1_, _MAX_SEGMENT1_);
var SEGMENT2 = random(_MIN_SEGMENT2_, _MAX_SEGMENT2_);

// Solution
// L-shape path
moveForward();

for (let i = 0; i < SEGMENT1; i++) {
  collectItem();
  moveForward();
}

turnRight();

for (let i = 0; i < SEGMENT2; i++) {
  collectItem();
  moveForward();
}
```
