---
id: staircase-climb
name: "Staircase Climb"
category: loop
concepts: ["repeat_n", "pattern_recognition"]
difficulty: 3
tags: ["repeat", "pattern", "staircase"]
author: system
version: 2
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
var _MIN_STEPS_ = 2;
var _MAX_STEPS_ = 5;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
moveForward();

for (let i = 0; i < STEPS; i++) {
  collectItem();
  moveForward();
  jumpUp();
}

collectItem();
moveForward();
```
