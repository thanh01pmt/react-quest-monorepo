---
id: mem-palindrome
name: "Palindrome Path"
category: memory
concepts: ["pattern_recognition", "string_logic"]
difficulty: 4
tags: ["pattern", "palindrome", "symmetry"]
author: system
version: 2
description: "Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)"
---

# Palindrome Path

A path where the action sequence reads the same backwards and forwards.

## Academic Concept: Palindrome / Symmetry
- Sequence: $A, B, C, B, A$

## Features
- **Symmetry**: Actions are mirrored around a center point.
- **Pattern Construction**: Builds a sequence A-B-C-B-A.

## Solution & Parameters

```js
// Parameters
var _MIN_MID_LENGTH_ = 1;
var _MAX_MID_LENGTH_ = 3;
var MID_LENGTH = random(_MIN_MID_LENGTH_, _MAX_MID_LENGTH_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null
var _SEED_ = random(1, 99999);

// Solution
// Start (A) - Manual or Pattern
jumpUp(); 
moveForward();

// Middle (B repeated) - Forward
for (let i = 0; i < MID_LENGTH; i++) {
  // Pattern segment forward
  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);
}

// Pivot (C)
turnRight();
moveForward();
turnRight();

// Middle Mirror (B repeated) - Backward/Return
// We reuse the seed logic to "mirror" the path structure, but for the palindrome execution 
// usually the ACTIONS are the same (Move, Collect).
for (let i = 0; i < MID_LENGTH; i++) {
   randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i + 100); 
   // Using diff seed to ensure new items generated if needed, but structure is strictly Length of 1
}

// End Mirror (A)
moveForward();
jumpDown();
```
