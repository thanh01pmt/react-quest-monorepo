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
var MIN_SEGMENT1 = 2;
var MAX_SEGMENT1 = 4;
var MIN_SEGMENT2 = 2;
var MAX_SEGMENT2 = 4;
var SEGMENT1 = random(MIN_SEGMENT1, MAX_SEGMENT1);
var SEGMENT2 = random(MIN_SEGMENT2, MAX_SEGMENT2);

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

moveForward();
```
