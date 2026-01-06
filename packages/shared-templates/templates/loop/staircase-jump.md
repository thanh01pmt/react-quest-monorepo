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
var MIN_STEPS = 3;
var MAX_STEPS = 6;
var STEPS = random(MIN_STEPS, MAX_STEPS);

// Solution
// Staircase
moveForward();
jump();

for (let step = 0; step < STEPS; step++) {
  collectItem();
  jump();
}

moveForward();
```
