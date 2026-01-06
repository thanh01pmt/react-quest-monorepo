---
id: staircase-jump
name: "Staircase with Jump"
category: loop
concepts: ["repeat_n"]
difficulty: 4
tags: ["loop", "jump", "staircase", "elevated"]
author: system
version: 1
description: "Create elevated terrain using jump command"
---

# Staircase with Jump

Use the jump command to climb a staircase while collecting items.

## Learning Goals
- Use the jump() command
- Combine movement with elevation
- Repeat jump pattern

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
// Staircase
jump();

for (let step = 0; step < STEPS; step++) {
  collectItem();
  jump();
}
```
