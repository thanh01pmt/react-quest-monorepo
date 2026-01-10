---
id: logic-3-way
name: "Three-Way Cycle"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 5
tags: ["logic", "modulo", "cycle", "pattern"]
author: system
version: 2
description: "A repeating cycle of 3 actions: Move -> Jump -> Collect"
---

# Three-Way Cycle

A pattern that repeats every 3 steps, teaching Modulo 3 logic.

## Academic Concept: Modulo N
- Case 0: Action A
- Case 1: Action B
- Case 2: Action C

## Features
- **Modulo Logic**: Repeats a pattern every 3 steps (0, 1, 2).
- **Cycle**: A repeating sequence of Move, Jump, Collect+Move.

## Solution & Parameters

```js
// Parameters
var _MIN_CYCLES_ = 3;
var _MAX_CYCLES_ = 5;
var CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < CYCLES; i++) {
  // Case 0: Move (Simple Walk)
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', _NO_ITEM_AT_, _SEED_ + (i*3));
  
  // Case 1: Jump Up
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'withJump', _NO_ITEM_AT_, _SEED_ + (i*3) + 1);
  
  // Case 2: Collect & Move (Move with guaranteed item or just standard pattern)
  // Logic says "Collect & Move". randomPattern(1) basically does Move+Collect if item exists.
  // We'll force an item here to distinguish it from Case 0 if Case 0 was random.
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', 'false', _SEED_ + (i*3) + 2);
}
```
