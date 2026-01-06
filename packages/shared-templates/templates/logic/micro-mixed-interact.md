---
id: micro-mixed-interact
name: "Micro Mixed Interact"
category: logic
concepts: ["micropattern", "crystal", "switch", "mixed"]
difficulty: 4
tags: ["logic", "crystal", "switch", "interact"]
author: system
version: 4
description: "Collect crystals AND toggle switches with different spacing"
---

# Micro Mixed Interact

Collect crystals and toggle switches.

## Solution & Parameters

```js
var _MIN_REPEATS_ = 2;
var _MAX_REPEATS_ = 4;
var _MIN_SPACE_CRYSTAL_ = 0;
var _MAX_SPACE_CRYSTAL_ = 2;
var _MIN_SPACE_SWITCH_ = 0;
var _MAX_SPACE_SWITCH_ = 1;

var REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);
var SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);
var SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);

moveForward();

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
  
  turnRight();
}

moveForward();
collectItem();
moveForward();
```
