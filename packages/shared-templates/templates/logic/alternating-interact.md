---
id: logic-alt-interact
name: "Alternating Interaction"
category: logic
concepts: ["loop", "conditional", "modulo"]
difficulty: 4
tags: ["logic", "parity", "switch", "collect"]
author: system
version: 2
description: "Alternate between collecting Item and toggling Switch"
---

# Alternating Interaction

A complex task requiring the student to recognize two interleaved patterns.

## Academic Concept: Parity (Modulo 2)
- Even steps: Collect Crystal
- Odd steps: Toggle Switch

## Features
- **Complex Pattern**: Alternates between two different actions (Collect vs Toggle).
- **Modulo Logic**: Uses `%` operator to determine the current state.

## Solution & Parameters

```js
// Parameters
var _MIN_PAIRS_ = 2;
var _MAX_PAIRS_ = 4;
var PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);

// Full Parameter Set (Standardized)
var _TURN_STYLE_ = 'straight';
var _TURN_POINT_ = 'null';
var _HAS_JUMP_ = 'noJump';
var _NO_ITEM_AT_ = 'random';
var _SEED_ = random(1, 99999);

// Solution
for (let i = 0; i < PAIRS; i++) {
  // Step 1: Crystal
  randomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2));
  
  // Step 2: Switch
  randomPattern(2, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2) + 1);
}
```
