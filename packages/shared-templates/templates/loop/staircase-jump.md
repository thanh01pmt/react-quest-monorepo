---
id: staircase-jump
name: "Staircase with Jump"
category: loop
concepts: ["repeat_n"]
difficulty: 4
tags: ["loop", "jump", "staircase", "elevated"]
author: system
version: 2
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
var _MIN_STEPS_ = 2;
var _MAX_STEPS_ = 5;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Solution
// Initial entry
moveForward();
jumpUp();

for (let step = 0; step < STEPS; step++) {
  collectItem();
  jumpUp();
}

// Final exit
collectItem();
moveForward();
```
