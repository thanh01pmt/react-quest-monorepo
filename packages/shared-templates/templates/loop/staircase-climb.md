---
id: staircase-climb
name: "Staircase Climb"
category: loop
concepts: ["repeat_n", "pattern_recognition"]
difficulty: 3
tags: ["repeat", "pattern", "staircase"]
author: system
version: 1
description: "Climb a staircase using repeat pattern"
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
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 8;
var _STEPS_ = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
for (let i = 0; i < _STEPS_; i++) {
  moveForward();
  jump();
}
moveForward();
```
