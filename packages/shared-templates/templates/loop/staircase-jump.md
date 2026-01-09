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

## Features
- **Jump Commands**: Focuses on vertical traversal.
- **Repeated Pattern**: Uses a loop to create a consistent climbing challenge.

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal';
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'withJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
jumpUp(); // Initial placement

for (let i = 0; i < STEPS; i++) {
  // Pattern with jump enabled
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
}
```
