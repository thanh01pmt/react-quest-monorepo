---
id: zigzag-procedure
name: "Zigzag Procedure"
category: function
concepts: ["procedure_simple"]
difficulty: 4
tags: ["procedure", "function", "zigzag"]
author: system
version: 1
description: "Create a reusable function to move in a zigzag"
---

# Zigzag Procedure

Define a function for a complex movement pattern and reuse it.

## Solution & Parameters

```js
## Features
- **Complex Function**: The `zigZagStep` function contains a multi-step maneuver.
- **Pattern Repetition**: Repeats the function to create a saw-tooth path.

## Solution & Parameters

```js
// Parameters
var _MIN_COUNT_ = 3;
var _MAX_COUNT_ = 5;
var COUNT = random(_MIN_COUNT_, _MAX_COUNT_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
function zigZagStep() {
  // A zigzag step is: M, R, M, L
  // We can simulate this with randomPattern for M and explicit turns
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);
  turnRight();
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);
  turnLeft();
}

for (let i = 0; i < COUNT; i++) {
  zigZagStep();
}
```
