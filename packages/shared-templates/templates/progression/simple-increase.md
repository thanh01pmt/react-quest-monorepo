---
id: prog-simple-increase
name: "Simple Increase"
category: progression
concepts: ["variable", "arithmetic_progression"]
difficulty: 2
tags: ["math", "progression", "increment"]
author: system
version: 3
description: "Simple increasing pattern (1, 2, 3 steps)"
---

# Simple Increase

A simple introduction to increasing patterns.

## Learning Goals
- Recognize increasing sequences
- Understand progression

## Features
- **Increasing Pattern**: 1 step, then 2 steps, then 3 steps.
- **Progression Logic**: Visualizes how linear growth looks in movement.

## Solution & Parameters

```js
// Parameters
var _MIN_GROUPS_ = 3;
var _MAX_GROUPS_ = 5;
var GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

// Solution
// Walk 1 step, then 2 steps, then 3 steps, etc.
for (let group = 0; group < GROUPS; group++) {
  let stepsInGroup = group + 1; // 1, 2, 3...
  
  // Generate segment of length 'stepsInGroup'
  randomPattern(stepsInGroup, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + group);
  
  // Turn for next group (simple zigzag/stairs turn)
  if (group < GROUPS - 1) {
    turnRight();
    moveForward(); // Connector
    turnLeft();
  }
}
```
