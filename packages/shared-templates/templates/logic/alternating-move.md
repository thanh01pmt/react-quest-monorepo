---
id: logic-alt-move
name: "Alternating Move"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 3
tags: ["logic", "parity", "even_odd"]
author: system
version: 2
description: "Alternate between walking and jumping, collecting crystals"
---

# Alternating Move

A pattern that changes action based on whether the step count is Odd or Even.

## Academic Concept: Parity (Modulo 2)
- Logic: `if (i % 2 == 0) ActionA else ActionB`

## Features
- **Alternating Actions**: Switches between walking and jumping every step.
- **Parity Logic**: Uses odd/even checks to decide action.

## Solution & Parameters

```js
// Parameters
var _MIN_PAIRS_ = 3;
var _MAX_PAIRS_ = 5;
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
  // Even: Walk (Normal move)
  // Use randomPattern to generate a simple move-collect segment
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', _NO_ITEM_AT_, _SEED_ + (i*2));
  
  // Odd: Jump Up
  // Use randomPattern to generate a jump-collect segment
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'withJump', _NO_ITEM_AT_, _SEED_ + (i*2) + 1);
}
```
