---
id: micro-mixed-interact
name: "Micro Mixed Interact"
category: logic
concepts: ["micropattern", "crystal", "switch", "mixed"]
difficulty: 4
tags: ["logic", "crystal", "switch", "interact"]
author: system
version: 5
description: "Collect crystals AND toggle switches with different spacing"
---

# Micro Mixed Interact

Collect crystals and toggle switches.

## Solution & Parameters

```js
## Solution & Parameters

```js
var _MIN_REPEATS_ = 2;
var _MAX_REPEATS_ = 3;
var _MIN_SPACE_CRYSTAL_ = 0;
var _MAX_SPACE_CRYSTAL_ = 2;
var _MIN_SPACE_SWITCH_ = 0;
var _MAX_SPACE_SWITCH_ = 1;

var REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);
var SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);
var SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

moveForward();

// Zigzag pattern to avoid circular path
for (let i = 0; i < REPEATS; i++) {
  // Phase 1: Crystal Spacing
  for (let c = 0; c < SPACE_CRYSTAL + 1; c++) {
    moveForward();
  }
  collectItem();
  
  // Phase 2: Switch Spacing
  for (let s = 0; s < SPACE_SWITCH + 1; s++) {
    moveForward();
  }
  toggleSwitch();
  
  // Alternate turn direction
  if (i % 2 == 0) {
    turnRight();
    moveForward();
    turnRight();
  } else {
    turnLeft();
    moveForward();
    turnLeft();
  }
}

// Final exit
collectItem();
moveForward();
```
