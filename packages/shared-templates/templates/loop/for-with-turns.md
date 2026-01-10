---
id: for-with-turns
name: "FOR Loop with Turns"
category: loop
concepts: ["repeat_n"]
difficulty: 2
tags: ["for", "loop", "turn", "l-shape"]
author: system
version: 1
description: "Create an L-shape path using loops with turns"
---

# FOR Loop with Turns

Combine FOR loops with turning to create more complex paths.

## Learning Goals
- Use multiple FOR loops
- Combine loops with turn commands
- Create L-shaped paths

## Features
- **Sequential Loops**: Uses multiple loops to create distinct path segments.
- **Direction Change**: Connects segments with a turn command.
- **Segments**: Each arm of the L-shape is generated as a `randomPattern`.

## Solution & Parameters

```js
// Parameters
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 5;
var SEG1_LEN = random(_MIN_STEPS_, _MAX_STEPS_);
var SEG2_LEN = random(_MIN_STEPS_, _MAX_STEPS_);

// Full Parameter Set (Standardized)
var _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key
var _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, random
var _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random
var _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump
var _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth
var _SEED_ = random(1, 99999);

// Solution
// Segment 1
randomPattern(SEG1_LEN, _INTERACTION_, false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);

// Turn
turnRight();

// Segment 2
randomPattern(SEG2_LEN, _INTERACTION_, false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);
```
