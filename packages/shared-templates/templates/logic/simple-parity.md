---
id: logic-simple-parity
name: "Simple Parity"
category: logic
concepts: ["conditional", "modulo"]
difficulty: 2
tags: ["logic", "parity", "even_odd"]
author: system
version: 2
description: "Simple alternating pattern - collect every other step"
---

# Simple Parity

A simple introduction to parity (even/odd) logic.

## Learning Goals
- Understand even/odd pattern
- Recognize alternating sequences

## Features
- **Parity Logic**: Demonstrates doing something every *other* step.
- **Control Flow**: Using logic to control action execution.

## Solution & Parameters

```js
// Parameters
var _MIN_PAIRS_ = 3;
var _MAX_PAIRS_ = 5;
var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < STEPS; i++) {
   // Even steps: Item present
   // Odd steps: No item (empty step)
   if (i % 2 == 0) {
      randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + i); // Item forced
   } else {
      randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + i); // Item blocked (empty)
   }
}
```
