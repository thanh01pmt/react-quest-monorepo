---
id: collect-procedure
name: "Collect Procedure"
category: function
concepts: ["procedure_simple"]
difficulty: 4
tags: ["procedure", "function", "reuse"]
author: system
version: 1
description: "Create and use a procedure for collecting items"
---

# Collect Procedure

Create a reusable procedure for the collect-and-move pattern.

## Learning Goals
- Define custom procedures
- Call procedures to reduce code
- Understand code reuse

## Features
- **Procedure**: Defines a `collectAndMove` function.
- **Reuse**: Calls the function multiple times in a loop.

## Solution & Parameters

```js
// Parameters
var _MIN_COLLECTION_COUNT_ = 3;
var _MAX_COLLECTION_COUNT_ = 6;
var COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
function collectAndMove() {
  // Use randomPattern for the action unit
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
}

// Use the procedure
for (let i = 0; i < COLLECTION_COUNT; i++) {
  collectAndMove();
  // Ensure we move forward seed to differentiate steps if we wanted variety, 
  // but here reusing the exact same "procedure" conceptually usually implies identical action.
  // However, randomPattern handles placement logic.
}
```
