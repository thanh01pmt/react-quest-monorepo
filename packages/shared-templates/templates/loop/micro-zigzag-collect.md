---
id: micro-zigzag-collect
name: "Micro Zigzag Collect"
category: loop
concepts: ["zigzag", "turns", "alternating"]
difficulty: 4
tags: ["loop", "zigzag", "crystal"]
author: system
version: 4
description: "Collect crystals in a zigzag pattern with alternating turns"
---

# Micro Zigzag Collect

Zigzag path with alternating left/right turns.

## Features
- **ZigZag Logic**: Alternates turns for a classic zigzag path.
- **Micro-Patterns**: Each leg of the zigzag is a generated pattern.

## Solution & Parameters

```js
// Parameters
var _MIN_PAIRS_ = 2;
var _MAX_PAIRS_ = 4;
var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < PAIRS; i++) {
  // Leg 1
  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2));
  turnRight();
  
  // Leg 2
  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2) + 1);
  turnLeft();
}
```
