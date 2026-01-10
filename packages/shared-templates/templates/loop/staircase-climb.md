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

## Features
- **Staircase Logic**: Simulates climbing stairs using repeated jump/move segments.
- **Elevation**: Demonstrates 3D movement.

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 5;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < STEPS; i++) {
  // Generate a 1-step pattern with a jump
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
}
```
