---
id: staircase-climb
name: "Staircase Climb"
category: loop
concepts: ["repeat_n", "pattern_recognition"]
difficulty: 3
tags: ["repeat", "pattern", "staircase"]
author: system
version: 1
description: "Climb a staircase and collect crystals at each step"
---

# Staircase Climb

Climb a staircase by recognizing the repeating pattern of forward + jump.

## Learning Goals
- Recognize repeating patterns
- Use `repeat` block effectively
- Combine movement with jumping

## Solution & Parameters

```js
// Parameters
var MIN_STEPS = 3;
var MAX_STEPS = 8;
var STEPS = random(MIN_STEPS, MAX_STEPS);

// Solution
moveForward();

for (let i = 0; i < STEPS; i++) {
  collectItem();
  moveForward();
  jump();
}
collectItem();
moveForward();
```
