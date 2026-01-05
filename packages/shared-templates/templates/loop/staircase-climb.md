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

## Parameters

```js
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
```

## Solution Code

```js
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Climb the staircase
for (let i = 0; i < STEPS; i++) {
  moveForward();
  jump();
}
moveForward();
