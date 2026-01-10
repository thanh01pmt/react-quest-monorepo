---
id: simple-function
name: "Simple Function"
category: function
concepts: ["procedure_simple"]
difficulty: 3
tags: ["function", "procedure", "reuse", "define"]
author: system
version: 2
description: "Define and call a simple function"
---

# Simple Function

Learn to define and call functions to organize your code.

## Learning Goals
- Define a function
- Call a function multiple times
- Understand code reuse

## Features
- **Function Definition**: Groups actions into `collectItems`.
- **Complex Pattern**: Uses the function to build a zigzag path.

## Solution & Parameters

```js
// Parameters
var _MIN_PER_CALL_ = 2;
var _MAX_PER_CALL_ = 4;
var _MIN_CALLS_ = 3;
var _MAX_CALLS_ = 5;
var PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);
var CALLS = random(_MIN_CALLS_, _MAX_CALLS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
function collectItems() {
  // Generate a straight segment of collection
  randomPattern(PER_CALL, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
}

// Zigzag pattern to avoid circular path
for (let c = 0; c < CALLS; c++) {
  collectItems();
  
  if (c % 2 == 0) {
    turnRight();
  } else {
    turnLeft();
  }
}
```
